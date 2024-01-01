import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

function getSourceFileDirectory(): string {
  const fileName = fileURLToPath(import.meta.url);
  return path.dirname(fileName);
}

export function resolveFilePath(filePath: string, useCurrentDirectory: boolean = true): string {
  const isAbsolutePath = path.isAbsolute(filePath);
  const normalizedPath = isAbsolutePath
    ? filePath
    : path.join(useCurrentDirectory ? process.cwd() : getSourceFileDirectory(), filePath);
  return path.resolve(normalizedPath);
}

async function checkFileNameCase(filePath: string): Promise<boolean> {
  const directory = path.dirname(filePath);
  const fileName = path.basename(filePath);

  const files = await fs.readdir(directory);
  return files.includes(fileName);
}

export async function readFile(
  filePath: string,
  useCurrentWorkingDirectory: boolean = true
): Promise<string> {
  if (!(await checkFileNameCase(filePath))) {
    throw new Error(`File not found: ${filePath}`);
  }
  const data = await fs.readFile(resolveFilePath(filePath, useCurrentWorkingDirectory), 'utf-8');
  return data;
}

export async function createFolderWithBasePath(
  basePath: string,
  folderName: string
): Promise<void> {
  const isAbsolutePath = path.isAbsolute(basePath);
  const folderPath = isAbsolutePath
    ? path.join(basePath, folderName)
    : path.join(process.cwd(), basePath, folderName);
  await fs.mkdir(folderPath, { recursive: true });
}

export async function createFolder(folderPath: string): Promise<void> {
  await fs.mkdir(folderPath, { recursive: true });
}

export async function deleteFolder(folderPath: string): Promise<void> {
  try {
    await fs.rm(folderPath, { recursive: true });
  } catch (e) {
    console.log("Couldn't delete folder: ", folderPath);
  }
}

export async function getCompleteFolderPath(folderName: string): Promise<string> {
  const isAbsolutePath = path.isAbsolute(folderName);
  const folderPath = isAbsolutePath ? folderName : path.join(process.cwd(), folderName);

  if (folderPath.endsWith('/')) {
    return folderPath.slice(0, -1);
  }
  return folderPath;
}

export async function getExpectedWrittenPath(basePath: string, fileName: string): Promise<string> {
  const isAbsolutePath = path.isAbsolute(basePath);
  const filePath = isAbsolutePath
    ? path.join(basePath, fileName)
    : path.join(process.cwd(), basePath, fileName);
  return filePath;
}

export async function writeFile(
  basePath: string,
  fileName: string,
  content: string
): Promise<void> {
  const isAbsolutePath = path.isAbsolute(basePath);
  const filePath = isAbsolutePath
    ? path.join(basePath, fileName)
    : path.join(process.cwd(), basePath, fileName);
  await fs.writeFile(filePath, content);
}

export async function readYaml(filePath: string): Promise<unknown> {
  const fileData = await readFile(filePath);
  return yaml.parse(fileData);
}
