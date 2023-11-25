import type { Configuration, TypesWriterMode, GroupedTypesWriterMode } from '$types';
import { readFile } from '$utils';

export async function config(
  inputFilePath: string,
  outputDirectory: string,
  typesWriterMode: TypesWriterMode,
  groupedTypesWriterMode: GroupedTypesWriterMode
): Promise<Configuration> {
  // __DEVELOPMENT__ will be replaced with PRODUCTION when package is built.
  const directoryPrefix = '__DEVELOPMENT__'.includes('DEVELOPMENT') ? 'src/' : 'dist/';

  const objectSyntax = await readFile(directoryPrefix + 'templates/typescript/object-syntax.hbs');
  const exporterModuleSyntax = await readFile(
    directoryPrefix + 'templates/typescript/exporter-module-syntax.hbs'
  );
  const typesFileSyntax = await readFile(
    directoryPrefix + 'templates/typescript/types-file-syntax.hbs'
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
      typesFileSyntax
    },
    language: {
      exporterModuleName: 'index',
      typeMapper: {
        string: { default: 'string', date: 'Date' },
        number: { default: 'number' },
        integer: { default: 'integer' },
        boolean: 'boolean',
        array: '~ItemType~[]',
        object: 'type',
        unknown: 'unknown'
      }
    }
  };
  return config;
}
