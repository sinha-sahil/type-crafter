# Type Crafter YAML Specification Guide

Type Crafter generates typed code from YAML specifications. This guide is the definitive reference for what is valid. **If something is not listed here, it is not supported and will be rejected.**

---

## Complete Valid Keyword Reference

### Root-Level Keys (ONLY these three exist)

| Key            | Required                                  | Description                     |
| -------------- | ----------------------------------------- | ------------------------------- |
| `info`         | Yes (for top files)                       | Version and title metadata      |
| `types`        | At least one of `types` or `groupedTypes` | Flat/top-level type definitions |
| `groupedTypes` | At least one of `types` or `groupedTypes` | Namespaced type definitions     |

**No other root-level keys exist.** Do not add `schemas`, `definitions`, `components`, or anything else at the root.

### The `info` Object (ONLY these two keys)

| Key       | Type   | Required | Description                   |
| --------- | ------ | -------- | ----------------------------- |
| `version` | string | Yes      | Semver format, e.g. `'1.0.0'` |
| `title`   | string | Yes      | Descriptive title             |

**No other info keys exist.** Do not add `description`, `contact`, `license`, or anything else.

### Valid Type Values (ONLY these)

| `type` value | Notes                                                |
| ------------ | ---------------------------------------------------- |
| `string`     | Basic string                                         |
| `number`     | Numeric value                                        |
| `integer`    | Numeric value (same as number)                       |
| `boolean`    | True/false                                           |
| `unknown`    | Dynamic/untyped value                                |
| `object`     | Must have `properties` and/or `additionalProperties` |
| `array`      | Must have `items`. **Cannot be a top-level type.**   |

**No other type values exist.** Do not use `date`, `datetime`, `float`, `int`, `any`, `null`, `void`, `map`, `list`, `dict`, or anything else.

### Valid Format Values (ONLY these exist)

| `format` value | Applies to          | Description                                           |
| -------------- | ------------------- | ----------------------------------------------------- |
| `date`         | `type: string` only | Represents a date value                               |
| `date-time`    | `type: string` only | Represents a date-time value (with time and timezone) |

**No other format values exist.** Do not use `datetime`, `time`, `email`, `uri`, `url`, `uuid`, `iso8601`, or anything else.

### Valid Keywords Per Type Kind

#### On a primitive (`type: string | number | integer | boolean | unknown`)

| Keyword            | Required | Description                                                            |
| ------------------ | -------- | ---------------------------------------------------------------------- |
| `type`             | Yes      | One of: `string`, `number`, `integer`, `boolean`, `unknown`            |
| `enum`             | No       | Array of allowed values. Creates a union of literals.                  |
| `format`           | No       | `date` or `date-time`, only on `type: string`                          |
| `customAttributes` | No       | Pass-through key/value map for template-level features (e.g. `x-name`) |
| `description`      | No       | Documentation comment                                                  |
| `example`          | No       | Documentation example                                                  |

#### On an object (`type: object`)

| Keyword                | Required                                 | Description                                                               |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| `type`                 | Yes                                      | Must be `object`                                                          |
| `properties`           | Yes (unless `additionalProperties` only) | Map of property names to type definitions                                 |
| `required`             | No                                       | Array of property names that are non-nullable                             |
| `additionalProperties` | No                                       | `true` or object with `keyType` and `valueType` for hashmaps              |
| `customAttributes`     | No                                       | Pass-through key/value map for template-level features (e.g. `renameAll`) |
| `description`          | No                                       | Documentation comment                                                     |
| `example`              | No                                       | Documentation example                                                     |

#### On an array (`type: array`)

| Keyword            | Required | Description                                            |
| ------------------ | -------- | ------------------------------------------------------ |
| `type`             | Yes      | Must be `array`                                        |
| `items`            | Yes      | Type definition for array elements                     |
| `customAttributes` | No       | Pass-through key/value map for template-level features |
| `description`      | No       | Documentation comment                                  |

#### On a reference

| Keyword | Required | Description             |
| ------- | -------- | ----------------------- |
| `$ref`  | Yes      | Path to referenced type |

