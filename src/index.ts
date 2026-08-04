#!/usr/bin/env node

import { Command } from 'commander';
import { decodeTypesWriterMode, decodeGroupedTypesWriterMode } from '$types';
import { greeting, logSuccessBox, createSpinner, colors, symbols } from '$utils';
import {
  handleErrors,
  LanguageNotSupportedError,
  InvalidParamError,
  UnsupportedFeatureError
} from '$utils/error-handler';
import { typescript, typescriptWithDecoders, rust } from '$templates';
import { generate } from './sdk';
export { generate } from './sdk';

const { colorize, BRAND } = colors;

async function runner(
  language: string,
  inputFilePath: string,
  outputDirectory: string,
  _typesWriterMode: string,
  _groupedTypesWriterMode: string
): Promise<void> {
  const spinner = createSpinner('Initializing type generation...');

  try {
    const typesWriterMode = decodeTypesWriterMode(_typesWriterMode);
    const groupedTypesWriterMode = decodeGroupedTypesWriterMode(_groupedTypesWriterMode);

    if (typesWriterMode === null) {
      throw new InvalidParamError('Types writer mode', _typesWriterMode);
    }

    if (groupedTypesWriterMode === null) {
      throw new InvalidParamError('Grouped types writer mode', _groupedTypesWriterMode);
    }

    spinner.start();
    spinner.update(`Configuring ${language} generator...`);

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
      case 'typescript-with-decoders':
        generatorConfig = await typescriptWithDecoders.config(
          inputFilePath,
          outputDirectory,
          typesWriterMode,
          groupedTypesWriterMode
        );
        break;
      case 'rust':
        generatorConfig = await rust.config(
          inputFilePath,
          outputDirectory,
          typesWriterMode,
          groupedTypesWriterMode
        );
        break;
      default:
        spinner.stop();
        throw new LanguageNotSupportedError(language);
    }

    if (generatorConfig === null) {
      spinner.stop();
      throw new UnsupportedFeatureError(`Failed to get generator config for ${language}`);
    }

    spinner.update('Generating types...');
    await generate(generatorConfig);

    spinner.success('Type generation complete!');
    console.log();
    logSuccessBox(
      [
        colorize('Types have been crafted successfully!', BRAND.success),
        '',
        `${symbols.pointer} Language: ${colorize(language, BRAND.primary)}`,
        `${symbols.pointer} Output: ${colorize(outputDirectory, BRAND.primary)}`
      ],
      'Done & Dusted!'
    );
    console.log();
  } catch (e) {
    spinner.stop();
    handleErrors(e);
    process.exitCode = 1;
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
