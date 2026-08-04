import Runtime from '$runtime';
import { readYaml, registerTemplateHelpers } from '$utils';
import { decodeSpecFileData, type Configuration } from '$types';
import { generator } from '$generators/generic';
import { writeOutput } from '$writer';
import { InvalidSpecFileError } from '$utils/error-handler';

export async function generate(config: Configuration): Promise<void> {
  Runtime.setConfig(config);
  const specFileData = await readYaml(config.input);
  const decodedSpecData = decodeSpecFileData(specFileData);
  if (
    decodedSpecData === null ||
    (decodedSpecData.types === null && decodedSpecData.groupedTypes === null)
  ) {
    throw new InvalidSpecFileError('Neither types nor groupedTypes found!');
  }
  Runtime.setSpecFileData(decodedSpecData);
  Runtime.compileTemplates();
  registerTemplateHelpers();
  const result = await generator(decodedSpecData);
  await writeOutput(result);
}

export { typescript, typescriptWithDecoders, rust } from '$templates';
export * from '$types';
export * from '$utils';
export { resolveTypeReference, resolveGroupReference, fillPatterns } from '$generators/helpers';
