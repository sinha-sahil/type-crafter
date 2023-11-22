import yaml from 'yaml';
import { type Configuration, decodeSpecFileData } from '$types';
import { readFile, registerTemplateHelpers } from '$utils';
import { generator } from '$generators/generic';
import { writeOutput } from '$writer';
import Runtime from '$runtime';

export async function generate(config: Configuration): Promise<void> {
  try {
    Runtime.setConfig(config);
    const specFileData = await readFile(config.input);
    const specJSONData = yaml.parse(specFileData);
    const decodedSpecData = decodeSpecFileData(specJSONData);
    if (
      decodedSpecData === null ||
      (decodedSpecData.types === null && decodedSpecData.groupedTypes === null)
    ) {
      throw new Error('Invalid spec file data!');
    }
    Runtime.setSpecFileData(decodedSpecData);
    Runtime.compileTemplates();
    registerTemplateHelpers();
    const result = generator(decodedSpecData);
    await writeOutput(result);
  } catch (e) {
    console.error('Generation failed!: ', String(e));
  }
}
