export * from "./decoders";

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
  }
}

export type Template = {
  objectSyntax: string;
}

export type LanguageConfig = {
  keywords: LanguageKeywords;
}

export type LanguageKeywords = {
  "string": string;
  "number": string;
  "integer": string;
  "boolean": string;
  "object": string;
  "date": string;
  "array": string;
  "any": string;
}

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

export type TypeProperty = {
  type: string;
};

//#endregion

//#region Writer Data

export type ObjectTemplateInput = {
  typeName: string;
  properties: {
    [propertyName: string]: {
      type: string; 
      required: boolean;
    };
  }
}

//#endregion

//#region Output Data

export type GenerationResult = {
  groupedTypes: GroupedTypesOutput;
  types: TypesOutput;
}

export type GroupedTypesOutput = {
  [groupName: string]: TypesOutput;
}

export type TypesOutput = {
  [typeName: string]: string;
}

//#endregion
