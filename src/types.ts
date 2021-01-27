// Everything before the first slash
export type DisplayThemeName = string
// Everything after the first slash
export type DisplayStyleName = string
// Trimmed and with spaces replaced style name
export type IdThemeName = string
// Trimmed and with spaces replaced style name
export type IdStyleName = string

export interface Message {
  type: string
  id: number
  payload?: any
}

export interface Theme {
  displayName: DisplayThemeName
  idName: IdThemeName
  color: string
}

export interface ThemedNodes {
  theme: Theme
  fill: SceneNode[]
  stroke: SceneNode[]
  text: SceneNode[]
  effect: SceneNode[]
}

export const MIXED_THEME: Theme = {
  displayName: 'Mixed Theme',
  idName: '__mixed__',
  color: '',
}

export interface BasicFigmaStyle {
  id: string
  key: string
  type: string
}

export interface ThemeStyles {
  [key: string]: BasicFigmaStyle
}

export interface TemojMap {
  mapName: string
  lastUpdated: Date
  themes: Theme[]
  map: Map<IdStyleName, ThemeStyles>
}
