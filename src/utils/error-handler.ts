import { logError, logErrorBox, colors, symbols } from './logger';

const { colorize, BRAND } = colors;

export class LanguageNotSupportedError extends Error {
  constructor(language: string) {
    super(`Language "${language}" is not supported`);
    this.name = 'LanguageNotSupportedError';
  }
}

export class InvalidParamError extends Error {
  constructor(key: string, value: string) {
    super(`Invalid value "${value}" for parameter "${key}"`);
    this.name = 'InvalidParamError';
  }
}

export class InvalidSpecFileError extends Error {
  constructor(param: string) {
    super(`Invalid specification file\n${param ?? ''}`);
    this.name = 'InvalidSpecFileError';
  }
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuntimeError';
  }
}

export class UnsupportedFeatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedFeatureError';
  }
}

const formatErrorName = (name: string): string => {
  // Convert PascalCase to spaced words (e.g., "InvalidParamError" -> "Invalid Param Error")
  return name
    .replace(/Error$/, '')
    .replace(/(?:[A-Z])/g, ' $&')
    .trim();
};

export function handleErrors(error: unknown): void {
  if (error instanceof Error) {
    const errorTitle = formatErrorName(error.name);

    // Check for Node.js ENOENT errors
    if (
      'code' in error &&
      'path' in error &&
      typeof error.path === 'string' &&
      error.code === 'ENOENT'
    ) {
      logErrorBox(
        [
          `Could not find the specified file:`,
          '',
          colorize(`  ${symbols.pointer} ${error.path}`, BRAND.error),
          '',
          colorize('Please check that the path is correct and the file exists.', BRAND.muted)
        ],
        'File Not Found'
      );
    } else if (error.message.startsWith('File not found:')) {
      // Check for custom file not found errors
      const filePath = error.message.replace('File not found: ', '');
      logErrorBox(
        [
          `Could not find the specified file:`,
          '',
          colorize(`  ${symbols.pointer} ${filePath}`, BRAND.error),
          '',
          colorize('Please check that the path is correct and the file exists.', BRAND.muted)
        ],
        'File Not Found'
      );
    } else if (error instanceof LanguageNotSupportedError) {
      const supportedLangs = ['typescript', 'typescript-with-decoders'];
      logErrorBox(
        [
          error.message,
          '',
          colorize('Supported languages:', BRAND.muted),
          ...supportedLangs.map((lang) => colorize(`  ${symbols.bullet} ${lang}`, BRAND.info))
        ],
        errorTitle
      );
    } else if (error instanceof InvalidSpecFileError) {
      logErrorBox(
        [
          'The specification file could not be parsed.',
          '',
          colorize('Details:', BRAND.muted),
          ...error.message.split('\n').map((line) => `  ${line}`)
        ],
        'Invalid Spec File'
      );
    } else {
      logError(errorTitle, error.message);
    }
  } else {
    logError('Unknown Error', String(error));
  }
}
