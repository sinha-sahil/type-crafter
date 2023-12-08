# type-crafter

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
