import Runtime from '$runtime';
import { InvalidSpecFileError, UnsupportedFeatureError } from '$utils/error-handler';
import { readNestedValue, readYaml, resolveFilePath } from '$utils';
import {
  type TypeInfo,
  decodeTypeInfo,
  type ResolvedTypeReferenceData,
  type ReferenceMeta,
  type ReferenceType,
  type ResolvedGroupReferenceData,
  type Types,
  decodeTypes
} from '$types';
import type { JSONObject } from 'type-decoder';

function getReferenceMeta(reference: string): ReferenceMeta {
  const slashedParts = reference.split('/');
  const hashSlashParts = reference.split('#');

  let referenceType: ReferenceType;

  if (reference.startsWith('#')) {
    referenceType = 'local';
  } else if (reference.startsWith('http')) {
    referenceType = 'url';
  } else {
    referenceType = 'remote';
  }

  let completeSource = hashSlashParts.at(0);
  const sourceFile = hashSlashParts.at(0)?.split('/').at(-1);
  const path = hashSlashParts.at(1)?.slice(1);
  const name = slashedParts[slashedParts.length - 1];

  if (
    typeof completeSource === 'undefined' ||
    typeof path === 'undefined' ||
    typeof sourceFile === 'undefined'
  ) {
    throw new InvalidSpecFileError('Invalid reference at: ' + reference);
  }

  if (
    referenceType === 'remote' &&
    resolveFilePath(completeSource) === Runtime.getInputFilePath()
  ) {
    completeSource = resolveFilePath(completeSource);
    referenceType = 'local';
  }

  return {
    completeSource,
    sourceFile,
    path,
    type: referenceType,
    name
  };
}

async function getReferencedData(refMeta: ReferenceMeta): Promise<JSONObject> {
  let refFileData;
  if (refMeta.type === 'local') {
    refFileData = Runtime.getSpecFileData();
  } else if (refMeta.type === 'remote') {
    refFileData = await readYaml(refMeta.completeSource);
  } else {
    throw new UnsupportedFeatureError('URL references are not supported yet');
  }
  if (typeof refFileData === 'undefined') {
    throw new InvalidSpecFileError('Invalid reference at: ' + refMeta.completeSource);
  }
  return readNestedValue(refFileData, refMeta.path.split('/'));
}

export async function resolveTypeReference(reference: string): Promise<ResolvedTypeReferenceData> {
  const refMeta = getReferenceMeta(reference);
  const refData = await getReferencedData(refMeta);
  const result: TypeInfo | null = decodeTypeInfo(refData);

  if (result === null) {
    throw new InvalidSpecFileError('Invalid reference at: ' + reference);
  }

  return { typeInfo: result, ...refMeta };
}

export async function resolveGroupReference(
  reference: string
): Promise<ResolvedGroupReferenceData> {
  const refMeta = getReferenceMeta(reference);
  const refData = await getReferencedData(refMeta);
  const result: Types | null = decodeTypes(refData);

  if (result === null) {
    throw new InvalidSpecFileError('Invalid reference at: ' + reference);
  }

  return { groupedTypes: result, ...refMeta };
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
