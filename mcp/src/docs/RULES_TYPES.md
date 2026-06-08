# Types Rules

**Only the keywords documented here are valid. Anything not listed will be rejected.**

---

## Valid Type Values (Complete List)

These are the **only** values the `type` field accepts:

| `type` value | Notes                                                                |
| ------------ | -------------------------------------------------------------------- |
| `string`     | Accepts optional `format: date` or `format: date-time` and/or `enum` |
| `number`     | Accepts optional `enum`                                              |
| `integer`    | Same as number. Accepts optional `enum`                              |
| `boolean`    |                                                                      |
| `unknown`    | Dynamic/untyped value                                                |
| `object`     | Requires `properties` and/or `additionalProperties`                  |
| `array`      | Requires `items`. Cannot be a top-level type                         |

**No other type values exist.** `date`, `datetime`, `float`, `int`, `any`, `null`, `void`, `map`, `list` are all invalid.

---

## Valid Format Values (Complete List)

There are exactly **two** valid formats:

| `format` value | Applies to          | Description                 |
| -------------- | ------------------- | --------------------------- |
| `date`         | `type: string` only | Date without time           |
| `date-time`    | `type: string` only | Date with time and timezone |

**No other format values exist.** `datetime`, `time`, `email`, `uri`, `uuid`, `iso8601`, `url` are all invalid.

---

## Primitive Types

Valid keywords on a primitive: `type`, `enum`, `format`, `customAttributes`, `description`, `example`. Nothing else.

```yaml
properties:
  name:
    type: string
  age:
    type: number
  isActive:
    type: boolean
  birthDate:
    type: string
    format: date
  createdAt:
    type: string
    format: date-time
  metadata:
    type: unknown
```

---

## Object Types

Valid keywords on an object: `type`, `properties`, `required`, `additionalProperties`, `customAttributes`, `description`, `example`. Nothing else.

```yaml
User:
  type: object
  description: 'User account'
  required:
    - id
    - email
  properties:
    id:
      type: string
      description: 'Unique ID'
    email:
      type: string
    name:
      type: string
```

In this example, `name` is not in `required`, so it is nullable.

---

## Enum Types

Enums use the `enum` keyword with either `type: string` or `type: number`. No other enum mechanism exists (`allowed_values`, `values`, `options`, `choices` are all invalid).

### String Enum (Top-Level)

```yaml
Status:
  type: string
  enum:
    - active
    - inactive
    - pending
```

### Number Enum (Top-Level)

```yaml
Priority:
  type: number
  enum:
    - 1
    - 2
    - 3
```

### Inline Enum (Property)

```yaml
User:
  type: object
  properties:
    role:
      type: string
      enum:
        - admin
        - user
        - guest
```

---

## Array Types

Valid keywords on an array: `type`, `items`, `customAttributes`, `description`. Nothing else.

### Arrays Cannot Be Top-Level Types

```yaml
# WRONG - will not work
Tags:
  type: array
  items:
    type: string

# CORRECT - arrays must be properties
Post:
  type: object
  properties:
    tags:
      type: array
      items:
        type: string
```

### Array of Primitives

```yaml
properties:
  tags:
    type: array
    items:
      type: string
```

### Array of Objects

```yaml
properties:
  comments:
    type: array
    items:
      type: object
      required:
        - text
      properties:
        text:
          type: string
        author:
          type: string
```

### Array of References

```yaml
properties:
  posts:
    type: array
    items:
      $ref: '#/types/Post'
```

---

## Nested Objects

Each nested object follows the same keyword rules as top-level objects.

```yaml
Company:
  type: object
  required:
    - id
    - address
  properties:
    id:
      type: string
    address:
      type: object
      required:
        - street
      properties:
        street:
          type: string
        city:
          type: string
        zip:
          type: string
```

---

## Additional Properties (Hashmaps/Dictionaries)

`additionalProperties` accepts either `true` or an object with `keyType` and `valueType`. No other forms.

### Simple Hashmap (any values)

