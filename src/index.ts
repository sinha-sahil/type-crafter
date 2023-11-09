import yaml from 'yaml';
import { Configuration, decodeSpecFileData } from '$types';
import { getOptionalKeys, readFile } from '$utils';
import { generator } from '$generators/generic';
import { writeOutput } from '$writer';
import Handlebars from 'handlebars';
import { Runtime } from './runtime';

export async function generate(config: Configuration): Promise<void> {
  try {
    Runtime.setConfiguration(config);
    const specFileData = await readFile(config.input);
    const specJSONData = yaml.parse(specFileData);
    const decodedSpecData = decodeSpecFileData(specJSONData);
    if (decodedSpecData === null) {
      throw new Error('Invalid spec file data!');
    }
    Handlebars.registerHelper('getOptionalKeys', getOptionalKeys);
    const result = generator(decodedSpecData);
    await writeOutput(result);
  } catch (e) {
    console.error('Generation failed!');
  }
}
