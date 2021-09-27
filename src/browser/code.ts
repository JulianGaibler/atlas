import {
  Message,
  Theme,
  MappedTheme,
  ThemedNodes,
  BasicFigmaStyle,
  ThemeStyles,
  Result,
  DisplayThemeName,
  DisplayStyleName,
  IdThemeName,
  IdStyleName,
  MIXED_THEME,
  AtlasMap,
  ExternalAtlasMap,
  LOCAL_THEME_ID,
  DisplayMapName,
  IdMapName,
} from '../types'
import Messenger from '../Messenger'
import { ErrorType } from '../errors'

const SUCCESS = {}

class Backend {
  localMap: AtlasMap
  atlas: AtlasMap[]
  lastSelection: ThemedNodes[]

  uiVisible: boolean

  messenger: Messenger

  constructor() {
    this.localMap = {
      mapName: '',
      mapId: LOCAL_THEME_ID,
      lastUpdated: null,
      themes: [],
      styleMap: null,
    }
    this.uiVisible = false
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
            respond(msg, this.createTheme(msg.payload.name, msg.payload.color, msg.payload.group))
          } else if (msg.type === 'duplicateTheme') {
            respond(
              msg,
              this.duplicateTheme(
                msg.payload.from,
                msg.payload.name,
                msg.payload.color,
                msg.payload.group,
                msg.payload.duplicateStyles,
              ),
            )
          } else if (msg.type === 'editTheme') {
            respond(
              msg,
              this.editTheme(
                msg.payload.from,
                msg.payload.name,
                msg.payload.color,
                msg.payload.group,
              ),
            )
          } else if (msg.type === 'getAllThemes') {
            respond(msg, this.getAllThemes())
          } else if (msg.type === 'getAllThemesByMap') {
            respond(msg, this.getAllMappedThemes())
          } else if (msg.type === 'changeTheme') {
            this.changeTheme(msg.payload.from, msg.payload.to)
              .then((data) => respond(msg, data))
              .catch((e) => {
                throw e
              })
          } else if (msg.type === 'deleteTheme') {
            respond(msg, this.deleteTheme(msg.payload.themeId, msg.payload.deleteStyles))
          } else if (msg.type === 'getLastMapUpdate') {
            respond(
              msg,
              this.localMap.lastUpdated && this.localMap.themes.length > 0
                ? this.localMap.lastUpdated.toISOString()
                : null,
            )
          } else if (msg.type === 'anyThemesAdded') {
            respond(msg, this.localMap.themes.length + this.atlas.length > 0)
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
    this.uiVisible = true

    figma.on('selectionchange', () =>
      this.messenger.sendMessage('selectionChange', this.getSelection()),
    )
  }

  /**
   * Plugin Storage
   */

  loadPluginStorage() {
    const str = figma.root.getPluginData('data')
    if (str.length < 1) return
    const obj = JSON.parse(str)
    this.localMap = obj.localMap
    obj.atlas.map((str) => this.importMap(str))
  }

  updatePluginStorage() {
    figma.root.setPluginData(
      'data',
      JSON.stringify({
        version: 1,
        localMap: this.localMap,
        atlas: this.atlas.map(serializeAtlasMap),
      }),
    )
  }

  /**
   * Selection
   */

  getSelection() {
    return figma.currentPage.selection.length
  }

