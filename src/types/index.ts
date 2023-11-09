export * from './decoders';

//#region Config Type

export type Configuration = {
  input: string;
  output: OutputConfig;
  template: Template;
  language: LanguageConfig;
};

export type OutputConfig = {
  cleanWrite: boolean;
  fileExtension: string;
  directory: string;
  writerMode: {
    groupedTypes: 'FolderWithFiles' | 'SingleFile';
    types: 'SingleFile' | 'Files';
  };
};

export type Template = {
  objectSyntax: string;
  exporterModuleSyntax: string;
};

export type LanguageConfig = {
  exporterModuleName: string;
  typeMapper: LanguageTypeMapper;
};

/**
 * @description Mappers for all the types supported by OpenAPI 3.0.0
 * @see https://swagger.io/docs/specification/data-models/data-types/
 */
export type LanguageTypeMapper = Record<TypeDataType, FormatType | string>;

export type FormatType = {
  default: string;
  [format: string]: string | undefined;
};

//#endregion

//#region Spec File Data

export type SpecFileData = {
  info: SpecInfo;
  groupedTypes: GroupedTypes | null;
  types: Types | null;
};

export type SpecInfo = {
  version: string;
  title: string;
};

export type GroupedTypes = {
  [groupName: string]: Types;
};

export type Types = {
  [typeName: string]: TypeInfo;
};

export type TypeInfo = {
  type: string;
  required: string[] | null;
  properties: TypeProperties;
};

export type TypeProperties = {
  [propertyName: string]: TypeProperty;
};

export type TypeDataType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

export type TypeProperty = {
  type: TypeDataType;
  format: string | null;
};

//#endregion

//#region Writer Data

export type ObjectTemplateInput = {
  typeName: string;
  properties: ObjectTemplateInputProperties;
};

export type ObjectTemplateInputProperties = {
  [propertyName: string]: ObjectTemplateInputProperty;
};

export type ObjectTemplateInputProperty = {
  type: string;
  required: boolean;
};

//#endregion

//#region Output Data

export type GenerationResult = {
  groupedTypes: GroupedTypesOutput;
  types: TypesOutput;
};

export type GroupedTypesOutput = {
  [groupName: string]: TypesOutput;
};

export type TypesOutput = {
  [typeName: string]: string;
};

//#endregion
