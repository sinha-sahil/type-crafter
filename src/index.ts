import yaml from "yaml";
import { Configuration, decodeSpecFileData } from "$types";
import { readFile, writeOutput } from "$utils";
import { generator } from "$generators/generic";

export async function generate(config: Configuration): Promise<void> {
  try {
    const specFileData = await readFile(config.input);
    const specJSONData = yaml.parse(specFileData);
    const decodedSpecData = decodeSpecFileData(specJSONData);
    if (decodedSpecData === null) {
      throw new Error("Invalid spec file data!");
    }
    const result = generator(config, decodedSpecData);
    await writeOutput(config, result);
  } catch (e) {
    console.error("Generation failed!");
  }
}
