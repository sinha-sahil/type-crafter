import type {
  GenerationResult,
  ObjectTemplateInput,
  SpecFileData,
  GeneratedTypes,
  TypeInfo,
  Types,
  GroupedTypesOutput,
  GeneratedType,
  EnumTemplateInput,
  OneOfTemplateInput,
  OneOfTemplateInputComposition,
  VariableTemplateInput,
  TemplateInput
} from '$types';
import Runtime from '$runtime';
import { toPascalCase } from '$utils';
import { InvalidSpecFileError } from '$utils/error-handler';
import { fillPatterns, resolveReference } from './helpers';

function getPrimitiveType(
  typeName: string,
  typeInfo: TypeInfo
): GeneratedType<VariableTemplateInput> {
  if (typeInfo.type === null) {
    throw new InvalidSpecFileError('Invalid type for: ' + typeName);
  }

  const templateInput: VariableTemplateInput = {
    typeName,
    description: typeInfo.description,
    example: typeInfo.example,
    summary: typeInfo.summary,
    type: typeInfo.type
  };

  const result: GeneratedType<VariableTemplateInput> = {
    content: '',
    references: new Set(),
    primitives: new Set(),
    templateInput
  };

  const typeMapper = Runtime.getConfig().language.typeMapper;
  const mappedType = typeMapper[typeInfo.type];
  let languageDataType: string | null = null;

  if (typeof mappedType !== 'string') {
    const defaultType = mappedType.default;
    const mappedTypeWithFormat = mappedType[typeInfo.format ?? ''] ?? defaultType;
    languageDataType = mappedTypeWithFormat;
  } else {
    languageDataType = mappedType;
  }

  if (languageDataType === null) {
    throw new InvalidSpecFileError('Invalid type for: ' + typeName);
  }

  templateInput.type = languageDataType;
  result.primitives.add(languageDataType);

  return result;
}

async function generateObjectType(
  typeName: string,
  typeInfo: TypeInfo
): Promise<GeneratedType<ObjectTemplateInput>> {
  const templateInput: ObjectTemplateInput = {
    typeName,
    type: typeName,
    description: typeInfo.description,
    example: typeInfo.example,
    summary: typeInfo.summary,
    properties: {}
  };

  let recursiveTypeGenOutput: GeneratedType<TemplateInput> | null = null;
  let dynamicGeneratedType: string = '';

  const primitives: string[] = [];
  const references: string[] = [];

  for (const propertyName in typeInfo.properties) {
    const propertyDetails = typeInfo.properties[propertyName];
    const propertyType = propertyDetails.type;
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
      const referencedType = await generateReferencedType(propertyName, propertyDetails);
      recursivePropertyName = referencedType.templateInput.typeName;
      languageDataType = recursivePropertyName;
      references.push(...referencedType.references);
      primitives.push(...referencedType.primitives);
      isReferenced = true;
    } else if (enumValues !== null) {
      const enumName = toPascalCase(propertyName) + 'Enum';
      dynamicGeneratedType = generateEnumType(enumName, propertyDetails).content;
      languageDataType = enumName;
    } else if (propertyType === 'array') {
      const arrayDataGenOutput = await generateArrayType(propertyName, propertyDetails);
      primitives.push(...arrayDataGenOutput.primitives);
      references.push(...arrayDataGenOutput.references);
      languageDataType = arrayDataGenOutput.templateInput.type;
      composerType = arrayDataGenOutput.templateInput.composerType ?? null;
    } else if (propertyType === 'object') {
      recursivePropertyName = toPascalCase(propertyName);
      recursiveTypeGenOutput = await generateObjectType(
        recursivePropertyName,
        typeInfo.properties[propertyName]
      );
      languageDataType = recursivePropertyName;
      references.push(...recursiveTypeGenOutput.references);
      primitives.push(...recursiveTypeGenOutput.primitives);
    } else {
      const primitiveTypeGenOutput = getPrimitiveType(propertyName, propertyDetails);
      languageDataType = primitiveTypeGenOutput.templateInput.type;
      primitives.push(...primitiveTypeGenOutput.primitives);
      references.push(...primitiveTypeGenOutput.references);
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
        description: propertyDetails.description,
        summary: propertyDetails.summary
      }
    };
  }

  const result: GeneratedType<ObjectTemplateInput> = {
    content:
      Runtime.getObjectTemplate()(templateInput) +
      (recursiveTypeGenOutput?.content ?? '') +
      dynamicGeneratedType,
    primitives: new Set(primitives),
    references: new Set(references),
    templateInput
  };

  return result;
}