#### On a composition

| Keyword | Required                | Description                                       |
| ------- | ----------------------- | ------------------------------------------------- |
| `oneOf` | Yes (for unions)        | Array of type definitions. Union of types.        |
| `allOf` | Yes (for intersections) | Array of type definitions. Intersection of types. |

**No other keywords exist anywhere.** Do not use `nullable`, `optional`, `extensible`, `default`, `minimum`, `maximum`, `minLength`, `maxLength`, `pattern`, `title` (on properties), `readOnly`, `writeOnly`, `deprecated`, `discriminator`, `allowed_values`, `values`, `options`, `choices`, or anything from OpenAPI/JSON Schema that is not listed above.

> **Note on `customAttributes`:** This field is a generic pass-through map. Its keys/values are not validated by Type Crafter — they are forwarded directly to language templates. Different language templates may read different keys (e.g. the Rust template reads `x-name` for serde rename, `renameAll` for `serde(rename_all)`, and `x-derive` to append custom `#[derive(...)]` macros). Consult the template documentation for your target language.

---

## Nullability: The Only Mechanism

Properties **not** listed in the `required` array become nullable. This is the **only** way to make a property nullable. There is no other mechanism.

```yaml
User:
  type: object
  required:
    - id
    - email
  properties:
    id:
      type: string
    email:
      type: string
    name:
      type: string
```

In this example, `id` and `email` are non-nullable. `name` is not in `required`, so it is nullable.

---

## Minimal Valid Spec

```yaml
info:
  version: '1.0.0'
  title: 'My API Types'

types:
  User:
    type: object
    required:
      - id
      - email
    properties:
      id:
        type: string
      email:
        type: string
      name:
        type: string
```

---

## Quick Reference

| Concept           | YAML                                                       |
| ----------------- | ---------------------------------------------------------- |
| Required property | Listed in `required` array                                 |
| Nullable property | NOT listed in `required` array                             |
| String            | `type: string`                                             |
| Number            | `type: number`                                             |
| Boolean           | `type: boolean`                                            |
| Date              | `type: string` with `format: date`                         |
| Date-time         | `type: string` with `format: date-time`                    |
| Unknown           | `type: unknown`                                            |
| String enum       | `type: string` with `enum` list                            |
| Number enum       | `type: number` with `enum` list                            |
| Array             | `type: array` with `items`                                 |
| Union             | `oneOf` with array of types                                |
| Intersection      | `allOf` with array of types                                |
| Reference         | `$ref` with path                                           |
| Hashmap           | `additionalProperties: true` or with `keyType`/`valueType` |
| Custom attributes | `customAttributes: { key: value }` on any type             |

---

## Available Detail Sections

Call `get-rules-section` with these topics for deep dives:

| Section       | What You'll Learn                                   |
| ------------- | --------------------------------------------------- |
| `structure`   | Root structure, info section, types vs groupedTypes |
| `types`       | Objects, enums, primitives, arrays, nested objects  |
| `nullable`    | How `required` array controls nullability           |
| `references`  | $ref syntax, top-file vs non-top-file rules         |
| `composition` | oneOf (unions), allOf (intersections)               |
| `patterns`    | Common patterns with full examples                  |

---

## Workflow

1. Read this guide (you just did)
2. Write your YAML spec using ONLY the keywords listed above
3. Call `validate-spec` to check for errors
4. Fix any issues
5. Run `type-crafter generate` CLI in your project

---

## Key Rules Summary

1. **Only use keywords listed in this guide** - Anything else is invalid and will be rejected
2. **Nullability = `required` array** - The only mechanism that controls this
3. **Only valid formats are `date` and `date-time`** - No other format values exist
4. **Only valid types are `string`, `number`, `integer`, `boolean`, `unknown`, `object`, `array`**
5. **Arrays = properties only** - Never top-level types
6. **Paths = from project root** - Where you run the CLI
7. **Top file = has `info` section** - Can use `#/` references
8. **Non-top file = no `info`** - Must use full file paths for ALL references
