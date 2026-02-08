import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

interface HayakuConfig {
  apiKey?: string;
  baseUrl: string;
  userId?: number;
  email?: string;
}

const CONFIG_DIR = join(homedir(), '.hayaku');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');
const SESSIONS_PATH = join(CONFIG_DIR, 'offline-sessions.json');

export class Config {
  private static ensureConfigDir(): void {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  static load(): HayakuConfig {
    this.ensureConfigDir();

    if (!existsSync(CONFIG_PATH)) {
      return {
        baseUrl: process.env.HAYAKU_BASE_URL || 'http://localhost:3000'
      };
    }

    try {
      const data = readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading config file:', error);
      return {
        baseUrl: process.env.HAYAKU_BASE_URL || 'http://localhost:3000'
      };
    }
  }

  static save(config: HayakuConfig): void {
    this.ensureConfigDir();
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  }

  static clear(): void {
    if (existsSync(CONFIG_PATH)) {
      writeFileSync(CONFIG_PATH, JSON.stringify({
        baseUrl: process.env.HAYAKU_BASE_URL || 'http://localhost:3000'
      }, null, 2));
    }
  }

  static isAuthenticated(): boolean {
    const config = this.load();
    return !!config.apiKey;
  }

  static getOfflineSessions(): any[] {
    this.ensureConfigDir();

    if (!existsSync(SESSIONS_PATH)) {
      return [];
    }

    try {
      const data = readFileSync(SESSIONS_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  static saveOfflineSession(session: any): void {
    this.ensureConfigDir();
    const sessions = this.getOfflineSessions();
    sessions.push(session);
    writeFileSync(SESSIONS_PATH, JSON.stringify(sessions, null, 2));
  }

  static clearOfflineSessions(): void {
    if (existsSync(SESSIONS_PATH)) {
      writeFileSync(SESSIONS_PATH, JSON.stringify([], null, 2));
    }
  }
}
