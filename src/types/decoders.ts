import type {
  GroupRef,
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
  TypesWriterMode,
  GroupTypesData,
  KeyedAdditionalProperties,
  AdditionalPropertiesKeyType,
  AdditionalProperties
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
      const decodedRefValue = decodeGroupRef(value);
      const decodedTypes = decodeTypes(value);
      const decodedValue = decodedRefValue ?? decodedTypes;
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

export function valueIsGroupRef(value: GroupTypesData): value is GroupRef {
  return isJSON(value) && typeof value.$ref === 'string';
}

function decodeGroupRef(rawInput: unknown): GroupRef | null {
  if (isJSON(rawInput)) {
    const ref = decodeString(rawInput.$ref);
    if (ref !== null) {
      return {
        $ref: ref
      };
    }
  }
  return null;
}

export function decodeTypes(rawInput: unknown): Types | null {
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

export function decodeAdditionalPropertiesKeyType(
  rawInput: unknown
): AdditionalPropertiesKeyType | null {
  if (typeof rawInput === 'string') {
    switch (rawInput) {
      case 'string':
      case 'number':
        return rawInput;
    }
  }
  return null;
}

export function decodeTypeInfo(rawInput: unknown): TypeInfo | null {
  if (isJSON(rawInput)) {
    const _type = decodeTypeDataType(rawInput.type);
    const additionalProperties = decodeAdditionalProperties(rawInput.additionalProperties);
    const result: TypeInfo = {
      type: _type,
      required: decodeArray(rawInput.required, decodeString),
      properties: decodeTypeProperties(rawInput.properties),
      items: decodeTypeInfo(rawInput.items),
      format: decodeString(rawInput.format),
      $ref: decodeString(rawInput.$ref),
      summary: decodeString(rawInput.summary),
      description: decodeString(rawInput.description),
      example: decodeString(rawInput.example) ?? decodeNumber(rawInput.example),
      oneOf: decodeArray(rawInput.oneOf, decodeTypeInfo),
      additionalProperties,
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

function decodeAdditionalProperties(rawInput: unknown): AdditionalProperties | null {
  return (
    decodeKeyedAdditionalProperties(rawInput) ?? decodeTypeInfo(rawInput) ?? decodeBoolean(rawInput)
  );
}

function decodeKeyedAdditionalProperties(rawInput: unknown): KeyedAdditionalProperties | null {
  if (isJSON(rawInput)) {
    const keyType = decodeAdditionalPropertiesKeyType(rawInput.keyType);
    const valueType = decodeTypeInfo(rawInput.valueType);
    if (keyType !== null && valueType !== null) {
      return {
        keyType,
        valueType
      };
    }
  }
  return null;
}

export function valueIsKeyedAdditionalProperties(
  value: unknown
): value is KeyedAdditionalProperties {
  return decodeKeyedAdditionalProperties(value) !== null;
}

export function valueIsTypeInfo(value: unknown): value is TypeInfo {
  return decodeTypeInfo(value) !== null;
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
    const summary = decodeString(rawInput.summary);
    const example = decodeString(rawInput.example) ?? decodeNumber(rawInput.example);
    const description = decodeString(rawInput.description);
    if (required !== null && _type !== null && referenced !== null && primitiveType !== null) {
      return {
        type: _type,
        required,
        referenced,
        primitiveType,
        composerType,
        summary,
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
    const type = decodeString(rawInput.type);
    const values = decodeArray(rawInput.values, decodeString);
    const summary = decodeString(rawInput.summary);
    const example = decodeString(rawInput.example);
    const description = decodeString(rawInput.description);
    if (typeName !== null && values !== null && type !== null) {
      return {
        typeName,
        type,
        values,
        summary,
        example,
        description
      };
    }
  }
  return null;
}