function generateEnumType(typeName: string, typeInfo: TypeInfo): GeneratedType<EnumTemplateInput> {
  if (typeInfo.enum === null || typeInfo.enum.length === 0 || typeInfo.type === null) {
    throw new InvalidSpecFileError('Invalid enum type for: ' + typeName);
  }
  const templateInput: EnumTemplateInput = {
    typeName,
    type: typeInfo.type,
    values: typeInfo.enum,
    example: typeInfo.example,
    description: typeInfo.description,
    summary: typeInfo.summary
  };

  const result: GeneratedType<EnumTemplateInput> = {
    content: '',
    references: new Set(),
    primitives: new Set(),
    templateInput
  };

  result.content = Runtime.getEnumTemplate()(templateInput);
  return result;
}

async function generateArrayType(
  typeName: string,
  typeInfo: TypeInfo
): Promise<GeneratedType<VariableTemplateInput>> {
  if (typeInfo.items === null) {
    throw new InvalidSpecFileError('Invalid array type for: ' + typeName);
  }

  const arrayItemsType = await generateType(typeName, typeInfo.items);

  if (typeof arrayItemsType.templateInput?.type === 'undefined') {
    throw new InvalidSpecFileError('Invalid array type for: ' + typeName);
  }

  const fillerPatterns = [{ regex: /~ItemType~/g, value: arrayItemsType.templateInput.type }];
  const arrayTypeMap = Runtime.getConfig().language.typeMapper.array;

  if (typeof arrayTypeMap !== 'string') {
    throw new InvalidSpecFileError('Invalid array type for: ' + typeName);
  }

  const dataType = fillPatterns(arrayTypeMap, fillerPatterns);

  const result: GeneratedType<VariableTemplateInput> = {
    content: '',
    references: arrayItemsType.references,
    primitives: new Set([...arrayItemsType.primitives, 'Array']),
    templateInput: {
      typeName,
      type: dataType,
      composerType: arrayItemsType.templateInput.type,
      description: typeInfo.description,
      example: typeInfo.example,
      summary: typeInfo.summary
    }
  };

  return result;
}

function generateVariableType(
  typeName: string,
  typeInfo: TypeInfo
): GeneratedType<VariableTemplateInput> {
  if (typeInfo.type === null) {
    throw new InvalidSpecFileError('Invalid variable type for: ' + typeName);
  }

  const variableGenOutput = getPrimitiveType(typeName, typeInfo);

  const templateInput: VariableTemplateInput = {
    typeName,
    type: variableGenOutput.templateInput.type,
    composerType: variableGenOutput.templateInput.type,
    description: typeInfo.description,
    example: typeInfo.example,
    summary: typeInfo.summary
  };

  return {
    content: '',
    references: variableGenOutput.references,
    primitives: variableGenOutput.primitives,
    templateInput
  };
}

