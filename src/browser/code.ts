import {
  Message,
  Theme,
  ThemedNodes,
  BasicFigmaStyle,
  ThemeStyles,
  TemojMap,
  DisplayThemeName,
  DisplayStyleName,
  IdThemeName,
  IdStyleName,
  MIXED_THEME,
} from '../types'
import Messenger from '../Messenger'

class Backend {
  localMap: TemojMap
  atlas: TemojMap[]
  lastSelection: ThemedNodes[]

  messenger: Messenger

  constructor() {
    this.localMap = {
      mapName: '',
      lastUpdated: null,
      themes: [],
      map: null,
    }
    this.atlas = []
    this.lastSelection = []

    this.messenger = new Messenger(
      false,
      (msg: Message, respond: (oMsg: Message, payload: any) => void) => {
        try {
          if (msg.type === 'getLocalThemes') {
            respond(msg, this.localMap.themes)
          } else if (msg.type === 'getSelection') {
            respond(msg, this.getSelection())
          } else if (msg.type === 'categorizeSelection') {
            respond(msg, this.categorizeSelection())
          } else if (msg.type === 'createTheme') {
            respond(msg, this.createTheme(msg.payload.name, msg.payload.color))
          } else if (msg.type === 'duplicateTheme') {
            respond(
              msg,
              this.duplicateTheme(
                msg.payload.from,
                msg.payload.name,
                msg.payload.color,
                msg.payload.addWhitespace,
              ),
            )
          } else if (msg.type === 'editTheme') {
            respond(
              msg,
              this.editTheme(
                msg.payload.from,
                msg.payload.name,
                msg.payload.color,
                msg.payload.addWhitespace,
              ),
            )
          } else if (msg.type === 'getAllThemes') {
            respond(msg, [...this.localMap.themes, ...this.atlas.map((map) => map.themes).flat()])
          } else if (msg.type === 'changeTheme') {
            this.changeTheme(msg.payload.from, msg.payload.to)
              .then((data) => respond(msg, data))
              .catch((e) => {
                throw e
              })
          } else if (msg.type === 'deleteTheme') {
            respond(msg, this.deleteTheme(msg.payload.themeId, msg.payload.deleteStyles))
          } else if (msg.type === 'getLastMapUpdate') {
            respond(msg, this.localMap.lastUpdated ? this.localMap.lastUpdated.toISOString() : null)
          } else if (msg.type === 'refreshMap') {
            respond(msg, this.generateLocalMap())
          } else if (msg.type === 'exportMap') {
            this.exportMap(msg.payload.name)
              .then((data) => respond(msg, data))
              .catch((e) => {
                throw e
              })
          } else if (msg.type === 'importMap') {
            respond(msg, this.importMap(msg.payload.json))
          } else if (msg.type === 'getDocumentName') {
            respond(msg, figma.root.name)
          } else if (msg.type === 'selectMixedNodes') {
            respond(msg, this.selectMixedNodes())
          } else if (msg.type === 'deleteFromAtlas') {
            respond(msg, this.deleteFromAtlas(msg.payload.name))
          } else if (msg.type === 'getAtlas') {
            respond(
              msg,
              this.atlas.map((m) => ({
                mapName: m.mapName,
                lastUpdatedISO: m.lastUpdated.toISOString(),
                themes: m.themes,
              })),
            )
          } else {
            // courtesy response
            respond(msg, 'error')
          }
        } catch (e) {
          respond(msg, {
            thrown: JSON.stringify(e),
          })
          throw e
        }
      },
    )

    this.loadPluginStorage()
    this.generateLocalMap()

    figma.showUI(__html__, { width: 290, height: 485 })

    figma.on('selectionchange', () =>
      this.messenger.sendMessage('selectionChange', this.getSelection()),
    )
  }

