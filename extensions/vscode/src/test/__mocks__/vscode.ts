import { vi } from "vitest";

export const StatusBarAlignment = {
  Left: 1,
  Right: 2,
};

export class ThemeColor {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

const createMockStatusBarItem = () => ({
  text: "",
  tooltip: "",
  command: "",
  backgroundColor: undefined as ThemeColor | undefined,
  show: vi.fn(),
  hide: vi.fn(),
  dispose: vi.fn(),
});

export const window = {
  createStatusBarItem: vi.fn(() => createMockStatusBarItem()),
  showInformationMessage: vi.fn(),
  createWebviewPanel: vi.fn(),
};

export const commands = {
  registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
};

export const workspace = {
  getConfiguration: vi.fn(() => ({
    get: vi.fn((_key: string, defaultValue: unknown) => defaultValue),
  })),
  onDidChangeTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
};

export const Uri = {
  joinPath: vi.fn(),
};

export const ViewColumn = {
  One: 1,
  Two: 2,
  Three: 3,
};
