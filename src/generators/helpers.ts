import Runtime from '$runtime';
import { InvalidSpecFileError, UnsupportedFeatureError } from '$utils/error-handler';
import { readNestedValue, readYaml } from '$utils';
import { type TypeInfo, decodeTypeInfo, type ResolveReferenceData } from '$types';

export async function resolveReference(reference: string): Promise<ResolveReferenceData> {
  let referenceType: 'local' | 'remote' | 'url' | 'unknown' = 'unknown';
  const referenceParts = reference.split('/');
  const referenceName = referenceParts[referenceParts.length - 1];

  if (reference.startsWith('#')) {
    referenceType = 'local';
  } else if (reference.startsWith('http')) {
    referenceType = 'url';
  } else {
    referenceType = 'remote';
  }

  let result: TypeInfo | null = null;
  let referenceFileName;

  if (referenceType === 'local') {
    const specFileData = Runtime.getSpecFileData();
    const referenceKeyPath = referenceParts.slice(1);
    result = decodeTypeInfo(readNestedValue(specFileData, referenceKeyPath));
  } else if (referenceType === 'url') {
    throw new UnsupportedFeatureError('URL references are not supported yet');
  } else if (referenceType === 'remote') {
    const indexOfExtension = reference.indexOf('.yaml');
    const referenceFilePath = reference.slice(0, indexOfExtension + 5);
    const typeDataPath = reference.slice(indexOfExtension + 6);
    referenceFileName = referenceParts.find((part) => part.endsWith('.yaml'));
    const referencedFileData = await readYaml(referenceFilePath);
    const jsonValue = readNestedValue(referencedFileData, typeDataPath.split('/'));
    result = decodeTypeInfo(jsonValue);
  } else {
    throw new InvalidSpecFileError('Invalid reference at: ' + reference);
  }

  if (result === null) {
    throw new InvalidSpecFileError('Invalid reference at: ' + reference);
  }

  return { typeInfo: result, referenceName, sourceFile: referenceFileName };
}

export function fillPatterns(
  input: string,
  patterns: Array<{ regex: RegExp; value: string }>
): string {
  let result = input;
  patterns.forEach((pattern) => {
    result = result.replace(pattern.regex, pattern.value);
  });
  return result;
}
