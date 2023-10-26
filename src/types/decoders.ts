import type {
  GroupedTypes,
  SpecFileData,
  SpecInfo,
  TypeInfo,
  TypeProperties,
  TypeProperty,
  Types,
} from ".";
import {
  __decodeString,
  decodeArray,
  decodeString,
  isJSON,
  noErrorOrNullValues,
} from "type-decoder";

export function decodeSpecFileData(rawInput: unknown): SpecFileData | null {
  if (isJSON(rawInput)) {
    const info = decodeSpecInfo(rawInput.info);
    const types = decodeTypes(rawInput.types);
    const groupedTypes = decodeGroupedTypes(rawInput.groupedTypes);

    if (info !== null) {
      const result: SpecFileData = {
        info,
        types,
        groupedTypes,
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
      title: __decodeString(rawInput.title),
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
    for (let key in rawInput) {
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
    for (let key in rawInput) {
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
    if (properties !== null) {
      const result: TypeInfo = {
        type: __decodeString(rawInput.type),
        required,
        properties,
      };
      if (noErrorOrNullValues(result, ["required"])) {
        return result;
      }
    }
  }
  return null;
}

function decodeTypeProperties(rawInput: unknown): TypeProperties | null {
  if (isJSON(rawInput)) {
    const result: TypeProperties = {};
    for (let key in rawInput) {
      const value = rawInput[key];
      const decodedValue = decodeTypeProperty(value);
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

function decodeTypeProperty(rawInput: unknown): TypeProperty | null {
  if (isJSON(rawInput)) {
    const result = {
      type: __decodeString(rawInput.type),
    };
    if (noErrorOrNullValues(result)) {
      return result;
    }
  }
  return null;
}
