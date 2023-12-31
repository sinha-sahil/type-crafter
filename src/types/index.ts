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
    groupedTypes: GroupedTypesWriterMode;
    types: TypesWriterMode;
  };
};

export type GroupedTypesWriterMode = 'FolderWithFiles' | 'SingleFile';
export type TypesWriterMode = 'SingleFile' | 'Files';

export type Template = {
  objectSyntax: string;
  exporterModuleSyntax: string;
  typesFileSyntax: string;
  enumSyntax: string;
  oneOfSyntax: string;
  allOfSyntax: string;
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

// #region Runtime Type

export type ReferenceType = 'local' | 'remote' | 'url';

export type ReferenceMeta = {
  completeSource: string;
  sourceFile: string;
  path: string;
  type: ReferenceType;
  name: string;
};

export type ResolvedTypeReferenceData = ReferenceMeta & {
  typeInfo: TypeInfo;
};

export type ResolvedGroupReferenceData = ReferenceMeta & {
  groupedTypes: Types;
};

export type GeneratedReferencedType = ResolvedTypeReferenceData & {
  templateData: GeneratedType<TemplateInput>;
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
export type GroupedTypes = Record<GroupName, GroupTypesData>;
export type GroupTypesData = Types | GroupRef;

export type GroupRef = {
  $ref: string;
};

type TypeName = string;
export type Types = Record<TypeName, TypeInfo>;

export type TypeInfo = TypeDescriptors & {
  required: string[] | null;
  type: TypeDataType | null;
  format: string | null;
  items: TypeInfo | null;
  properties: TypeProperties | null;
  $ref: string | null;
  oneOf: TypeInfo[] | null;
  allOf: TypeInfo[] | null;
  enum: string[] | number[] | null;
  additionalProperties: AdditionalProperties | null;
};

export type AdditionalProperties = KeyedAdditionalProperties | TypeInfo | boolean;

export type KeyedAdditionalProperties = {
  keyType: AdditionalPropertiesKeyType;
  valueType: TypeInfo;
};

export type AdditionalPropertiesKeyType = 'string' | 'number';

type PropertyName = string;
export type TypeProperties = Record<PropertyName, TypeInfo>;

export type TypeDataType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'unknown';

export type TypeDescriptors = {
  summary: string | null;
  example: string | number | null;
  description: string | null;
};

// #endregion

// #region Writer Data

export type ObjectTemplateInput = TypeDescriptors & {
  typeName: string;
  type: string;
  properties: ObjectTemplateInputProperties;
  additionalProperties?: AdditionalPropertiesTemplateInput;
};

export type ObjectTemplateInputProperties = Record<PropertyName, ObjectTemplateInputProperty>;

export type ObjectTemplateInputProperty = TypeDescriptors & {
  type: string;
  required: boolean;
  referenced: boolean;
  primitiveType: string;
  composerType: string | null;
};

export type AdditionalPropertiesTemplateInput = {
  keyType: string;
  valueType: string;
};

export type ExporterModuleTemplateInput = {
  modules: string[];
};

export type TypesFileTemplateInput = {
  referencedTypes: string[];
  primitives: string[];
  typesContent: string;
  writtenAt: string;
};

export type ReferencedModule = {
  modulePath: string;
  moduleRelativePath: string;
  referencedTypes: string[];
};

export type EnumTemplateInput = TypeDescriptors & {
  typeName: string;
  type: string;
  values: string[] | number[];
};

export type OneOfTemplateInput = TypeDescriptors & {
  typeName: string;
  type: string;
  compositions: OneOfTemplateInputComposition[];
};

export type OneOfTemplateInputComposition = {
  dataType?: TypeDataType | null;
  templateInput?: TemplateInput;
  source: 'inline' | 'referenced';
  referencedType?: string;
  content?: string;
};

export type AllOfTemplateInput = TypeDescriptors & {
  typeName: string;
  type: string;
  compositions: AllOfTemplateInputComposition[];
};

export type AllOfTemplateInputComposition = {
  dataType?: TypeDataType | null;
  templateInput?: TemplateInput;
  source: 'inline' | 'referenced';
  referencedType?: string;
  content?: string;
};

export type VariableTemplateInput = TypeDescriptors & {
  typeName: string;
  type: string;
  composerType?: string;
};

export type TemplateInput =
  | ObjectTemplateInput
  | EnumTemplateInput
  | OneOfTemplateInput
  | AllOfTemplateInput
  | VariableTemplateInput;

// #endregion

// #region Output Data

export type GenerationResult = {
  groupedTypes: GroupedTypesOutput;
  types: GeneratedTypes;
};

export type GeneratedType<TemplateType extends TemplateInput> = {
  content: string;
  references: Set<string>;
  primitives: Set<string>;
  templateInput: TemplateType;
};

export type GroupedTypesOutput = Record<GroupName, GeneratedTypes>;
export type GeneratedTypes = Record<TypeName, GeneratedType<TemplateInput>>;

export type TypeFilePath = {
  modulePath: string;
  filePath: string;
  extension: string;
};

// #endregion
