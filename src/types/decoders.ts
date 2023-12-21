import type {
  EnumTemplateInput,
  GroupedTypes,
  GroupedTypesWriterMode,
  ObjectTemplateInputProperties,
  ObjectTemplateInputProperty,
  SpecFileData,
  SpecInfo,
  TypeDataType,
  TypeInfo,
  TypeProperties,
  Types,
  TypesWriterMode
} from '.';
import {
  __decodeString,
  decodeArray,
  decodeBoolean,
  decodeNumber,
  decodeString,
  isJSON,
  noErrorOrNullValues
} from 'type-decoder';

export function decodeGroupedTypesWriterMode(rawInput: unknown): GroupedTypesWriterMode | null {
  if (typeof rawInput === 'string') {
    switch (rawInput) {
      case 'SingleFile':
      case 'FolderWithFiles':
        return rawInput;
    }
  }
  return null;
}

export function decodeTypesWriterMode(rawInput: unknown): TypesWriterMode | null {
  if (typeof rawInput === 'string') {
    switch (rawInput) {
      case 'SingleFile':
      case 'Files':
        return rawInput;
    }
  }
  return null;
}

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
    const _type = decodeTypeDataType(rawInput.type);
    const result: TypeInfo = {
      type: _type,
      required: decodeArray(rawInput.required, decodeString),
      properties: decodeTypeProperties(rawInput.properties),
      items: decodeTypeInfo(rawInput.items),
      format: decodeString(rawInput.format),
      $ref: decodeString(rawInput.$ref),
      description: decodeString(rawInput.description),
      example: decodeString(rawInput.example) ?? decodeNumber(rawInput.example),
      oneOf: decodeArray(rawInput.oneOf, decodeTypeInfo),
      enum:
        _type === 'string'
          ? decodeArray(rawInput.enum, decodeString)
          : _type === 'number'
            ? decodeArray(rawInput.enum, decodeNumber)
            : null
    };
    return result;
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
      case 'unknown':
        return rawInput;
    }
  }
  return null;
}

function decodeObjectTemplateInputProperty(rawInput: unknown): ObjectTemplateInputProperty | null {
  if (isJSON(rawInput)) {
    const required = decodeBoolean(rawInput.required);
    const _type = decodeString(rawInput.type);
    const referenced = decodeBoolean(rawInput.referenced);
    const primitiveType = decodeString(rawInput.primitiveType);
    const composerType = decodeString(rawInput.composerType);
    const example = decodeString(rawInput.example) ?? decodeNumber(rawInput.example);
    const description = decodeString(rawInput.description);
    if (required !== null && _type !== null && referenced !== null && primitiveType !== null) {
      return {
        type: _type,
        required,
        referenced,
        primitiveType,
        composerType,
        example,
        description
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

export function decodeEnumTemplateInput(rawInput: unknown): EnumTemplateInput | null {
  if (isJSON(rawInput)) {
    const typeName = decodeString(rawInput.typeName);
    const enumType = decodeString(rawInput.enumType);
    const values = decodeArray(rawInput.values, decodeString);
    const example = decodeString(rawInput.example);
    const description = decodeString(rawInput.description);
    if (typeName !== null && values !== null && enumType !== null) {
      return {
        typeName,
        enumType,
        values,
        example,
        description
      };
    }
  }
  return null;
}
