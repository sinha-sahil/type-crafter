import type { Configuration, GroupedTypesWriterMode, TypesWriterMode } from '$types';
import { readFile } from '$utils';

export async function config(
  inputFilePath: string,
  outputDirectory: string,
  typesWriterMode: TypesWriterMode,
  groupedTypesWriterMode: GroupedTypesWriterMode
): Promise<Configuration> {
  const devMode = '__DEVELOPMENT__'.includes('DEVELOPMENT');
  const directoryPrefix = devMode ? 'src/' : './';

  const objectSyntax = await readFile(
    directoryPrefix + 'templates/typescript-with-decoders/object-syntax.hbs',
    devMode
  );
  const exporterModuleSyntax = await readFile(
    directoryPrefix + 'templates/typescript/exporter-module-syntax.hbs',
    devMode
  );
  const typesFileSyntax = await readFile(
    directoryPrefix + 'templates/typescript-with-decoders/types-file-syntax.hbs',
    devMode
  );
  const enumSyntax = await readFile(
    directoryPrefix + 'templates/typescript-with-decoders/enum-syntax.hbs',
    devMode
  );

  const oneOfSyntax = await readFile(
    directoryPrefix + 'templates/typescript-with-decoders/oneOf-syntax.hbs',
    devMode
  );

  const config: Configuration = {
    input: inputFilePath,
    output: {
      cleanWrite: true,
      fileExtension: '.ts',
      directory: outputDirectory,
      writerMode: {
        groupedTypes: groupedTypesWriterMode,
        types: typesWriterMode
      }
    },
    template: {
      objectSyntax,
      exporterModuleSyntax,
      typesFileSyntax,
      enumSyntax,
      oneOfSyntax
    },
    language: {
      exporterModuleName: 'index',
      typeMapper: {
        string: { default: 'string', date: 'Date' },
        number: { default: 'number' },
        integer: { default: 'number' },
        boolean: 'boolean',
        array: '~ItemType~[]',
        object: 'type',
        unknown: 'unknown'
      }
    }
  };
  return config;
}
