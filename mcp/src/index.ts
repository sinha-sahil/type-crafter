#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parse as parseYaml } from 'yaml';
import { randomUUID } from 'crypto';
import { z } from 'zod';

// ES module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Session management
const sessions = new Map<string, { createdAt: Date; acknowledged: boolean }>();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

function createSession(): string {
  const sessionId = randomUUID();
  sessions.set(sessionId, { createdAt: new Date(), acknowledged: true });
  return sessionId;
}

function isValidSession(sessionId: string | undefined): boolean {
  if (!sessionId) return false;
  const session = sessions.get(sessionId);
  if (!session) return false;

  // Check if session is expired
  const now = new Date();
  if (now.getTime() - session.createdAt.getTime() > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    return false;
  }
  return true;
}

// Clean up expired sessions periodically
setInterval(
  () => {
    const now = new Date();
    for (const [id, session] of sessions.entries()) {
      if (now.getTime() - session.createdAt.getTime() > SESSION_TTL_MS) {
        sessions.delete(id);
      }
    }
  },
  5 * 60 * 1000
); // Every 5 minutes

// Zod schemas for tools
const getWritingGuideSchema = z.object({});

const getRulesSectionSchema = z.object({
  sessionId: z
    .string()
    .optional()
    .describe('Session ID from get-writing-guide. Recommended but not required.'),
  section: z
    .enum(['structure', 'types', 'nullable', 'references', 'composition', 'patterns'])
    .describe('The section to retrieve detailed rules for'),
});

const validateSpecSchema = z.object({
  sessionId: z
    .string()
    .optional()
    .describe('Session ID from get-writing-guide. Recommended but not required.'),
  specFilePath: z.string().describe('Path to the YAML specification file to validate'),
});

const getSpecInfoSchema = z.object({
  specFilePath: z.string().describe('Path to the YAML specification file'),
});

const listLanguagesSchema = z.object({});

// Interfaces
interface SpecInfo {
  version: string;
  title: string;
}

interface ValidationResult {
  valid: boolean;
  info?: SpecInfo;
  types?: Record<string, unknown>;
  groupedTypes?: Record<string, unknown>;
}

interface ExecError extends Error {
  stderr?: string;
  stdout?: string;
}

// Type guards
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSpecInfo(value: unknown): value is SpecInfo {
  return isRecord(value) && typeof value.version === 'string' && typeof value.title === 'string';
}

function isExecError(error: unknown): error is ExecError {
  return error instanceof Error;
}

// Helper to read doc files
async function readDocFile(filename: string): Promise<string> {
  const docPath = path.join(__dirname, 'docs', filename);
  return fs.readFile(docPath, 'utf-8');
}

// Helper function to read YAML files
async function readYaml(filePath: string): Promise<unknown> {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return parseYaml(fileContent);
}

// Helper function to validate spec structure
function validateSpecData(data: unknown): ValidationResult {
  if (!isRecord(data)) {
    return { valid: false };
  }

  if (!isRecord(data.info)) {
    return { valid: false };
  }

  if (!isSpecInfo(data.info)) {
    return { valid: false };
  }

  const types = isRecord(data.types) ? data.types : undefined;
  const groupedTypes = isRecord(data.groupedTypes) ? data.groupedTypes : undefined;

  if (typeof types === 'undefined' && typeof groupedTypes === 'undefined') {
    return { valid: false };
  }

  return {
    valid: true,
    info: data.info,
    types,
    groupedTypes,
  };
}

// Check spec for common mistakes
interface CheckResult {
  issues: string[];
  warnings: string[];
  isTopFile: boolean;
  fileType: string;
}

