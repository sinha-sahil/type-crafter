import Runtime from '$runtime';
import { InvalidSpecFileError, UnsupportedFeatureError } from '$utils/error-handler';
import { readNestedValue } from '$utils';
import type { JSONObject } from 'type-decoder';

export function resolveReference(reference: string): JSONObject {
  let referenceType: 'local' | 'remote' | 'url' | 'unknown' = 'unknown';
  const referenceParts = reference.split('/');

  if (reference.startsWith('#')) {
    referenceType = 'local';
  } else if (reference.startsWith('http')) {
    referenceType = 'url';
  } else {
    referenceType = 'remote';
  }

  if (referenceType === 'local') {
    const specFileData = Runtime.getSpecFileData();
    const referenceKeyPath = referenceParts.slice(1);
    return readNestedValue(specFileData, referenceKeyPath);
  } else if (referenceType === 'url') {
    throw new UnsupportedFeatureError('URL references are not supported yet');
  } else if (referenceType === 'remote') {
    throw new UnsupportedFeatureError('Remote references are not supported yet');
  } else {
    throw new InvalidSpecFileError('Invalid reference at: ' + reference);
  }
}
