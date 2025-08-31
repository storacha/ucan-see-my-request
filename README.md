# UCAN See My Request

Devtools extension to look at web requests

## Installation

Clone this repository, run `npm install` then `npm run build`.

You can then load the `dist` folder as an unpacked extension. 

## Usage

After installation go to a site that makes requests to web3.storage and open your devtools.  There should be a "UCAN Requests" tab.  Click on it and you'll see a list of requests that were made.  Clicking on a request will show you the details.

## How to test it

Navigate to `https://console.web3.storage` and use the site.  You should see the requests in the devtools.

## Safari Support

A Safari Web Extension version is also available for Safari users.

### Safari Installation

1. Run `npm run safari:convert` to build and convert to Safari format
2. Open `safari/UCAN See My Request.xcodeproj` in Xcode
3. Build and run the project (⌘+R) 
4. Enable the extension in Safari → Settings → Extensions → Web Extensions

### Safari Usage

1. Navigate to a Storacha site (e.g., `https://console.storacha.network`)
2. Click the extension icon in Safari's toolbar
3. The UCAN debug panel will appear
4. Perform actions to see captured requests with UCAN content analysis

For detailed Safari implementation information, see [Safari Implementation Guide](docs/Safari-Implementation.md).