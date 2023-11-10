import type {
  GroupedTypes,
  ObjectTemplateInputProperties,
  ObjectTemplateInputProperty,
  SpecFileData,
  SpecInfo,
  TypeDataType,
  TypeInfo,
  TypeProperties,
  Types
} from '.';
import {
  __decodeString,
  decodeArray,
  decodeBoolean,
  decodeString,
  isJSON,
  noErrorOrNullValues
} from 'type-decoder';

export function decodeSpecFileData(rawInput: unknown): SpecFileData | null {
  if (isJSON(rawInput)) {
    const info = decodeSpecInfo(rawInput.info);
    const types = decodeTypes(rawInput.types);
    const groupedTypes = decodeGroupedTypes(rawInput.groupedTypes);

    if (info !== null) {
      const result: SpecFileData = {
        info,
        types,
        groupedTypes
      };
      return result;
    }
  }
  return null;
}

function decodeSpecInfo(rawInput: unknown): SpecInfo | null {
  if (isJSON(rawInput)) {
    const result = {
      version: __decodeString(rawInput.version),
      title: __decodeString(rawInput.title)
    };
    if (noErrorOrNullValues(result)) {
      return result;
    }
  }
  return null;
}

function decodeGroupedTypes(rawInput: unknown): GroupedTypes | null {
  if (isJSON(rawInput)) {
    const result: GroupedTypes = {};
    for (const key in rawInput) {
      const value = rawInput[key];
      const decodedValue = decodeTypes(value);
      if (decodedValue !== null) {
        result[key] = decodedValue;
      } else {
        return null;
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  }
  return null;
}

function decodeTypes(rawInput: unknown): Types | null {
  if (isJSON(rawInput)) {
    const result: Types = {};
    for (const key in rawInput) {
      const value = rawInput[key];
      const decodedValue = decodeTypeInfo(value);
      if (decodedValue !== null) {
        result[key] = decodedValue;
      } else {
        return null;
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  }
  return null;
}

function decodeTypeInfo(rawInput: unknown): TypeInfo | null {
  if (isJSON(rawInput)) {
    const required = decodeArray(rawInput.required, decodeString);
    const properties = decodeTypeProperties(rawInput.properties);
    const _type = decodeTypeDataType(rawInput.type);
    const items = decodeTypeInfo(rawInput.items);
    if (_type !== null) {
      const result: TypeInfo = {
        type: _type,
        required,
        properties,
        items,
        format: decodeString(rawInput.format)
      };
      if (noErrorOrNullValues(result, ['required', 'properties', 'items', 'format'])) {
        return result;
      }
    }
  }
  return null;
}

function decodeTypeProperties(rawInput: unknown): TypeProperties | null {
  if (isJSON(rawInput)) {
    const result: TypeProperties = {};
    for (const key in rawInput) {
      const value = rawInput[key];
      const decodedValue = decodeTypeInfo(value);
      if (decodedValue !== null) {
        result[key] = decodedValue;
      } else {
        return null;
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  }
  return null;
}

function decodeTypeDataType(rawInput: unknown): TypeDataType | null {
  if (typeof rawInput === 'string') {
    switch (rawInput) {
      case 'string':
      case 'number':
      case 'integer':
      case 'boolean':
      case 'array':
      case 'object':
        return rawInput;
    }
  }
  return null;
}

function decodeObjectTemplateInputProperty(rawInput: unknown): ObjectTemplateInputProperty | null {
  if (isJSON(rawInput)) {
    const required = decodeBoolean(rawInput.required);
    const _type = decodeString(rawInput.type);
    if (required !== null && _type !== null) {
      return {
        type: _type,
        required
      };
    }
  }
  return null;
}

export function decodeObjectTemplateInputProperties(
  rawInput: unknown
): ObjectTemplateInputProperties | null {
  if (isJSON(rawInput)) {
    const result: ObjectTemplateInputProperties = {};
    for (const key in rawInput) {
      const value = rawInput[key];
      const decodedValue = decodeObjectTemplateInputProperty(value);
      if (decodedValue !== null) {
        result[key] = decodedValue;
      } else {
        return null;
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  }
  return null;
}
