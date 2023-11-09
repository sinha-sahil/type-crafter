import {
  Configuration,
  GenerationResult,
  ObjectTemplateInput,
  SpecFileData,
  TypesOutput,
  TypeInfo,
  Types,
  GroupedTypes,
  GroupedTypesOutput,
  TypeDataType
} from '$types';
import Handlebars from 'handlebars';
import { Runtime } from '../runtime';
import { isJSON } from 'type-decoder';

type TemplateGenerator = (input: ObjectTemplateInput) => string;

function getLanguageDataType(dataType: TypeDataType, format: string | null): string {
  const typeMapper = Runtime.config?.language.typeMapper ?? null;
  const mappedType = typeMapper !== null ? typeMapper[dataType] : null;
  if (typeof mappedType === 'string') {
    return mappedType;
  } else if (isJSON(mappedType)) {
    const defaultType = mappedType.default;
    const mappedTypeWithFormat = mappedType[format ?? ''] ?? defaultType;
    if (typeof mappedTypeWithFormat !== 'undefined') {
      return mappedTypeWithFormat;
    }
  }
  return dataType;
}

function generateTypeString(
  template: TemplateGenerator,
  typeName: string,
  typeInfo: TypeInfo
): string {
  const templateInput: ObjectTemplateInput = {
    typeName,
    properties: {}
  };

  for (let propertyName in typeInfo.properties) {
    const propertyType = typeInfo.properties[propertyName].type;
    const propertyFormat = typeInfo.properties[propertyName].format;
    templateInput.properties = {
      ...templateInput.properties,
      [propertyName]: {
        type: getLanguageDataType(propertyType, propertyFormat),
        required: typeInfo.required?.includes(propertyName) ?? false
      }
    };
  }
  return template(templateInput);
}

function generateTypes(template: TemplateGenerator, types: Types): TypesOutput {
  const result: TypesOutput = {};
  for (let type in types) {
    const typeInfo: TypeInfo = types[type];
    const typeString = generateTypeString(template, type, typeInfo);
    result[type] = typeString;
  }
  return result;
}

export function generator(specFileData: SpecFileData): GenerationResult {
  if (Runtime.config === null) {
    throw new Error('Configuration not set!');
  }

  const result: GenerationResult = {
    groupedTypes: {},
    types: {}
  };

  // compiling templates
  const objectSyntaxTemplate = Handlebars.compile(Runtime.config.template.objectSyntax);

  // generating types
  if (specFileData.types !== null) {
    result.types = generateTypes(objectSyntaxTemplate, specFileData.types);
  }

  // generating grouped types
  const groupedTypes: GroupedTypesOutput = {};
  for (let groupName in specFileData.groupedTypes) {
    groupedTypes[groupName] = generateTypes(
      objectSyntaxTemplate,
      specFileData.groupedTypes[groupName]
    );
  }
  result.groupedTypes = groupedTypes;

  return result;
}