async function generateReferencedType(
  typeName: string,
  typeInfo: TypeInfo
): Promise<GeneratedType<TemplateInput>> {
  if (typeInfo.$ref === null) {
    throw new InvalidSpecFileError('Invalid referenced type for: ' + typeName);
  }

  const cachedReferencedType = Runtime.getCachedReferenceType(typeInfo.$ref);
  if (cachedReferencedType !== null) {
    return cachedReferencedType.templateData;
  }

  const referencedTypeInfo = await resolveReference(typeInfo.$ref);
  const referencedGeneratedType = await generateType(
    referencedTypeInfo.referenceName,
    referencedTypeInfo.typeInfo
  );

  const result = {
    content: referencedGeneratedType.content,
    references: new Set([...referencedGeneratedType.references, referencedTypeInfo.referenceName]),
    primitives: referencedGeneratedType.primitives,
    templateInput: referencedGeneratedType.templateInput
  };

  Runtime.cacheReferenceType(typeInfo.$ref, { ...referencedTypeInfo, templateData: result });
  return result;
}

async function generateOneOfTypes(
  typeName: string,
  typeInfo: TypeInfo
): Promise<GeneratedType<OneOfTemplateInput>> {
  if (typeInfo.oneOf === null || typeInfo.oneOf.length === 0) {
    throw new InvalidSpecFileError('Invalid oneOf type for: ' + typeName);
  }
  const templateInput: OneOfTemplateInput = {
    typeName,
    type: typeName,
    compositions: [],
    description: typeInfo.description,
    example: typeInfo.example,
    summary: typeInfo.summary
  };

  const result: GeneratedType<OneOfTemplateInput> = {
    content: '',
    references: new Set(),
    primitives: new Set(),
    templateInput
  };

  for (let index = 0; index < typeInfo.oneOf.length; index++) {
    const oneOfItem = typeInfo.oneOf[index];
    if (oneOfItem.$ref !== null) {
      const referenceData = await resolveReference(oneOfItem.$ref);
      const composition: OneOfTemplateInputComposition = {
        source: 'referenced',
        referencedType: referenceData.referenceName
      };
      templateInput.compositions.push(composition);
      result.references.add(referenceData.referenceName);
    } else {
      const generatedType = await generateType(typeName + (index + 1), oneOfItem);

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

async function generateType(
  typeName: string,
  typeInfo: TypeInfo
): Promise<GeneratedType<TemplateInput>> {
  if (typeInfo.type === 'object') {
    return await generateObjectType(typeName, typeInfo);
  }
  if (typeInfo.enum !== null) {
    return generateEnumType(typeName, typeInfo);
  }
  if (typeInfo.oneOf !== null) {
    return await generateOneOfTypes(typeName, typeInfo);
  }
  if (typeInfo.type === 'array') {
    return await generateArrayType(typeName, typeInfo);
  }
  if (typeInfo.$ref !== null) {
    return await generateReferencedType(typeName, typeInfo);
  }
  return generateVariableType(typeName, typeInfo);
}

async function generateTypes(types: Types): Promise<GeneratedTypes> {
  const result: GeneratedTypes = {};
  for (const type in types) {
    const typeInfo: TypeInfo = types[type];
    result[type] = await generateType(type, typeInfo);
  }

  return result;
}

export async function generator(specFileData: SpecFileData): Promise<GenerationResult> {
  const result: GenerationResult = {
    groupedTypes: {},
    types: {}
  };

  // generating types
  if (specFileData.types !== null) {
    result.types = await generateTypes(specFileData.types);
  }

  // generating grouped types
  const groupedTypes: GroupedTypesOutput = {};
  for (const groupName in specFileData.groupedTypes) {
    groupedTypes[groupName] = await generateTypes(specFileData.groupedTypes[groupName]);
  }

  // storing remote referenced to output
  for (const generatedRefData of Runtime.getCachedReferencedTypes().values()) {
    if (typeof generatedRefData.sourceFile === 'string') {
      const refGroupName = toPascalCase(generatedRefData.sourceFile.replace('.yaml', ''));
      groupedTypes[refGroupName] = {
        ...groupedTypes[refGroupName],
        [generatedRefData.referenceName]: generatedRefData.templateData
      };
    }
  }

  result.groupedTypes = groupedTypes;

  return result;
}
