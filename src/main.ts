import "webextension-polyfill";

const createDevtoolsPanel = () => {
  try {
    // Try Chrome API first 
    if (typeof chrome !== 'undefined' && chrome.devtools && chrome.devtools.panels) {
      chrome.devtools.panels.create('UCAN Requests', '', 'panel.html');
      return;
    }
    
    // Fallback to browser API 
    if (typeof browser !== 'undefined' && browser.devtools && browser.devtools.panels) {
      browser.devtools.panels.create('UCAN Requests', '', 'panel.html');
      return;
    }
    
    throw new Error('Neither Chrome nor Firefox devtools APIs available');
  } catch (error) {
    console.error('Failed to create devtools panel:', error);
  }
};

createDevtoolsPanel();