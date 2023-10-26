import yaml from "yaml";
import { Configuration, decodeSpecFileData } from "$types";
import { readFile } from "$utils";

export async function generate(configuration: Configuration): Promise<void> {
  try {
    const specFileData = await readFile(configuration.inputFile);
    const specJSONData = yaml.parse(specFileData);
    const decodedSpecData = decodeSpecFileData(specJSONData);
    if (decodedSpecData === null) {
      throw new Error("Invalid spec file data!");
    }
  } catch (e) {
    console.error("Generation failed!");
  }
}
