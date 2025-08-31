# Safari Web Extension Implementation

## Overview

This document describes the Safari-only Web Extension implementation for UCAN request debugging on Storacha platforms. This extension provides developers with tools to inspect UCAN (User Controlled Authorization Networks) requests and CAR (Content Addressed Archive) file operations.

## Architecture

### Safari Web Extension Structure

The Safari extension is built as an isolated implementation with these core components:

```
src/safari/
├── main.ts                    # Safari DevTools entry point
├── App.tsx                    # Safari-specific App component
├── panel.tsx                  # Safari DevTools panel entry
├── content-script.ts          # Network interception and overlay UI
├── background.ts              # Background service worker
├── browser-service.ts         # Safari network service abstraction
└── storacha-config.ts         # UCAN endpoint configuration
```

### Key Components

- **DevTools Integration**: Limited panel support with fallback overlay UI
- **Content Script Interception**: Page-level `fetch()` and `XMLHttpRequest` monitoring
- **Background Service Worker**: Message passing and persistent storage
- **Icon-Only Interface**: Extension icon click to show/hide debug panel
- **Badge Notifications**: Real-time counter for captured UCAN requests

## Safari-Specific Features

### Content Script Network Interception

The Safari extension injects a page-context script that intercepts:
- `window.fetch()` calls to Storacha endpoints
- `XMLHttpRequest` operations with UCAN content
- Preserves original network behavior while capturing debug data

### UCAN Content Detection

Advanced pattern matching for Storacha/UCAN operations:
- **CAR Content Types**: `application/car`, `application/vnd.ipld.car`
- **Storacha Endpoints**: `console.storacha.network`, `up.storacha.network`, `api.storacha.network`
- **Legacy Endpoints**: `console.web3.storage`, `up.web3.storage`, `api.web3.storage`
- **UCAN Patterns**: Authorization headers, DID identifiers, delegation chains
- **Path Detection**: `/space/`, `/upload/`, `/receipt/`, `/blob/`, `/store/`, `/index/`

### Icon-Controlled Overlay UI

Professional browser integration:
- **Extension Icon Click**: Show/hide UCAN debug panel
- **Badge Counter**: Shows number of captured requests (Storacha orange theme)
- **Native UX**: Follows Safari extension conventions

### Real-Time Request Display

- **📦 CAR File Indicators**: Visual markers for CAR content
- **🔐 UCAN Token Indicators**: Authorization header detection
- **🔗 UCAN Data Indicators**: Request/response body pattern matching
- **Clickable Details**: Modal view with full request/response inspection
- **Timing Information**: Request duration and timestamps

## Build Commands

### Safari Extension
```bash
npm run build:safari   # Production build for Safari
npm run dev:safari     # Development watch mode
npm run safari:convert # Build + convert to Xcode project
npm run safari:clean   # Clean build artifacts
```

## Development Workflow

### Setting Up Safari Extension
1. Run `npm run safari:convert`
2. Open `safari/UCAN See My Request.xcodeproj` in Xcode
3. Build and run the macOS host app (⌘+R)
4. Enable extension in Safari → Settings → Extensions → Web Extensions
5. Test on `https://console.storacha.network`

### Testing the Extension
1. Navigate to a Storacha site
2. **No visual button should appear** (clean site experience)
3. **Click the extension icon** in Safari's toolbar
4. **Panel appears** with Storacha-themed colors
5. **Perform UCAN actions** → See badge counter increment + requests populate
6. **Click × or icon again** → Panel hides

## Technical Implementation

### Message Passing Architecture

1. **Page Context** → **Content Script**: `window.postMessage()`
2. **Content Script** → **Background**: `browser.runtime.sendMessage()`
3. **Background** → **DevTools Panel**: `browser.runtime.Port`
4. **Icon Click** → **Content Script**: `browser.tabs.sendMessage()`

### Storage Strategy

Safari extension persists captured requests in `browser.storage.local`:
- Maximum 100 stored requests (configurable)
- Automatic cleanup of old entries
- Retrieval on DevTools panel connection
- Badge counter persistence across sessions

### Performance Considerations

- Content script overhead: ~23KB (minimized)
- Background service worker: ~14KB (minimized)
- In-memory request storage with cleanup
- Page-context script injection on Storacha sites only

## Security Model

Safari Web Extension security features:
- Content script with limited page access
- Background service worker with message passing
- `<all_urls>` host permissions for network interception
- Storage permission for request persistence
- Action permission for icon click handling

## Supported Endpoints

### Current Storacha Platform (Priority)
- `console.storacha.network` - Main developer console
- `up.storacha.network` - Upload service endpoints
- `api.storacha.network` - API service endpoints
- `w3s.link` - Gateway and retrieval service
- `referrals.storacha.network` - Referral system

### Legacy web3.storage (Backward Compatibility)
- `console.web3.storage` - Legacy console
- `up.web3.storage` - Legacy upload service
- `api.web3.storage` - Legacy API endpoints

## User Experience

### On Storacha Sites
```
Extension Icon (with badge: "3") → Click → Panel appears
🔍 UCAN Requests (Safari)                                    ×
---------------------------------------------------
📦 CAR requests and 🔗 UCAN data appear here...
```

### On Other Sites
```
Extension Icon → Click → Notification: "UCAN debugging only available on Storacha sites"
```

## Troubleshooting

### Extension Icon Not Appearing
- Check Safari extension is enabled in Safari → Settings → Extensions
- Verify extension is allowed to run on the current website
- Look for extension in Safari's toolbar (may need to be manually added)

### Panel Not Showing on Icon Click
- Ensure you're on a Storacha site (`*.storacha.network`, `*.web3.storage`)
- Check Web Inspector console for error messages
- Verify extension permissions for the current site

### UCAN Requests Not Detected
- Verify endpoint patterns in `storacha-config.ts`
- Check network requests are reaching Storacha domains
- Confirm content-type headers for CAR files
- Look for UCAN authorization headers in requests

### Content Script Not Injecting
- Check Safari extension permissions are granted
- Verify extension is enabled for the website in Safari settings
- Look for console errors in Safari's Web Inspector
- Confirm manifest permissions include `<all_urls>`

### Build Errors
- Ensure `webextension-polyfill` is installed: `npm install`
- Check TypeScript compilation: `npx tsc --noEmit`
- Verify all Safari-specific files are present in `src/safari/`
- Clean and rebuild: `npm run safari:clean && npm run safari:convert`

## Xcode Project Structure

After running `npm run safari:convert`, you'll get:
```
safari/
└── UCAN See My Request/
    ├── UCAN See My Request.xcodeproj         # Main Xcode project
    ├── Shared (App)/                         # macOS host app
    └── Shared (Extension)/
        └── Resources/                        # Extension files (auto-generated)
            ├── manifest.json
            ├── safari-*.js                   # Built JavaScript
            ├── devtools.html
            └── panel.html
```

## Future Enhancements

Potential improvements for Safari implementation:
- Custom extension icons in manifest
- Enhanced error reporting and analytics
- Performance optimizations for large request volumes
- Additional UCAN pattern detection
- Improved DevTools integration (when Safari APIs improve)
- Export/import functionality for captured requests
- Request filtering and search capabilities

## Support

For Safari-specific issues:
1. Check this documentation first
2. Test with minimal reproduction case
3. Include Safari version and macOS version in bug reports
4. Provide Web Inspector console logs when reporting issues
5. Test on both `console.storacha.network` and `console.web3.storage`