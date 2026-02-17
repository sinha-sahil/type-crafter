# References Rules

**Only the `$ref` keyword is used for references. No other referencing mechanism exists (`$include`, `$import`, `extends`, `inherits`, etc. are all invalid).**

---

## Valid Reference Formats (Complete List)

There are exactly **three** valid `$ref` formats:

| Format | When to use | Example |
| --- | --- | --- |
| `#/types/TypeName` | Top file, same-file, types section | `$ref: '#/types/User'` |
| `#/groupedTypes/Group/TypeName` | Top file, same-file, grouped section | `$ref: '#/groupedTypes/Auth/Token'` |
| `'./path/file.yaml#/TypePath'` | External file, OR any ref in non-top files | `$ref: './shared/types.yaml#/User'` |

**No other reference formats exist.**

---

## Top File vs Non-Top File

### Identifying File Type

**Top File** = Has `info` section with valid `version` and `title`.

**Non-Top File** = No `info` section.

### Reference Rules by File Type

| File Type | Same-File Reference | External Reference |
| --- | --- | --- |
| Top File | `#/types/Name` or `#/groupedTypes/Group/Name` | `'./path/file.yaml#/Name'` |
| Non-Top File | `'./path/to/this-file.yaml#/Name'` (full path required) | `'./path/file.yaml#/Name'` |

---

## Top File References

In a file WITH `info` section:

```yaml
info:
  version: '1.0.0'
  title: 'API Types'

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

groupedTypes:
  Auth:
    LoginResponse:
      type: object
      properties:
        user:
          $ref: '#/types/User'
        session:
          $ref: '#/groupedTypes/Auth/Session'

    Session:
      type: object
      properties:
        token:
          type: string
```

---

## Non-Top File References

In a file WITHOUT `info` section, you MUST use full paths for EVERYTHING:

```yaml
Cart:
  CartItem:
    type: object
    required:
      - product
    properties:
      product:
        $ref: './shared/cart.yaml#/Cart/Product'
      quantity:
        type: number

  Product:
    type: object
    properties:
      name:
        type: string
      price:
        type: number
```

**Why?** Non-top files have no root context. The parser needs the full path to resolve references.

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
Cart:
  CartItem:
    type: object
    properties:
      product:
        $ref: './specs/shop/product.yaml#/Product/ProductInfo'
      discount:
        $ref: './specs/shop/cart.yaml#/Cart/Discount'

  Discount:
    type: object
    properties:
      amount:
        type: number
```

---

## Referencing Entire Groups

You can reference an entire group, not just individual types:

```yaml
info:
  version: '1.0.0'
  title: 'API'

groupedTypes:
  Auth:
    $ref: './specs/auth/types.yaml#/AuthTypes'
```

```yaml
AuthTypes:
  LoginRequest:
    type: object
    properties:
      email:
        type: string

  LoginResponse:
    type: object
    properties:
      token:
        type: string
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
        $ref: '#/types/TreeNode'

LinkedList:
  type: object
  properties:
    value:
      type: number
    next:
      $ref: '#/types/LinkedList'
```

---

## Valid Reference Formats Summary

| Context | Format | Example |
| --- | --- | --- |
| Top file, same file, types | `#/types/Name` | `$ref: '#/types/User'` |
| Top file, same file, grouped | `#/groupedTypes/Group/Name` | `$ref: '#/groupedTypes/Auth/Token'` |
| Top file, external | `'./path/file.yaml#/...'` | `$ref: './shared/types.yaml#/User'` |
| Non-top file, ANY reference | `'./path/file.yaml#/...'` | `$ref: './this/file.yaml#/Group/Type'` |
