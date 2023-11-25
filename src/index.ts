#!/usr/bin/env node

import { Command } from 'commander';
import yaml from 'yaml';
import {
  type Configuration,
  decodeSpecFileData,
  decodeTypesWriterMode,
  decodeGroupedTypesWriterMode
} from '$types';
import { readFile, registerTemplateHelpers, greeting, logSuccess } from '$utils';
import {
  handleErrors,
  LanguageNotSupportedError,
  InvalidParamError,
  InvalidSpecFileError,
  UnsupportedFeatureError
} from '$utils/error-handler';
import { generator } from '$generators/generic';
import { writeOutput } from '$writer';
import Runtime from '$runtime';
import { typescript } from '$templates';

export async function generate(config: Configuration): Promise<void> {
  Runtime.setConfig(config);
  const specFileData = await readFile(config.input);
  const specJSONData = yaml.parse(specFileData);
  const decodedSpecData = decodeSpecFileData(specJSONData);
  if (
    decodedSpecData === null ||
    (decodedSpecData.types === null && decodedSpecData.groupedTypes === null)
  ) {
    throw new InvalidSpecFileError('Neither types nor groupedTypes found!');
  }
  Runtime.setSpecFileData(decodedSpecData);
  Runtime.compileTemplates();
  registerTemplateHelpers();
  const result = generator(decodedSpecData);
  await writeOutput(result);
}

async function runner(
  language: string,
  inputFilePath: string,
  outputDirectory: string,
  _typesWriterMode: string,
  _groupedTypesWriterMode: string
): Promise<void> {
  try {
    const typesWriterMode = decodeTypesWriterMode(_typesWriterMode);
    const groupedTypesWriterMode = decodeGroupedTypesWriterMode(_groupedTypesWriterMode);

    if (typesWriterMode === null) {
      throw new InvalidParamError('Types writer mode', _typesWriterMode);
    }

    if (groupedTypesWriterMode === null) {
      throw new InvalidParamError('Grouped types writer mode', _groupedTypesWriterMode);
    }

    let generatorConfig = null;
    switch (language.toLowerCase()) {
      case 'typescript':
        generatorConfig = await typescript.config(
          inputFilePath,
          outputDirectory,
          typesWriterMode,
          groupedTypesWriterMode
        );
        break;
      default:
        throw new LanguageNotSupportedError(language);
    }
    if (generatorConfig === null) {
      throw new UnsupportedFeatureError(`Failed to get generator config for ${language}`);
    }
    await generate(generatorConfig);
    logSuccess('Done & Dusted!', `Output saved at ${outputDirectory}`);
  } catch (e) {
    handleErrors(e);
  }
}

greeting();

const program = new Command().version('__VERSION__');

program
  .command('generate')
  .description('Generate types for your language from a type spec file')
  .argument('<outputLanguage>', 'Language to generate types for')
  .argument('<inputFilePath>', 'Path to the input spec file')
  .argument('<outputDirectory>', 'Path to the output file')
  .argument('[typesWriterMode]', 'Writer mode for types', 'SingleFile')
  .argument('[groupedTypesWriterMode]', 'Writer mode for grouped types', 'SingleFile')
  .action(runner);

program.parse();
