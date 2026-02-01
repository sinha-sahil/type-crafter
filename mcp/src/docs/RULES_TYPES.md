# Types Rules

## Primitive Types

| YAML Type                 | TypeScript | Notes               |
| ------------------------- | ---------- | ------------------- |
| `string`                  | `string`   | Basic string        |
| `string` + `format: date` | `Date`     | Date object         |
| `number`                  | `number`   | Floating point      |
| `integer`                 | `number`   | Also becomes number |
| `boolean`                 | `boolean`  | True/false          |
| `unknown`                 | `unknown`  | Dynamic/any type    |

```yaml
properties:
  name: { type: string }
  age: { type: number }
  isActive: { type: boolean }
  birthDate: { type: string, format: date }
  metadata: { type: unknown }
```

---

## Object Types

```yaml
User:
  type: object
  description: 'User account' # Optional - becomes JSDoc
  example: "{ id: '123' }" # Optional - becomes JSDoc
  required:
    - id
    - email
  properties:
    id:
      type: string
      description: 'Unique ID' # Optional
      example: 'user-123' # Optional
    email:
      type: string
    name:
      type: string # Not in required = nullable
```

**TypeScript:**

```typescript
/**
 * @description User account
 */
export type User = {
  /** @description Unique ID */
  id: string;
  email: string;
  name: string | null;
};
```

---

## Enum Types

### String Enum (Top-Level)

```yaml
Status:
  type: string
  enum:
    - active
    - inactive
    - pending
```

**TypeScript:** `export type Status = 'active' | 'inactive' | 'pending';`

### Number Enum (Top-Level)

```yaml
Priority:
  type: number
  enum:
    - 1
    - 2
    - 3
```

**TypeScript:** `export type Priority = 1 | 2 | 3;`

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

**TypeScript:**

```typescript
export type User = {
  role: ('admin' | 'user' | 'guest') | null;
};
```

---

## Array Types

### CRITICAL: Arrays Cannot Be Top-Level Types

```yaml
# WRONG - This will NOT work
Tags:
  type: array
  items:
    type: string

# CORRECT - Arrays must be properties
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

**TypeScript:** `tags: string[] | null`

### Array of Objects

```yaml
properties:
  comments:
    type: array
    items:
      type: object
      required: [text]
      properties:
        text: { type: string }
        author: { type: string }
```

**TypeScript:** `comments: { text: string; author: string | null }[] | null`

### Array of References

```yaml
properties:
  posts:
    type: array
    items:
      $ref: '#/types/Post'
```

**TypeScript:** `posts: Post[] | null`

---

## Nested Objects

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

**TypeScript:**

```typescript
export type Company = {
  id: string;
  address: {
    street: string;
    city: string | null;
    zip: string | null;
  };
};
```

---

## Additional Properties (Hashmaps/Dictionaries)

### Simple Hashmap (any values)

```yaml
Metadata:
  type: object
  additionalProperties: true
```

**TypeScript:** `{ [keys: string]: unknown }`

### Typed Hashmap

```yaml
StringMap:
  type: object
  additionalProperties:
    keyType: string
    valueType:
      type: string
```

**TypeScript:** `{ [keys: string]: string }`

### Number Keys

```yaml
IdMap:
  type: object
  additionalProperties:
    keyType: number
    valueType:
      $ref: '#/types/User'
```

**TypeScript:** `{ [keys: number]: User }`

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

**TypeScript:**

```typescript
export type UserWithMeta = {
  id: string;
  [keys: string]: string;
};
```

---

## Type Definition Summary

| Type         | Structure                      | Top-Level? |
| ------------ | ------------------------------ | ---------- |
| Object       | `type: object` + `properties`  | Yes        |
| Enum         | `type: string/number` + `enum` | Yes        |
| Primitive    | `type: string/number/boolean`  | Yes        |
| Array        | `type: array` + `items`        | **NO**     |
| Union        | `oneOf: [...]`                 | Yes        |
| Intersection | `allOf: [...]`                 | Yes        |
| Reference    | `$ref: '...'`                  | Yes        |
