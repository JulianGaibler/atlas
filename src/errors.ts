export enum ErrorType {
  UnpublishedChanges,
  ThemeNameDuplicate,
  ThemeNameNoStartSlash,
  ThemeNameNoEndSlash,
  ThemeNameRequired,
  ThemeLocalNotFound,
  ExportNothingExported,
  ImportParsingError,
  ImportIncomplete,
  InputInvalidColor,
}

export interface AtlasError {
  type: ErrorType
  data?: string[]
}

export function getErrorMessage(err: AtlasError) {
  switch (err.type) {
    case ErrorType.UnpublishedChanges:
      return `The map you are trying to export has unpublished changes. Stopped export at '${err.data[0]}'.`
    case ErrorType.ThemeNameDuplicate:
      return `The theme '${err.data[0]}' already exists.`
    case ErrorType.ThemeNameNoStartSlash:
      return `Theme names cannot start with a slash (/).`
    case ErrorType.ThemeNameNoEndSlash:
      return `Theme names cannot end with a slash (/).`
    case ErrorType.ThemeNameRequired:
      return `Theme name is reqired.`
    case ErrorType.ThemeLocalNotFound:
      return `The local theme with the theme-ID '${err.data[0]}' was not found.`
    case ErrorType.ExportNothingExported:
      return `None of the themes were exported.`
    case ErrorType.ImportParsingError:
      return `The map could not be parsed`
    case ErrorType.ImportIncomplete:
      return `The map could be parsed but is missing values.`
    case ErrorType.InputInvalidColor:
      return `Color value is invalid.`
  }
}