```yaml
Metadata:
  type: object
  additionalProperties: true
```

### Typed Hashmap

```yaml
StringMap:
  type: object
  additionalProperties:
    keyType: string
    valueType:
      type: string
```

### Number Keys

```yaml
IdMap:
  type: object
  additionalProperties:
    keyType: number
    valueType:
      $ref: '#/types/User'
```

### Mixed: Properties + Additional

```yaml
UserWithMeta:
  type: object
  required:
    - id
  properties:
    id:
      type: string
  additionalProperties:
    keyType: string
    valueType:
      type: string
```

---

## Custom Attributes (Pass-Through)

`customAttributes` is an optional key/value map available on any type (primitive, object, array). It is **not validated** by Type Crafter — values are passed directly to language templates. Different templates read different keys.

### On a Property (e.g. custom serialization name)

```yaml
Product:
  type: object
  required:
    - id
    - bodyHtml
  properties:
    id:
      type: string
    bodyHtml:
      type: string
      customAttributes:
        x-name: 'Body (HTML)'
```

The Rust template reads `x-name` to emit `#[serde(rename = "Body (HTML)")]` on that field.

### On an Object (e.g. rename_all strategy)

```yaml
Product:
  type: object
  customAttributes:
    renameAll: camelCase
  required:
    - id
  properties:
    id:
      type: string
    productType:
      type: string
```

The Rust template reads `renameAll` to emit `#[serde(rename_all = "camelCase")]` on the struct, suppressing automatic per-field renames.

### On a Type (e.g. custom derive macros)

```yaml
Point:
  type: object
  customAttributes:
    x-derive:
      - PartialEq
      - Eq
      - Hash
  required:
    - x
    - y
  properties:
    x:
      type: integer
    y:
      type: integer
```

The Rust template reads `x-derive` (a list of derive macro names) on objects, enums, `oneOf`, and `allOf` types and **appends** them to the always-present defaults, producing:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct Point { /* ... */ }
```

Notes on `x-derive`:

- It is **append-only**. The defaults `Debug, Clone, Serialize, Deserialize` are always emitted and cannot be removed via `x-derive` — this keeps the serde attributes the generator emits (`rename`, `rename_all`, `untagged`, `flatten`, `skip_serializing_if`) working. Duplicates (e.g. listing `Clone`) are ignored.
- It only adds names to the `#[derive(...)]` line. Derives that require an `import`/`use` (e.g. `strum::EnumString`) will **not** get their `use` statement added automatically — only std-prelude derives such as `PartialEq`, `Eq`, `Hash`, `Default`, `Ord`, `PartialOrd` work out of the box.
- It is applied per type. If a type with `x-derive` references a nested inline type, add `x-derive` to that nested type too if the derived trait must hold transitively (e.g. `PartialEq` on a struct whose fields are themselves generated structs).

---

## Valid Keywords Summary

| Type Kind    | Valid Keywords (and ONLY these)                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| Primitive    | `type`, `enum`, `format`, `customAttributes`, `description`, `example`                                 |
| Object       | `type`, `properties`, `required`, `additionalProperties`, `customAttributes`, `description`, `example` |
| Array        | `type`, `items`, `customAttributes`, `description`                                                     |
| Reference    | `$ref`                                                                                                 |
| Union        | `oneOf`                                                                                                |
| Intersection | `allOf`                                                                                                |

## Type Definition Summary

| Type         | Structure                                         | Top-Level? |
| ------------ | ------------------------------------------------- | ---------- |
| Object       | `type: object` + `properties`                     | Yes        |
| Enum         | `type: string` or `type: number` + `enum`         | Yes        |
| Primitive    | `type: string` / `number` / `boolean` / `unknown` | Yes        |
| Array        | `type: array` + `items`                           | **NO**     |
| Union        | `oneOf` with array                                | Yes        |
| Intersection | `allOf` with array                                | Yes        |
| Reference    | `$ref` with path                                  | Yes        |
