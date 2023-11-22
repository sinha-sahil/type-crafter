import type {
  Configuration,
  GenerationResult,
  GeneratedTypes,
  TypesFileTemplateInput
} from '$types';
import {
  addValuesToMappedSet,
  createFolder,
  createFolderWithBasePath,
  deleteFolder,
  getCompleteFolderPath,
  getExpectedWrittenPath,
  writeFile
} from '$utils';
import Runtime from '$runtime';
import { generateExpectedOutputFile } from './helpers';

// #region Localized types

type FileWriterOutput = {
  folderName: string;
  files: string[];
};

// #endregion

async function writeTypesToFiles(
  config: Configuration,
  types: GeneratedTypes,
  folderName: string = ''
): Promise<FileWriterOutput> {
  const result: FileWriterOutput = {
    folderName: config.output.directory + '/' + folderName,
    files: []
  };
  for (const typeName in types) {
    const typeData = types[typeName];
    const file = typeName + config.output.fileExtension;
    const templateInput: TypesFileTemplateInput = {
      referencedTypes: [...typeData.references],
      primitives: [...typeData.primitives],
      typesContent: typeData.content,
      writtenAt: await getExpectedWrittenPath(result.folderName, file)
    };

    // remove duplicates
    templateInput.primitives = [...new Set(templateInput.primitives)];
    templateInput.referencedTypes = [...new Set(templateInput.referencedTypes)];

    const content = Runtime.getTypesFileTemplate()(templateInput);
    await writeFile(result.folderName, file, content);
    result.files.push(file);
  }
  return result;
}

async function writeTypesToFile(
  config: Configuration,
  types: GeneratedTypes,
  fileName: string = 'types'
): Promise<FileWriterOutput> {
  const templateInput: TypesFileTemplateInput = {
    referencedTypes: [],
    primitives: [],
    typesContent: '',
    writtenAt: ''
  };
  for (const typeName in types) {
    templateInput.primitives.push(...types[typeName].primitives);
    templateInput.referencedTypes.push(...types[typeName].references);
    templateInput.typesContent += types[typeName].content + '\n';
  }

  // remove duplicates
  templateInput.primitives = [...new Set(templateInput.primitives)];
  templateInput.referencedTypes = [...new Set(templateInput.referencedTypes)];
  templateInput.writtenAt = await getExpectedWrittenPath(config.output.directory, fileName);

  const content = Runtime.getTypesFileTemplate()(templateInput);

  await writeFile(config.output.directory, fileName + config.output.fileExtension, content);
  return {
    folderName: config.output.directory,
    files: [fileName + config.output.fileExtension]
  };
}

async function writeExporterModules(files: Set<string>, folder: string): Promise<void> {
  const exporterModuleContent = Runtime.getExporterModuleTemplate()({
    modules: [...files].map((file) => file.replace(Runtime.getConfig().output.fileExtension, ''))
  });
  await writeFile(
    folder,
    Runtime.getConfig().language.exporterModuleName + Runtime.getConfig().output.fileExtension,
    exporterModuleContent
  );
}

export async function writeOutput(generationResult: GenerationResult): Promise<void> {
  const config: Configuration = Runtime.getConfig();

  if (config.output.cleanWrite) {
    await deleteFolder(config.output.directory);
  }
  await createFolder(config.output.directory);

  const writtenFiles: Map<string, Set<string>> = new Map<string, Set<string>>();

  // pre compute all the folders and files that will be written
  Runtime.setExpectedOutputFiles(generateExpectedOutputFile());

  // writing types to output directory

  let typesFilesWritten = null;

  if (config.output.writerMode.types === 'Files') {
    typesFilesWritten = await writeTypesToFiles(config, generationResult.types);
  } else if (config.output.writerMode.types === 'SingleFile') {
    typesFilesWritten = await writeTypesToFile(config, generationResult.types);
  }
  if (typesFilesWritten !== null) {
    addValuesToMappedSet(
      writtenFiles,
      await getCompleteFolderPath(typesFilesWritten.folderName),
      typesFilesWritten.files
    );
  }

  // writing grouped types to output directory
  if (config.output.writerMode.groupedTypes === 'FolderWithFiles') {
    for (const groupName in generationResult.groupedTypes) {
      let groupFilesWritten = null;
      await createFolderWithBasePath(config.output.directory, groupName);
      addValuesToMappedSet(writtenFiles, await getCompleteFolderPath(config.output.directory), [
        groupName
      ]);
      groupFilesWritten = await writeTypesToFiles(
        config,
        generationResult.groupedTypes[groupName],
        groupName
      );
      if (groupFilesWritten !== null) {
        addValuesToMappedSet(
          writtenFiles,
          await getCompleteFolderPath(groupFilesWritten.folderName),
          groupFilesWritten.files
        );
      }
    }
  } else if (config.output.writerMode.groupedTypes === 'SingleFile') {
    for (const groupName in generationResult.groupedTypes) {
      let groupFilesWritten = null;
      groupFilesWritten = await writeTypesToFile(
        config,
        generationResult.groupedTypes[groupName],
        groupName
      );
      if (groupFilesWritten !== null) {
        addValuesToMappedSet(
          writtenFiles,
          await getCompleteFolderPath(groupFilesWritten.folderName),
          groupFilesWritten.files
        );
      }
    }
  }

  writtenFiles.forEach((files, folder) => {
    void writeExporterModules(files, folder);
  });
}
