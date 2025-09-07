import React from 'react';
import ReactDOM from 'react-dom/client';
import SafariApp from './App';

// Safari panel entry point - renders the Safari-specific App
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <SafariApp />
  </React.StrictMode>
);
