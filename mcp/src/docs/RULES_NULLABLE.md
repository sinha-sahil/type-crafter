# Nullable Types Rules

## The Only Mechanism

**The `required` array is the only way to control nullability.** No other mechanism exists in Type Crafter.

- Properties listed in `required` -> non-nullable
- Properties NOT listed in `required` -> nullable
- No `required` array at all -> all properties are nullable

There are no keywords like `nullable`, `optional`, `nillable`, or any other annotation. There is no `?` suffix syntax. There is no `type: [string, null]` syntax. The `required` array is it.

---

## How It Works

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
    age:
      type: number
```

In this example, `id` and `email` are in `required` so they are non-nullable. `name` and `age` are not in `required` so they are nullable.

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
    id:
      type: string
    email:
      type: string
    name:
      type: string
    age:
      type: number
```

All four properties are non-nullable.

### Some Properties Required

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
    age:
      type: number
```

`id` and `email` are non-nullable. `name` and `age` are nullable.

### No Properties Required (All Nullable)

```yaml
User:
  type: object
  properties:
    id:
      type: string
    email:
      type: string
    name:
      type: string
```

All three properties are nullable.

### Empty Required Array (All Nullable)

```yaml
User:
  type: object
  required: []
  properties:
    id:
      type: string
```

`id` is nullable.

---

## Nested Objects

Each nested object has its OWN `required` array:

```yaml
User:
  type: object
  required:
    - id
    - profile
  properties:
    id:
      type: string
    profile:
      type: object
      required:
        - name
      properties:
        name:
          type: string
        bio:
          type: string
```

`profile` is non-nullable (it's in User's `required`). Inside profile, `name` is non-nullable (it's in profile's `required`), but `bio` is nullable (not in profile's `required`).

---

## Arrays

The array itself follows `required` rules. Items have their own rules:

```yaml
Post:
  type: object
  required:
    - id
    - tags
  properties:
    id:
      type: string
    tags:
      type: array
      items:
        type: string
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

`tags` is non-nullable (in `required`). `comments` is nullable (not in `required`). Inside each comment item, `text` is non-nullable but `author` is nullable.

---

## References

Referenced types maintain their own nullability. The reference's position in `required` controls if the reference itself is nullable:

```yaml
types:
  Profile:
    type: object
    required:
      - bio
    properties:
      bio:
        type: string
      avatar:
        type: string

  User:
    type: object
    required:
      - id
      - mainProfile
    properties:
      id:
        type: string
      mainProfile:
        $ref: '#/types/Profile'
      backupProfile:
        $ref: '#/types/Profile'
```

`mainProfile` is non-nullable (in `required`). `backupProfile` is nullable (not in `required`). Inside Profile, `bio` is non-nullable and `avatar` is nullable regardless of where Profile is referenced.

---

## Quick Reference

| Scenario | Result |
| --- | --- |
| Property in `required` array | Non-nullable |
| Property NOT in `required` | Nullable |
| No `required` array | All properties nullable |
| `required: []` (empty) | All properties nullable |
| Nested object | Uses its own `required` array |
| Array items | Follow their own `required` rules |
| References | Reference position in `required` controls nullability |