  categorizeSelection(): Result<ThemedNodes[]> {
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
        fill: this._getThemeByFigmaStyleId((node as any).fillStyleId),
        stroke: this._getThemeByFigmaStyleId((node as any).strokeStyleId),
        text: this._getThemeByFigmaStyleId((node as any).textStyleId),
        effect: this._getThemeByFigmaStyleId((node as any).effectStyleId),
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
        const themeNode = mappedNodes.find(
          (themeNode) =>
            themeNode.theme.idName === styles[key].theme.idName &&
            themeNode.mapId === styles[key].mapId,
        )

        if (themeNode) {
          // If yes, we can just push this node in it's style-type array of this theme node
          themeNode[key].push(nodeInfo)
        } else {
          // Otherwise we create a new theme node, with empty style-type array
          // and add it to mappedNodes
          const newObj: ThemedNodes = {
            theme: styles[key].theme,
            mapId: styles[key].mapId,
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

    return {
      data: mappedNodes,
    }
  }

  /**
   * Change selection
   */

  async changeTheme(
    from: { mapId: IdMapName; themeId: IdThemeName },
    to: { mapId: IdMapName; themeId: IdThemeName },
  ) {
    // Since the selection is sorted by themes, we just need to pick the element of theme we want to change from
    const themeNode = this.lastSelection.find(
      (item) => item.mapId === from.mapId && item.theme.idName === from.themeId,
    )
    if (!themeNode) return

    // We go over every style-type type, because we need to know which Id to change
    const styleTypes = ['fill', 'stroke', 'text', 'effect']

    let promises = []

    let switchStyle = async (key: string, nodeInfo) => {
      let figmaStyleId = null

      if (to.mapId === LOCAL_THEME_ID) {
        let result = this.localMap.styleMap.get(nodeInfo.idStyleName)
        if (result && result[to.themeId] && typeCompare(key, result[to.themeId].type)) {
          figmaStyleId = result[to.themeId].id
        }
      } else {
        const atlasMap = this.atlas.find((map) => map.mapId === to.mapId)
        const result = atlasMap.styleMap.get(nodeInfo.idStyleName)
        if (result && result[to.themeId]) {
          const importedStyle = await figma.importStyleByKeyAsync(result[to.themeId].key)
          if (typeCompare(key, importedStyle.type)) {
            figmaStyleId = importedStyle.id
          }
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

    let totalTasks = 0
    let tasksDone = 0

    let updateProgress = async (done, count) => {
      if (count) tasksDone++
      this.messenger.sendMessage('progressUpdate', { totalTasks, tasksDone, done, type: 'change' })
    }

    for (const key of styleTypes) {
      // Next we go over every node of that style-type
      for (const nodeInfo of themeNode[key]) {
        totalTasks++
        updateProgress(false, false)
        promises.push(switchStyle(key, nodeInfo).then(() => updateProgress(false, true)))
      }
    }

    await Promise.all(promises)
    tasksDone = totalTasks
    await updateProgress(true, false)
  }

  /**
   * Building map from local styles
   */

  generateLocalMap(): AtlasMap {
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
      const result = this.findThemeByFigmaStyle(style.name, true)
      if (result === null) return

      const { theme, idStyleName } = result

      // Save basic information about the style
      const data: BasicFigmaStyle = {
        id: style.id,
        key: style.key,
        type: style.type,
      }
      // If we already have themes associated to this style name, we add to the ThemeStyles object, otherwise we create a new one
      const part = newMap.get(idStyleName) || {}

      // TODO: Maybe check if we're overwriting something here and warn the user
      part[theme.idName] = data
      newMap.set(idStyleName, part)
    })

    // Create the map object
    const newLocalMap = {
      mapName: figma.root.name,
      mapId: LOCAL_THEME_ID,
      lastUpdated: new Date(),
      themes: this.localMap.themes,
      styleMap: newMap,
    }
    this.localMap = newLocalMap
    if (this.uiVisible) {
      this.messenger.sendMessage(
        'updatedLocalMap',
        this.localMap.themes.length > 0 ? newLocalMap.lastUpdated.toISOString() : null,
      )
    }
    return newLocalMap
  }

  async exportLocalMap(): Promise<Result<AtlasMap>> {
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
          error: {
            type: ErrorType.UnpublishedChanges,
            data: [style.name],
          },
        }
      }
      if (status === 'UNPUBLISHED') {
        continue
      }

      // Let's check if this figma style has the structure to be themeable
      const result = this.findThemeByFigmaStyle(style.name, true)
      if (result === null) continue

      const { theme, idStyleName } = result

      if (!containedThemeIds.includes(theme.idName)) {
        containedThemeIds.push(theme.idName)
      }

      // Save basic information about the style
      const data: BasicFigmaStyle = {
        id: style.id,
        key: style.key,
        type: style.type,
      }
      // If we already have themes associated to this style name, we add to the
      // ThemeStyles object, otherwise we create a new one
      const part = newMap.get(idStyleName) || {}

      // TODO: Maybe check if we're overwriting something here and warn the user
      part[theme.idName] = data
      newMap.set(idStyleName, part)
    }

    const containedThemes = this.localMap.themes.filter((map) =>
      containedThemeIds.includes(map.idName),
    )

    // Create the map object
    const newLocalMap: AtlasMap = {
      mapName: figma.root.name,
      mapId: LOCAL_THEME_ID,
      lastUpdated: new Date(),
      themes: containedThemes,
      styleMap: newMap,
    }

    return {
      data: newLocalMap,
    }
  }