  async changeTheme(fromIdName: string, toIdName: string) {
    // Since the selection is sorted by themes, we just need to pick the element of theme we want to change from
    const themeNode = this.lastSelection.find((item) => item.theme.idName === fromIdName)
    if (!themeNode) return

    // Let's collect all maps we have
    const maps = [this.localMap.map, ...this.atlas.map((map) => map.map)]

    // We go over every style-type type, because we need to know which Id to change
    const styleTypes = ['fill', 'stroke', 'text', 'effect']
    for (const key of styleTypes) {
      // Next we go over every node of that style-type

      for (const nodeInfo of themeNode[key]) {
        // Let's search the maps for a matching idStyleName
        let result = this.localMap.map.get(nodeInfo.idStyleName)
        let figmaStyleId = null

        if (!result || !result[toIdName]) {
          const atlasMaps = this.atlas.map((map) => map.map)
          for (const map of atlasMaps) {
            result = map.get(nodeInfo.idStyleName)
            if (result && result[toIdName]) {
              const importedStyle = await figma.importStyleByKeyAsync(result[toIdName].key)
              if (this.typeCompare(key, importedStyle.type)) {
                figmaStyleId = importedStyle.id
                break
              }
            }
          }
        } else {
          this.typeCompare(key, result[toIdName].type)
          if (this.typeCompare(key, result[toIdName].type)) {
            figmaStyleId = result[toIdName].id
          }
        }

        // If we have a matching idStyleName we also have to check if that map contained the theme we want to style to
        if (figmaStyleId) {
          // Last but not least we replace the nodes style id with the one from the map
          switch (key) {
            case 'fill':
              nodeInfo.node.fillStyleId = figmaStyleId
              break
            case 'stroke':
              nodeInfo.node.strokeStyleId = figmaStyleId
              break
            case 'text':
              nodeInfo.node.textStyleId = figmaStyleId
              break
            case 'effect':
              nodeInfo.node.effectStyleId = figmaStyleId
          }
        }
      }
    }
  }

  typeCompare(attrib: string, style: string) {
    if (attrib === 'fill' && style === 'PAINT') return true
    if (attrib === 'stroke' && style === 'PAINT') return true
    if (attrib === 'text' && style === 'TEXT') return true
    if (attrib === 'effect' && style === 'EFFECT') return true
    return false
  }

  findLocalThemeById(name: IdThemeName): Theme | null {
    return this.localMap.themes.find((theme) => theme.idName === name) || null
  }

  findThemeById(name: IdThemeName): Theme | null {
    return (
      [...this.localMap.themes, ...this.atlas.map((map) => map.themes).flat()].find(
        (theme) => theme.idName === name,
      ) || null
    )
  }

  loadPluginStorage() {
    const str = figma.root.getPluginData('data')
    if (str.length < 1) return
    const obj = JSON.parse(str)
    this.localMap = obj.localMap
    this.atlas = obj.atlas.map((str) => deserializeTemojMap(JSON.parse(str)).data)
  }

  updatePluginStorage() {
    figma.root.setPluginData(
      'data',
      JSON.stringify({
        version: 1,
        localMap: this.localMap,
        atlas: this.atlas.map(serializeTemojMap),
      }),
    )
  }

  generateLocalMap(): TemojMap {
    // Create a map, where we associate one IdStyleName with the figma style ids of each theme
    const newMap: Map<IdStyleName, ThemeStyles> = new Map()

    // First get all the local styles
    const localStyles = [
      ...figma.getLocalPaintStyles(),
      ...figma.getLocalTextStyles(),
      ...figma.getLocalEffectStyles(),
    ]

    localStyles.forEach((style: PaintStyle | TextStyle | EffectStyle) => {
      // Let's check if this figma style has the structure to be themeable
      const result = splitStyle(style.name)
      if (result === null) return

      const { displayThemeName, displayStyleName } = result
      const idThemeName = transformToThemeName(displayThemeName)

      // Then check if we have local theme that matches the name of this style
      const localTheme = this.findLocalThemeById(idThemeName)
      if (localTheme === null) return

      // Save basic information about the style
      const data: BasicFigmaStyle = {
        id: style.id,
        key: style.key,
        type: style.type,
      }
      const idStyleName = transformToStyleName(displayStyleName)
      // If we already have themes associated to this style name, we add to the ThemeStyles object, otherwise we create a new one
      const part = newMap.get(idStyleName) || {}

      // TODO: Maybe check if we're overwriting something here and warn the user
      part[idThemeName] = data
      newMap.set(idStyleName, part)
    })

    // Create the map object
    const newLocalMap = {
      mapName: figma.root.name,
      lastUpdated: new Date(),
      themes: this.localMap.themes,
      map: newMap,
    }
    this.localMap = newLocalMap
    return newLocalMap
  }

