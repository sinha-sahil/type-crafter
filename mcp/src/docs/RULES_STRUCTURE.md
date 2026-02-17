# Structure Rules

**Only the structure documented here is valid. Any keys or sections not listed will be rejected.**

---

## Valid Root-Level Keys (Complete List)

A spec file has exactly **three** possible root-level keys:

| Key | Type | Required | Description |
| --- | --- | --- | --- |
| `info` | object | Yes (for top files) | Metadata with version and title |
| `types` | object | At least one required | Flat/top-level type definitions |
| `groupedTypes` | object | At least one required | Namespaced type definitions |

**No other root-level keys exist.** Do not add `schemas`, `definitions`, `components`, `models`, `imports`, `config`, or anything else.

**Rule:** At least ONE of `types` or `groupedTypes` is required.

---

## The `info` Object (Complete List)

The `info` object accepts exactly **two** keys:

| Key | Type | Required |
| --- | --- | --- |
| `version` | string (semver) | Yes |
| `title` | string | Yes |

**No other info keys exist.** Do not add `description`, `contact`, `license`, `baseUrl`, `servers`, or anything else.

```yaml
info:
  version: '1.0.0'
  title: 'API Types'
```

Without a valid `info` section, the file is a "non-top file" with different reference rules.

---

## Top File vs Non-Top File

### Top File (has `info` section)

```yaml
info:
  version: '1.0.0'
  title: 'Main Types'

types:
  User:
    type: object
    properties:
      profile:
        $ref: '#/types/Profile'
  Profile:
    type: object
    properties:
      bio:
        type: string
```

**Rules for top files:**

- Can use `#/types/TypeName` for same-file references
- Can use `#/groupedTypes/Group/TypeName` for grouped types
- Can be used directly with `type-crafter generate` CLI

### Non-Top File (no `info` section)

```yaml
Cart:
  CartItem:
    type: object
    properties:
      product:
        $ref: './shared/cart.yaml#/Cart/Product'
  Product:
    type: object
    properties:
      name:
        type: string
```

**Rules for non-top files:**

- MUST use full file paths for ALL references
- Cannot use `#/` alone - always include file path
- Cannot be used directly with CLI - must be referenced from a top file

---

## `types` Section (Flat Types)

For standalone, top-level types:

```yaml
types:
  User:
    type: object
    required:
      - id
    properties:
      id:
        type: string

  Status:
    type: string
    enum:
      - active
      - inactive

  ApiResponse:
    oneOf:
      - $ref: '#/types/User'
      - type: string
```

---

## `groupedTypes` Section (Namespaced Types)

For organizing related types:

```yaml
groupedTypes:
  Auth:
    LoginRequest:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
        password:
          type: string

    LoginResponse:
      type: object
      required:
        - token
      properties:
        token:
          type: string
        user:
          $ref: '#/groupedTypes/Auth/User'

    User:
      type: object
      properties:
        id:
          type: string

  Shop:
    Product:
      type: object
      properties:
        name:
          type: string
```

---

## Combining `types` and `groupedTypes`

You can have both:

```yaml
info:
  version: '1.0.0'
  title: 'Full API'

types:
  Timestamp:
    type: object
    required:
      - createdAt
    properties:
      createdAt:
        type: string
        format: date

groupedTypes:
  Users:
    User:
      allOf:
        - $ref: '#/types/Timestamp'
        - type: object
          properties:
            name:
              type: string
```

---

## File Organization Patterns

### Pattern 1: Single File (Small Projects)

```
project/
  types.yaml      # Everything in one file
  src/
```

### Pattern 2: Main + Shared (Medium Projects)

```
project/
  types/
    index.yaml    # Top file with info
    shared.yaml   # Non-top file, referenced from index
  src/
```

### Pattern 3: Domain Separation (Large Projects)

```
project/
  specs/
    api.yaml      # Top file - main entry
    auth/
      types.yaml  # Non-top file
    shop/
      cart.yaml   # Non-top file
      product.yaml
  src/
```

**api.yaml (top file):**

```yaml
info:
  version: '1.0.0'
  title: 'E-Commerce API'

groupedTypes:
  Auth:
    $ref: './specs/auth/types.yaml#/AuthTypes'
  Shop:
    Cart:
      $ref: './specs/shop/cart.yaml#/Cart'
    Product:
      $ref: './specs/shop/product.yaml#/Product'
```
