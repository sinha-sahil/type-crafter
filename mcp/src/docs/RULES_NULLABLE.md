# Nullable Types Rules

## The Core Rule

**Properties NOT in the `required` array become `Type | null` in TypeScript.**

This is the ONLY way to control nullability. No other mechanism exists.

---

## What Does NOT Work

```yaml
# WRONG: nullable property does NOT exist
name:
  type: string
  nullable: true      # INVALID - will be ignored or error

# WRONG: optional property does NOT exist
name:
  type: string
  optional: true      # INVALID - will be ignored or error

# WRONG: ? suffix is NOT supported
properties:
  name?:              # INVALID SYNTAX
    type: string

# WRONG: Array type syntax
name:
  type: [string, null]  # INVALID - not supported
```

---

## What DOES Work

```yaml
User:
  type: object
  required: # This array controls EVERYTHING
    - id # id is required -> string
    - email # email is required -> string
    # name is NOT here -> string | null
    # age is NOT here -> number | null
  properties:
    id:
      type: string
    email:
      type: string
    name:
      type: string
    age:
      type: number
```

**TypeScript:**

```typescript
export type User = {
  id: string; // Required
  email: string; // Required
  name: string | null; // Nullable (not in required)
  age: number | null; // Nullable (not in required)
};
```

---

## Scenarios

### All Properties Required

```yaml
User:
  type: object
  required:
    - id
    - email
    - name
    - age
  properties:
    id: { type: string }
    email: { type: string }
    name: { type: string }
    age: { type: number }
```

```typescript
export type User = {
  id: string;
  email: string;
  name: string;
  age: number;
};
```

### Some Properties Required

```yaml
User:
  type: object
  required:
    - id
    - email
  properties:
    id: { type: string }
    email: { type: string }
    name: { type: string }
    age: { type: number }
```

```typescript
export type User = {
  id: string;
  email: string;
  name: string | null;
  age: number | null;
};
```

### No Properties Required (All Nullable)

```yaml
User:
  type: object
  # No required array at all
  properties:
    id: { type: string }
    email: { type: string }
    name: { type: string }
```

```typescript
export type User = {
  id: string | null;
  email: string | null;
  name: string | null;
};
```

### Empty Required Array (All Nullable)

```yaml
User:
  type: object
  required: [] # Explicit empty array
  properties:
    id: { type: string }
```

```typescript
export type User = {
  id: string | null;
};
```

---

## Nested Objects

Each nested object has its OWN `required` array:

```yaml
User:
  type: object
  required:
    - id
    - profile # profile object is required
  properties:
    id:
      type: string
    profile:
      type: object
      required:
        - name # name inside profile is required
      properties:
        name:
          type: string
        bio:
          type: string # NOT required inside profile
```

```typescript
export type User = {
  id: string;
  profile: {
    // profile is required (non-null)
    name: string; // name is required inside profile
    bio: string | null; // bio is nullable inside profile
  };
};
```

---

## Arrays

The array itself follows `required` rules. Items have their own rules:

```yaml
Post:
  type: object
  required:
    - id
    - tags # tags array is required
  properties:
    id:
      type: string
    tags:
      type: array
      items:
        type: string
    comments: # NOT in required
      type: array
      items:
        type: object
        required:
          - text
        properties:
          text: { type: string }
          author: { type: string }
```

```typescript
export type Post = {
  id: string;
  tags: string[]; // Required array
  comments:
    | {
        // Nullable array
        text: string;
        author: string | null;
      }[]
    | null;
};
```

---

## References

Referenced types maintain their own nullability. The reference's position in `required` controls if the reference itself is nullable:

```yaml
types:
  Profile:
    type: object
    required: [bio]
    properties:
      bio: { type: string }
      avatar: { type: string } # nullable inside Profile

  User:
    type: object
    required:
      - id
      - mainProfile # This reference is required
    properties:
      id:
        type: string
      mainProfile:
        $ref: '#/types/Profile'
      backupProfile: # NOT in required
        $ref: '#/types/Profile'
```

```typescript
export type Profile = {
  bio: string;
  avatar: string | null;
};

export type User = {
  id: string;
  mainProfile: Profile; // Required reference
  backupProfile: Profile | null; // Nullable reference
};
```

---

## Quick Reference

| Scenario                     | Result                                                |
| ---------------------------- | ----------------------------------------------------- |
| Property in `required` array | `Type`                                                |
| Property NOT in `required`   | `Type \| null`                                        |
| No `required` array          | All properties `Type \| null`                         |
| `required: []` (empty)       | All properties `Type \| null`                         |
| Nested object                | Uses its own `required` array                         |
| Array items                  | Follow their own `required` rules                     |
| References                   | Reference position in `required` controls nullability |
