// Test setup file for Jest

// Mock Chrome extension APIs
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  },
  storage: {
    sync: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue()
    },
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue()
    }
  },
  tabs: {
    query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://www.youtube.com/watch?v=test' }]),
    sendMessage: jest.fn()
  }
};

// Mock fetch API
global.fetch = jest.fn();

// Mock crypto.subtle for SHA-256 hashing
global.crypto = {
  subtle: {
    digest: jest.fn().mockImplementation(async (algorithm, data) => {
      // Return a mock hash buffer
      return new ArrayBuffer(32);
    })
  }
};

// Mock TextEncoder
global.TextEncoder = class {
  encode(str) {
    return new Uint8Array([...str].map(c => c.charCodeAt(0)));
  }
};

// Mock atob/btoa for base64
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');

// Mock FormData
global.FormData = class {
  constructor() {
    this.data = {};
  }
  append(key, value, filename) {
    this.data[key] = { value, filename };
  }
};

// Mock Blob
global.Blob = class {
  constructor(parts, options = {}) {
    this.parts = parts;
    this.type = options.type || '';
  }
};

// Console error spy for catching errors in tests
beforeEach(() => {
  jest.clearAllMocks();
});
