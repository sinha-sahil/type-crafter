# Type Crafter

TypeCrafter is a CLI tool for generating types from a YAML types specification for any language.
The tool is heavily inspired by [OpenAPI Generator](https://openapi-generator.tech/) and
aims to provide similar functionality for generating types with a simple YAML specification & more flexibility.

## Installation

```bash
npm i -g type-crafter
```

## Usage

```bash
type-crafter generate <language> <types-specification-file> <output-directory>
```

### Example

```bash
type-crafter generate typescript types.yaml ./types
```

Example input specification file can be found [here](https://github.com/sinha-sahil/type-crafter/blob/release/examples/input.yaml#L1)

## Input Specification

The input specification is a YAML file that contains the types specification.
Refer the following sample specification for the structure:

```yaml
info:
  version: 0.0.0
  title: Title of your specification
types:
  SampleType:
    type: object
    properties:
      name:
        type: string
groupedTypes:
  SampleGroupedType:
    type: object
    properties:
      name:
        type: string
```

The input specification yaml file must be of following syntax:

- `info` - The information about the specification. Specifying the version and title of your spec. **This is required.**
- `types` - These are types that will be generated in flat structure.
- `groupedTypes` - These are types that will be generated and grouped in a folder.

**Note: Passing types or groupedTypes is up to your expected results. A valid spec file can contain either types or groupedTypes or both.**

The syntax for writing different types can be referred from the [OpenAPI Data Types Guide](https://swagger.io/docs/specification/data-models/data-types/).

## Supported languages

- [✔️] TypeScript
- More languages will be added soon.

## Contributing & Extending

### Adding support for a new language

TypeCrafter uses Handlebars to template syntax for different languages.

To add support for a new language, you need to create a new folder in `src/templates` directory.
The folder name will be the name of the language.
The folder must implement following files:

- `index.ts` - The main file that will be exporting the [generator config](https://github.com/sinha-sahil/type-crafter/blob/release/src/types/index.ts#L5).
- `object-syntax.hbs` - This Handlebars template file that will be used to generate the object syntax.
- `type-file-syntax.hbs` - This Handlebars template file that will be used to generate the syntax for file which contains the generated types & its imports.
- `exporter-module-syntax.hbs` - This Handlebars template file that will be used to generate the syntax for the module that exports the generated types.

## Development

To start developing type-crafter, you need to run following commands:

```bash
pnpm i
pnpm run dev
```
