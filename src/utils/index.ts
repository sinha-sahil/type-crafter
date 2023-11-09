import { decodeObjectTemplateInputProperties } from '$types';

export * from './file-system';

export function addValuesToMappedSet(map: Map<string, Set<string>>, key: string, values: string[]) {
  const existingValues = map.get(key);
  map.set(
    key,
    typeof existingValues === 'undefined'
      ? new Set(values)
      : new Set([...existingValues, ...values])
  );
}

export function getOptionalKeys(object: unknown) {
  const properties = decodeObjectTemplateInputProperties(object);
  if (properties !== null) {
    const nullableKeys = [];
    for (let propertyName in properties) {
      const property = properties[propertyName];
      if (!property.required) {
        nullableKeys.push(propertyName);
      }
    }
    return nullableKeys;
  }
}
