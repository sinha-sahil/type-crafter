# type-crafter

## 0.8.2

### Patch Changes

- 004d45b: fix: issue with template file path in reading

  - fixed template directory not found issue

## 0.8.1

### Patch Changes

- 7e6b880: fix: conflicting type name & missing imports in generated output

  - fixed issues with conflicting types in same file & missing type imports in generated output
  - made filename case sensitive fro avoiding same types written in two different files with different naming case

## 0.8.0

### Minor Changes

- 0635e62: feat: added support for generating types with allOf operator

  - now use allOf operator for union of types

## 0.7.0

### Minor Changes

- bea1b41: feat: support for generating hashmaps

  - now generate object hashmaps using additionalProperties param

## 0.6.1

### Patch Changes

- 2220f71: fix: reference generation for FolderWithFiles writer mode for GroupedTypes

  - Issues with missing type imports in case of FolderWithFiles Group writer mode is now fixed

## 0.6.0

### Minor Changes

- 1e9e39f: feat: added support for referencing types & groups from a remote file

  - now you can reference groups & types from remote files
  - fixed issues with referenced type generation

## 0.5.0

### Minor Changes

- ffe6dc1: feat: added support for remote file reference

  - added support for remote file references
  - fixed issues array items decoders in typescript-with-decoders model

## 0.4.0

### Minor Changes

- e347421: feat: added support for oneOf operator in spec generation

  - now you use oneOf operator in spec yaml
  - supported language: typescript & typescript-with-decoders

## 0.3.0

### Minor Changes

- c6abf3a: feat: added support for generating enums

  - now users can generate enums from the spec.
  - this can be done using directly defined types, ref enums & inline enum declaration

## 0.2.1

### Patch Changes

- 6cfdb89: fix: issue with composer types of array elements in case of primitive data types

  - fixes issue with generated decoder for array types where items were of primitive type

## 0.2.0

### Minor Changes

- e6e788d: feat: added support for generating typescript types with decoders

  - now generate typescript types with decoders using `typescript-with-decoders` language param

## 0.1.1

### Patch Changes

- 2092d02: fix: output generation for ref array types

  - fix $ref parsing for array items
  - updated templates reader to read from package path

## 0.1.0

### Minor Changes

- de1d7a3: Releasing first beta version of type-crafter
