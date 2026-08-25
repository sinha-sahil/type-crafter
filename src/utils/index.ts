import {
  type ReferencedModule,
  type ModulePathConfig,
  type FontCase,
  decodeObjectTemplateInputProperties,
  type TypeInfo,
  type TypeDataType
} from '$types';
import Handlebars from 'handlebars';
import { type JSONObject, type JSONValue, decodeArray, decodeString, isJSON } from 'type-decoder';
import Runtime from '$runtime';
import { resolveFilePath } from './file-system';
import { InvalidSpecFileError } from './error-handler';

export * from './file-system';
export * from './logger';

export function addValuesToMappedSet(
  map: Map<string, Set<string>>,
  key: string,
  values: string[]
): void {
  const existingValues = map.get(key);
  map.set(
    key,
    typeof existingValues === 'undefined'
      ? new Set(values)
      : new Set([...existingValues, ...values])
  );
}

export function getOptionalKeys(object: unknown): string[] {
  const nullableKeys = [];
  const properties = decodeObjectTemplateInputProperties(object);
  if (properties !== null) {
    for (const propertyName in properties) {
      const property = properties[propertyName];
      if (!property.required) {
        nullableKeys.push(propertyName);
      }
    }
  }
  return nullableKeys;
}

export function getRequiredKeys(object: unknown): string[] {
  const requiredKeys = [];
  const properties = decodeObjectTemplateInputProperties(object);
  if (properties !== null) {
    for (const propertyName in properties) {
      const property = properties[propertyName];
      if (property.required) {
        requiredKeys.push(propertyName);
      }
    }
  }
  return requiredKeys;
}

export function getReferencedTypes(object: unknown): string[] {
  const referencedTypes = [];
  const properties = decodeObjectTemplateInputProperties(object);
  if (properties !== null) {
    for (const propertyName in properties) {
      const property = properties[propertyName];
      if (property.referenced) {
        referencedTypes.push(property.type);
      }
    }
  }
  return referencedTypes;
}

export function getReferencedTypeModules(_referencedTypes: unknown, _writtenAt: string): unknown[] {
  const referencedTypes = decodeArray(_referencedTypes, decodeString);
  const writtenAt = decodeString(_writtenAt);
  if (referencedTypes === null || writtenAt === null) {
    return [];
  }

  const expectedOutputFiles = Runtime.getExpectedOutputFiles();
  const modulePathConfig = Runtime.getConfig().language.modulePathConfig;
  const referencedTypeModules: Record<string, ReferencedModule> = {};

  for (const referenceType of referencedTypes) {
    const outputFile = expectedOutputFiles.get(referenceType);
    if (
      typeof outputFile !== 'undefined' &&
      resolveFilePath(outputFile.filePath) !== resolveFilePath(writtenAt)
    ) {
      if (typeof referencedTypeModules[outputFile.modulePath] === 'undefined') {
        const rawRelativePath = generateRelativePath(writtenAt, outputFile.modulePath);
        const moduleName = outputFile.modulePath.split('/').pop() ?? '';
        referencedTypeModules[outputFile.modulePath] = {
          modulePath: outputFile.modulePath,
          moduleRelativePath: formatModulePath(rawRelativePath, writtenAt, modulePathConfig),
          referencedTypes: [referenceType],
          moduleName,
          fileBasedModules: moduleName === (modulePathConfig?.moduleFileName ?? '')
        };
      } else {
        referencedTypeModules[outputFile.modulePath].referencedTypes.push(referenceType);
      }
    }
  }

  const result: ReferencedModule[] = [];
  for (const modulePath in referencedTypeModules) {
    result.push(referencedTypeModules[modulePath]);
  }
  return result;
}

