# Composition Rules

**Only two composition keywords exist: `oneOf` and `allOf`. No other composition mechanism exists (`anyOf`, `not`, `extends`, `implements`, `inherits`, `mixin`, `merge`, `discriminator` are all invalid).**

---

## Valid Composition Keywords (Complete List)

| Keyword | Use Case |
| --- | --- |
| `oneOf` | Value is one of several types (union) |
| `allOf` | Combine/merge multiple types (intersection) |

**No other composition keywords exist.**

---

## What Can Appear Inside `oneOf` / `allOf` Arrays

Each array item must be one of:

- `$ref` to another type
- `type: object` with `properties`
- `type: string/number/boolean/unknown` (primitives)
- `type: string` with `enum`
- `type: array` with `items`
- Nested `oneOf` or `allOf`

---

## oneOf - Union Types

Use when a value can be ONE of several types.

### Basic Union

```yaml
Response:
  oneOf:
    - $ref: '#/types/SuccessResponse'
    - $ref: '#/types/ErrorResponse'
```

### Union with Primitives

```yaml
Value:
  oneOf:
    - type: string
    - type: number
    - type: boolean
```

### Union with Inline Objects

```yaml
Result:
  oneOf:
    - type: object
      required:
        - data
      properties:
        data:
          type: string
    - type: object
      required:
        - error
      properties:
        error:
          type: string
```

### Union with Arrays

```yaml
Items:
  oneOf:
    - type: string
    - type: array
      items:
        type: string
```

### Union with Enums

```yaml
Status:
  oneOf:
    - type: string
      enum:
        - pending
        - loading
    - type: string
      enum:
        - success
        - error
```

### Complex Union Example

```yaml
ApiResponse:
  oneOf:
    - $ref: '#/types/User'
    - $ref: '#/types/Error'
    - type: string
    - type: number
    - type: string
      enum:
        - pending
        - loading
    - type: object
      properties:
        status:
          type: string
    - type: array
      items:
        type: string
    - type: array
      items:
        $ref: '#/types/User'
```

---

## allOf - Intersection/Merge Types

Use to combine multiple types into one (all properties merged).

### Basic Intersection

```yaml
AdminUser:
  allOf:
    - $ref: '#/types/BaseUser'
    - $ref: '#/types/AdminPermissions'
```

### Intersection with Inline Extension

```yaml
types:
  BaseUser:
    type: object
    required:
      - id
    properties:
      id:
        type: string

  ExtendedUser:
    allOf:
      - $ref: '#/types/BaseUser'
      - type: object
        required:
          - email
        properties:
          email:
            type: string
          name:
            type: string
```

### Multiple Inheritance Pattern

```yaml
types:
  Timestamped:
    type: object
    required:
      - createdAt
      - updatedAt
    properties:
      createdAt:
        type: string
        format: date
      updatedAt:
        type: string
        format: date

  Identifiable:
    type: object
    required:
      - id
    properties:
      id:
        type: string

  User:
    allOf:
      - $ref: '#/types/Timestamped'
      - $ref: '#/types/Identifiable'
      - type: object
        required:
          - email
        properties:
          email:
            type: string
          name:
            type: string
```

---

## Combining oneOf and allOf

You can nest composition operators:

### Union of Intersections

```yaml
Response:
  oneOf:
    - allOf:
        - $ref: '#/types/BaseResponse'
        - type: object
          properties:
            data:
              $ref: '#/types/User'
    - allOf:
        - $ref: '#/types/BaseResponse'
        - type: object
          properties:
            error:
              type: string
```

### Intersection with Union Property

```yaml
Entity:
  allOf:
    - $ref: '#/types/BaseEntity'
    - type: object
      properties:
        status:
          oneOf:
            - type: string
              enum:
                - active
                - inactive
            - type: number
```

---

## Common Patterns

### Discriminated Union (Tagged Union)

```yaml
types:
  SuccessResult:
    type: object
    required:
      - type
      - data
    properties:
      type:
        type: string
        enum:
          - success
      data:
        type: unknown

  ErrorResult:
    type: object
    required:
      - type
      - message
    properties:
      type:
        type: string
        enum:
          - error
      message:
        type: string

  Result:
    oneOf:
      - $ref: '#/types/SuccessResult'
      - $ref: '#/types/ErrorResult'
```

### Mixin Pattern

```yaml
types:
  WithTimestamps:
    type: object
    required:
      - createdAt
    properties:
      createdAt:
        type: string
        format: date
      updatedAt:
        type: string
        format: date

  WithSoftDelete:
    type: object
    properties:
      deletedAt:
        type: string
        format: date

  User:
    allOf:
      - $ref: '#/types/WithTimestamps'
      - $ref: '#/types/WithSoftDelete'
      - type: object
        required:
          - id
          - email
        properties:
          id:
            type: string
          email:
            type: string
```
