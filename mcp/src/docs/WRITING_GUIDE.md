# Type Crafter YAML Specification Guide

Type Crafter generates TypeScript types from YAML specifications. This guide teaches you how to write valid specs.

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
        type: string # Not in required = nullable (string | null)
```

**Generated TypeScript:**

```typescript
export type User = {
  id: string;
  email: string;
  name: string | null;
};
```

---

## Common Mistakes - DO NOT DO THESE

### 1. Using `nullable: true` - DOES NOT EXIST

```yaml
# WRONG
name:
  type: string
  nullable: true # THIS PROPERTY DOES NOT EXIST

# CORRECT - Omit from required array
required:
  - id # id is required
  # name is NOT here, so it becomes nullable
properties:
  id: { type: string }
  name: { type: string } # Generates: string | null
```

### 2. Using `optional: true` - DOES NOT EXIST

```yaml
# WRONG
name:
  type: string
  optional: true # THIS PROPERTY DOES NOT EXIST

# CORRECT - Use required array
required: [id] # Only id is required
properties:
  id: { type: string }
  name: { type: string } # Not in required = nullable
```

### 3. Using `?` suffix - NOT SUPPORTED

```yaml
# WRONG
properties:
  name?:  # INVALID SYNTAX
    type: string

# CORRECT
required: [id]
properties:
  name: { type: string }
```

### 4. Top-level array types - NOT ALLOWED

```yaml
# WRONG - Arrays cannot be top-level types
Tags:
  type: array
  items:
    type: string

# CORRECT - Arrays must be properties within objects
Post:
  type: object
  properties:
    tags:
      type: array
      items:
        type: string
```

### 5. Using `../` in paths - WRONG

```yaml
# WRONG - Relative paths from current file
$ref: '../common/types.yaml#/User'

# CORRECT - Paths from project root (where CLI runs)
$ref: './src/common/types.yaml#/User'
```

### 6. Using `#/` references in non-top files

```yaml
# In a file WITHOUT info section (non-top file)
# WRONG
$ref: '#/Cart/CartItem'

# CORRECT - Must use full path
$ref: './docs/cart.yaml#/Cart/CartItem'
```

---

## Quick Reference

| Concept           | YAML                         | TypeScript           |
| ----------------- | ---------------------------- | -------------------- |
| Required property | In `required` array          | `prop: Type`         |
| Nullable property | NOT in `required`            | `prop: Type \| null` |
| String            | `type: string`               | `string`             |
| Number            | `type: number`               | `number`             |
| Boolean           | `type: boolean`              | `boolean`            |
| Date              | `type: string, format: date` | `Date`               |
| Array             | `type: array, items: {...}`  | `Type[]`             |
| Enum              | `type: string, enum: [...]`  | `'a' \| 'b'`         |
| Union             | `oneOf: [...]`               | `A \| B`             |
| Intersection      | `allOf: [...]`               | `A & B`              |

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
2. Write your YAML spec
3. Call `validate-spec` to check for errors
4. Fix any issues
5. Run `type-crafter generate` CLI in your project

---

## Key Rules Summary

1. **Nullability = `required` array** - Nothing else controls this
2. **Arrays = properties only** - Never top-level types
3. **Paths = from project root** - Where you run the CLI
4. **Top file = has `info` section** - Can use `#/` references
5. **Non-top file = no `info`** - Must use full file paths for ALL references
