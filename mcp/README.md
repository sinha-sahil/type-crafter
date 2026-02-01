# Type Crafter MCP Server

An MCP (Model Context Protocol) server that helps AI assistants write correct Type Crafter YAML specifications.

[![npm version](https://badge.fury.io/js/@type-crafter%2Fmcp-server.svg)](https://www.npmjs.com/package/@type-crafter/mcp-server)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Why This MCP?

LLMs often make mistakes when writing Type Crafter YAML specs:

| Common Mistake     | Why It Fails                    |
| ------------------ | ------------------------------- |
| `nullable: true`   | Property doesn't exist          |
| `optional: true`   | Property doesn't exist          |
| `name?: string`    | Syntax not supported            |
| Top-level arrays   | Arrays must be properties       |
| `../relative/path` | Paths must be from project root |

This MCP **teaches** LLMs the correct format and **validates** specs before generation.

## Installation

```bash
# Install MCP server
npm install -g @type-crafter/mcp-server

# Also need type-crafter CLI for generation
npm install -g type-crafter
```

## Configuration

### Claude Desktop

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "type-crafter": {
      "command": "type-crafter-mcp"
    }
  }
}
```

### From Source

```json
{
  "mcpServers": {
    "type-crafter": {
      "command": "node",
      "args": ["/path/to/type-crafter/mcp/dist/index.js"]
    }
  }
}
```

## Tools

### 1. `get-writing-guide`

**Call this FIRST.** Returns the writing guide and a sessionId.

```
Parameters: none

Returns:
- sessionId (pass to other tools)
- Quick start guide
- Common mistakes to avoid
- Quick reference table
```

### 2. `get-rules-section`

Get detailed rules for a specific topic.

```
Parameters:
- sessionId (optional): From get-writing-guide
- section (required): One of:
    - structure   → Root structure, info, types vs groupedTypes
    - types       → Objects, enums, primitives, arrays
    - nullable    → How required array controls nullability
    - references  → $ref syntax, top-file vs non-top-file
    - composition → oneOf (unions), allOf (intersections)
    - patterns    → Common patterns with examples
```

### 3. `validate-spec`

Validate a YAML spec for correctness.

```
Parameters:
- sessionId (optional): From get-writing-guide
- specFilePath (required): Path to YAML file

Checks:
- Structure (info, types, groupedTypes)
- Common mistakes (nullable, optional, wrong paths)
- Reference rules (top-file vs non-top-file)
```

### 4. `get-spec-info`

Get information about an existing spec file.

```
Parameters:
- specFilePath (required): Path to YAML file

Returns:
- Version and title
- List of all types
- List of all grouped types
```

### 5. `list-languages`

List supported languages for type-crafter CLI.

```
Parameters: none

Returns:
- typescript
- typescript-with-decoders
```

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. get-writing-guide                                       │
│     └─→ Returns sessionId + guide                           │
│                                                             │
│  2. Write YAML spec (following the guide)                   │
│                                                             │
│  3. validate-spec(sessionId, specFilePath)                  │
│     ├─→ Valid: "Run type-crafter generate..."               │
│     └─→ Errors: Shows issues + suggests get-rules-section   │
│                                                             │
│  4. Fix issues, re-validate                                 │
│                                                             │
│  5. User runs: type-crafter generate typescript spec.yaml   │
└─────────────────────────────────────────────────────────────┘
```

## Session Enforcement

The MCP uses sessions to encourage reading the guide first:

- `get-writing-guide` returns a `sessionId`
- Pass `sessionId` to other tools
- If validation fails with common mistakes AND no sessionId → suggests reading the guide
- Sessions expire after 30 minutes

## YAML Quick Reference

```yaml
info:
  version: '1.0.0'
  title: 'My Types'

types:
  User:
    type: object
    required:
      - id # Required → string
      - email # Required → string
    properties:
      id: { type: string }
      email: { type: string }
      name: { type: string } # Not in required → string | null
```

**Generated TypeScript:**

```typescript
export type User = {
  id: string;
  email: string;
  name: string | null;
};
```

## Key Rules

| Rule                      | Correct                            | Wrong                   |
| ------------------------- | ---------------------------------- | ----------------------- |
| Nullable fields           | Omit from `required` array         | `nullable: true`        |
| Optional fields           | Omit from `required` array         | `optional: true`        |
| Arrays                    | Property inside object             | Top-level type          |
| External refs             | `./path/from/root/file.yaml#/Type` | `../relative/path.yaml` |
| Same-file refs (top file) | `#/types/TypeName`                 | -                       |
| Same-file refs (non-top)  | `./this/file.yaml#/TypeName`       | `#/TypeName`            |

## Usage Examples

### Creating Types

```
User: "Create types for a user API with id, email, and optional name"

LLM: [Calls get-writing-guide]
     [Reads the guide, notes required array controls nullability]
     [Creates YAML spec]
     [Calls validate-spec]
     "Here's your valid spec. Run: type-crafter generate typescript ./types.yaml ./output"
```

### Validating Specs

```
User: "Check if my types.yaml is valid"

LLM: [Calls validate-spec]
     "Found 2 issues:
      1. Line 15: 'nullable: true' doesn't exist - use required array
      2. Line 23: Wrong path format - use ./path/from/root"
```

### Learning Specific Rules

```
User: "How do references work in Type Crafter?"

LLM: [Calls get-rules-section with section: "references"]
     "References in Type Crafter work like this..."
```

## Troubleshooting

### "nullable: true" errors

Type Crafter doesn't have a `nullable` property. Use the `required` array:

```yaml
# Properties in required → non-nullable
# Properties NOT in required → nullable (Type | null)
required:
  - id
  - email
properties:
  id: { type: string } # string
  email: { type: string } # string
  name: { type: string } # string | null
```

### Reference path errors

All paths are from project root (where you run the CLI), not relative to current file:

```yaml
# Wrong
$ref: '../common/types.yaml#/User'

# Correct
$ref: './src/common/types.yaml#/User'
```

### "Arrays cannot be top-level types"

Arrays must be properties within objects:

```yaml
# Wrong
Tags:
  type: array
  items: { type: string }

# Correct
Post:
  type: object
  properties:
    tags:
      type: array
      items: { type: string }
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Lint
npm run lint
```

## License

ISC
