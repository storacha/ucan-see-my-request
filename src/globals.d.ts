declare const browser: typeof import('webextension-polyfill');

// Define HAR log structure
interface HARLog {
  log: {
    entries: unknown[]; 
    version: string;
    creator: {
      name: string;
      version: string;
    };
    browser?: {
      name: string;
      version: string;
    };
    pages?: unknown[];
    comment?: string;
  };
}

// Define Chrome DevTools Network API
interface ChromeDevToolsNetworkAPI {
  getHAR: (callback: (harLog: HARLog) => void) => void;
  onRequestFinished: {
    addListener: (callback: (request: unknown) => void) => void; 
    removeListener: (callback: (request: unknown) => void) => void;
  };
  getHARAsync?: () => Promise<HARLog>;
}

// Chrome APIs are available in devtools context
declare const chrome: {
  devtools: {
    panels: {
      create: (title: string, iconPath: string, pagePath: string) => void;
    };
    network: ChromeDevToolsNetworkAPI;
  };
};
