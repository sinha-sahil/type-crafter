import { readFile } from "$utils";
import { generate } from "../src";

async function generateTypescript() { 
  const objectSyntax = await readFile("templates/typescript/object-syntax.hbs");

  generate({
    input: "examples/input.yaml",
    output: {
      cleanWrite: true,
      fileExtension: ".ts",
      directory: "examples/output",
      writerMode: {
        groupedTypes: 'FolderWithFiles', 
        types: 'SingleFile'
      }
    },
    template: {
      objectSyntax
    },
    language: {
      keywords: {
        "string": "string",
        "number": "number",
        "integer": "number",
        "boolean": "boolean",
        "object": "Record<string, unknown>",
        "date": "Date",
        "array": "unknown[]",
        "any": "unknown"
      }
    }
  });
}


generateTypescript();