function checkSpecContent(specContent: string, resolvedSpecPath: string): CheckResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  let isTopFile = false;
  let fileType = 'UNKNOWN';

  // Parse YAML to determine file type
  let specData: unknown;
  try {
    specData = parseYaml(specContent);

    if (!isRecord(specData)) {
      issues.push('Spec file root is not an object. Expected YAML object at root level.');
    } else {
      if (isRecord(specData.info) && isSpecInfo(specData.info)) {
        isTopFile = true;
        fileType = 'TOP FILE';
      } else if (isRecord(specData.info)) {
        isTopFile = false;
        fileType = 'INCOMPLETE TOP FILE';
        if (typeof specData.info.version !== 'string') {
          issues.push(
            "Missing 'info.version' - Must be a string in semver format (e.g., '1.0.0')."
          );
        }
        if (typeof specData.info.title !== 'string') {
          issues.push("Missing 'info.title' - Must be a string describing the spec.");
        }
      } else {
        isTopFile = false;
        fileType = 'NON-TOP FILE';
      }

      const hasTypes = isRecord(specData.types);
      const hasGroupedTypes = isRecord(specData.groupedTypes);

      if (isTopFile && !hasTypes && !hasGroupedTypes) {
        issues.push(
          "Missing 'types' or 'groupedTypes' section - Top files must have at least one of these sections."
        );
      }
    }
  } catch (error: unknown) {
    if (isExecError(error)) {
      issues.push(`YAML parsing error: ${error.message}`);
    } else {
      issues.push('YAML parsing error: Unable to parse spec file.');
    }
  }

  const relativeFromCwd = path.relative(process.cwd(), resolvedSpecPath);
  const suggestedPath = relativeFromCwd.startsWith('.') ? relativeFromCwd : `./${relativeFromCwd}`;

  const lines = specContent.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for 'nullable: true'
    if (line.match(/nullable\s*:\s*true/i)) {
      issues.push(
        `Line ${lineNum}: Found 'nullable: true' - This property does NOT exist in Type Crafter. ` +
          `Use the 'required' array to control nullability instead.`
      );
    }

    // Check for 'optional: true'
    if (line.match(/optional\s*:\s*true/i)) {
      issues.push(
        `Line ${lineNum}: Found 'optional: true' - This property does NOT exist in Type Crafter. ` +
          `Use the 'required' array to control nullability instead.`
      );
    }

    // Check for property names with '?'
    if (line.match(/^\s+[\w]+\?\s*:/)) {
      issues.push(
        `Line ${lineNum}: Found property name with '?' suffix - This syntax is NOT supported. ` +
          `Use the 'required' array instead.`
      );
    }

    // Check for type: [string, null] pattern
    if (line.match(/type\s*:\s*\[.*,\s*null\]/)) {
      issues.push(
        `Line ${lineNum}: Found 'type: [type, null]' pattern - This is NOT supported. ` +
          `Use the 'required' array to control nullability instead.`
      );
    }

    // Check for top-level array types
    if (line.match(/^\w+:\s*$/) && lines[index + 1]?.match(/^\s+type\s*:\s*array/)) {
      warnings.push(
        `Line ${lineNum}: Possible top-level array type - Arrays cannot be top-level types. ` +
          `They must be properties within objects.`
      );
    }

    // Check for '../' in $ref paths
    if (line.match(/\$ref\s*:\s*['"].*\.\.\//)) {
      issues.push(
        `Line ${lineNum}: Found relative path with '../' in $ref - Paths should be from project root, ` +
          `not relative to the current file. Use './path/from/root/file.yaml#/Type' format.`
      );
    }

    // Check for # references in NON-TOP files
    if (!isTopFile && fileType === 'NON-TOP FILE') {
      const refMatch = line.match(/\$ref\s*:\s*['"]#\/([^'"]+)['"]/);
      if (refMatch) {
        const refPath = refMatch[1];
        issues.push(
          `Line ${lineNum}: Found '#/${refPath}' reference in a NON-TOP FILE. ` +
            `Non-top files (files without 'info' section) MUST use complete file paths for ALL references. ` +
            `Use: $ref: '${suggestedPath}#/${refPath}'`
        );
      }
    }

    // Check for missing './' prefix in external $ref
    if (line.match(/\$ref\s*:\s*['"][^#'][^/]/)) {
      const match = line.match(/\$ref\s*:\s*['"]([^'"]+)['"]/);
      if (match && match[1] && !match[1].startsWith('#') && !match[1].startsWith('./')) {
        warnings.push(
          `Line ${lineNum}: External $ref path should start with './' - ` +
            `Use './path/from/root/file.yaml#/Type' format.`
        );
      }
    }
  });

  return { issues, warnings, isTopFile, fileType };
}