  _getThemeByFigmaStyleId(
    figmaStyleId: string | PluginAPI['mixed'],
  ): { theme: Theme; mapId: IdMapName; idStyleName: string } | null {
    // Check if we got a mixed style so we can warn the user later
    if (figmaStyleId === figma.mixed) {
      return {
        theme: MIXED_THEME,
        mapId: '',
        idStyleName: '',
      }
    }
    // Get the style from the API and return undefined if it doesn't exist
    const style = figma.getStyleById(figmaStyleId)
    if (!style) return null

    // Trim to get the string before a possible slash and check against theme names
    const result = this.findThemeByFigmaStyle(style.name, false)
    if (!result) return null

    const { theme, mapId } = result

    return {
      theme,
      mapId,
      idStyleName: result.idStyleName,
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

  createTheme(themeName: DisplayThemeName, themeColor: string, group: string): Result<any> {
    const result = this._createTheme(themeName, themeColor, group, true)
    if (result.error) return result
    // Add to local themes und update everything
    this.localMap.themes.push(result.data)
    this.updatePluginStorage()
    this.generateLocalMap()

    return SUCCESS
  }

  _createTheme(
    themeName: DisplayThemeName,
    themeColor: string,
    group: string,
    duplicateCheck: boolean,
  ): Result<Theme> {
    // Theme Name cannot include a forward slash

    let trimmedThemeName = themeName.trim()

    if (trimmedThemeName.length < 1) {
      return {
        error: {
          type: ErrorType.ThemeNameRequired,
        },
      }
    }
    if (trimmedThemeName[0] == '/') {
      return {
        error: {
          type: ErrorType.ThemeNameNoStartSlash,
        },
      }
    }
    if (trimmedThemeName[trimmedThemeName.length - 1] == '/') {
      return {
        error: {
          type: ErrorType.ThemeNameNoEndSlash,
        },
      }
    }

    // Create new Theme object
    const newTheme: Theme = {
      displayName: cleanUpDisplayName(trimmedThemeName),
      idName: TransformToThemeId(trimmedThemeName),
      color: themeColor,
    }

    if (group && group.trim().length > 0) {
      newTheme.group = group
    }

    // Check if a theme with similar ID doesn't already exist
    if (duplicateCheck && this.findThemeById(LOCAL_THEME_ID, newTheme.idName) !== null) {
      return {
        error: {
          type: ErrorType.ThemeNameDuplicate,
          data: [trimmedThemeName],
        },
      }
    }
    return {
      data: newTheme,
    }
  }

  duplicateTheme(
    from: { mapId: IdMapName; themeId: IdThemeName },
    themeName: DisplayThemeName,
    themeColor: string,
    group: string,
    duplicateStyles: boolean,
  ): Result<any> {
    const result = this._createTheme(themeName, themeColor, group, true)
    if (result.error) return result
    this.localMap.themes.push(result.data)

    if (duplicateStyles) {
      let defaultFontLoaded = false

      let x = async (style: BasicFigmaStyle) => {
        let fromFigmaStyle: PaintStyle | TextStyle | EffectStyle = null

        if (from.mapId == LOCAL_THEME_ID) {
          fromFigmaStyle = figma.getStyleById(style.id) as any
        } else {
          fromFigmaStyle = (await figma.importStyleByKeyAsync(style.key)) as any
        }

        if (fromFigmaStyle === null) return

        let newFigmaStyle: PaintStyle | TextStyle | EffectStyle
        switch (fromFigmaStyle.type) {
          case 'PAINT':
            newFigmaStyle = figma.createPaintStyle()
            newFigmaStyle.paints = fromFigmaStyle.paints
            break
          case 'TEXT':
            if (!defaultFontLoaded) {
              await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' })
              defaultFontLoaded = true
            }
            await figma.loadFontAsync(fromFigmaStyle.fontName)
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

        const { theme } = this.findThemeByFigmaStyle(fromFigmaStyle.name, false)
        let displayStyleName = getDisplayStyleName(theme, fromFigmaStyle.name)

        newFigmaStyle.name = result.data.displayName + '/' + displayStyleName
        newFigmaStyle.description = fromFigmaStyle.description
      }

      let fromMap = this.findMapById(from.mapId)

      const promises = []
      let totalTasks = 0
      let tasksDone = 0

      let updateProgress = async (done, count) => {
        if (count) tasksDone++
        this.messenger.sendMessage('progressUpdate', {
          totalTasks,
          tasksDone,
          done,
          type: 'duplicate',
        })
      }

      for (const themes of fromMap.styleMap.values()) {
        if (themes[from.themeId]) {
          totalTasks++
          promises.push(x(themes[from.themeId]).then(() => updateProgress(false, true)))
        }
      }
      updateProgress(false, false)

      Promise.all(promises).then(() => {
        this.generateLocalMap()
        this.updatePluginStorage()
        tasksDone = totalTasks
        updateProgress(true, false)
      })
    }
    return SUCCESS
  }

  editTheme(
    from: IdThemeName,
    themeName: DisplayThemeName,
    themeColor: string,
    group: string,
  ): Result<any> {
    let changes = false
    const theme = this.findThemeById(LOCAL_THEME_ID, from)

    if (theme.displayName !== themeName.trim()) {
      changes = true

      const result = this._createTheme(themeName, themeColor, group, false)
      if (result.error) return result

      let newTheme = result.data

      this.localMap.styleMap.forEach((themes) => {
        if (themes[from]) {
          const figmaStyle = figma.getStyleById(themes[from].id)
          const { theme } = this.findThemeByFigmaStyle(figmaStyle.name, true)

          let displayStyleName = getDisplayStyleName(theme, figmaStyle.name)

          figmaStyle.name = newTheme.displayName + '/' + displayStyleName
        }
      })

      theme.displayName = newTheme.displayName
      theme.idName = newTheme.idName
    }

    if (theme.color !== themeColor) {
      changes = true
      theme.color = themeColor
    }

    if (theme.group !== group) {
      const result = this._createTheme(themeName, themeColor, group, false)
      if (result.error) return result

      changes = true
      theme.group = result.data.group
    }

    if (changes) {
      this.generateLocalMap()
      this.updatePluginStorage()
    }
    return SUCCESS
  }

  deleteTheme(themeId: IdThemeName, deleteStyles: boolean): Result<any> {
    const index = this.localMap.themes.findIndex((theme) => theme.idName === themeId)
    if (index < 0) {
      return {
        error: {
          type: ErrorType.ThemeLocalNotFound,
          data: [themeId],
        },
      }
    }
    const deletedTheme = this.localMap.themes.splice(index, 1)[0]
    if (deleteStyles) {
      this.localMap.styleMap.forEach((themes) => {
        if (themes[deletedTheme.idName]) {
          const figmaStyle = figma.getStyleById(themes[deletedTheme.idName].id)
          figmaStyle.remove()
        }
      })
    }
    this.generateLocalMap()
    this.updatePluginStorage()
    return SUCCESS
  }

  async exportMap(name: string): Promise<Result<string | AtlasMap>> {
    const res = await this.exportLocalMap()

    if (res.error) {
      return res
    }
    const map = res.data

    if (map.themes.length < 1) {
      return {
        error: {
          type: ErrorType.ExportNothingExported,
        },
      }
    }
    if (name) {
      map.mapName = name.trim()
    }

    return {
      data: serializeAtlasMap(map),
    }
  }

  importMap(json: string): Result<any> {
    let obj
    try {
      obj = JSON.parse(json)
    } catch (e) {
      return {
        error: {
          type: ErrorType.ImportParsingError,
        },
      }
    }

    const res = deserializeAtlasMap(obj)
    if (res.error) {
      return res
    }

    // Change name until there is no namespace collision
    let mapId = transformToMapId(res.data.mapName)
    let counter = 0
    while (true) {
      if (!this.atlas.some((map) => map.mapId == mapId)) {
        break
      }
      mapId = `${mapId}-${counter++}`
    }

    const map: AtlasMap = Object.assign({ mapId }, res.data)

    this.atlas.push(map)
    this.updatePluginStorage()

    return SUCCESS
  }

  deleteFromAtlas(mapName: string) {
    const index = this.atlas.findIndex((map) => map.mapName === mapName)
    this.atlas.splice(index, 1)
    this.updatePluginStorage()
    return {
      success: true,
    }
  }

  /**
   * Finding themes in maps
   */

  getAllThemes(): Theme[] {
    return [...this.localMap.themes, ...this.atlas.map((map) => map.themes).flat()]
  }
  getAllMappedThemes(): MappedTheme[] {
    return [
      ...this.localMap.themes.map((t) =>
        Object.assign({ mapName: figma.root.name, mapId: this.localMap.mapId, local: true }, t),
      ),
      ...this.atlas
        .map((map) =>
          map.themes.map((t) =>
            Object.assign({ mapName: map.mapName, mapId: map.mapId, local: false }, t),
          ),
        )
        .flat(),
    ]
  }
  getLocalThemes(): Theme[] {
    return this.localMap.themes
  }

  findMapById(map: IdThemeName): AtlasMap | null {
    if (map == LOCAL_THEME_ID) {
      return this.localMap
    } else {
      let res = this.atlas.find((m) => m.mapId === map)
      return res || null
    }
  }

  findThemeById(mapId: IdThemeName, themeId: IdThemeName): Theme | null {
    let map = this.findMapById(mapId)
    if (!map) return null
    return map.themes.find((theme) => theme.idName === themeId) || null
  }

  findThemeByFigmaStyle(
    figmaStyleName: string,
    local: boolean,
  ): { theme: Theme; mapId: IdMapName; idStyleName: IdStyleName } | null {
    const themes: Theme[] = local ? this.getLocalThemes() : this.getAllMappedThemes()

    const search = transformtoIdName(figmaStyleName)
    const searchSplit = search.split('/')

    if (searchSplit.length < 2) return null

    searchloop: for (const theme of themes) {
      // Split current name in parts
      const currentSplit = theme.idName.split('/')
      // If the whole name of the search-split has less elements than the current one, we can continue already.
      if (searchSplit.length < currentSplit.length) break

      // see if the current theme-split match the beginning of the search-split
      for (const [i, part] of theme.idName.split('/').entries()) {
        if (part != searchSplit[i]) {
          continue searchloop
        }
      }

      const mapId = local ? LOCAL_THEME_ID : (theme as MappedTheme).mapId

      return { theme, mapId, idStyleName: search.substr(theme.idName.length + 1) }
    }
    return null
  }
}

function getDisplayStyleName(theme: Theme, displayName: string) {
  let themeSplit = theme.displayName.split('/')
  let fullSplit = cleanUpDisplayName(displayName).split('/')

  return fullSplit.slice(themeSplit.length).join('/')
}

function TransformToThemeId(name: DisplayThemeName): IdThemeName {
  return transformtoIdName(name)
}
function transformToStyleId(name: DisplayStyleName): IdStyleName {
  return transformtoIdName(name)
}
function transformToMapId(name: DisplayMapName): IdMapName {
  return name.trim().toLowerCase().replace(/\s/g, '-')
}

function transformtoIdName(displayName: string): string {
  return displayName
    .split('/')
    .map((str) => str.trim().toLowerCase().replace(/\s/g, '-'))
    .join('/')
}

function cleanUpDisplayName(displayName: string): string {
  return displayName
    .split('/')
    .map((str) => str.trim())
    .join('/')
}

function serializeAtlasMap(m: AtlasMap): string {
  let externalMap: ExternalAtlasMap = {
    mapName: m.mapName,
    lastUpdatedISO: m.lastUpdated.toISOString(),
    themes: m.themes,
    arrayMap: Array.from(m.styleMap.entries()),
  }
  return JSON.stringify(externalMap)
}

function deserializeAtlasMap(obj: any): Result<any> {
  // TODO: obj.map is for backwards compability to Atlas 1. Remove in the future.
  if (!isVarTypeOf(obj, Object)) {
    return {
      error: {
        type: ErrorType.ImportParsingError,
      },
    }
  }
  if (!obj.mapName || !obj.lastUpdatedISO || !obj.themes || !(obj.arrayMap || obj.map)) {
    return {
      error: {
        type: ErrorType.ImportIncomplete,
      },
    }
  }
  return {
    data: {
      mapName: String(obj.mapName).trim(),
      lastUpdated: new Date(obj.lastUpdatedISO),
      themes: obj.themes,
      styleMap: new Map(obj.arrayMap || obj.map),
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

function typeCompare(attrib: string, style: string) {
  if (attrib === 'fill' && style === 'PAINT') return true
  if (attrib === 'stroke' && style === 'PAINT') return true
  if (attrib === 'text' && style === 'TEXT') return true
  if (attrib === 'effect' && style === 'EFFECT') return true
  return false
}

new Backend()