  async exportLocalMap() {
    // Create a map, where we associate one IdStyleName with the figma style ids of each theme
    const newMap: Map<IdStyleName, ThemeStyles> = new Map()

    // First get all the local styles
    const localStyles = [
      ...figma.getLocalPaintStyles(),
      ...figma.getLocalTextStyles(),
      ...figma.getLocalEffectStyles(),
    ]

    const containedThemeIds = []

    for (const style of localStyles) {
      const status = await (style as any).getPublishStatusAsync()
      if (status === 'CHANGED') {
        return {
          success: false,
          type: 'errUnpublishedChanges',
        }
      }
      if (status === 'UNPUBLISHED') {
        continue
      }

      // Let's check if this figma style has the structure to be themeable
      const result = splitStyle(style.name)
      if (result === null) continue

      const { displayThemeName, displayStyleName } = result
      const idThemeName = transformToThemeName(displayThemeName)

      if (!containedThemeIds.includes(idThemeName)) {
        containedThemeIds.push(idThemeName)
      }

      // Then check if we have local theme that matches the name of this style
      const localTheme = this.findLocalThemeById(idThemeName)
      if (localTheme === null) continue

      // Save basic information about the style
      const data: BasicFigmaStyle = {
        id: style.id,
        key: style.key,
        type: style.type,
      }
      const idStyleName = transformToStyleName(displayStyleName)
      // If we already have themes associated to this style name, we add to the
      // ThemeStyles object, otherwise we create a new one
      const part = newMap.get(idStyleName) || {}

      // TODO: Maybe check if we're overwriting something here and warn the user
      part[idThemeName] = data
      newMap.set(idStyleName, part)
    }

    const containedThemes = this.localMap.themes.filter((map) =>
      containedThemeIds.includes(map.idName),
    )

    // Create the map object
    const newLocalMap = {
      mapName: figma.root.name,
      lastUpdated: new Date(),
      themes: containedThemes,
      map: newMap,
    }

    return {
      success: true,
      data: newLocalMap,
    }
  }

  categorizeSelection() {
    // Get all selected nodes as a flat array of nodes
    const selectedNodes: Array<PageNode | SceneNode> = figma.currentPage.selection.flatMap((node) =>
      (node as any).findAll !== undefined ? [node, ...(node as any).findAll()] : node,
    )

    // For every theme we save nodes with a themed style, categorized by style-type
    const mappedNodes: ThemedNodes[] = []

    // Go over every node...
    selectedNodes.forEach((node) => {
      // For every style-type, check if it is associated
      // with an id that is related to one of our themes
      const styles = {
        fill: this.getThemeByFigmaStyleId((node as any).fillStyleId),
        stroke: this.getThemeByFigmaStyleId((node as any).strokeStyleId),
        text: this.getThemeByFigmaStyleId((node as any).textStyleId),
        effect: this.getThemeByFigmaStyleId((node as any).effectStyleId),
      }

      // For each style-type check if we found a matching theme
      Object.keys(styles).forEach((key) => {
        if (!styles[key]) return

        // We're saving a node reference and the idStyle name
        const nodeInfo = {
          node,
          idStyleName: styles[key].idStyleName,
        }

        // Check if we already added the theme to mappedNodes
        const themeNode = mappedNodes.find((themeNode) => themeNode.theme === styles[key].theme)

        if (themeNode) {
          // If yes, we can just push this node in it's style-type array of this theme node
          themeNode[key].push(nodeInfo)
        } else {
          // Otherwise we create a new theme node, with empty style-type array
          // and add it to mappedNodes
          const newObj = {
            theme: styles[key].theme,
            fill: [],
            stroke: [],
            text: [],
            effect: [],
          }
          newObj[key].push(nodeInfo)
          mappedNodes.push(newObj)
        }
      })
    })
    this.lastSelection = mappedNodes
    return mappedNodes
  }

  getThemeByFigmaStyleId(
    figmaStyleId: string | PluginAPI['mixed'],
  ): { theme: Theme; idStyleName: string } | null {
    // Check if we got a mixed style so we can warn the user later
    if (figmaStyleId === figma.mixed) {
      return {
        theme: MIXED_THEME,
        idStyleName: '',
      }
    }
    // Get the style from the API and return undefined if it doesn't exist
    const style = figma.getStyleById(figmaStyleId)
    if (!style) return null

    // Trim to get the string before a possible slash and check against theme names
    const split = splitStyle(style.name)
    if (!split) return null

    const theme = this.findThemeById(transformToThemeName(split.displayThemeName))
    if (!theme) return

    return {
      theme,
      idStyleName: transformToStyleName(split.displayStyleName),
    }
  }

