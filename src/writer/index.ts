import { Configuration, GenerationResult, TypesOutput } from "$types";
import {
  addValuesToMappedSet,
  createFolder,
  createFolderWithBasePath,
  deleteFolder,
  getCompleteFolderPath,
  writeFile,
} from "$utils";
import Handlebars from "handlebars";

//#region Localized types

type FileWriterOutput = {
  folderName: string;
  files: string[];
};

//#endregion

async function writeTypesToFiles(
  config: Configuration,
  types: TypesOutput,
  folderName: string = "",
): Promise<FileWriterOutput> {
  const result: FileWriterOutput = {
    folderName: config.output.directory + "/" + folderName,
    files: [],
  };
  for (let typeName in types) {
    const file = typeName + config.output.fileExtension;
    await writeFile(result.folderName, file, types[typeName]);
    result.files.push(file);
  }
  return result;
}

async function writeTypesToFile(
  config: Configuration,
  types: TypesOutput,
  fileName: string = "types",
): Promise<FileWriterOutput> {
  let content = "";
  for (let typeName in types) {
    content += types[typeName] + "\n";
  }
  await writeFile(
    config.output.directory,
    fileName + config.output.fileExtension,
    content,
  );
  return {
    folderName: config.output.directory,
    files: [fileName + config.output.fileExtension],
  };
}

export async function writeOutput(
  config: Configuration,
  generationResult: GenerationResult,
) {
  if (config.output.cleanWrite) {
    await deleteFolder(config.output.directory);
  }
  await createFolder(config.output.directory);

  const writtenFiles: Map<string, Set<string>> = new Map();

  // writing types to output directory

  let typesFilesWritten = null;

  if (config.output.writerMode.types === "Files") {
    typesFilesWritten = await writeTypesToFiles(config, generationResult.types);
  } else if (config.output.writerMode.types === "SingleFile") {
    typesFilesWritten = await writeTypesToFile(config, generationResult.types);
  }
  if (typesFilesWritten !== null) {
    addValuesToMappedSet(
      writtenFiles,
      await getCompleteFolderPath(typesFilesWritten.folderName),
      typesFilesWritten.files,
    );
  }

  // writing grouped types to output directory
  if (config.output.writerMode.groupedTypes === "FolderWithFiles") {
    for (let groupName in generationResult.groupedTypes) {
      let groupFilesWritten = null;
      await createFolderWithBasePath(config.output.directory, groupName);
      addValuesToMappedSet(
        writtenFiles,
        await getCompleteFolderPath(config.output.directory),
        [groupName],
      );
      groupFilesWritten = await writeTypesToFiles(
        config,
        generationResult.groupedTypes[groupName],
        groupName,
      );
      if (groupFilesWritten !== null) {
        addValuesToMappedSet(
          writtenFiles,
          await getCompleteFolderPath(groupFilesWritten.folderName),
          groupFilesWritten.files,
        );
      }
    }
  } else if (config.output.writerMode.groupedTypes === "SingleFile") {
    for (let groupName in generationResult.groupedTypes) {
      let groupFilesWritten = null;
      groupFilesWritten = await writeTypesToFile(
        config,
        generationResult.groupedTypes[groupName],
        groupName,
      );
      if (groupFilesWritten !== null) {
        addValuesToMappedSet(
          writtenFiles,
          await getCompleteFolderPath(groupFilesWritten.folderName),
          groupFilesWritten.files,
        );
      }
    }
  }

  // writing exporter modules
  const exporterModuleTemplate = Handlebars.compile(
    config.template.exporterModuleSyntax,
  );

  writtenFiles.forEach(async (files, folder) => {
    const exporterModuleContent = exporterModuleTemplate({
      modules: [...files].map((file) =>
        file.replace(config.output.fileExtension, ""),
      ),
    });
    await writeFile(
      folder,
      config.language.exporterModuleName + config.output.fileExtension,
      exporterModuleContent,
    );
  });
}
