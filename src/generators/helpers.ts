import Runtime from '$runtime';
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
    throw new Error('URL references are not supported yet');
  } else if (referenceType === 'remote') {
    throw new Error('Remote references are not supported yet');
  } else {
    throw new Error('Invalid reference');
  }
}
