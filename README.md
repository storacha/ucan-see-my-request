# ucan-see-my-request

*A simple Chrome extension to view requests for UCanto endpoints*

This is an in development extension for debugging requests to Storacha's endpoints, which are built using Ucanto, which encodes UCAN's into CAR files in the request and response bodies.

# Installation

This repository has the source code for the extension, which is not yet published. Before you can use it, you need to install node modules and then build the project

```
npm install
npm run build
```

This will make a `dist` directory in the repository.

To load the extension, open your chrome extensions (`chrome://extensions`), then enable Developer Mode by clicking the button in the upper right hand corner

You will now see three new buttons -- click the `Load Unpacked` button, and select the `dist` directory in this repository you just created. If it works, you'll see the extension in the extensions table.

Finally, navigate to a UCAN enabled page (i.e. console.web3.storage) and open the developer tools.

Sometimes it doesn't show up immediately -- if this is the case, I recommend closing the developer tools, force full-reloading the page (Command-Shift-R on Mac) and reopening the developer tools.

# What you should see

Once the developer tools are open, any requests that sent that are in UCAN format should show up in the list on the `UCan Requests` tab. Note just like the network tab, requests only show up if they initiate after you open developer tools, so you may have to reload the page.

## UCAN Field Visualization

The extension provides detailed visualization of UCAN fields:

- **Capabilities**: Shows the 'can' and 'with' fields for each capability
- **Fact Field**: If a capability contains a fact field, it will be displayed in a human-readable JSON format using DAG-JSON encoding
- **Proofs**: Displays the full chain of proofs with their capabilities
- **Receipts**: Shows the output and execution details of UCAN operations

# Developing

If you want to work on this, I recommend `npm run dev`. As you make changes, you can control-click/right-click over the UCAN requests app and choose `Reload Frame` -- this seems to capture any changes immediately.