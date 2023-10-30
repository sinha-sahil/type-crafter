export * from "./file-system";

export function addValuesToMappedSet(
  map: Map<string, Set<string>>,
  key: string,
  values: string[],
) {
  const existingValues = map.get(key);
  map.set(
    key,
    typeof existingValues === "undefined"
      ? new Set(values)
      : new Set([...existingValues, ...values]),
  );
}
