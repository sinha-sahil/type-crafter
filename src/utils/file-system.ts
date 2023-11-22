import fs from 'fs/promises';
import path from 'path';

export function resolveFilePath(filePath: string): string {
  const isAbsolutePath = path.isAbsolute(filePath);
  const normalizedPath = isAbsolutePath ? filePath : path.join(process.cwd(), filePath);
  return path.resolve(normalizedPath);
}

export async function readFile(filePath: string): Promise<string> {
  const data = await fs.readFile(resolveFilePath(filePath), 'utf-8');
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
  await fs.rmdir(folderPath, { recursive: true });
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
