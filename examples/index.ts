import { readFile } from '$utils';
import { generate } from '../src';

async function generateTypescript(): Promise<void> {
  const objectSyntax = await readFile('templates/typescript/object-syntax.hbs');
  const exporterModuleSyntax = await readFile('templates/typescript/exporter-module-syntax.hbs');
  const typesFileSyntax = await readFile('templates/typescript/types-file-syntax.hbs');

  await generate({
    input: 'examples/input.yaml',
    output: {
      cleanWrite: true,
      fileExtension: '.ts',
      directory: 'examples/output',
      writerMode: {
        groupedTypes: 'FolderWithFiles',
        types: 'SingleFile'
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
  });
}

generateTypescript()
  .then(() => {
    console.log('Done & Dusted');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
