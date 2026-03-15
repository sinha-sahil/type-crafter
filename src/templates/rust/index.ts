import type { Configuration, TypesWriterMode, GroupedTypesWriterMode } from '$types';
import { readFile } from '$utils';

export async function config(
  inputFilePath: string,
  outputDirectory: string,
  typesWriterMode: TypesWriterMode,
  groupedTypesWriterMode: GroupedTypesWriterMode
): Promise<Configuration> {
  const devMode = '__DEVELOPMENT__'.includes('DEVELOPMENT');
  // __DEVELOPMENT__ will be replaced with PRODUCTION when package is built.
  const directoryPrefix = devMode ? 'src/' : './';

  const objectSyntax = await readFile(
    directoryPrefix + 'templates/rust/object-syntax.hbs',
    devMode
  );
  const exporterModuleSyntax = await readFile(
    directoryPrefix + 'templates/rust/exporter-module-syntax.hbs',
    devMode
  );
  const typesFileSyntax = await readFile(
    directoryPrefix + 'templates/rust/types-file-syntax.hbs',
    devMode
  );

  const enumSyntax = await readFile(directoryPrefix + 'templates/rust/enum-syntax.hbs', devMode);

  const oneOfSyntax = await readFile(directoryPrefix + 'templates/rust/oneOf-syntax.hbs', devMode);

  const allOfSyntax = await readFile(directoryPrefix + 'templates/rust/allOf-syntax.hbs', devMode);

  const config: Configuration = {
    input: inputFilePath,
    output: {
      cleanWrite: true,
      fileExtension: '.rs',
      directory: outputDirectory,
      typesFileName: 'mod',
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
      oneOfSyntax,
      allOfSyntax
    },
    language: {
      exporterModuleName: 'mod',
      typeMapper: {
        string: { default: 'String', date: 'time::Date', 'date-time': 'time::OffsetDateTime' },
        number: {
          default: 'f64',
          float: 'f32',
          double: 'f64',
          i8: 'i8',
          i16: 'i16',
          int32: 'i32',
          int64: 'i64',
          i128: 'i128',
          isize: 'isize',
          u8: 'u8',
          u16: 'u16',
          u32: 'u32',
          u64: 'u64',
          u128: 'u128',
          usize: 'usize'
        },
        integer: {
          default: 'i32',
          int32: 'i32',
          int64: 'i64',
          i8: 'i8',
          i16: 'i16',
          i128: 'i128',
          isize: 'isize',
          u8: 'u8',
          u16: 'u16',
          u32: 'u32',
          u64: 'u64',
          u128: 'u128',
          usize: 'usize'
        },
        boolean: 'bool',
        array: 'Vec<~ItemType~>',
        object: 'type',
        unknown: 'serde_json::Value'
      },
      modulePathConfig: {
        separator: '::',
        parentRef: 'super',
        selfRef: 'self',
        moduleFileName: 'mod',
        fileBasedModules: true,
        moduleNameCase: 'snake_case'
      },
      reservedKeywords: {
        prefix: 'r#',
        words: [
          'as',
          'break',
          'const',
          'continue',
          'crate',
          'else',
          'enum',
          'extern',
          'false',
          'fn',
          'for',
          'if',
          'impl',
          'in',
          'let',
          'loop',
          'match',
          'mod',
          'move',
          'mut',
          'pub',
          'ref',
          'return',
          'self',
          'Self',
          'static',
          'struct',
          'super',
          'trait',
          'true',
          'type',
          'unsafe',
          'use',
          'where',
          'while',
          'async',
          'await',
          'dyn',
          'abstract',
          'become',
          'box',
          'do',
          'final',
          'macro',
          'override',
          'priv',
          'typeof',
          'unsized',
          'virtual',
          'yield',
          'try'
        ]
      }
    }
  };
  return config;
}