  selectMixedNodes() {
    const themeNode = this.lastSelection.find((item) => item.theme.idName === MIXED_THEME.idName)
    if (!themeNode) return

    const nodes = []

    const styleTypes = ['fill', 'stroke', 'text', 'effect']
    for (const key of styleTypes) {
      for (const nodeInfo of themeNode[key]) {
        nodes.push(nodeInfo.node)
      }
    }
    figma.currentPage.selection = nodes
  }

  createTheme(themeName: DisplayThemeName, themeColor: string) {
    const result = this._createTheme(themeName, themeColor)
    if (!result.success) return result
    // Add to local themes und update everything
    this.localMap.themes.push(result.newTheme)
    this.updatePluginStorage()
    this.generateLocalMap()

    return {
      success: true,
    }
  }

  _createTheme(themeName: DisplayThemeName, themeColor: string) {
    // Theme Name cannot include a forward slash
    if (themeName.length < 1) {
      return {
        success: false,
        type: 'errTooShort',
      }
    }
    // Theme Name cannot include a forward slash
    if (themeName.includes('/')) {
      return {
        success: false,
        type: 'errIncludesForwardSlash',
      }
    }
    // Create new Theme object
    const newTheme: Theme = {
      displayName: themeName.trim(),
      idName: transformToThemeName(themeName),
      color: themeColor,
    }
    // Check if a theme with similar ID doesn't already exist
    if (this.findLocalThemeById(newTheme.idName) !== null) {
      return {
        success: false,
        type: 'errDuplicateTheme',
      }
    }
    return {
      success: true,
      newTheme,
    }
  }

  duplicateTheme(
    from: IdThemeName,
    themeName: DisplayThemeName,
    themeColor: string,
    addWhitespace: boolean,
  ) {
    const result = this._createTheme(themeName, themeColor)
    if (!result.success) return result
    this.localMap.themes.push(result.newTheme)

    this.localMap.map.forEach((themes) => {
      if (themes[from]) {
        const fromFigmaStyle = figma.getStyleById(themes[from].id) as
          | PaintStyle
          | TextStyle
          | EffectStyle
        if (fromFigmaStyle === null) return

        let newFigmaStyle: PaintStyle | TextStyle | EffectStyle
        switch (fromFigmaStyle.type) {
          case 'PAINT':
            newFigmaStyle = figma.createPaintStyle()
            newFigmaStyle.paints = fromFigmaStyle.paints
            break
          case 'TEXT':
            newFigmaStyle = figma.createTextStyle()
            ;[
              'fontSize',
              'textDecoration',
              'fontName',
              'letterSpacing',
              'lineHeight',
              'paragraphIndent',
              'paragraphSpacing',
              'textCase',
            ].forEach((key) => {
              newFigmaStyle[key] = fromFigmaStyle[key]
            })
            break
          case 'EFFECT':
            newFigmaStyle = figma.createEffectStyle()
            newFigmaStyle.effects = fromFigmaStyle.effects
            break
        }

        const { displayStyleName } = splitStyle(fromFigmaStyle.name)

        newFigmaStyle.name =
          result.newTheme.displayName + (addWhitespace ? ' ' : '') + '/' + displayStyleName

        newFigmaStyle.description = fromFigmaStyle.description
      }
    })
    this.generateLocalMap()
    this.updatePluginStorage()
    return {
      success: true,
    }
  }

  editTheme(
    from: IdThemeName,
    themeName: DisplayThemeName,
    themeColor: string,
    addWhitespace: boolean,
  ) {
    let changes = false
    const theme = this.findLocalThemeById(from)

    if (theme.displayName !== themeName.trim()) {
      changes = true

      const result = this._createTheme(themeName, themeColor)
      if (!result.success) return result

      theme.displayName = result.newTheme.displayName
      theme.idName = result.newTheme.idName

      this.localMap.map.forEach((themes) => {
        if (themes[from]) {
          const figmaStyle = figma.getStyleById(themes[from].id)
          const { displayStyleName } = splitStyle(figmaStyle.name)

          figmaStyle.name = themeName.trim() + (addWhitespace ? ' ' : '') + '/' + displayStyleName
        }
      })
    }

    if (theme.color !== themeColor) {
      changes = true
      theme.color = themeColor
    }

    if (changes) {
      this.generateLocalMap()
      this.updatePluginStorage()
    }
    return {
      success: true,
    }
  }

