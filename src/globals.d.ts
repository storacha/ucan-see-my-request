declare const browser: typeof import('webextension-polyfill');

// Chrome APIs are available in devtools context
declare const chrome: {
  devtools: {
    panels: {
      create: (title: string, iconPath: string, pagePath: string) => void;
    };
    network: {
      getHAR: () => Promise<any>;
      onRequestFinished: {
        addListener: (callback: (request: any) => void) => void;
        removeListener: (callback: (request: any) => void) => void;
      };
    };
  };
};
