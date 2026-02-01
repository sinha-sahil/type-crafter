# Composition Rules

## oneOf - Union Types

Creates TypeScript union: `TypeA | TypeB | TypeC`

Use when a value can be ONE of several types.

### Basic Union

```yaml
Response:
  oneOf:
    - $ref: '#/types/SuccessResponse'
    - $ref: '#/types/ErrorResponse'
```

**TypeScript:** `export type Response = SuccessResponse | ErrorResponse;`

### Union with Primitives

```yaml
Value:
  oneOf:
    - type: string
    - type: number
    - type: boolean
```

**TypeScript:** `export type Value = string | number | boolean;`

### Union with Inline Objects

```yaml
Result:
  oneOf:
    - type: object
      required: [data]
      properties:
        data: { type: string }
    - type: object
      required: [error]
      properties:
        error: { type: string }
```

**TypeScript:**

```typescript
export type Result = { data: string } | { error: string };
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

**TypeScript:** `export type Items = string | string[];`

### Union with Enums

```yaml
Status:
  oneOf:
    - type: string
      enum: [pending, loading]
    - type: string
      enum: [success, error]
```

**TypeScript:** `export type Status = 'pending' | 'loading' | 'success' | 'error';`

### Complex Union Example

```yaml
ApiResponse:
  oneOf:
    - $ref: '#/types/User'
    - $ref: '#/types/Error'
    - type: string
    - type: number
    - type: string
      enum: [pending, loading]
    - type: object
      properties:
        status: { type: string }
    - type: array
      items:
        type: string
    - type: array
      items:
        $ref: '#/types/User'
```

**TypeScript:**

```typescript
export type ApiResponse =
  | User
  | Error
  | string
  | number
  | ('pending' | 'loading')
  | { status: string | null }
  | string[]
  | User[];
```

---

## allOf - Intersection/Merge Types

Creates TypeScript intersection: `TypeA & TypeB & TypeC`

Use to combine multiple types into one (all properties merged).

### Basic Intersection

```yaml
AdminUser:
  allOf:
    - $ref: '#/types/BaseUser'
    - $ref: '#/types/AdminPermissions'
```

**TypeScript:** `export type AdminUser = BaseUser & AdminPermissions;`

### Intersection with Inline Extension

```yaml
types:
  BaseUser:
    type: object
    required: [id]
    properties:
      id: { type: string }

  ExtendedUser:
    allOf:
      - $ref: '#/types/BaseUser'
      - type: object
        required: [email]
        properties:
          email: { type: string }
          name: { type: string }
```

**TypeScript:**

```typescript
export type BaseUser = {
  id: string;
};

export type ExtendedUser = BaseUser & {
  email: string;
  name: string | null;
};
```

### Multiple Inheritance Pattern

```yaml
types:
  Timestamped:
    type: object
    required: [createdAt, updatedAt]
    properties:
      createdAt: { type: string, format: date }
      updatedAt: { type: string, format: date }

  Identifiable:
    type: object
    required: [id]
    properties:
      id: { type: string }

  User:
    allOf:
      - $ref: '#/types/Timestamped'
      - $ref: '#/types/Identifiable'
      - type: object
        required: [email]
        properties:
          email: { type: string }
          name: { type: string }
```

**TypeScript:**

```typescript
export type User = Timestamped &
  Identifiable & {
    email: string;
    name: string | null;
  };

// Effectively:
// {
//   createdAt: Date;
//   updatedAt: Date;
//   id: string;
//   email: string;
//   name: string | null;
// }
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
            data: { $ref: '#/types/User' }
    - allOf:
        - $ref: '#/types/BaseResponse'
        - type: object
          properties:
            error: { type: string }
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
              enum: [active, inactive]
            - type: number
```

---

## Common Patterns

### Discriminated Union (Tagged Union)

```yaml
types:
  SuccessResult:
    type: object
    required: [type, data]
    properties:
      type:
        type: string
        enum: [success]
      data: { type: unknown }

  ErrorResult:
    type: object
    required: [type, message]
    properties:
      type:
        type: string
        enum: [error]
      message: { type: string }

  Result:
    oneOf:
      - $ref: '#/types/SuccessResult'
      - $ref: '#/types/ErrorResult'
```

**TypeScript:**

```typescript
export type Result = { type: 'success'; data: unknown } | { type: 'error'; message: string };
```

### Mixin Pattern

```yaml
types:
  WithTimestamps:
    type: object
    required: [createdAt]
    properties:
      createdAt: { type: string, format: date }
      updatedAt: { type: string, format: date }

  WithSoftDelete:
    type: object
    properties:
      deletedAt: { type: string, format: date }

  User:
    allOf:
      - $ref: '#/types/WithTimestamps'
      - $ref: '#/types/WithSoftDelete'
      - type: object
        required: [id, email]
        properties:
          id: { type: string }
          email: { type: string }
```

### Nullable Union

```yaml
MaybeUser:
  oneOf:
    - $ref: '#/types/User'
    - type: object
      properties: {} # Empty object as "null" representation
```

---

## Rules Summary

| Operator | TypeScript    | Use Case                      |
| -------- | ------------- | ----------------------------- |
| `oneOf`  | `A \| B \| C` | Value is one of several types |
| `allOf`  | `A & B & C`   | Combine/merge multiple types  |

### What Can Be in oneOf/allOf

- `$ref` to other types
- `type: object` with properties
- `type: string/number/boolean` primitives
- `type: string` with `enum`
- `type: array` with items
- Nested `oneOf` or `allOf`