  deleteTheme(themeId: IdThemeName, deleteStyles: boolean) {
    const index = this.localMap.themes.findIndex((theme) => theme.idName === themeId)
    if (index < 0) {
      return {
        success: false,
        type: 'errThemeNotFound',
      }
    }
    const deletedTheme = this.localMap.themes.splice(index, 1)[0]
    if (deleteStyles) {
      this.localMap.map.forEach((themes) => {
        if (themes[deletedTheme.idName]) {
          const figmaStyle = figma.getStyleById(themes[deletedTheme.idName].id)
          figmaStyle.remove()
        }
      })
    }
    this.generateLocalMap()
    this.updatePluginStorage()
    return {
      success: true,
    }
  }

  async exportMap(name: string) {
    const res = await this.exportLocalMap()

    if (!res.success) {
      return res
    }
    const map = res.data

    if (map.themes.length < 1) {
      return {
        success: false,
        type: 'errNoThemeExported',
      }
    }
    if (name) {
      map.mapName = name.trim()
    }

    return {
      success: true,
      data: serializeTemojMap(map),
    }
  }

  importMap(json: string) {
    let obj
    try {
      obj = JSON.parse(json)
    } catch (e) {
      return {
        success: false,
        type: 'errJsonParse',
      }
    }

    const res = deserializeTemojMap(obj)
    if (!res.success) {
      return res
    }

    const map = res.data

    for (const theme of map.themes) {
      if (this.findThemeById(theme.idName)) {
        return {
          success: false,
          type: 'errThemeNameCollision',
          data: theme.displayName,
        }
      }
    }

    this.atlas.push(map as any)
    this.updatePluginStorage()

    return {
      success: true,
    }
  }

  deleteFromAtlas(mapName: string) {
    const index = this.atlas.findIndex((map) => map.mapName === mapName)
    this.atlas.splice(index, 1)
    this.updatePluginStorage()
    return {
      success: true,
    }
  }

  getSelection() {
    return figma.currentPage.selection.length
  }
}

function transformToThemeName(name: DisplayThemeName): IdThemeName {
  return name.trim().toLowerCase().replace(/\s/g, '-')
}
function transformToStyleName(name: DisplayStyleName): IdStyleName {
  return name
    .split('/')
    .map((str) => str.trim().toLowerCase().replace(/\s/g, '-'))
    .join('/')
}

function splitStyle(
  figmaStyleName,
): { displayThemeName: DisplayThemeName; displayStyleName: DisplayStyleName } | null {
  const firstSlash = figmaStyleName.indexOf('/')
  if (firstSlash < 0) return null

  const theme = figmaStyleName.substr(0, firstSlash).trim()
  const style = figmaStyleName.substr(firstSlash + 1)

  if (theme.length < 1) return null

  return { displayThemeName: theme, displayStyleName: style }
}

function serializeTemojMap(m: TemojMap): string {
  return JSON.stringify({
    mapName: m.mapName,
    lastUpdatedISO: m.lastUpdated.toISOString(),
    themes: m.themes,
    arrayMap: Array.from(m.map.entries()),
  })
}

function deserializeTemojMap(obj: any) {
  if (!isVarTypeOf(obj, Object)) {
    return {
      success: false,
      type: 'errNotAnObject',
    }
  }
  if (!obj.mapName || !obj.lastUpdatedISO || !obj.themes || !obj.arrayMap) {
    return {
      success: false,
      type: 'errMissingValue',
    }
  }
  return {
    success: true,
    data: {
      mapName: String(obj.mapName).trim(),
      lastUpdated: new Date(obj.lastUpdatedISO),
      themes: obj.themes,
      map: new Map(obj.arrayMap),
    },
  }
}

function isVarTypeOf(_var, _type) {
  try {
    return _var.constructor === _type
  } catch (ex) {
    return false
  }
}

new Backend()
