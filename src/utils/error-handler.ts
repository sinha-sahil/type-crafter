import { logError } from './logger';

export class LanguageNotSupportedError extends Error {
  constructor(language: string) {
    super(`Language ${language} not supported`);
    this.name = 'LanguageNotSupportedError';
  }
}

export class InvalidParamError extends Error {
  constructor(key: string, value: string) {
    super(`Invalid Param ${value} for ${key}`);
    this.name = 'InvalidParamError';
  }
}

export class InvalidSpecFileError extends Error {
  constructor(param: string) {
    super(`Bad spec file \n${param ?? ''}`);
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

export function handleErrors(error: unknown): void {
  if (error instanceof Error) {
    if (
      'code' in error &&
      'path' in error &&
      typeof error.path === 'string' &&
      error.code === 'ENOENT'
    ) {
      logError('File not found', 'Failed to read file on path: ' + error.path);
    } else {
      logError(error.name, error.message);
    }
  }
}
