import type { Configuration } from '$types';

let config: Configuration | null = null;

function setConfig(newConfig: Configuration): void {
  config = newConfig;
}

function getConfig(): Configuration {
  if (config === null) {
    throw new Error('Configuration not set!');
  }
  return config;
}

export default {
  getConfig,
  setConfig
};
