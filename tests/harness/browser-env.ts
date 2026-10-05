/**
 * Headless Browser Environment Setup for Vitest / Node
 * Sets up in-memory localStorage, window, document, and URL objects.
 */

export class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  // Debug helper
  dump(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of this.store.entries()) {
      out[k] = v;
    }
    return out;
  }
}

export function setupBrowserEnv(): { storage: MockStorage; downloads: Array<{ filename: string; content: string }> } {
  const storage = new MockStorage();
  const downloads: Array<{ filename: string; content: string }> = [];

  // Setup localStorage
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    writable: true,
    configurable: true,
  });

  // Setup mock document & window
  const mockDocument = {
    createElement: (tag: string) => {
      const element: any = {
        tagName: tag.toUpperCase(),
        attributes: {} as Record<string, string>,
        setAttribute: (name: string, value: string) => {
          element.attributes[name] = value;
        },
        getAttribute: (name: string) => element.attributes[name],
        click: () => {
          if (tag.toLowerCase() === 'a' && element.attributes.download) {
            downloads.push({
              filename: element.attributes.download,
              content: element._blobContent || '',
            });
          }
        },
      };
      return element;
    },
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  const mockWindow: any = {
    localStorage: storage,
    document: mockDocument,
    open: () => ({
      document: {
        write: () => {},
        close: () => {},
      },
      focus: () => {},
      print: () => {},
      close: () => {},
    }),
    alert: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  Object.defineProperty(globalThis, 'window', {
    value: mockWindow,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'document', {
    value: mockDocument,
    writable: true,
    configurable: true,
  });

  // Setup URL.createObjectURL and revokeObjectURL
  if (!URL.createObjectURL) {
    (URL as any).createObjectURL = (blob: any) => {
      return `blob:mock-url-${Math.random().toString(36).slice(2)}`;
    };
  }
  if (!URL.revokeObjectURL) {
    (URL as any).revokeObjectURL = () => {};
  }

  return { storage, downloads };
}

export function resetBrowserEnv(storage: MockStorage) {
  storage.clear();
}
