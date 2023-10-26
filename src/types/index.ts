export * from "./decoders";

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

export type TypeProperty = {
  type: string;
};

export type Configuration = {
  inputFile: string;
  outputDirectory: string;
};
