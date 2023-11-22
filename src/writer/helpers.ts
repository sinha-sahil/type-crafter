import Runtime from '$runtime';
import type { TypeFilePath, Types } from '$types';

export function generateTypesOutputFiles(
  types: Types | null,
  groupName: string | null = null
): Map<string, TypeFilePath> {
  const config = Runtime.getConfig();
  const extension = config.output.fileExtension;
  const outputDir = config.output.directory;
  const moduleFileName = config.language.exporterModuleName;
  const writerMode =
    groupName === null ? config.output.writerMode.types : config.output.writerMode.groupedTypes;

  const result: Map<string, TypeFilePath> = new Map<string, TypeFilePath>();

  for (const typeName in types) {
    const typeProperties = types[typeName];
    if (typeof typeProperties !== 'undefined') {
      result.set(typeName, {
        modulePath:
          outputDir +
          '/' +
          (writerMode === 'FolderWithFiles' ? (groupName ?? '') + '/' : '') +
          moduleFileName,
        filePath:
          outputDir +
          (writerMode === 'Files' || writerMode === 'FolderWithFiles'
            ? '/' + (groupName ?? '') + typeName
            : '/' + (groupName ?? 'types')),
        extension
      });
    }
  }
  return result;
}

export function generateExpectedOutputFile(): Map<string, TypeFilePath> {
  const specData = Runtime.getSpecFileData();

  let result: Map<string, TypeFilePath> = new Map<string, TypeFilePath>();

  result = new Map([...generateTypesOutputFiles(specData.types)]);

  for (const groupName in specData.groupedTypes) {
    const group = specData.groupedTypes[groupName];
    result = new Map([...result, ...generateTypesOutputFiles(group, groupName)]);
  }

  return result;
}
