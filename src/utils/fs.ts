import fs from "fs/promises";
import path from "path";

function resolveFilePath(filePath: string): string {
  const isAbsolutePath = path.isAbsolute(filePath);
  const normalizedPath = isAbsolutePath
    ? filePath
    : path.join(process.cwd(), filePath);
  return path.resolve(normalizedPath);
}

export async function readFile(filePath: string): Promise<string> {
  const data = await fs.readFile(resolveFilePath(filePath), "utf-8");
  return data;
}

export async function createFolder(basePath: string, folderName: string) {
  const isAbsolutePath = path.isAbsolute(basePath);
  const folderPath = isAbsolutePath
    ? path.join(basePath, folderName)
    : path.join(process.cwd(), basePath, folderName);
  await fs.mkdir(folderPath, { recursive: true });
}

export async function writeFile(
  basePath: string,
  fileName: string,
  content: string,
) {
  const isAbsolutePath = path.isAbsolute(basePath);
  const filePath = isAbsolutePath
    ? path.join(basePath, fileName)
    : path.join(process.cwd(), basePath, fileName);
  await fs.writeFile(filePath, content);
}
