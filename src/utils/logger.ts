function hasColorSupport(): boolean {
  if (typeof process.env.NO_COLOR !== 'undefined') {
    return false;
  }
  if (typeof process.env.FORCE_COLOR !== 'undefined') {
    return true;
  }
  if (process.env.COLORTERM === 'truecolor' || process.env.COLORTERM === '24bit') {
    return true;
  }
  if (typeof process.env.CI !== 'undefined') {
    return true;
  }

  const term = process.env.TERM ?? '';
  if (term === 'dumb') {
    return false;
  }
  if (
    term.includes('256color') ||
    term.includes('color') ||
    term.includes('xterm') ||
    term.includes('screen') ||
    term.includes('vt100')
  ) {
    return true;
  }

  return process.stdout.isTTY ?? false;
}

const isColorSupported = hasColorSupport();

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const ITALIC = '\x1b[3m';
const UNDERLINE = '\x1b[4m';

const FG = {
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m'
};

const BG = {
  black: '\x1b[40m',
  red: '\x1b[41m',
  green: '\x1b[42m',
  yellow: '\x1b[43m',
  blue: '\x1b[44m',
  magenta: '\x1b[45m',
  cyan: '\x1b[46m',
  white: '\x1b[47m',
  brightBlack: '\x1b[100m',
  brightRed: '\x1b[101m',
  brightGreen: '\x1b[102m',
  brightYellow: '\x1b[103m',
  brightBlue: '\x1b[104m',
  brightMagenta: '\x1b[105m',
  brightCyan: '\x1b[106m',
  brightWhite: '\x1b[107m'
};

