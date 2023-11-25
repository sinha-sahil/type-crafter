import { exec } from 'child_process';
import { promisify } from 'util';
import packageJson from '../package.json' assert { type: 'json' };

const _exec = promisify(exec);
console.log(`Building with version ${packageJson.version}`);
await _exec(`pnpm run build --environment version=${packageJson.version}`);
await _exec('changeset publish');
