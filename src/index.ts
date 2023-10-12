import fs from "fs/promises";
import yaml from "yaml";
import { Configuration } from "./types";

export async function generate(configuration: Configuration): Promise<void> {
  try {
    const file = await fs.readFile(configuration.inputFile, "utf-8");
    const data = yaml.parse(file);
    console.log("Coming Soon!");
  } catch (e) {
    console.error("Generation failed!");
  }
}
