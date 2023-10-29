import { Configuration, GenerationResult, TypesOutput } from "$types";
import { _createFolder, createFolder, deleteFolder, writeFile } from "./file-system";

export * from "./file-system";

async function writeTypesToFiles(config: Configuration, types: TypesOutput, folderName: string = '') { 
  for (let typeName in types) { 
    await writeFile(config.output.directory + '/' + folderName, typeName + config.output.fileExtension, types[typeName]);
  }
}

async function writeTypesToSingleFile(config: Configuration, types: TypesOutput, fileName: string = 'types') { 
  let content = '';
  for (let typeName in types) { 
    content += types[typeName] + '\n';
  }
  await writeFile(config.output.directory,  fileName + config.output.fileExtension, content);
}


export async function writeOutput(config: Configuration, generationResult: GenerationResult) { 
  if (config.output.cleanWrite) { 
    await deleteFolder(config.output.directory);
  }

  await _createFolder(config.output.directory);

  // writing types to output directory
  if (config.output.writerMode.types === 'Files') { 
    await writeTypesToFiles(config, generationResult.types)
  } else if (config.output.writerMode.types === 'SingleFile') { 
    await writeTypesToSingleFile(config, generationResult.types);
  }

  // writing grouped types to output directory
  if (config.output.writerMode.groupedTypes === 'FolderWithFiles') { 
    for (let groupName in generationResult.groupedTypes) { 
      await createFolder(config.output.directory, groupName);
      await writeTypesToFiles(config, generationResult.groupedTypes[groupName], groupName);
    }
  } else if (config.output.writerMode.groupedTypes === 'SingleFile') { 
    for (let groupName in generationResult.groupedTypes) { 
      await writeTypesToSingleFile(config, generationResult.groupedTypes[groupName], groupName);
    }
  }

}