import { Configuration, GenerationResult, ObjectTemplateInput, SpecFileData, TypesOutput, TypeInfo, Types, GroupedTypes, GroupedTypesOutput } from "$types";
import Handlebars from "handlebars";

type TemplateGenerator = (input: ObjectTemplateInput) => string;

function generateTypeString(template: TemplateGenerator, typeName: string, typeInfo: TypeInfo): string {
  const templateInput: ObjectTemplateInput = {
    typeName,
    properties: {},
  };

  for (let propertyName in typeInfo.properties) {
    const propertyType = typeInfo.properties[propertyName].type;
    templateInput.properties = {
      ...templateInput.properties,
      [propertyName]: {
        type: propertyType,
        required: typeInfo.required?.includes(propertyName) ?? false,
      },
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

export function generator(config: Configuration, specFileData: SpecFileData): GenerationResult { 
  const result: GenerationResult = {
    groupedTypes: {},
    types: {}
  };

  // compiling templates
  const objectSyntaxTemplate = Handlebars.compile(config.template.objectSyntax);

  // generating types
  if (specFileData.types !== null) { 
    result.types = generateTypes(objectSyntaxTemplate, specFileData.types);
  }

  // generating grouped types
  const groupedTypes: GroupedTypesOutput = {};
  for (let groupName in specFileData.groupedTypes) {
    groupedTypes[groupName] = generateTypes(objectSyntaxTemplate, specFileData.groupedTypes[groupName]);
  }
  result.groupedTypes = groupedTypes

  return result;
}