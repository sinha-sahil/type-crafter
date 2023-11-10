export * from './decoders';

// #region Config Type

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

// #endregion

// #region Spec File Data

export type SpecFileData = {
  info: SpecInfo;
  groupedTypes: GroupedTypes | null;
  types: Types | null;
};

export type SpecInfo = {
  version: string;
  title: string;
};

type GroupName = string;
export type GroupedTypes = Record<GroupName, Types>;

type TypeName = string;
export type Types = Record<TypeName, TypeInfo>;

export type TypeInfo = {
  required: string[] | null;
  type: TypeDataType;
  format: string | null;
  items: TypeInfo | null;
  properties: TypeProperties | null;
};

type PropertyName = string;
export type TypeProperties = Record<PropertyName, TypeInfo>;

export type TypeDataType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

// #endregion

// #region Writer Data

export type ObjectTemplateInput = {
  typeName: string;
  properties: ObjectTemplateInputProperties;
};

export type ObjectTemplateInputProperties = Record<PropertyName, ObjectTemplateInputProperty>;

export type ObjectTemplateInputProperty = {
  type: string;
  required: boolean;
};

export type ExporterModuleTemplateInput = {
  modules: string[];
};

// #endregion

// #region Output Data

export type GenerationResult = {
  groupedTypes: GroupedTypesOutput;
  types: TypesOutput;
};

export type GroupedTypesOutput = Record<GroupName, TypesOutput>;
export type TypesOutput = Record<TypeName, string>;

// #endregion
