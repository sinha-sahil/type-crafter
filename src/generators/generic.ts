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
  TypeDataType,
  TypeProperty
} from '$types';
import Handlebars from 'handlebars';
import { Runtime } from '../runtime';
import { isJSON } from 'type-decoder';

type TemplateGenerator = (input: ObjectTemplateInput) => string;

function fillPatterns(input: string, patterns: { regex: RegExp; value: string }[]): string {
  let result = input;
  patterns.forEach((pattern) => {
    result = result.replace(pattern.regex, pattern.value);
  });
  return result;
}

function getLanguageDataType(
  dataType: TypeDataType,
  format: string | null,
  items: TypeProperty | null
): string {
  const typeMapper = Runtime.config?.language.typeMapper ?? null;
  const mappedType = typeMapper !== null ? typeMapper[dataType] : null;
  const itemsType =
    items !== null ? getLanguageDataType(items.type, items.format, items.items) : null;
  const fillerPatterns = [];
  if (itemsType !== null) {
    fillerPatterns.push({ regex: /~ItemType~/g, value: itemsType });
  }

  if (typeof mappedType === 'string') {
    return fillPatterns(mappedType, fillerPatterns);
  } else if (isJSON(mappedType)) {
    const defaultType = mappedType.default;
    const mappedTypeWithFormat = mappedType[format ?? ''] ?? defaultType;
    if (typeof mappedTypeWithFormat !== 'undefined') {
      return fillPatterns(mappedTypeWithFormat, fillerPatterns);
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
    const propertyItems = typeInfo.properties[propertyName].items ?? null;
    templateInput.properties = {
      ...templateInput.properties,
      [propertyName]: {
        type: getLanguageDataType(propertyType, propertyFormat, propertyItems),
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
