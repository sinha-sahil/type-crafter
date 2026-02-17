# Common Patterns

## Pattern 1: API Response Wrapper

```yaml
info:
  version: '1.0.0'
  title: 'API Patterns'

types:
  SuccessResponse:
    type: object
    required:
      - success
      - data
    properties:
      success:
        type: boolean
      data:
        type: unknown

  ErrorResponse:
    type: object
    required:
      - success
      - error
    properties:
      success:
        type: boolean
      error:
        type: string
      code:
        type: number

  ApiResponse:
    oneOf:
      - $ref: '#/types/SuccessResponse'
      - $ref: '#/types/ErrorResponse'
```

---

## Pattern 2: Paginated Response

```yaml
types:
  PaginationMeta:
    type: object
    required:
      - total
      - page
      - perPage
      - totalPages
    properties:
      total:
        type: number
      page:
        type: number
      perPage:
        type: number
      totalPages:
        type: number

  PaginatedUsers:
    type: object
    required:
      - data
      - meta
    properties:
      data:
        type: array
        items:
          $ref: '#/types/User'
      meta:
        $ref: '#/types/PaginationMeta'

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
```

---

## Pattern 3: Timestamp Mixin

```yaml
types:
  Timestamps:
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

  User:
    allOf:
      - $ref: '#/types/Timestamps'
      - type: object
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

  Post:
    allOf:
      - $ref: '#/types/Timestamps'
      - type: object
        required:
          - id
          - title
        properties:
          id:
            type: string
          title:
            type: string
          content:
            type: string
```

---

## Pattern 4: Status Enum with Metadata

```yaml
types:
  OrderStatus:
    type: string
    enum:
      - pending
      - processing
      - shipped
      - delivered
      - cancelled

  Order:
    type: object
    required:
      - id
      - status
    properties:
      id:
        type: string
      status:
        $ref: '#/types/OrderStatus'
      statusChangedAt:
        type: string
        format: date
      statusHistory:
        type: array
        items:
          type: object
          required:
            - status
            - changedAt
          properties:
            status:
              $ref: '#/types/OrderStatus'
            changedAt:
              type: string
              format: date
```

---

## Pattern 5: Recursive/Tree Structure

```yaml
types:
  MenuItem:
    type: object
    required:
      - id
      - label
    properties:
      id:
        type: string
      label:
        type: string
      url:
        type: string
      children:
        type: array
        items:
          $ref: '#/types/MenuItem'

  Menu:
    type: object
    required:
      - items
    properties:
      items:
        type: array
        items:
          $ref: '#/types/MenuItem'
```

---

## Pattern 6: Form Request/Response

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
        rememberMe:
          type: boolean

    LoginResponse:
      type: object
      required:
        - token
        - expiresAt
      properties:
        token:
          type: string
        refreshToken:
          type: string
        expiresAt:
          type: string
          format: date
        user:
          $ref: '#/types/User'

    RegisterRequest:
      type: object
      required:
        - email
        - password
        - confirmPassword
      properties:
        email:
          type: string
        password:
          type: string
        confirmPassword:
          type: string
        name:
          type: string

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
        type: string
```

---

## Pattern 7: Polymorphic Types (Discriminated Union)

```yaml
types:
  BaseNotification:
    type: object
    required:
      - id
      - type
      - createdAt
    properties:
      id:
        type: string
      type:
        type: string
      createdAt:
        type: string
        format: date
      read:
        type: boolean

  EmailNotification:
    allOf:
      - $ref: '#/types/BaseNotification'
      - type: object
        required:
          - subject
          - body
        properties:
          type:
            type: string
            enum:
              - email
          subject:
            type: string
          body:
            type: string

  SmsNotification:
    allOf:
      - $ref: '#/types/BaseNotification'
      - type: object
        required:
          - message
          - phoneNumber
        properties:
          type:
            type: string
            enum:
              - sms
          message:
            type: string
          phoneNumber:
            type: string

  PushNotification:
    allOf:
      - $ref: '#/types/BaseNotification'
      - type: object
        required:
          - title
        properties:
          type:
            type: string
            enum:
              - push
          title:
            type: string
          body:
            type: string

  Notification:
    oneOf:
      - $ref: '#/types/EmailNotification'
      - $ref: '#/types/SmsNotification'
      - $ref: '#/types/PushNotification'
```

---

## Pattern 8: Configuration Object

```yaml
types:
  DatabaseConfig:
    type: object
    required:
      - host
      - port
      - database
    properties:
      host:
        type: string
      port:
        type: number
      database:
        type: string
      username:
        type: string
      password:
        type: string
      ssl:
        type: boolean

  CacheConfig:
    type: object
    required:
      - enabled
    properties:
      enabled:
        type: boolean
      ttl:
        type: number
      maxSize:
        type: number

  AppConfig:
    type: object
    required:
      - database
      - environment
    properties:
      environment:
        type: string
        enum:
          - development
          - staging
          - production
      database:
        $ref: '#/types/DatabaseConfig'
      cache:
        $ref: '#/types/CacheConfig'
      features:
        type: object
        additionalProperties:
          keyType: string
          valueType:
            type: boolean
```

---

## Pattern 9: Multi-File Domain Organization

**specs/api.yaml (top file):**

```yaml
info:
  version: '1.0.0'
  title: 'E-Commerce API'

groupedTypes:
  Users:
    $ref: './specs/users/types.yaml#/UserTypes'
  Products:
    $ref: './specs/products/types.yaml#/ProductTypes'
  Orders:
    $ref: './specs/orders/types.yaml#/OrderTypes'
```

**specs/users/types.yaml:**

```yaml
info:
  version: '1.0.0'
  title: 'User Types'

groupedTypes:
  UserTypes:
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
        profile:
          $ref: '#/groupedTypes/UserTypes/UserProfile'

    UserProfile:
      type: object
      properties:
        name:
          type: string
        avatar:
          type: string
```

---

## Pattern 10: Hashmap/Dictionary

```yaml
types:
  Headers:
    type: object
    additionalProperties:
      keyType: string
      valueType:
        type: string

  Metadata:
    type: object
    additionalProperties: true

  UserCache:
    type: object
    additionalProperties:
      keyType: string
      valueType:
        $ref: '#/types/User'

  Response:
    type: object
    required:
      - status
    properties:
      status:
        type: number
    additionalProperties:
      keyType: string
      valueType:
        type: unknown

  User:
    type: object
    required:
      - id
    properties:
      id:
        type: string
```
