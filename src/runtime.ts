import type {
  Configuration,
  ExporterModuleTemplateInput,
  ObjectTemplateInput,
  SpecFileData,
  TypeFilePath,
  TypesFileTemplateInput
} from '$types';
import Handlebars from 'handlebars';

let config: Configuration | null = null;
let specFileData: SpecFileData | null = null;
let objectSyntaxTemplate: HandlebarsTemplateDelegate<ObjectTemplateInput> | null = null;
let exporterModuleSyntaxTemplate: HandlebarsTemplateDelegate<ExporterModuleTemplateInput> | null =
  null;
let typesFileSyntaxTemplate: HandlebarsTemplateDelegate<TypesFileTemplateInput> | null = null;
let expectedOutputFiles: Map<string, TypeFilePath> | null = null;

function setConfig(newConfig: Configuration): void {
  config = newConfig;
}

function getConfig(): Configuration {
  if (config === null) {
    throw new Error('Configuration not set!');
  }
  return config;
}

function setSpecFileData(newSpecFileData: SpecFileData): void {
  specFileData = newSpecFileData;
}

function getSpecFileData(): SpecFileData {
  if (specFileData === null) {
    throw new Error('Spec file data not set!');
  }
  return specFileData;
}

function compileTemplates(): void {
  const config = getConfig();
  objectSyntaxTemplate = Handlebars.compile(config.template.objectSyntax);
  exporterModuleSyntaxTemplate = Handlebars.compile(config.template.exporterModuleSyntax);
  typesFileSyntaxTemplate = Handlebars.compile(config.template.typesFileSyntax);
}

function getObjectTemplate(): HandlebarsTemplateDelegate<ObjectTemplateInput> {
  if (objectSyntaxTemplate === null) {
    throw new Error('Object template not compiled!');
  }
  return objectSyntaxTemplate;
}

function getExporterModuleTemplate(): HandlebarsTemplateDelegate<ExporterModuleTemplateInput> {
  if (exporterModuleSyntaxTemplate === null) {
    throw new Error('Exporter module template not compiled!');
  }
  return exporterModuleSyntaxTemplate;
}

function getTypesFileTemplate(): HandlebarsTemplateDelegate<TypesFileTemplateInput> {
  if (typesFileSyntaxTemplate === null) {
    throw new Error('Types file template not compiled!');
  }
  return typesFileSyntaxTemplate;
}

function setExpectedOutputFiles(newExpectedOutputFiles: Map<string, TypeFilePath>): void {
  expectedOutputFiles = newExpectedOutputFiles;
}

function getExpectedOutputFiles(): Map<string, TypeFilePath> {
  if (expectedOutputFiles === null) {
    throw new Error('Expected output files not set!');
  }
  return expectedOutputFiles;
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
  getExpectedOutputFiles,
  compileTemplates
};
