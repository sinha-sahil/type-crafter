import chalk from 'chalk';

const redLog = chalk.bgHex('#D2001A').hex('#EFEFEF').bold.overline;
const greenLog = chalk.bgHex('#4f9907').hex('#000000').bold;
const yellowLog = chalk.bgHex('#c49f02').hex('#000000').bold;
const darkBlue = chalk.bgHex('#06283D').hex('#ffffff');

export function logError(header: string, message: string): void {
  console.log(redLog(`${header}`));
  console.log(`${message}`);
}

export function logWarning(header: string, message: string): void {
  console.log(yellowLog(`${header}`));
  console.log(`${message}`);
}

export function logSuccess(header: string, message: string): void {
  console.log(greenLog(`${header}`));
  console.log(`${message}`);
}

export function greeting(): void {
  console.log('\n' + darkBlue('|' + Array(50).join('‾') + '|'));
  console.log(darkBlue('|' + Array(20).join(' ') + 'Type Crafter' + Array(19).join(' ') + '|'));
  console.log(darkBlue('|' + Array(50).join('_') + '|') + '\n');
}
