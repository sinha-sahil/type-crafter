import { Configuration } from '$types';

export class Runtime {
  static config: Configuration | null = null;

  static setConfiguration(config: Configuration) {
    this.config = config;
  }
}