// Create server instance
const server = new McpServer(
  {
    name: 'type-crafter-mcp',
    version: '0.2.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool 1: get-writing-guide
server.registerTool(
  'get-writing-guide',
  {
    description:
      'Get the Type Crafter YAML specification writing guide. ' +
      'CALL THIS FIRST before writing any YAML specs. ' +
      'Returns a sessionId that should be passed to other tools. ' +
      'The guide includes common mistakes to avoid, quick reference, and links to detailed sections.',
    inputSchema: getWritingGuideSchema,
  },
  async () => {
    try {
      const sessionId = createSession();
      const guideContent = await readDocFile('WRITING_GUIDE.md');

      return {
        content: [
          {
            type: 'text' as const,
            text:
              `SESSION: ${sessionId}\n\n` +
              `Save this sessionId and pass it to other Type Crafter tools.\n\n` +
              `---\n\n${guideContent}`,
          },
        ],
      };
    } catch (error: unknown) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error reading writing guide: ${
              isExecError(error) ? error.message : 'Unknown error'
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool 2: get-rules-section
server.registerTool(
  'get-rules-section',
  {
    description:
      'Get detailed rules for a specific topic. ' +
      'Available sections: structure, types, nullable, references, composition, patterns. ' +
      'Pass the sessionId from get-writing-guide for best experience.',
    inputSchema: getRulesSectionSchema,
  },
  async (args: unknown) => {
    const parsed = getRulesSectionSchema.safeParse(args);
    if (!parsed.success) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Error: Invalid arguments. Required: section (structure|types|nullable|references|composition|patterns)',
          },
        ],
        isError: true,
      };
    }

    const { sessionId, section } = parsed.data;

    // Check session - warn if not provided but don't block
    let sessionWarning = '';
    if (!sessionId) {
      sessionWarning =
        '** Note: No sessionId provided. Call get-writing-guide first to get the basics and a sessionId.\n\n';
    } else if (!isValidSession(sessionId)) {
      sessionWarning =
        '** Note: Invalid or expired sessionId. Consider calling get-writing-guide again.\n\n';
    }

    const sectionFileMap: Record<string, string> = {
      structure: 'RULES_STRUCTURE.md',
      types: 'RULES_TYPES.md',
      nullable: 'RULES_NULLABLE.md',
      references: 'RULES_REFERENCES.md',
      composition: 'RULES_COMPOSITION.md',
      patterns: 'RULES_PATTERNS.md',
    };

    try {
      const content = await readDocFile(sectionFileMap[section]);
      return {
        content: [
          {
            type: 'text' as const,
            text: sessionWarning + content,
          },
        ],
      };
    } catch (error: unknown) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error reading section '${section}': ${
              isExecError(error) ? error.message : 'Unknown error'
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool 3: validate-spec
server.registerTool(
  'validate-spec',
  {
    description:
      'Validate a YAML specification file for correctness. ' +
      'Checks structure AND common mistakes (nullable, optional, paths, etc.). ' +
      'If validation fails with common mistakes, you likely need to read get-writing-guide first. ' +
      'Pass sessionId from get-writing-guide for best experience.',
    inputSchema: validateSpecSchema,
  },
  async (args: unknown) => {
    const parsed = validateSpecSchema.safeParse(args);
    if (!parsed.success) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Error: Invalid arguments. Required: specFilePath',
          },
        ],
        isError: true,
      };
    }

    const { sessionId, specFilePath } = parsed.data;
    const resolvedSpecPath = path.resolve(specFilePath);

    // Check if file exists
    try {
      await fs.access(resolvedSpecPath);
    } catch {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: Specification file not found at ${resolvedSpecPath}`,
          },
        ],
        isError: true,
      };
    }

    // Read spec content
    let specContent: string;
    try {
      specContent = await fs.readFile(resolvedSpecPath, 'utf-8');
    } catch (error: unknown) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error reading spec file: ${
              isExecError(error) ? error.message : 'Unknown error'
            }`,
          },
        ],
        isError: true,
      };
    }

    // Run checks
    const checkResult = checkSpecContent(specContent, resolvedSpecPath);
    const fileName = path.basename(resolvedSpecPath);

    let response = `File: ${fileName}\nType: ${checkResult.fileType}\n\n`;

    // Add file type explanation
    if (checkResult.fileType === 'TOP FILE') {
      response += 'This is a TOP FILE (has info section).\n';
      response += '- Can use #/types/TypeName for same-file references\n';
      response += '- Can be used with type-crafter generate CLI\n\n';
    } else if (checkResult.fileType === 'NON-TOP FILE') {
      response += 'This is a NON-TOP FILE (no info section).\n';
      response += '- MUST use full paths for ALL references\n';
      response += '- Must be referenced from a top file\n\n';
    }

    // Check if there are issues and no session - suggest reading guide
    const hasCommonMistakes = checkResult.issues.some(
      (i) =>
        i.includes('nullable') ||
        i.includes('optional') ||
        i.includes("'?'") ||
        i.includes('../') ||
        i.includes('NON-TOP FILE')
    );

    if (hasCommonMistakes && !isValidSession(sessionId)) {
      response +=
        '** RECOMMENDATION: These errors suggest you may not have read the writing guide.\n' +
        '** Call get-writing-guide first to learn the correct YAML format.\n\n';
    }

    if (checkResult.issues.length === 0 && checkResult.warnings.length === 0) {
      // Also validate structure
      const specData = await readYaml(resolvedSpecPath);
      const structureValidation = validateSpecData(specData);

      if (structureValidation.valid && structureValidation.info) {
        const typesCount = structureValidation.types
          ? Object.keys(structureValidation.types).length
          : 0;
        const groupedTypesCount = structureValidation.groupedTypes
          ? Object.keys(structureValidation.groupedTypes).length
          : 0;

        response += 'VALID - Specification file is valid!\n\n';
        response += `Version: ${structureValidation.info.version}\n`;
        response += `Title: ${structureValidation.info.title}\n`;
        response += `Types: ${typesCount}\n`;
        response += `Grouped Types: ${groupedTypesCount}\n\n`;
        response += 'You can now run: type-crafter generate <language> <spec-path> <output-dir>';

        return {
          content: [{ type: 'text' as const, text: response }],
        };
      }
    }

    if (checkResult.issues.length > 0) {
      response += 'ISSUES FOUND:\n\n';
      checkResult.issues.forEach((issue, idx) => {
        response += `${idx + 1}. ${issue}\n\n`;
      });
    }

    if (checkResult.warnings.length > 0) {
      response += 'WARNINGS:\n\n';
      checkResult.warnings.forEach((warning, idx) => {
        response += `${idx + 1}. ${warning}\n\n`;
      });
    }

    if (checkResult.issues.length > 0 || checkResult.warnings.length > 0) {
      response += '\nFor detailed rules, call get-rules-section with the relevant topic:\n';
      response += '- nullable: How to control nullability with required array\n';
      response += '- references: $ref syntax and path rules\n';
      response += '- types: Object, enum, array definitions\n';
      response += '- structure: Top file vs non-top file rules\n';
    }

    return {
      content: [{ type: 'text' as const, text: response }],
      isError: checkResult.issues.length > 0,
    };
  }
);

