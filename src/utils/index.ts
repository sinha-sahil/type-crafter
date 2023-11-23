import { type ReferencedModule, decodeObjectTemplateInputProperties } from '$types';
import Handlebars from 'handlebars';
import { type JSONObject, type JSONValue, decodeArray, decodeString, isJSON } from 'type-decoder';
import Runtime from '$runtime';
import { resolveFilePath } from './file-system';

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
  const referencedTypeModules: Record<string, ReferencedModule> = {};

  for (const referenceType of referencedTypes) {
    const outputFile = expectedOutputFiles.get(referenceType);
    if (
      typeof outputFile !== 'undefined' &&
      resolveFilePath(outputFile.filePath) !== resolveFilePath(writtenAt)
    ) {
      if (typeof referencedTypeModules[outputFile.modulePath] === 'undefined') {
        referencedTypeModules[outputFile.modulePath] = {
          modulePath: outputFile.modulePath,
          moduleRelativePath: generateRelativePath(writtenAt, outputFile.modulePath),
          referencedTypes: [referenceType]
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

export function registerTemplateHelpers(): void {
  Handlebars.registerHelper('getOptionalKeys', getOptionalKeys);
  Handlebars.registerHelper('getReferencedTypes', getReferencedTypes);
  Handlebars.registerHelper('getReferencedTypeModules', getReferencedTypeModules);
}

export function readNestedValue(json: JSONObject, keyPath: string[]): JSONObject {
  let result: JSONValue = json;
  keyPath.forEach((key) => {
    if (isJSON(result)) {
      result = result[key];
    } else {
      throw new Error('Invalid Key Path for: ' + keyPath.join('.'));
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

// #region string utils

export function stripPrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

// #endregion
