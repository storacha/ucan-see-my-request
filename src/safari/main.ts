import browser from 'webextension-polyfill';

// Safari DevTools panel entry point - uses webextension-polyfill
// If DevTools panel creation fails, Safari will fall back to content script overlay
try {
  browser.devtools.panels.create('UCAN Requests', '', 'panel.html').then((panel) => {
    console.log('✅ Safari UCAN Requests DevTools panel created successfully');
  }).catch((error) => {
    console.warn('⚠️ Safari DevTools panel creation failed - using overlay approach:', error);
  });
} catch (error) {
  console.warn('⚠️ Safari DevTools API not available - using overlay approach:', error);
}
