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
import { formatModuleName, generateExpectedOutputFile } from './helpers';

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

  // Filtering references for writing types to files; Done for types.writerMode: Files
  // Maybe a hack. But it works for now
  // Fix this later
  const filterReferences =
    folderName !== '' && Runtime.getConfig().output.writerMode.groupedTypes !== 'FolderWithFiles';

  const typeNames = Object.keys(types);

  for (const typeName in types) {
    const typeData = types[typeName];
    const file = formatModuleName(typeName) + config.output.fileExtension;

    const references = filterReferences
      ? [...types[typeName].references].filter((x) => !typeNames.includes(x))
      : [...types[typeName].references];

    const templateInput: TypesFileTemplateInput = {
      referencedTypes: references,
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
  fileName: string
): Promise<FileWriterOutput> {
  const templateInput: TypesFileTemplateInput = {
    referencedTypes: [],
    primitives: [],
    typesContent: '',
    writtenAt: ''
  };

  const typeNames = Object.keys(types);

  for (const typeName in types) {
    templateInput.primitives.push(...types[typeName].primitives);
    // Removing references that are already written to file
    const _references = [...types[typeName].references].filter((x) => !typeNames.includes(x));
    templateInput.referencedTypes.push(..._references);
    templateInput.typesContent += types[typeName].content;
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
    modules: [...files]
      .map((file) => file.replace(Runtime.getConfig().output.fileExtension, ''))
      .filter((name) => name !== Runtime.getConfig().language.exporterModuleName)
      .sort()
  });
  const config = Runtime.getConfig();
  // Merging the contents of exporter module & types file in case their names are same.
  const typesFileName = Runtime.getConfig().output.typesFileName;
  const moduleExporterFileName = Runtime.getConfig().language.exporterModuleName;
  const writingTypesFile = files.has(typesFileName + config.output.fileExtension);
  const appendContent = writingTypesFile && typesFileName === moduleExporterFileName;

  await writeFile(
    folder,
    Runtime.getConfig().language.exporterModuleName + Runtime.getConfig().output.fileExtension,
    exporterModuleContent,
    appendContent
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

  // #region writing types to output directory

  let typesFilesWritten = null;

  if (Object.keys(generationResult.types).length > 0) {
    if (config.output.writerMode.types === 'Files') {
      typesFilesWritten = await writeTypesToFiles(config, generationResult.types);
    } else if (config.output.writerMode.types === 'SingleFile') {
      typesFilesWritten = await writeTypesToFile(
        config,
        generationResult.types,
        Runtime.getConfig().output.typesFileName
      );
    }
  }

  if (typesFilesWritten !== null) {
    addValuesToMappedSet(
      writtenFiles,
      await getCompleteFolderPath(typesFilesWritten.folderName),
      typesFilesWritten.files
    );
  }
  // #endregion

  // #region writing grouped types to output directory
  if (config.output.writerMode.groupedTypes === 'FolderWithFiles') {
    for (const groupName in generationResult.groupedTypes) {
      let groupFilesWritten = null;
      const formattedGroupName = formatModuleName(groupName);
      await createFolderWithBasePath(config.output.directory, formattedGroupName);
      addValuesToMappedSet(writtenFiles, await getCompleteFolderPath(config.output.directory), [
        formattedGroupName
      ]);
      groupFilesWritten = await writeTypesToFiles(
        config,
        generationResult.groupedTypes[groupName],
        formattedGroupName
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
        formatModuleName(groupName)
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

  // #endregion

  writtenFiles.forEach((files, folder) => {
    void writeExporterModules(files, folder);
  });
}