// Tool 4: get-spec-info
server.registerTool(
  'get-spec-info',
  {
    description:
      'Get information about a YAML specification file including version, title, ' +
      'and all types defined in the spec.',
    inputSchema: getSpecInfoSchema,
  },
  async (args: unknown) => {
    const parsed = getSpecInfoSchema.safeParse(args);
    if (!parsed.success) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Error: Invalid arguments. Required: specFilePath',
          },
        ],
        isError: true,
      };
    }

    const { specFilePath } = parsed.data;
    const resolvedSpecPath = path.resolve(specFilePath);

    try {
      await fs.access(resolvedSpecPath);
    } catch {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: Specification file not found at ${resolvedSpecPath}`,
          },
        ],
        isError: true,
      };
    }

    const specFileData = await readYaml(resolvedSpecPath);
    const validation = validateSpecData(specFileData);

    if (!validation.valid || typeof validation.info === 'undefined') {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Error: Invalid specification file format. Missing info section or types/groupedTypes.',
          },
        ],
        isError: true,
      };
    }

    const typesCount =
      typeof validation.types !== 'undefined' ? Object.keys(validation.types).length : 0;
    const groupedTypesCount =
      typeof validation.groupedTypes !== 'undefined'
        ? Object.keys(validation.groupedTypes).length
        : 0;

    let infoText = 'Specification Info:\n\n';
    infoText += `Version: ${validation.info.version}\n`;
    infoText += `Title: ${validation.info.title}\n`;
    infoText += `Types: ${typesCount}\n`;
    infoText += `Grouped Types: ${groupedTypesCount}\n\n`;

    if (typeof validation.types !== 'undefined' && typesCount > 0) {
      infoText += 'Top-level Types:\n';
      Object.keys(validation.types).forEach((typeName) => {
        infoText += `  - ${typeName}\n`;
      });
      infoText += '\n';
    }

    if (typeof validation.groupedTypes !== 'undefined' && groupedTypesCount > 0) {
      infoText += 'Grouped Types:\n';
      Object.keys(validation.groupedTypes).forEach((groupName) => {
        const group = validation.groupedTypes?.[groupName];
        if (isRecord(group) && !('$ref' in group)) {
          const typeNames = Object.keys(group);
          infoText += `  ${groupName} (${typeNames.length} types):\n`;
          typeNames.forEach((typeName) => {
            infoText += `    - ${typeName}\n`;
          });
        } else {
          infoText += `  ${groupName} (reference)\n`;
        }
      });
    }

    return {
      content: [{ type: 'text' as const, text: infoText }],
    };
  }
);

// Tool 5: list-languages
server.registerTool(
  'list-languages',
  {
    description:
      'List all supported target languages for type generation with the type-crafter CLI.',
    inputSchema: listLanguagesSchema,
  },
  async () => {
    return {
      content: [
        {
          type: 'text' as const,
          text:
            'Supported Languages for type-crafter generate:\n\n' +
            '1. typescript\n' +
            '   - Generates TypeScript type definitions (.ts files)\n' +
            '   - Usage: type-crafter generate typescript <spec.yaml> <output-dir>\n\n' +
            '2. typescript-with-decoders\n' +
            '   - Generates TypeScript types WITH runtime decoders\n' +
            '   - Useful for runtime validation of API responses\n' +
            '   - Usage: type-crafter generate typescript-with-decoders <spec.yaml> <output-dir>\n\n' +
            'Writer Modes:\n' +
            '- typesWriterMode: SingleFile | Files\n' +
            '- groupedTypesWriterMode: FolderWithFiles | SingleFile\n\n' +
            'Example:\n' +
            'type-crafter generate typescript ./types.yaml ./src/types SingleFile FolderWithFiles',
        },
      ],
    };
  }
);

// Start the server
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Type Crafter MCP Server v0.2.0 running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
