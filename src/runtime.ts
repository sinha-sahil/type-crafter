import type {
  AllOfTemplateInput,
  Configuration,
  EnumTemplateInput,
  ExporterModuleTemplateInput,
  GeneratedReferencedType,
  ObjectTemplateInput,
  OneOfTemplateInput,
  SpecFileData,
  TypeFilePath,
  TypesFileTemplateInput
} from '$types';
import { resolveFilePath } from '$utils';
import { RuntimeError } from '$utils/error-handler';
import Handlebars from 'handlebars';

let config: Configuration | null = null;
let specFileData: SpecFileData | null = null;

let objectSyntaxTemplate: HandlebarsTemplateDelegate<ObjectTemplateInput> | null = null;
let exporterModuleSyntaxTemplate: HandlebarsTemplateDelegate<ExporterModuleTemplateInput> | null =
  null;
let typesFileSyntaxTemplate: HandlebarsTemplateDelegate<TypesFileTemplateInput> | null = null;
let oneOfSyntaxTemplate: HandlebarsTemplateDelegate<OneOfTemplateInput> | null = null;
let enumSyntaxTemplate: HandlebarsTemplateDelegate<EnumTemplateInput> | null = null;
let allOfSyntaxTemplate: HandlebarsTemplateDelegate<AllOfTemplateInput> | null = null;

const cachedReferencedTypes = new Map<string, GeneratedReferencedType>();
let expectedOutputFiles: Map<string, TypeFilePath> | null = null;

function setConfig(newConfig: Configuration): void {
  config = newConfig;
}

function getConfig(): Configuration {
  if (config === null) {
    throw new RuntimeError('Failed to load configuration!');
  }
  return config;
}

function setSpecFileData(newSpecFileData: SpecFileData): void {
  specFileData = newSpecFileData;
}

function getSpecFileData(): SpecFileData {
  if (specFileData === null) {
    throw new RuntimeError('Failed to load Spec file data!');
  }
  return specFileData;
}

function compileTemplates(): void {
  const config = getConfig();
  objectSyntaxTemplate = Handlebars.compile(config.template.objectSyntax);
  exporterModuleSyntaxTemplate = Handlebars.compile(config.template.exporterModuleSyntax);
  typesFileSyntaxTemplate = Handlebars.compile(config.template.typesFileSyntax);
  enumSyntaxTemplate = Handlebars.compile(config.template.enumSyntax);
  oneOfSyntaxTemplate = Handlebars.compile(config.template.oneOfSyntax);
  allOfSyntaxTemplate = Handlebars.compile(config.template.allOfSyntax);
}

function getObjectTemplate(): HandlebarsTemplateDelegate<ObjectTemplateInput> {
  if (objectSyntaxTemplate === null) {
    throw new RuntimeError('Object template not compiled!');
  }
  return objectSyntaxTemplate;
}

function getExporterModuleTemplate(): HandlebarsTemplateDelegate<ExporterModuleTemplateInput> {
  if (exporterModuleSyntaxTemplate === null) {
    throw new RuntimeError('Exporter module template not compiled!');
  }
  return exporterModuleSyntaxTemplate;
}

function getTypesFileTemplate(): HandlebarsTemplateDelegate<TypesFileTemplateInput> {
  if (typesFileSyntaxTemplate === null) {
    throw new RuntimeError('Types file template not compiled!');
  }
  return typesFileSyntaxTemplate;
}

function getEnumTemplate(): HandlebarsTemplateDelegate<EnumTemplateInput> {
  if (enumSyntaxTemplate === null) {
    throw new RuntimeError('Enum template not compiled!');
  }
  return enumSyntaxTemplate;
}

function getOneOfTemplate(): HandlebarsTemplateDelegate<OneOfTemplateInput> {
  if (oneOfSyntaxTemplate === null) {
    throw new RuntimeError('OneOf template not compiled!');
  }
  return oneOfSyntaxTemplate;
}

function setExpectedOutputFiles(newExpectedOutputFiles: Map<string, TypeFilePath>): void {
  expectedOutputFiles = newExpectedOutputFiles;
}

function getExpectedOutputFiles(): Map<string, TypeFilePath> {
  if (expectedOutputFiles === null) {
    throw new RuntimeError('Expected output files not set!');
  }
  return expectedOutputFiles;
}

function getCachedReferencedTypes(): Map<string, GeneratedReferencedType> {
  return cachedReferencedTypes;
}

function getCachedReferenceType(referencePath: string): GeneratedReferencedType | null {
  return cachedReferencedTypes.get(referencePath) ?? null;
}

function cacheReferenceType(referencePath: string, generatedData: GeneratedReferencedType): void {
  cachedReferencedTypes.set(referencePath, generatedData);
}

function getInputFilePath(absolutePath: boolean = true): string {
  if (config === null) {
    throw new RuntimeError('Spec file path not set!');
  }
  return absolutePath ? resolveFilePath(config.input) : config.input;
}

function getAllOfTemplate(): HandlebarsTemplateDelegate<AllOfTemplateInput> {
  if (allOfSyntaxTemplate === null) {
    throw new RuntimeError('AllOf template not compiled!');
  }
  return allOfSyntaxTemplate;
}

export default {
  getConfig,
  setConfig,
  setSpecFileData,
  setExpectedOutputFiles,
  getSpecFileData,
  getObjectTemplate,
  getExporterModuleTemplate,
  getTypesFileTemplate,
  getEnumTemplate,
  getExpectedOutputFiles,
  compileTemplates,
  getOneOfTemplate,
  getCachedReferencedTypes,
  getCachedReferenceType,
  cacheReferenceType,
  getInputFilePath,
  getAllOfTemplate
};
