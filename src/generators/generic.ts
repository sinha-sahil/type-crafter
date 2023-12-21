import type {
  GenerationResult,
  ObjectTemplateInput,
  SpecFileData,
  GeneratedTypes,
  TypeInfo,
  Types,
  GroupedTypesOutput,
  TypeDataType,
  GeneratedType,
  EnumTemplateInput,
  OneOfTemplateInput,
  OneOfTemplateInputComposition
} from '$types';
import Runtime from '$runtime';
import { toPascalCase } from '$utils';
import { InvalidSpecFileError } from '$utils/error-handler';
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

function resolveAndGetReferenceName(reference: string): string {
  resolveReference(reference);
  return getReferenceName(reference);
}
type LanguageDataType = {
  dataType: string;
  itemType?: string;
  references: Set<string>;
  primitives: Set<string>;
};

function getLanguageDataType(
  dataType: TypeDataType,
  format: string | null,
  items: TypeInfo | null
): LanguageDataType {
  const result: LanguageDataType = {
    dataType,
    references: new Set(),
    primitives: new Set()
  };
  const typeMapper = Runtime.getConfig().language.typeMapper ?? null;
  const mappedType = typeMapper !== null ? typeMapper[dataType] : null;
  const itemReference =
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    items !== null && items.$ref !== null ? resolveAndGetReferenceName(items.$ref) : null;
  const itemsType: LanguageDataType | null =
    // eslint-disable-next-line
    items !== null
      ? items.type !== null
        ? getLanguageDataType(items.type, items.format, items.items)
        : itemReference !== null
          ? {
              dataType: itemReference,
              references: new Set([itemReference]),
              primitives: new Set()
            }
          : null
      : null;

  const fillerPatterns = [];
  if (itemsType !== null) {
    fillerPatterns.push({ regex: /~ItemType~/g, value: itemsType.dataType });
  }

  let mappedTypeWithFormat: string | null = null;
  let defaultType: string | null = null;

  if (typeof mappedType === 'string') {
    result.dataType = fillPatterns(mappedType, fillerPatterns);
  } else if (isJSON(mappedType)) {
    defaultType = mappedType.default;
    mappedTypeWithFormat = mappedType[format ?? ''] ?? defaultType;
    if (typeof mappedTypeWithFormat === 'string') {
      result.dataType = fillPatterns(mappedTypeWithFormat, fillerPatterns);
    }
  }

  /**
   * @todo: Segregate array & variable type generation
   */
  const primitiveElementType =
    items?.$ref !== null
      ? null
      : mappedTypeWithFormat === null
        ? itemsType !== null
          ? itemsType.dataType
          : result.dataType
        : typeof mappedType === 'string' && items?.$ref !== null
          ? mappedType
          : null;

  if (itemsType !== null && primitiveElementType !== null) {
    result.itemType = primitiveElementType;
  } else if (itemsType !== null && itemReference !== null) {
    result.itemType = itemReference;
  }

  if (itemsType !== null) {
    result.references = new Set([...result.references, ...itemsType.references]);
    result.primitives =
      primitiveElementType !== null
        ? new Set([...result.primitives, primitiveElementType])
        : result.primitives;
  }

  return result;
}

function generateObjectType(typeName: string, typeInfo: TypeInfo): GeneratedType {
  const templateInput: ObjectTemplateInput = {
    typeName,
    description: typeInfo.description,
    example: typeInfo.example,
    properties: {}
  };

  const result: GeneratedType = {
    content: '',
    references: new Set(),
    primitives: new Set(),
    templateInput
  };

  let recursiveTypeGenOutput: GeneratedType | null = null;
  let dynamicGeneratedType: string = '';

  for (const propertyName in typeInfo.properties) {
    const propertyDetails = typeInfo.properties[propertyName];
    const propertyType = propertyDetails.type;
    const propertyFormat = propertyDetails.format;
    const propertyItems = propertyDetails.items ?? null;
    const reference = propertyDetails.$ref ?? null;
    const enumValues = propertyDetails.enum ?? null;

    // Throwing error in case neither property type nor reference to a different type is present
    if (propertyType === null && reference === null) {
      throw new InvalidSpecFileError('Invalid property type for: ' + typeName + '.' + propertyName);
    }

    const primitiveType = propertyType ?? 'object';
    let composerType = null;
    let recursivePropertyName;
    let languageDataType: string | null = null;
    let isReferenced = false;

    if (reference !== null) {
      resolveReference(reference);
      recursivePropertyName = getReferenceName(reference);
      languageDataType = recursivePropertyName;
      isReferenced = true;
      result.references.add(recursivePropertyName);
    } else if (enumValues !== null) {
      const enumName = toPascalCase(propertyName) + 'Enum';
      dynamicGeneratedType = generateEnumType(enumName, propertyDetails).content;
      languageDataType = enumName;
    } else if (propertyType === 'object') {
      recursivePropertyName = toPascalCase(propertyName);
      recursiveTypeGenOutput = generateObjectType(
        recursivePropertyName,
        typeInfo.properties[propertyName]
      );
      languageDataType = recursivePropertyName;
      for (const reference of recursiveTypeGenOutput.references.values()) {
        result.references.add(reference);
      }
      for (const primitive of recursiveTypeGenOutput.primitives.values()) {
        result.primitives.add(primitive);
      }
    } else if (propertyType !== null) {
      languageDataType = getLanguageDataType(propertyType, propertyFormat, propertyItems).dataType;
      result.primitives.add(propertyItems !== null ? 'Array' : languageDataType);
      if (propertyItems !== null) {
        const itemsType = propertyItems.type ?? getReferenceName(propertyItems.$ref ?? '');
        result.references.add(itemsType);
        composerType = itemsType;
      }
    }

    if (languageDataType === null) {
      throw new InvalidSpecFileError(`Invalid language data type for: ${typeName}.${propertyName}`);
    }

    templateInput.properties = {
      ...templateInput.properties,
      [propertyName]: {
        type: languageDataType,
        required: typeInfo.required?.includes(propertyName) ?? false,
        referenced: isReferenced,
        primitiveType,
        composerType,
        example: propertyDetails.example,
        description: propertyDetails.description
      }
    };
  }

  result.content =
    Runtime.getObjectTemplate()(templateInput) +
    (recursiveTypeGenOutput?.content ?? '') +
    dynamicGeneratedType;
  return result;
}

