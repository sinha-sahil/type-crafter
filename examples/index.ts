import { readFile } from '$utils';
import { generate } from '../src';

async function generateTypescript() {
  const objectSyntax = await readFile('templates/typescript/object-syntax.hbs');
  const exporterModuleSyntax = await readFile('templates/typescript/exporter-module-syntax.hbs');

  generate({
    input: 'examples/input.yaml',
    output: {
      cleanWrite: true,
      fileExtension: '.ts',
      directory: 'examples/output',
      writerMode: {
        groupedTypes: 'FolderWithFiles',
        types: 'Files'
      }
    },
    template: {
      objectSyntax,
      exporterModuleSyntax
    },
    language: {
      exporterModuleName: 'index',
      typeMapper: {
        string: { default: 'string', date: 'Date' },
        number: { default: 'number' },
        integer: { default: 'integer' },
        boolean: 'boolean',
        array: 'Array',
        object: 'type'
      }
    }
  });
}

generateTypescript();
