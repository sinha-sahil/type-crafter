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
  TemplateInput,
  ResolvedGroupReferenceData
} from '$types';
import { valueIsGroupRef } from '$types';
import Runtime from '$runtime';
import { toPascalCase } from '$utils';
import { InvalidSpecFileError } from '$utils/error-handler';
import { fillPatterns, resolveGroupReference, resolveTypeReference } from './helpers';

/**
 * @description Generates the primitive type for the unit attribute in the spec.
 * @param typeName { string }
 * @param typeInfo { TypeInfo }
 * @returns {GeneratedType<VariableTemplateInput>}
 */
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
  typeInfo: TypeInfo,
  parentTypes: string[]
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

  // Generating types for properties
  for (const propertyName in typeInfo.properties) {
    const propertyDetails = typeInfo.properties[propertyName];
    const propertyType = propertyDetails.type;
    const reference = propertyDetails.$ref ?? null;
    const enumValues = propertyDetails.enum ?? null;

    // Throwing error in case neither property type nor reference to a different type is present
    if (propertyType === null && reference === null && propertyDetails.oneOf === null) {
      throw new InvalidSpecFileError('Invalid property type for: ' + typeName + '.' + propertyName);
    }

    const primitiveType = propertyType ?? 'object';
    let composerType = null;
    let recursivePropertyName;
    let languageDataType: string | null = null;
    let isReferenced = false;

    if (reference !== null) {
      const referencedType = await generateReferencedType(
        propertyName,
        propertyDetails,
        parentTypes
      );
      recursivePropertyName = referencedType.templateInput.typeName;
      languageDataType = recursivePropertyName;
      references.push(...referencedType.references);
      primitives.push(...referencedType.primitives);
      isReferenced = true;
    } else if (enumValues !== null) {
      const enumName = toPascalCase(propertyName) + 'Enum';
      dynamicGeneratedType += generateEnumType(enumName, propertyDetails).content;
      languageDataType = enumName;
    } else if (propertyType === 'array') {
      const arrayDataGenOutput = await generateArrayType(
        propertyName,
        propertyDetails,
        parentTypes
      );
      primitives.push(...arrayDataGenOutput.primitives);
      references.push(...arrayDataGenOutput.references);
      languageDataType = arrayDataGenOutput.templateInput.type;
      composerType = arrayDataGenOutput.templateInput.composerType ?? null;
    } else if (propertyType === 'object') {
      recursivePropertyName = toPascalCase(propertyName);
      recursiveTypeGenOutput = await generateObjectType(
        recursivePropertyName,
        typeInfo.properties[propertyName],
        parentTypes
      );
      languageDataType = recursivePropertyName;
      references.push(...recursiveTypeGenOutput.references);
      primitives.push(...recursiveTypeGenOutput.primitives);
    } else {
      const primitiveTypeGenOutput = await generateType(
        typeName + toPascalCase(propertyName),
        propertyDetails,
        parentTypes
      );
      languageDataType = primitiveTypeGenOutput.templateInput.type;
      primitives.push(...primitiveTypeGenOutput.primitives);
      references.push(...primitiveTypeGenOutput.references);
      dynamicGeneratedType += primitiveTypeGenOutput.content;
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

/**
 * @description Generated ENUM type for the unit attribute in the spec.
 * @param typeName
 * @param typeInfo
 * @returns {GeneratedType<EnumTemplateInput>}
 */
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
  typeInfo: TypeInfo,
  parentTypes: string[]
): Promise<GeneratedType<VariableTemplateInput>> {
  if (typeInfo.items === null) {
    throw new InvalidSpecFileError('Invalid array type for: ' + typeName);
  }

  const arrayItemsType = await generateType(typeName + 'Item', typeInfo.items, parentTypes);

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
  typeInfo: TypeInfo,
  parentTypes: string[]
): Promise<GeneratedType<TemplateInput>> {
  if (typeInfo.$ref === null) {
    throw new InvalidSpecFileError('Invalid referenced type for: ' + typeName);
  }

  const cachedReferencedType = Runtime.getCachedReferenceType(typeInfo.$ref);
  if (cachedReferencedType !== null) {
    return cachedReferencedType.templateData;
  }

  const referencedTypeInfo = await resolveTypeReference(typeInfo.$ref);
  const referencedGeneratedType = await generateType(
    referencedTypeInfo.name,
    referencedTypeInfo.typeInfo,
    parentTypes
  );

  const result = {
    content: referencedGeneratedType.content,
    references: new Set([...referencedGeneratedType.references, referencedTypeInfo.name]),
    primitives: referencedGeneratedType.primitives,
    templateInput: referencedGeneratedType.templateInput
  };

  Runtime.cacheReferenceType(typeInfo.$ref, { ...referencedTypeInfo, templateData: result });
  return result;
}

async function generateOneOfTypes(
  typeName: string,
  typeInfo: TypeInfo,
  parentTypes: string[]
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
      const referenceData = await resolveTypeReference(oneOfItem.$ref);
      const composition: OneOfTemplateInputComposition = {
        source: 'referenced',
        referencedType: referenceData.name
      };
      templateInput.compositions.push(composition);
      result.references.add(referenceData.name);
    } else {
      const generatedType = await generateType(typeName + (index + 1), oneOfItem, parentTypes);

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

function returnCyclicReference(typeName: string): GeneratedType<TemplateInput> {
  const templateInput: VariableTemplateInput = {
    typeName,
    type: typeName,
    composerType: typeName,
    description: '',
    example: '',
    summary: ''
  };

  return {
    content: '',
    references: new Set(),
    primitives: new Set(),
    templateInput
  };
}

async function generateType(
  typeName: string,
  typeInfo: TypeInfo,
  parentTypes: string[]
): Promise<GeneratedType<TemplateInput>> {
  if (parentTypes.includes(typeName)) {
    return returnCyclicReference(typeName);
  }

  parentTypes = [...parentTypes, typeName];

  if (typeInfo.type === 'object') {
    return await generateObjectType(typeName, typeInfo, parentTypes);
  }
  if (typeInfo.enum !== null) {
    return generateEnumType(typeName, typeInfo);
  }
  if (typeInfo.oneOf !== null) {
    return await generateOneOfTypes(typeName, typeInfo, parentTypes);
  }
  if (typeInfo.type === 'array') {
    return await generateArrayType(typeName, typeInfo, parentTypes);
  }
  if (typeInfo.$ref !== null) {
    return await generateReferencedType(typeName, typeInfo, parentTypes);
  }
  return generateVariableType(typeName, typeInfo);
}

async function generateTypes(types: Types): Promise<GeneratedTypes> {
  const result: GeneratedTypes = {};
  for (const type in types) {
    const typeInfo: TypeInfo = types[type];
    const generatedData = await generateType(type, typeInfo, []);
    // Not storing top level referenced types as they are already generated somewhere else
    if (typeInfo.$ref === null) {
      result[type] = generatedData;
    }
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

  // remove self references
  for (const typeName in result.types) {
    const typeData = result.types[typeName];
    typeData.references.delete(typeName);
  }

  // generating grouped types
  const groupedTypes: GroupedTypesOutput = {};
  const referencedGroups: ResolvedGroupReferenceData[] = [];
  for (const groupName in specFileData.groupedTypes) {
    const groupData = specFileData.groupedTypes[groupName];
    if (!valueIsGroupRef(groupData)) {
      groupedTypes[groupName] = await generateTypes(groupData);
    } else {
      const groupRefData = await resolveGroupReference(groupData.$ref);
      referencedGroups.push(groupRefData);
    }
  }

  for (const refGroup of referencedGroups) {
    groupedTypes[refGroup.name] = await generateTypes(refGroup.groupedTypes);
  }

  // storing remote referenced to output
  for (const generatedRefData of Runtime.getCachedReferencedTypes().values()) {
    if (typeof generatedRefData.sourceFile === 'string' && generatedRefData.type !== 'local') {
      const refGroupName = toPascalCase(generatedRefData.sourceFile.replace('.yaml', ''));
      groupedTypes[refGroupName] = {
        ...groupedTypes[refGroupName],
        [generatedRefData.name]: generatedRefData.templateData
      };
    }
  }

  result.groupedTypes = groupedTypes;

  return result;
}