function rgb(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

function bgRgb(r: number, g: number, b: number): string {
  return `\x1b[48;2;${r};${g};${b}m`;
}

function colorize(text: string, ...codes: string[]): string {
  if (!isColorSupported) {
    return text;
  }
  return codes.join('') + text + RESET;
}

const BRAND = {
  primary: rgb(99, 102, 241),
  secondary: rgb(139, 92, 246),
  accent: rgb(236, 72, 153),
  success: rgb(34, 197, 94),
  warning: rgb(234, 179, 8),
  error: rgb(239, 68, 68),
  info: rgb(59, 130, 246),
  muted: rgb(107, 114, 128)
};

const BRAND_BG = {
  primary: bgRgb(99, 102, 241),
  secondary: bgRgb(139, 92, 246),
  accent: bgRgb(236, 72, 153),
  success: bgRgb(34, 197, 94),
  warning: bgRgb(234, 179, 8),
  error: bgRgb(239, 68, 68),
  info: bgRgb(59, 130, 246),
  muted: bgRgb(55, 65, 81)
};

const SYMBOLS = {
  success: '✔',
  error: '✖',
  warning: '⚠',
  info: '◆',
  debug: '◇',
  pointer: '❯',
  arrowRight: '→',
  arrowDown: '↓',
  bullet: '●',
  ellipsis: '…',
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
  cross: '┼',
  star: '★',
  sparkles: '✨',
  rocket: '🚀',
  hammer: '🔨',
  package: '📦',
  check: '✓',
  lightning: '⚡'
};

type GradientStop = {
  r: number;
  g: number;
  b: number;
};

function interpolateColor(start: GradientStop, end: GradientStop, t: number): GradientStop {
  return {
    r: Math.round(start.r + (end.r - start.r) * t),
    g: Math.round(start.g + (end.g - start.g) * t),
    b: Math.round(start.b + (end.b - start.b) * t)
  };
}

function gradientText(text: string, startColor: GradientStop, endColor: GradientStop): string {
  if (!isColorSupported) {
    return text;
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-spread -- character-by-character gradient
  const chars = [...text];
  return chars
    .map((char, i) => {
      if (char === ' ' || char === '\n') {
        return char;
      }
      const t = chars.length > 1 ? i / (chars.length - 1) : 0;
      const color = interpolateColor(startColor, endColor, t);
      return rgb(color.r, color.g, color.b) + char;
    })
    .join('');
}

const gradients = {
  brand: (text: string) => gradientText(text, { r: 99, g: 102, b: 241 }, { r: 236, g: 72, b: 153 }),
  sunset: (text: string) =>
    gradientText(text, { r: 251, g: 146, b: 60 }, { r: 236, g: 72, b: 153 }),
  ocean: (text: string) => gradientText(text, { r: 34, g: 211, b: 238 }, { r: 99, g: 102, b: 241 }),
  forest: (text: string) => gradientText(text, { r: 34, g: 197, b: 94 }, { r: 16, g: 185, b: 129 }),
  fire: (text: string) => gradientText(text, { r: 239, g: 68, b: 68 }, { r: 234, g: 179, b: 8 })
};

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex -- stripping ANSI escape codes
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function createBox(
  content: string[],
  options: {
    title?: string;
    padding?: number;
    borderColor?: string;
    titleColor?: string;
  } = {}
): string {
  const { title, padding = 1, borderColor = BRAND.primary, titleColor = BRAND.accent } = options;

  const paddingStr = ' '.repeat(padding);
  const maxContentWidth = Math.max(...content.map((line) => stripAnsi(line).length));
  const boxWidth = maxContentWidth + padding * 2;

  const lines: string[] = [];

  if (title) {
    const titleText = ` ${title} `;
    const remainingWidth = boxWidth - stripAnsi(titleText).length;
    const leftPadding = Math.floor(remainingWidth / 2);
    const rightPadding = remainingWidth - leftPadding;
    lines.push(
      colorize(SYMBOLS.topLeft + SYMBOLS.horizontal.repeat(leftPadding), borderColor) +
        colorize(titleText, titleColor, BOLD) +
        colorize(SYMBOLS.horizontal.repeat(rightPadding) + SYMBOLS.topRight, borderColor)
    );
  } else {
    lines.push(
      colorize(
        SYMBOLS.topLeft + SYMBOLS.horizontal.repeat(boxWidth) + SYMBOLS.topRight,
        borderColor
      )
    );
  }

  for (const line of content) {
    const lineLength = stripAnsi(line).length;
    const rightPad = ' '.repeat(maxContentWidth - lineLength);
    lines.push(
      colorize(SYMBOLS.vertical, borderColor) +
        paddingStr +
        line +
        rightPad +
        paddingStr +
        colorize(SYMBOLS.vertical, borderColor)
    );
  }

  lines.push(
    colorize(
      SYMBOLS.bottomLeft + SYMBOLS.horizontal.repeat(boxWidth) + SYMBOLS.bottomRight,
      borderColor
    )
  );

  return lines.join('\n');
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

type Spinner = {
  start: () => void;
  stop: () => void;
  update: (message: string) => void;
  success: (message?: string) => void;
  fail: (message?: string) => void;
  warn: (message?: string) => void;
};

let activeSpinner: NodeJS.Timeout | null = null;
let spinnerMessage = '';
let spinnerFrame = 0;

function clearSpinnerLine(): void {
  if (process.stdout.isTTY) {
    process.stdout.write('\r\x1b[K');
  }
}

export function createSpinner(message: string): Spinner {
  spinnerMessage = message;
  spinnerFrame = 0;

  return {
    start: () => {
      if (activeSpinner) {
        clearInterval(activeSpinner);
      }

      const render = (): void => {
        clearSpinnerLine();
        const frame = isColorSupported
          ? colorize(SPINNER_FRAMES[spinnerFrame], BRAND.primary, BOLD)
          : SPINNER_FRAMES[spinnerFrame];
        process.stdout.write(`${frame} ${spinnerMessage}`);
        spinnerFrame = (spinnerFrame + 1) % SPINNER_FRAMES.length;
      };

      render();
      activeSpinner = setInterval(render, 80);
    },

    stop: () => {
      if (activeSpinner) {
        clearInterval(activeSpinner);
        activeSpinner = null;
      }
      clearSpinnerLine();
    },

    update: (msg: string) => {
      spinnerMessage = msg;
    },

    success: (msg?: string) => {
      if (activeSpinner) {
        clearInterval(activeSpinner);
        activeSpinner = null;
      }
      clearSpinnerLine();
      console.log(colorize(SYMBOLS.success, BRAND.success, BOLD) + ' ' + (msg ?? spinnerMessage));
    },

    fail: (msg?: string) => {
      if (activeSpinner) {
        clearInterval(activeSpinner);
        activeSpinner = null;
      }
      clearSpinnerLine();
      console.log(colorize(SYMBOLS.error, BRAND.error, BOLD) + ' ' + (msg ?? spinnerMessage));
    },

    warn: (msg?: string) => {
      if (activeSpinner) {
        clearInterval(activeSpinner);
        activeSpinner = null;
      }
      clearSpinnerLine();
      console.log(colorize(SYMBOLS.warning, BRAND.warning, BOLD) + ' ' + (msg ?? spinnerMessage));
    }
  };
}

export function progressBar(current: number, total: number, width = 30): string {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  const filled = Math.round((current / total) * width);
  const empty = width - filled;

  const filledBar = isColorSupported
    ? colorize('█'.repeat(filled), BRAND.success)
    : '█'.repeat(filled);
  const emptyBar = isColorSupported ? colorize('░'.repeat(empty), BRAND.muted) : '░'.repeat(empty);

  const percentText = isColorSupported
    ? colorize(`${percentage.toString().padStart(3)}%`, BRAND.primary, BOLD)
    : `${percentage.toString().padStart(3)}%`;

  return `${filledBar}${emptyBar} ${percentText}`;
}

function badge(text: string, bgColor: string, fgColor = FG.white): string {
  if (!isColorSupported) {
    return `[${text}]`;
  }
  return `${bgColor}${fgColor}${BOLD} ${text} ${RESET}`;
}

export function logError(header: string, message: string | null = null): void {
  console.log();
  console.log(badge('ERROR', BRAND_BG.error) + ' ' + colorize(header, BRAND.error, BOLD));
  if (message !== null) {
    const lines = message.split('\n');
    for (const line of lines) {
      console.log(colorize(`  ${SYMBOLS.vertical} `, BRAND.muted) + colorize(line, BRAND.muted));
    }
  }
  console.log();
}

export function logWarning(header: string, message: string): void {
  console.log();
  console.log(
    badge('WARN', BRAND_BG.warning, FG.black) + ' ' + colorize(header, BRAND.warning, BOLD)
  );
  const lines = message.split('\n');
  for (const line of lines) {
    console.log(colorize(`  ${SYMBOLS.vertical} `, BRAND.muted) + line);
  }
  console.log();
}

export function logSuccess(header: string, message: string): void {
  console.log();
  console.log(
    colorize(SYMBOLS.success, BRAND.success, BOLD) + ' ' + colorize(header, BRAND.success, BOLD)
  );
  const lines = message.split('\n');
  for (const line of lines) {
    console.log(colorize(`  ${SYMBOLS.vertical} `, BRAND.muted) + line);
  }
  console.log();
}

export function logInfo(message: string): void {
  console.log(colorize(SYMBOLS.info, BRAND.info, BOLD) + ' ' + message);
}

export function logDebug(message: string): void {
  if (process.env.DEBUG) {
    console.log(colorize(SYMBOLS.debug, BRAND.muted) + ' ' + colorize(message, BRAND.muted));
  }
}

export function logStep(step: number, total: number, message: string): void {
  const stepIndicator = isColorSupported
    ? colorize(`[${step}/${total}]`, BRAND.primary, BOLD)
    : `[${step}/${total}]`;
  console.log(`${stepIndicator} ${message}`);
}

export function logSection(title: string): void {
  console.log();
  console.log(
    colorize(SYMBOLS.pointer, BRAND.accent, BOLD) +
      ' ' +
      colorize(title, BRAND.primary, BOLD, UNDERLINE)
  );
}

export function logSectionEnd(): void {
  console.log();
}

export function logDivider(char = SYMBOLS.horizontal, width = 50): void {
  console.log(colorize(char.repeat(width), BRAND.muted));
}

export function logKeyValue(key: string, value: string): void {
  console.log(colorize(`  ${key}:`, BRAND.muted) + ' ' + colorize(value, BRAND.primary));
}

export function logList(items: string[], bullet = SYMBOLS.bullet): void {
  for (const item of items) {
    console.log(colorize(`  ${bullet}`, BRAND.accent) + ' ' + item);
  }
}

const ASCII_BANNER = `
  ████████╗██╗   ██╗██████╗ ███████╗
  ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝
     ██║    ╚████╔╝ ██████╔╝█████╗
     ██║     ╚██╔╝  ██╔═══╝ ██╔══╝
     ██║      ██║   ██║     ███████╗
     ╚═╝      ╚═╝   ╚═╝     ╚══════╝
   ██████╗██████╗  █████╗ ███████╗████████╗███████╗██████╗
  ██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
  ██║     ██████╔╝███████║█████╗     ██║   █████╗  ██████╔╝
  ██║     ██╔══██╗██╔══██║██╔══╝     ██║   ██╔══╝  ██╔══██╗
  ╚██████╗██║  ██║██║  ██║██║        ██║   ███████╗██║  ██║
   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝   ╚══════╝╚═╝  ╚═╝`;

export function greeting(): void {
  console.log();

  if (isColorSupported) {
    const lines = ASCII_BANNER.split('\n');
    for (const line of lines) {
      console.log(gradients.brand(line) + RESET);
    }
  } else {
    console.log(ASCII_BANNER);
  }

  console.log();
  console.log(
    colorize('  ' + SYMBOLS.sparkles, BRAND.accent) +
      ' ' +
      colorize('Type Crafter', BRAND.primary, BOLD) +
      colorize(' — Generate types from YAML specs', BRAND.muted)
  );
  console.log(
    colorize(`  ${SYMBOLS.lightning} `, BRAND.warning) +
      colorize('Fast, reliable, multi-language type generation', BRAND.muted)
  );
  console.log();
  logDivider();
  console.log();
}

export function greetingCompact(): void {
  console.log();
  console.log(
    colorize(SYMBOLS.package, BRAND.accent) +
      ' ' +
      gradients.brand('Type Crafter') +
      RESET +
      colorize(' — Generate types from YAML specs', BRAND.muted)
  );
  console.log();
}

export function logFileGenerated(filePath: string): void {
  console.log(
    colorize(`  ${SYMBOLS.check}`, BRAND.success) +
      ' ' +
      colorize('Generated:', BRAND.muted) +
      ' ' +
      colorize(filePath, BRAND.primary)
  );
}

export function logCommand(command: string): void {
  console.log(
    colorize(`  ${SYMBOLS.pointer}`, BRAND.accent) +
      ' ' +
      colorize('$', BRAND.muted) +
      ' ' +
      colorize(command, FG.white, BOLD)
  );
}

export function logTip(message: string): void {
  console.log(
    colorize(`  ${SYMBOLS.info}`, BRAND.info) +
      ' ' +
      colorize('Tip:', BRAND.info, BOLD) +
      ' ' +
      message
  );
}

export function logBox(content: string[], title?: string): void {
  console.log(createBox(content, { title }));
}

export function logSuccessBox(content: string[], title = 'Success'): void {
  console.log(
    createBox(content, {
      title: `${SYMBOLS.success} ${title}`,
      borderColor: BRAND.success,
      titleColor: BRAND.success
    })
  );
}

export function logErrorBox(content: string[], title = 'Error'): void {
  console.log(
    createBox(content, {
      title: `${SYMBOLS.error} ${title}`,
      borderColor: BRAND.error,
      titleColor: BRAND.error
    })
  );
}

export const colors = {
  colorize,
  gradients,
  BRAND,
  BRAND_BG,
  FG,
  BG,
  BOLD,
  DIM,
  ITALIC,
  UNDERLINE,
  RESET
};

export const symbols = SYMBOLS;
