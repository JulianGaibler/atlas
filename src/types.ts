import type { AtlasError } from './errors'

export const LOCAL_THEME_ID = '__local__'

// Everything before the first slash
export type DisplayThemeName = string
// Everything after the first slash
export type DisplayStyleName = string
// Name of the map as the user has typed it
export type DisplayMapName = string
// Trimmed and with spaces replaced
export type IdThemeName = string
// Trimmed and with spaces replaced
export type IdStyleName = string
// Trimmed and with spaces replaced
export type IdMapName = string

export enum StyleType {
  Fill = 'fill',
  Text = 'text',
  Stroke = 'stroke',
  Effect = 'effect',
}

export interface Message {
  type: string
  id: number
  payload?: any
}

export interface Theme {
  displayName: DisplayThemeName
  idName: IdThemeName
  group?: string
  color: string
}

export interface MappedTheme extends Theme {
  mapName: DisplayMapName
  mapId: IdMapName
  local: boolean
}

export interface ThemedNodes {
  theme: Theme
  mapId: IdMapName
  nodes: (ThemedNode | RangedThemedNode)[]
}

export interface ThemedNode {
  type: StyleType
  idStyleName: IdStyleName
  node: SceneNode
}

export interface RangedThemedNode extends ThemedNode {
  from: number
  to: number
}

export interface BasicFigmaStyle {
  id: string
  key: string
  type: string
}

export interface ThemeStyles {
  [key: string]: BasicFigmaStyle
}

export interface ExternalAtlasMap {
  mapName: DisplayMapName
  lastUpdatedISO: string
  themes: Theme[]
  arrayMap: [string, ThemeStyles][]
}

export interface AtlasMap {
  mapName: DisplayMapName
  mapId: IdMapName
  lastUpdated: Date
  themes: Theme[]
  styleMap: Map<IdStyleName, ThemeStyles>
}

export interface Result<Type> {
  error?: AtlasError
  data?: Type
}

export interface TypedThemeResult {
  type: StyleType
  themeResult: ThemeSearchResult
}

export interface RangedTypedThemeResult extends TypedThemeResult {
  from: number
  to: number
}

export interface ThemeSearchResult {
  theme: Theme
  mapId: IdMapName
  idStyleName: IdStyleName
}
