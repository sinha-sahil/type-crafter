const isColorSupported = process.env.COLORTERM === 'truecolor';

function redLog(r: string): string {
  if (!isColorSupported) {
    return r;
  }
  return `\x1b[41m\x1b[37m${r}\x1b[0m`;
}

function yellowLog(r: string): string {
  if (!isColorSupported) {
    return r;
  }
  return `\x1b[43m\x1b[37m${r}\x1b[0m`;
}

function greenLog(r: string): string {
  if (!isColorSupported) {
    return r;
  }
  return `\x1b[48;2;79;153;7m\x1b[30m${r}\x1b[0m`;
}

function darkBlue(r: string): string {
  if (!isColorSupported) {
    return r;
  }
  return `\x1b[48;2;6;40;61m\x1b[37m${r}\x1b[0m`;
}

export function logError(header: string, message: string | null = null): void {
  console.log(redLog(` Crafting failed: ${header}`));
  if (message !== null) {
    console.log(`${message}`);
  }
}

export function logWarning(header: string, message: string): void {
  console.log(yellowLog(`${header}`));
  console.log(`${message}`);
}

export function logSuccess(header: string, message: string): void {
  console.log(greenLog(` ${header} `));
  console.log(`${message}`);
}

export function greeting(): void {
  console.log('\n' + darkBlue('|' + Array(50).join('‾') + '|'));
  console.log(darkBlue('|' + Array(20).join(' ') + 'Type Crafter' + Array(19).join(' ') + '|'));
  console.log(darkBlue('|' + Array(50).join('_') + '|') + '\n');
}
