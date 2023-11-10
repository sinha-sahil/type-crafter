import { decodeObjectTemplateInputProperties } from '$types';

export * from './file-system';

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

export function toPascalCase(input: string): string {
  return input
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
