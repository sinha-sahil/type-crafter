import type {
  GenerationResult,
  ObjectTemplateInput,
  SpecFileData,
  TypesOutput,
  TypeInfo,
  Types,
  GroupedTypesOutput,
  TypeDataType
} from '$types';
import Handlebars from 'handlebars';
import Runtime from '../runtime';
import { isJSON } from 'type-decoder';
import { toPascalCase } from '$utils';

function fillPatterns(input: string, patterns: Array<{ regex: RegExp; value: string }>): string {
  let result = input;
  patterns.forEach((pattern) => {
    result = result.replace(pattern.regex, pattern.value);
  });
  return result;
}

function getLanguageDataType(
  dataType: TypeDataType,
  format: string | null,
  items: TypeInfo | null
): string {
  const typeMapper = Runtime.getConfig().language.typeMapper ?? null;
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
    if (typeof mappedTypeWithFormat === 'string') {
      return fillPatterns(mappedTypeWithFormat, fillerPatterns);
    }
  }
  return dataType;
}

function generateTypeString(
  template: HandlebarsTemplateDelegate<ObjectTemplateInput>,
  typeName: string,
  typeInfo: TypeInfo
): string {
  const templateInput: ObjectTemplateInput = {
    typeName,
    properties: {}
  };

  let recursiveTypeString = '';

  for (const propertyName in typeInfo.properties) {
    const propertyType = typeInfo.properties[propertyName].type;
    const propertyFormat = typeInfo.properties[propertyName].format;
    const propertyItems = typeInfo.properties[propertyName].items ?? null;
    const recursivePropertyName = toPascalCase(propertyName);
    if (propertyType === 'object') {
      recursiveTypeString +=
        '\n' +
        generateTypeString(template, recursivePropertyName, typeInfo.properties[propertyName]);
    }
    templateInput.properties = {
      ...templateInput.properties,
      [propertyName]: {
        type:
          propertyType === 'object'
            ? recursivePropertyName
            : getLanguageDataType(propertyType, propertyFormat, propertyItems),
        required: typeInfo.required?.includes(propertyName) ?? false
      }
    };
  }
  return template(templateInput) + recursiveTypeString;
}

function generateTypes(
  template: HandlebarsTemplateDelegate<ObjectTemplateInput>,
  types: Types
): TypesOutput {
  const result: TypesOutput = {};
  for (const type in types) {
    const typeInfo: TypeInfo = types[type];
    const typeString = generateTypeString(template, type, typeInfo);
    result[type] = typeString;
  }
  return result;
}

export function generator(specFileData: SpecFileData): GenerationResult {
  const result: GenerationResult = {
    groupedTypes: {},
    types: {}
  };

  // compiling templates
  const objectSyntaxTemplate: HandlebarsTemplateDelegate<ObjectTemplateInput> = Handlebars.compile(
    Runtime.getConfig().template.objectSyntax
  );

  // generating types
  if (specFileData.types !== null) {
    result.types = generateTypes(objectSyntaxTemplate, specFileData.types);
  }

  // generating grouped types
  const groupedTypes: GroupedTypesOutput = {};
  for (const groupName in specFileData.groupedTypes) {
    groupedTypes[groupName] = generateTypes(
      objectSyntaxTemplate,
      specFileData.groupedTypes[groupName]
    );
  }
  result.groupedTypes = groupedTypes;

  return result;
}