function generateEnumType(typeName: string, typeInfo: TypeInfo): GeneratedType {
  if (typeInfo.enum === null || typeInfo.enum.length === 0 || typeInfo.type === null) {
    throw new InvalidSpecFileError('Invalid enum type for: ' + typeName);
  }
  const templateInput: EnumTemplateInput = {
    typeName,
    enumType: typeInfo.type,
    values: typeInfo.enum,
    example: typeInfo.example,
    description: typeInfo.description
  };

  const result: GeneratedType = {
    content: '',
    references: new Set(),
    primitives: new Set(),
    templateInput
  };

  result.content = Runtime.getEnumTemplate()(templateInput);
  return result;
}

function generateOneOfTypes(typeName: string, typeInfo: TypeInfo): GeneratedType {
  const result: GeneratedType = {
    content: '',
    references: new Set(),
    primitives: new Set()
  };
  if (typeInfo.oneOf === null || typeInfo.oneOf.length === 0) {
    throw new InvalidSpecFileError('Invalid oneOf type for: ' + typeName);
  }
  const templateInput: OneOfTemplateInput = {
    typeName,
    compositions: []
  };

  for (let index = 0; index < typeInfo.oneOf.length; index++) {
    const oneOfItem = typeInfo.oneOf[index];
    if (oneOfItem.$ref !== null) {
      const referenceName = resolveAndGetReferenceName(oneOfItem.$ref);
      const composition: OneOfTemplateInputComposition = {
        source: 'referenced',
        referencedType: referenceName
      };
      templateInput.compositions.push(composition);
      result.references.add(referenceName);
    } else {
      const generatedType = generateType(typeName + (index + 1), oneOfItem);

      if (generatedType === null) {
        throw new InvalidSpecFileError('Invalid oneOf type for: ' + typeName);
      }

      const composition: OneOfTemplateInputComposition = {
        dataType: oneOfItem.type,
        templateInput: generatedType.templateInput,
        source: 'inline',
        content: generatedType.content
      };

      templateInput.compositions.push(composition);
      for (const reference of generatedType.references.values()) {
        result.references.add(reference);
      }
      for (const primitive of generatedType.primitives.values()) {
        result.primitives.add(primitive);
      }
    }
  }

  result.content = Runtime.getOneOfTemplate()(templateInput);
  return result;
}

function generateVariableType(typeName: string, typeInfo: TypeInfo): GeneratedType | null {
  if (typeInfo.type === null) {
    return null;
  }
  const dataType = getLanguageDataType(typeInfo.type, typeInfo.format, typeInfo.items);
  const _primitives = [...dataType.primitives];
  if (typeInfo.type === 'array' && dataType.references.size !== 0) {
    _primitives.push('Array');
  } else if (typeInfo.type !== 'array' && typeInfo.$ref === null) {
    _primitives.push(dataType.dataType);
  }

  return {
    content: '',
    references: dataType.references,
    primitives: new Set(_primitives),
    templateInput: {
      typeName,
      dataType: dataType.dataType,
      itemType: dataType.itemType,
      primitiveType: typeInfo.type
    }
  };
}

function generateType(typeName: string, typeInfo: TypeInfo): GeneratedType | null {
  if (typeInfo.type === 'object') {
    return generateObjectType(typeName, typeInfo);
  }
  if (typeInfo.enum !== null) {
    return generateEnumType(typeName, typeInfo);
  }
  if (typeInfo.oneOf !== null) {
    return generateOneOfTypes(typeName, typeInfo);
  }
  return generateVariableType(typeName, typeInfo);
}

function generateTypes(types: Types): GeneratedTypes {
  const result: GeneratedTypes = {};
  for (const type in types) {
    const typeInfo: TypeInfo = types[type];
    const genType = generateType(type, typeInfo);
    if (genType !== null) {
      result[type] = genType;
    }
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
    groupedTypes[groupName] = generateTypes(specFileData.groupedTypes[groupName]);
  }
  result.groupedTypes = groupedTypes;

  return result;
}
