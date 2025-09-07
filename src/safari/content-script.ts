import browser from 'webextension-polyfill';
import { isStorachaEndpoint, hasUCANPaths, hasCarContentType, hasUCANHeaders, UCAN_PATTERNS } from './storacha-config';

interface CapturedRequest {
  url: string;
  method: string;
  headers: { name: string; value: string }[];
  postData?: { text: string };
  timestamp: number;
}

interface CapturedResponse {
  status: number;
  headers: { name: string; value: string }[];
  content: { text?: string; encoding?: string };
}

interface NetworkCapture {
  request: CapturedRequest;
  response: CapturedResponse;
  time?: number;
}

/**
 * Safari Content Script for UCAN network interception
 */
class SafariNetworkInterceptor {
  private panelVisible = false;

  constructor() {
    this.setupPageHookInjection();
    this.setupMessageBridge();
    this.setupIconToggleListener();
  }

  private setupMessageBridge(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      try {
        if (event.source !== window) return;
        const data = (event as any).data;
        if (!data || typeof data !== 'object') return;
        if (data.type !== 'UCAN_CAPTURED') return;

        const capture: NetworkCapture = data.payload;
        this.sendToDevTools(capture);
      } catch (e) {
        console.warn('Safari UCAN bridge error:', e);
      }
    }, false);
  }

  /**
   * Setup listener for extension icon clicks
   */
  private setupIconToggleListener(): void {
    browser.runtime.onMessage.addListener((message: any) => {
      if (message.type === 'TOGGLE_UCAN_PANEL') {
        this.toggleUCANPanel();
        return true;
      }
      return false;
    });
  }

  /**
   * Toggle the UCAN debug panel visibility
   */
  private toggleUCANPanel(): void {
    let panel = document.getElementById('ucan-safari-panel');
    
    if (!panel) {
      this.createUCANPanel();
      panel = document.getElementById('ucan-safari-panel');
    }
    
    if (panel) {
      this.panelVisible = !this.panelVisible;
      panel.style.display = this.panelVisible ? 'block' : 'none';
      console.log(`🔄 UCAN panel ${this.panelVisible ? 'shown' : 'hidden'}`);
    }
  }

  /**
   * Create the UCAN debug panel (without toggle button)
   */
  private createUCANPanel(): void {
    if (document.getElementById('ucan-safari-panel')) {
      return; // Panel already exists
    }

    console.log('🍎 Creating Safari UCAN panel for:', window.location.hostname);
    
    const panelContainer = document.createElement('div');
    panelContainer.id = 'ucan-safari-panel';
    panelContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; width: 400px; height: 600px; background: #1a1a1a; border: 2px solid #ff6b35; border-radius: 8px; box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3); z-index: 999998; display: none; overflow: hidden; font-family: system-ui, -apple-system, sans-serif;';
    
    const header = document.createElement('div');
    header.innerHTML = '🔍 UCAN Requests (Safari)';
    header.style.cssText = 'background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 10px; font-weight: bold; font-size: 14px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;';
    
    // Add close button to header
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = 'background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;';
    closeBtn.onclick = () => this.toggleUCANPanel();
    header.appendChild(closeBtn);
    
    const content = document.createElement('div');
    content.id = 'ucan-content';
    content.style.cssText = 'padding: 10px; height: calc(100% - 50px); overflow-y: auto; color: #fff; font-size: 12px; background: #1a1a1a;';
    content.innerHTML = '<div class="waiting-message" style="margin-bottom: 10px; color: #666; text-align: center; padding: 20px;">🔍 Monitoring UCAN requests...<br><small style="color: #888;">Click the extension icon to show/hide this panel</small></div><div id="ucan-requests-list" style="font-family: monospace;"></div>';
    
    panelContainer.appendChild(header);
    panelContainer.appendChild(content);
    
    // Inject panel when DOM is ready
    if (document.body) {
      document.body.appendChild(panelContainer);
      console.log('✅ Safari UCAN panel created (icon-controlled)');
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(panelContainer);
        console.log('✅ Safari UCAN panel created (icon-controlled)');
      });
    }
  }

  private setupPageHookInjection(): void {
    try {
      const script = document.createElement('script');
      script.textContent = `
(function() {
  console.log('🔧 Safari UCAN page hook starting...');
  
  const CAR_TYPES = ['application/car', 'application/vnd.ipld.car'];
  const STORACHA_PATTERNS = ['storacha.network', 'console.storacha', 'up.storacha', 'api.storacha', 'w3s.link', 'referrals.storacha', 'web3.storage', 'up.web3.storage', 'api.web3.storage'];
  const UCAN_PATHS = ['/space/', '/upload/', '/receipt/', '/blob/', '/store/', '/index/', '/root/', '/shard/'];
  const BODY_PATTERNS = ['ucan', 'delegation', 'capability', 'space', 'did:key:', 'mailto:', 'cid', 'bagbaiera'];
  
  function headersToArray(h) { 
    const arr = []; 
    try { 
      if (h && h.forEach) {
        h.forEach((v,n) => arr.push({name:n, value:v})); 
      }
    } catch(e) {} 
    return arr;
  }
  
  function isStoracha(url, headers, init) {
    const u = String(url || '');
    const isStorachaEndpoint = STORACHA_PATTERNS.some(pattern => u.includes(pattern));
    const hasUcanPaths = UCAN_PATHS.some(path => u.includes(path));
    
    const headersCT = (headers || []).some(h => 
      h.name && h.name.toLowerCase() === 'content-type' && 
      CAR_TYPES.some(ct => h.value.includes(ct))
    );
    const initCT = init && init.headers && CAR_TYPES.some(ct => (init.headers['content-type'] || '').includes(ct));
    const hasCar = headersCT || initCT;
    
    const auth = (headers || []).some(h => {
      const n = (h.name || '').toLowerCase(); 
      const v = (h.value || '').toLowerCase(); 
      return n.includes('authorization') || n.includes('ucan') || v.includes('ucan') || v.startsWith('bearer ey');
    });
    
    return isStorachaEndpoint || hasUcanPaths || hasCar || auth;
  }
  
  async function readBody(resp) { 
    try { 
      const ct = resp.headers.get('content-type') || ''; 
      if (CAR_TYPES.some(carType => ct.includes(carType))) { 
        const ab = await resp.arrayBuffer(); 
        const u8 = new Uint8Array(ab); 
        let s = ''; 
        for(let i = 0; i < u8.length; i++) { 
          s += String.fromCharCode(u8[i]); 
        } 
        return {text: s, encoding: 'binary'};
      } 
      if (ct.includes('text') || ct.includes('json')) { 
        return {text: await resp.text()};
      } 
      const ab = await resp.arrayBuffer(); 
      const u8 = new Uint8Array(ab); 
      const bin = String.fromCharCode.apply(null, Array.from(u8)); 
      return {text: btoa(bin), encoding: 'base64'};
    } catch(e) { 
      return {text: ''};
    } 
  }

  const origFetch = window.fetch;
  window.fetch = async function(input, init) {
    const start = performance.now();
    const url = typeof input === 'string' ? input : (input && input.url) ? input.url : String(input);
    const method = (init && init.method) || 'GET';
    
    const reqHeaders = [];
    if (init && init.headers) {
      try {
        if (init.headers instanceof Headers) { 
          init.headers.forEach((v, n) => reqHeaders.push({name: n, value: v}));
        } else if (Array.isArray(init.headers)) { 
          init.headers.forEach(([n, v]) => reqHeaders.push({name: n, value: String(v)}));
        } else { 
          Object.entries(init.headers).forEach(([n, v]) => reqHeaders.push({name: String(n), value: String(v)}));
        }
      } catch(e) {}
    }
    
    const should = isStoracha(url, reqHeaders, init);
    
    try {
      const resp = await origFetch.apply(this, arguments);
      
      if (should) {
        console.log('🎯 Safari UCAN request captured:', url);
        const end = performance.now();
        const respHeaders = headersToArray(resp.headers);
        const body = await readBody(resp.clone());
        
        let postData = undefined;
        if (init && init.body) {
          if (typeof init.body === 'string') {
            postData = { text: init.body };
          } else if (init.body instanceof ArrayBuffer) {
            const u8 = new Uint8Array(init.body);
            let s = '';
            for(let i = 0; i < u8.length; i++) {
              s += String.fromCharCode(u8[i]);
            }
            postData = { text: s };
          }
        }
        
        const payload = {
          request: { 
            url: url, 
            method: method, 
            headers: reqHeaders, 
            postData: postData, 
            timestamp: Date.now() 
          },
          response: { 
            status: resp.status, 
            headers: respHeaders, 
            content: body 
          },
          time: end - start
        };
        
        window.postMessage({ type: 'UCAN_CAPTURED', payload: payload }, '*');
      }
      
      return resp;
    } catch(error) {
      throw error;
    }
  };
  
  console.log('✅ Safari UCAN page hook installed');
})();
      `;
      (document.head || document.documentElement).appendChild(script);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      console.log('📋 Safari page hook script injected');
    } catch (e) {
      console.warn('Failed to inject Safari page hook:', e);
    }
  }

  private async sendToDevTools(capture: NetworkCapture): Promise<void> {
    try {
      await browser.runtime.sendMessage({
        type: 'NETWORK_REQUEST_CAPTURED',
        data: capture
      });
      
      this.displayInSafariOverlay(capture);
    } catch (error) {
      console.warn('Failed to send network capture to Safari DevTools:', error);
    }
  }
  
  private displayInSafariOverlay(capture: NetworkCapture): void {
    const requestsList = document.getElementById('ucan-requests-list');
    if (requestsList) {
      const waitingMsg = requestsList.querySelector('.waiting-message');
      if (waitingMsg) {
        waitingMsg.remove();
      }
      
      const requestDiv = document.createElement('div');
      requestDiv.style.cssText = 'border: 1px solid #333; margin: 5px 0; padding: 8px; border-radius: 4px; background: #2a2a2a; cursor: pointer;';
      
      const timestamp = new Date().toLocaleTimeString();
      const url = new URL(capture.request.url);
      
      let ucanInfo = '';
      const hasCarContent = capture.response.headers.some(h => 
        h.name.toLowerCase() === 'content-type' && 
        UCAN_PATTERNS.CONTENT_TYPES.some(ct => h.value.includes(ct))
      ) || capture.request.headers.some(h => 
        h.name.toLowerCase() === 'content-type' && 
        UCAN_PATTERNS.CONTENT_TYPES.some(ct => h.value.includes(ct))
      );
      
      const hasUcanAuth = capture.request.headers.some(h => 
        h.name.toLowerCase() === 'authorization' && h.value.includes('ucan')
      );
      
      if (hasCarContent) {
        ucanInfo = ' 📦 CAR';
      } else if (hasUcanAuth) {
        ucanInfo = ' 🔐 UCAN';
      } else if (capture.request.postData?.text || capture.response.content.text) {
        try {
          const bodyStr = (capture.request.postData?.text || '') + (capture.response.content.text || '');
          if (UCAN_PATTERNS.BODY_PATTERNS.some(pattern => bodyStr.includes(pattern))) {
            ucanInfo = ' 🔗 UCAN Data';
          }
        } catch (e) {}
      }
      
      const statusColor = capture.response.status < 300 ? '#4caf50' : 
                         capture.response.status < 400 ? '#ff9800' : '#f44336';
      
      requestDiv.innerHTML = 
        '<div style="color: #007AFF; font-weight: bold; display: flex; justify-content: space-between;">' +
          '<span>' + timestamp + ' - ' + capture.request.method + ucanInfo + '</span>' +
          '<span style="color: ' + statusColor + ';">' + capture.response.status + '</span>' +
        '</div>' +
        '<div style="color: #00FF00; font-size: 11px; margin: 2px 0;">' + url.hostname + url.pathname + '</div>' +
        '<div style="color: #666; font-size: 10px;">Time: ' + Math.round(capture.time || 0) + 'ms</div>';
      
      requestDiv.onclick = () => {
        this.showRequestDetails(capture);
      };
      
      requestsList.insertBefore(requestDiv, requestsList.firstChild);
      
      while (requestsList.children.length > 15) {
        const lastChild = requestsList.lastChild;
        if (lastChild) {
          requestsList.removeChild(lastChild);
        }
      }
      
      console.log('🚀 Safari UCAN request displayed in overlay:', capture.request.url);
    }
  }
  
  private showRequestDetails(capture: NetworkCapture): void {
    const modal = document.createElement('div');
    modal.id = 'ucan-detail-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 999999; display: flex; align-items: center; justify-content: center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background: #1a1a1a; border: 2px solid #007AFF; border-radius: 8px; width: 80%; max-width: 800px; height: 80%; overflow-y: auto; padding: 20px; color: #fff; font-family: monospace; font-size: 12px;';
    
    const url = new URL(capture.request.url);
    let details = '<div style="border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 10px;">' +
      '<h3 style="color: #007AFF; margin: 0 0 10px 0;">' + capture.request.method + ' ' + url.pathname + '</h3>' +
      '<div style="color: #666;">Host: ' + url.hostname + '</div>' +
      '<div style="color: #666;">Status: ' + capture.response.status + '</div>' +
      '<div style="color: #666;">Time: ' + Math.round(capture.time || 0) + 'ms</div>' +
      '</div>' +
      '<div style="margin-bottom: 15px;">' +
      '<h4 style="color: #007AFF; margin-bottom: 5px;">Request Headers:</h4>' +
      '<div style="background: #2a2a2a; padding: 10px; border-radius: 4px; max-height: 200px; overflow-y: auto;">';
    
    capture.request.headers.forEach(h => {
      const isAuth = h.name.toLowerCase().includes('authorization');
      const isCar = h.name.toLowerCase() === 'content-type' && UCAN_PATTERNS.CONTENT_TYPES.some(ct => h.value.includes(ct));
      details += '<div style="color: ' + (isAuth || isCar ? '#00FF00' : '#ccc') + ';">' + h.name + ': ' + h.value + '</div>';
    });
    
    details += '</div></div>';
    
    if (capture.request.postData?.text) {
      details += '<div style="margin-bottom: 15px;">' +
        '<h4 style="color: #007AFF; margin-bottom: 5px;">Request Body:</h4>' +
        '<div style="background: #2a2a2a; padding: 10px; border-radius: 4px; max-height: 200px; overflow-y: auto;">' +
        '<pre style="color: #fff; white-space: pre-wrap; word-break: break-all;">' + 
        capture.request.postData.text.substring(0, 1000) + (capture.request.postData.text.length > 1000 ? '...' : '') + 
        '</pre></div></div>';
    }
    
    details += '<div style="margin-bottom: 15px;">' +
      '<h4 style="color: #007AFF; margin-bottom: 5px;">Response Headers:</h4>' +
      '<div style="background: #2a2a2a; padding: 10px; border-radius: 4px; max-height: 200px; overflow-y: auto;">';
    
    capture.response.headers.forEach(h => {
      const isCar = UCAN_PATTERNS.CONTENT_TYPES.some(ct => h.value.includes(ct));
      details += '<div style="color: ' + (isCar ? '#00FF00' : '#ccc') + ';">' + h.name + ': ' + h.value + '</div>';
    });
    
    details += '</div></div>';
    
    if (capture.response.content.text) {
      details += '<div style="margin-bottom: 15px;">' +
        '<h4 style="color: #007AFF; margin-bottom: 5px;">Response Body:</h4>' +
        '<div style="background: #2a2a2a; padding: 10px; border-radius: 4px; max-height: 200px; overflow-y: auto;">' +
        '<pre style="color: #fff; white-space: pre-wrap; word-break: break-all;">' + 
        capture.response.content.text.substring(0, 1000) + (capture.response.content.text.length > 1000 ? '...' : '') + 
        '</pre></div></div>';
    }
    
    details += '<div style="text-align: center; margin-top: 20px;">' +
      '<button id="close-detail" style="background: #007AFF; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Close</button>' +
      '</div>';
    
    content.innerHTML = details;
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    const closeBtn = document.getElementById('close-detail');
    const closeModal = () => {
      document.body.removeChild(modal);
    };
    
    if (closeBtn) closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  }
}

// Initialize the Safari interceptor
const safariInterceptor = new SafariNetworkInterceptor();

// Auto-create panel on Storacha sites (controlled by extension icon)
if (window.location.hostname.includes('storacha') || window.location.hostname.includes('web3.storage')) {
  // Create panel immediately but keep it hidden
  document.addEventListener('DOMContentLoaded', () => {
    (safariInterceptor as any).createUCANPanel();
  });
}

