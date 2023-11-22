import type {
  GenerationResult,
  ObjectTemplateInput,
  SpecFileData,
  GeneratedTypes,
  TypeInfo,
  Types,
  GroupedTypesOutput,
  TypeDataType,
  GeneratedType
} from '$types';
import Runtime from '$runtime';
import { toPascalCase } from '$utils';
import { resolveReference } from './helpers';
import { isJSON } from 'type-decoder';

function fillPatterns(input: string, patterns: Array<{ regex: RegExp; value: string }>): string {
  let result = input;
  patterns.forEach((pattern) => {
    result = result.replace(pattern.regex, pattern.value);
  });
  return result;
}

function getReferenceName(reference: string): string {
  const referenceParts = reference.split('/');
  return referenceParts[referenceParts.length - 1];
}

function getLanguageDataType(
  dataType: TypeDataType,
  format: string | null,
  items: TypeInfo | null
): string {
  const typeMapper = Runtime.getConfig().language.typeMapper ?? null;
  const mappedType = typeMapper !== null ? typeMapper[dataType] : null;
  const itemsType =
    // eslint-disable-next-line
    items !== null && items.type !== null
      ? getLanguageDataType(items.type, items.format, items.items)
      : null;
  const fillerPatterns = [];
  if (itemsType !== null) {
    fillerPatterns.push({ regex: /~ItemType~/g, value: itemsType });
  }

  if (typeof mappedType === 'string') {
    return fillPatterns(mappedType, fillerPatterns);
  } else if (isJSON(mappedType)) {
    const defaultType = mappedType.default;
    const mappedTypeWithFormat = mappedType[format ?? ''] ?? defaultType;
    if (typeof mappedTypeWithFormat === 'string') {
      return fillPatterns(mappedTypeWithFormat, fillerPatterns);
    }
  }
  return dataType;
}

function generateType(
  typeName: string,
  typeInfo: TypeInfo,
  groupedTypes: boolean = false
): GeneratedType {
  const result: GeneratedType = {
    content: '',
    references: new Set(),
    primitives: new Set()
  };
  const templateInput: ObjectTemplateInput = {
    typeName,
    properties: {}
  };

  let recursiveTypeGenOutput: GeneratedType | null = null;

  for (const propertyName in typeInfo.properties) {
    const propertyType = typeInfo.properties[propertyName].type;
    const propertyFormat = typeInfo.properties[propertyName].format;
    const propertyItems = typeInfo.properties[propertyName].items ?? null;
    const reference = typeInfo.properties[propertyName].$ref ?? null;

    // Throwing error in case neither property type nor reference to a different type is present
    if (propertyType === null && reference === null) {
      throw new Error('Invalid property type for: ' + typeName + '.' + propertyName);
    }

    let recursivePropertyName;
    let languageDataType: string | null = null;
    let isReferenced = false;

    if (reference !== null) {
      resolveReference(reference);
      recursivePropertyName = getReferenceName(reference);
      languageDataType = recursivePropertyName;
      isReferenced = true;
      result.references.add(recursivePropertyName);
    } else if (propertyType === 'object') {
      recursivePropertyName = toPascalCase(propertyName);
      recursiveTypeGenOutput = generateType(
        recursivePropertyName,
        typeInfo.properties[propertyName],
        groupedTypes
      );
      languageDataType = recursivePropertyName;
      for (const reference of recursiveTypeGenOutput.references.values()) {
        result.references.add(reference);
      }
      for (const primitive of recursiveTypeGenOutput.primitives.values()) {
        result.primitives.add(primitive);
      }
    } else if (propertyType !== null) {
      languageDataType = getLanguageDataType(propertyType, propertyFormat, propertyItems);
      result.primitives.add(languageDataType);
    }

    if (languageDataType === null) {
      throw new Error('Invalid language data type');
    }

    templateInput.properties = {
      ...templateInput.properties,
      [propertyName]: {
        type: languageDataType,
        required: typeInfo.required?.includes(propertyName) ?? false,
        referenced: isReferenced
      }
    };
  }

  result.content =
    Runtime.getObjectTemplate()(templateInput) + (recursiveTypeGenOutput?.content ?? '');
  return result;
}

function generateTypes(types: Types, groupedTypes: boolean = false): GeneratedTypes {
  const result: GeneratedTypes = {};
  for (const type in types) {
    const typeInfo: TypeInfo = types[type];
    const genType = generateType(type, typeInfo);
    result[type] = genType;
  }

  return result;
}

export function generator(specFileData: SpecFileData): GenerationResult {
  const result: GenerationResult = {
    groupedTypes: {},
    types: {}
  };

  // generating types
  if (specFileData.types !== null) {
    result.types = generateTypes(specFileData.types);
  }

  // generating grouped types
  const groupedTypes: GroupedTypesOutput = {};
  for (const groupName in specFileData.groupedTypes) {
    groupedTypes[groupName] = generateTypes(specFileData.groupedTypes[groupName], true);
  }
  result.groupedTypes = groupedTypes;

  return result;
}
