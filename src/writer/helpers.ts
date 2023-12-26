import Runtime from '$runtime';
import { valueIsGroupRef, type GroupedTypes, type TypeFilePath, type Types } from '$types';
import { toPascalCase } from '$utils';

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
    // No File/Folder will be created for referenced groups
    if (!valueIsGroupRef(group)) {
      result = new Map([...result, ...generateTypesOutputFiles(group, groupName)]);
    }
  }

  // Generating expect writing types for referenced types
  let referredGroups: GroupedTypes = {};

  for (const generatedRefData of Runtime.getCachedReferencedTypes().values()) {
    if (
      typeof generatedRefData.sourceFile !== 'undefined' &&
      generatedRefData.completeSource !== Runtime.getInputFilePath() // Preventing new file creation for remote references from base file
    ) {
      const groupName = toPascalCase(generatedRefData.sourceFile.replace('.yaml', ''));
      referredGroups = {
        ...referredGroups,
        [groupName]: {
          ...referredGroups[groupName],
          [generatedRefData.name]: generatedRefData.typeInfo
        }
      };
    }
  }

  for (const groupName in referredGroups) {
    const group = referredGroups[groupName];
    // No File/Folder will be created for referenced groups
    if (!valueIsGroupRef(group)) {
      result = new Map([...result, ...generateTypesOutputFiles(group, groupName)]);
    }
  }

  return result;
}