export function toPascalCase(input: string): string {
  return input
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export function toPascalCaseHelper(input: unknown): string | unknown {
  const inputString = decodeString(input);
  if (inputString === null) {
    return input;
  }
  return toPascalCase(inputString);
}

export function toSnakeCase(input: string): string {
  return input
    .replace(/[-]/g, '_')
    .replace(/(?<upper>[A-Z]+)(?<next>[A-Z][a-z])/g, '$1_$2')
    .replace(/(?<lower>[a-z\d])(?<cap>[A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/__+/g, '_');
}

export function toSnakeCaseHelper(input: unknown): string | unknown {
  const inputString = decodeString(input);
  if (inputString === null) {
    return input;
  }
  return toSnakeCase(inputString);
}

export function toCamelCase(input: string): string {
  const pascal = toPascalCase(input);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function formatCase(input: string, fontCase: FontCase): string {
  switch (fontCase) {
    case 'snake_case':
      return toSnakeCase(input);
    case 'PascalCase':
      return toPascalCase(input);
    case 'camelCase':
      return toCamelCase(input);
  }
}

export function refineJSONKey(input: unknown): unknown {
  if (typeof input === 'string' && input.includes('-')) {
    return `'${input}'`;
  }
  return input;
}

export function refineVariableName(input: unknown): unknown {
  if (typeof input === 'string') {
    return toPascalCase(input);
  }
  return input;
}

export function refineIndexKey(input: unknown): unknown {
  if (typeof input === 'string') {
    return `'${input}'`;
  }
  return input;
}

export function escapeReservedWord(input: unknown): unknown {
  if (typeof input !== 'string') {
    return input;
  }
  const config = Runtime.getConfig().language.reservedKeywords;
  if (typeof config === 'undefined') {
    return input;
  }
  if (config.words.includes(input)) {
    return config.prefix + input;
  }
  return input;
}

export function appendUnique(base: unknown, additions: unknown): string {
  const seen = new Set<string>();
  const result: string[] = [];

  const add = (item: unknown): void => {
    if (typeof item !== 'string') {
      return;
    }
    const trimmed = item.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) {
      return;
    }
    seen.add(trimmed);
    result.push(trimmed);
  };

  if (typeof base === 'string') {
    base.split(',').forEach(add);
  }

  if (Array.isArray(additions)) {
    additions.forEach(add);
  } else {
    add(additions);
  }

  return result.join(', ');
}

export function registerTemplateHelpers(): void {
  Handlebars.registerHelper('getOptionalKeys', getOptionalKeys);
  Handlebars.registerHelper('getRequiredKeys', getRequiredKeys);
  Handlebars.registerHelper(
    'areRequiredKeysPresent',
    (object: unknown) => getRequiredKeys(object).length > 0
  );

  Handlebars.registerHelper('getReferencedTypes', getReferencedTypes);
  Handlebars.registerHelper('getReferencedTypeModules', getReferencedTypeModules);
  Handlebars.registerHelper('toPascalCase', toPascalCaseHelper);
  Handlebars.registerHelper('toSnakeCase', toSnakeCaseHelper);
  Handlebars.registerHelper(
    'isNonEmptyArray',
    (value: unknown) => Array.isArray(value) && value.length === 0
  );
  Handlebars.registerHelper('eq', (value1: unknown, value2: unknown) => value1 === value2);
  Handlebars.registerHelper('notEq', (value1: unknown, value2: unknown) => value1 !== value2);
  Handlebars.registerHelper(
    'isEmptyObject',
    (value: unknown) =>
      typeof value === 'object' && value !== null && Object.keys(value).length === 0
  );
  Handlebars.registerHelper('jsonKey', refineJSONKey);
  Handlebars.registerHelper('variableName', refineVariableName);
  Handlebars.registerHelper('indexKey', refineIndexKey);
  Handlebars.registerHelper('escapeReservedWord', escapeReservedWord);
  Handlebars.registerHelper('appendUnique', appendUnique);
  Handlebars.registerHelper('stringify', (value: unknown) => JSON.stringify(value));
  Handlebars.registerHelper('not', (value: unknown) => {
    if (typeof value === 'boolean') {
      return !value;
    }
  });
  Handlebars.registerHelper('or', (...args: unknown[]) => {
    const values = args.slice(0, -1);
    return values.some(Boolean);
  });
  Handlebars.registerHelper('and', (...args: unknown[]) => {
    const values = args.slice(0, -1);
    return values.every(Boolean);
  });
  Handlebars.registerHelper('subtract', (a: unknown, b: unknown) =>
    typeof a === 'number' && typeof b === 'number' ? a - b : 0
  );
}

export function readNestedValue(json: unknown, keyPath: string[]): JSONObject {
  if (!isJSON(json)) {
    throw new InvalidSpecFileError('Invalid JSON for keyPath ' + keyPath.join('.'));
  }
  let result: JSONValue = json;
  keyPath.forEach((key) => {
    if (isJSON(result)) {
      result = result[key];
    } else {
      throw new InvalidSpecFileError('Invalid Key Path for: ' + keyPath.join('.'));
    }
  });
  return result;
}

export function generateRelativePath(fromPath: string, toPath: string): string {
  fromPath = stripPrefix(resolveFilePath(fromPath), '/');
  toPath = stripPrefix(resolveFilePath(toPath), '/');
  const fromPathArray = fromPath.split('/');
  const toPathArray = toPath.split('/');

  let diffIndex = -1;

  for (let i = 0; i < toPathArray.length; i++) {
    if (fromPathArray[i] !== toPathArray[i]) {
      diffIndex = i;
      break;
    }
  }

  let pathPrefix = Array(fromPathArray.length - diffIndex).join('../');
  pathPrefix = pathPrefix === '' ? './' : pathPrefix;

  return pathPrefix + toPathArray.slice(diffIndex).join('/');
}

export function formatModulePath(
  relativePath: string,
  writtenAt: string,
  config: ModulePathConfig
): string {
  let path = relativePath.replace(/^\.\//, '');

  const isModuleFile =
    writtenAt.endsWith('/' + config.moduleFileName) ||
    writtenAt.endsWith('\\' + config.moduleFileName);

  let parentCount = config.fileBasedModules && !isModuleFile ? 1 : 0;
  while (path.startsWith('../')) {
    parentCount++;
    path = path.slice(3);
  }

  const moduleFileRegex = new RegExp(`\\/?${config.moduleFileName}$`);
  path = path.replace(moduleFileRegex, '').replace(/\/$/, '');

  const parentPart =
    parentCount > 0 ? Array(parentCount).fill(config.parentRef).join(config.separator) : '';

  if (path === '' && parentPart === '') {
    return config.selfRef;
  }
  if (path === '') {
    return parentPart;
  }

  const formattedPath = path.replace(/\//g, config.separator);
  if (parentPart === '') {
    return config.selfRef + config.separator + formattedPath;
  }

  return parentPart + config.separator + formattedPath;
}

// #region string utils

export function stripPrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}
// #endregion

// #region type utils

export function isPrimitiveType(typeInfo: TypeInfo): boolean {
  return (
    typeInfo.type !== null &&
    typeInfo.type !== 'object' &&
    typeInfo.type !== 'array' &&
    typeInfo.$ref === null &&
    typeInfo.oneOf === null &&
    typeInfo.allOf === null &&
    typeInfo.enum === null
  );
}

export function isSimplePrimitiveType(type: TypeDataType | null): boolean {
  return type === 'string' || type === 'number' || type === 'integer' || type === 'boolean';
}

// #endregion
