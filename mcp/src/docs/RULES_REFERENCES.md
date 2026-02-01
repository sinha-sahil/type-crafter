# References Rules

## Reference Syntax

References use `$ref` to point to other types:

```yaml
$ref: '#/types/TypeName'           # Same file, top-level type
$ref: '#/groupedTypes/Group/Type'  # Same file, grouped type
$ref: './path/file.yaml#/TypeName' # External file
```

---

## Top File vs Non-Top File (CRITICAL)

### Identifying File Type

**Top File** = Has `info` section at root:

```yaml
info:
  version: '1.0.0'
  title: 'My Types'
types:
  User: { ... }
```

**Non-Top File** = No `info` section:

```yaml
# No info section here
UserTypes:
  User: { ... }
  Profile: { ... }
```

### Reference Rules by File Type

| File Type    | Same-File Reference                | External Reference         |
| ------------ | ---------------------------------- | -------------------------- |
| Top File     | `#/types/Name`                     | `'./path/file.yaml#/Name'` |
| Non-Top File | `'./path/to/this-file.yaml#/Name'` | `'./path/file.yaml#/Name'` |

---

## Top File References

In a file WITH `info` section:

```yaml
# types.yaml (TOP FILE)
info:
  version: '1.0.0'
  title: 'API Types'

types:
  User:
    type: object
    properties:
      profile:
        $ref: '#/types/Profile' # Same-file reference

  Profile:
    type: object
    properties:
      bio: { type: string }

groupedTypes:
  Auth:
    LoginResponse:
      type: object
      properties:
        user:
          $ref: '#/types/User' # Reference to types section
        session:
          $ref: '#/groupedTypes/Auth/Session' # Same group

    Session:
      type: object
      properties:
        token: { type: string }
```

---

## Non-Top File References

In a file WITHOUT `info` section, you MUST use full paths for EVERYTHING:

```yaml
# shared/cart.yaml (NON-TOP FILE - no info section)
Cart:
  CartItem:
    type: object
    required:
      - product
    properties:
      product:
        # MUST use full path even for same-file reference
        $ref: './shared/cart.yaml#/Cart/Product'
      quantity:
        type: number

  Product:
    type: object
    properties:
      name: { type: string }
      price: { type: number }
```

**Why?** Non-top files have no root context. The parser needs the full path to resolve references.

### Common Mistake in Non-Top Files

```yaml
# shared/cart.yaml (NON-TOP FILE)
Cart:
  CartItem:
    type: object
    properties:
      product:
        $ref: '#/Cart/Product'  # WRONG! Missing file path

      product:
        $ref: './shared/cart.yaml#/Cart/Product'  # CORRECT
```

---

## External File References

### Path Rules

1. **Paths are from project root** (where you run `type-crafter` CLI)
2. **Always start with `./`**
3. **Never use `../`** for relative navigation

### Project Structure Example

```
my-project/           # <- Run CLI from here
  specs/
    api.yaml          # Top file
    auth/
      types.yaml      # Non-top file
    shop/
      cart.yaml       # Non-top file
      product.yaml    # Non-top file
```

### References in api.yaml (top file)

```yaml
# specs/api.yaml
info:
  version: '1.0.0'
  title: 'API'

groupedTypes:
  Auth:
    $ref: './specs/auth/types.yaml#/AuthTypes'

  Shop:
    Cart:
      $ref: './specs/shop/cart.yaml#/Cart'
    Product:
      $ref: './specs/shop/product.yaml#/Product'
```

### References in cart.yaml (non-top file)

```yaml
# specs/shop/cart.yaml (NON-TOP FILE)
Cart:
  CartItem:
    type: object
    properties:
      product:
        # Reference to another non-top file
        $ref: './specs/shop/product.yaml#/Product/ProductInfo'

      # Same-file reference - still needs full path!
      discount:
        $ref: './specs/shop/cart.yaml#/Cart/Discount'

  Discount:
    type: object
    properties:
      amount: { type: number }
```

### WRONG: Using Relative Paths

```yaml
# specs/shop/cart.yaml
Cart:
  CartItem:
    type: object
    properties:
      product:
        # WRONG - Don't use ../
        $ref: '../product.yaml#/Product'

        # CORRECT - From project root
        $ref: './specs/shop/product.yaml#/Product'
```

---

## Referencing Entire Groups

You can reference an entire group, not just individual types:

```yaml
# api.yaml (top file)
info:
  version: '1.0.0'
  title: 'API'

groupedTypes:
  # Import entire Auth group from external file
  Auth:
    $ref: './specs/auth/types.yaml#/AuthTypes'
```

```yaml
# specs/auth/types.yaml (can be top or non-top)
AuthTypes:
  LoginRequest:
    type: object
    properties:
      email: { type: string }

  LoginResponse:
    type: object
    properties:
      token: { type: string }
```

---

## Cyclic/Self References

Types can reference themselves (useful for trees, linked lists):

```yaml
TreeNode:
  type: object
  required:
    - value
  properties:
    value:
      type: string
    children:
      type: array
      items:
        $ref: '#/types/TreeNode' # Self-reference

LinkedList:
  type: object
  properties:
    value:
      type: number
    next:
      $ref: '#/types/LinkedList' # Self-reference
```

**TypeScript:**

```typescript
export type TreeNode = {
  value: string;
  children: TreeNode[] | null;
};

export type LinkedList = {
  value: number | null;
  next: LinkedList | null;
};
```

---

## Reference Path Formats

| Context                      | Format                      | Example                                |
| ---------------------------- | --------------------------- | -------------------------------------- |
| Top file, same file, types   | `#/types/Name`              | `$ref: '#/types/User'`                 |
| Top file, same file, grouped | `#/groupedTypes/Group/Name` | `$ref: '#/groupedTypes/Auth/Token'`    |
| Top file, external           | `'./path/file.yaml#/...'`   | `$ref: './shared/types.yaml#/User'`    |
| Non-top file, ANY reference  | `'./path/file.yaml#/...'`   | `$ref: './this/file.yaml#/Group/Type'` |

---

## Checklist

- [ ] Is this a top file or non-top file?
- [ ] If non-top: Am I using full paths for ALL references?
- [ ] Are paths from project root (not relative to current file)?
- [ ] Do paths start with `./`?
- [ ] No `../` in any path?
