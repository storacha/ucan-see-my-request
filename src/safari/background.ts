import browser from 'webextension-polyfill';

interface StoredRequest {
  timestamp: number;
  data: any;
}

/**
 * Safari Background Service Worker
 * Handles message passing between content scripts and DevTools panels
 * Provides persistent storage for UCAN requests
 */
class SafariBackgroundService {
  private static readonly STORAGE_KEY = 'safari_ucan_requests';
  private static readonly MAX_STORED_REQUESTS = 100;
  
  private devToolsPorts: Set<browser.Runtime.Port> = new Set();
  private ucanRequestCount = 0;

  constructor() {
    this.setupMessageListeners();
    this.setupPortConnections();
    this.setupActionHandlers();
    this.initializeBadge();
    console.log('🚀 Safari Background Service Worker initialized');
  }

  /**
   * Setup message listeners for content script communication
   */
  private setupMessageListeners(): void {
    browser.runtime.onMessage.addListener(async (message: any, sender: browser.Runtime.MessageSender) => {
      console.log('📨 Safari Background received message:', message.type);
      
      if (message.type === 'NETWORK_REQUEST_CAPTURED') {
        await this.storeUCANRequest(message.data);
        this.forwardToDevTools(message);
        this.incrementBadgeCount();
        return true;
      }

      if (message.type === 'GET_STORED_REQUESTS') {
        const stored = await this.getStoredRequests();
        return { type: 'STORED_REQUESTS', data: stored };
      }

      if (message.type === 'CLEAR_STORED_REQUESTS') {
        await this.clearStoredRequests();
        this.resetBadgeCount();
        return true;
      }

      if (message.type === 'TOGGLE_PANEL') {
        // Forward panel toggle request to content script
        if (sender.tab?.id) {
          browser.tabs.sendMessage(sender.tab.id, { type: 'TOGGLE_UCAN_PANEL' });
        }
        return true;
      }
      
      return false;
    });
  }

  /**
   * Setup port connections for DevTools panels
   */
  private setupPortConnections(): void {
    browser.runtime.onConnect.addListener((port: browser.Runtime.Port) => {
      if (port.name === 'safari-devtools-panel') {
        console.log('🔗 Safari DevTools panel connected');
        this.devToolsPorts.add(port);
        
        // Send stored requests to new panel
        this.sendStoredRequestsToPort(port);
        
        port.onDisconnect.addListener(() => {
          console.log('🔌 Safari DevTools panel disconnected');
          this.devToolsPorts.delete(port);
        });
      }
    });
  }

  /**
   * Store UCAN request in local storage
   */
  private async storeUCANRequest(data: any): Promise<void> {
    try {
      const stored = await this.getStoredRequests();
      const newRequest: StoredRequest = {
        timestamp: Date.now(),
        data: data
      };
      
      stored.unshift(newRequest);
      
      // Keep only recent requests
      if (stored.length > SafariBackgroundService.MAX_STORED_REQUESTS) {
        stored.splice(SafariBackgroundService.MAX_STORED_REQUESTS);
      }
      
      await browser.storage.local.set({
        [SafariBackgroundService.STORAGE_KEY]: stored
      });
      
      console.log('💾 Safari UCAN request stored, total:', stored.length);
    } catch (error) {
      console.error('❌ Failed to store Safari UCAN request:', error);
    }
  }

  /**
   * Get stored UCAN requests
   */
  private async getStoredRequests(): Promise<StoredRequest[]> {
    try {
      const result = await browser.storage.local.get(SafariBackgroundService.STORAGE_KEY);
      const stored = result[SafariBackgroundService.STORAGE_KEY];
      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      console.error('❌ Failed to get stored Safari UCAN requests:', error);
      return [];
    }
  }

  /**
   * Clear stored UCAN requests
   */
  private async clearStoredRequests(): Promise<void> {
    try {
      await browser.storage.local.remove(SafariBackgroundService.STORAGE_KEY);
      console.log('🗑️ Safari stored UCAN requests cleared');
    } catch (error) {
      console.error('❌ Failed to clear stored Safari UCAN requests:', error);
    }
  }

  /**
   * Send stored requests to a specific DevTools port
   */
  private async sendStoredRequestsToPort(port: browser.Runtime.Port): Promise<void> {
    try {
      const stored = await this.getStoredRequests();
      if (stored.length > 0) {
        port.postMessage({
          type: 'STORED_REQUESTS',
          data: stored
        });
        console.log(`📤 Sent ${stored.length} stored Safari UCAN requests to DevTools`);
      }
    } catch (error) {
      console.error('❌ Failed to send stored Safari requests to DevTools:', error);
    }
  }

  /**
   * Forward messages to all connected DevTools panels
   */
  private forwardToDevTools(message: any): void {
    this.devToolsPorts.forEach(port => {
      try {
        port.postMessage(message);
      } catch (error) {
        console.warn('⚠️ Failed to forward Safari message to DevTools port:', error);
        // Remove disconnected ports
        this.devToolsPorts.delete(port);
      }
    });
  }

  /**
   * Setup extension icon click handlers
   */
  private setupActionHandlers(): void {
    browser.action.onClicked.addListener(async (tab) => {
      console.log('🖱️ Safari extension icon clicked');
      
      // Check if tab is a Storacha site
      if (tab.url && (tab.url.includes('storacha') || tab.url.includes('web3.storage'))) {
        // Send toggle message to content script
        try {
          await browser.tabs.sendMessage(tab.id!, { type: 'TOGGLE_UCAN_PANEL' });
        } catch (error) {
          console.warn('⚠️ Failed to send toggle message to content script:', error);
        }
      } else {
        // Show notification for non-Storacha sites
        browser.notifications?.create({
          type: 'basic',
          iconUrl: '',
          title: 'UCAN Debug',
          message: 'UCAN debugging is only available on Storacha sites (*.storacha.network, *.web3.storage)'
        });
      }
    });
  }

  /**
   * Initialize badge with clean state
   */
  private async initializeBadge(): Promise<void> {
    try {
      await browser.action.setBadgeBackgroundColor({ color: '#ff6b35' }); // Storacha orange
      await browser.action.setBadgeText({ text: '' });
      console.log('🏷️ Safari extension badge initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize Safari badge:', error);
    }
  }

  /**
   * Increment badge count for new UCAN requests
   */
  private async incrementBadgeCount(): Promise<void> {
    try {
      this.ucanRequestCount++;
      const badgeText = this.ucanRequestCount > 99 ? '99+' : String(this.ucanRequestCount);
      await browser.action.setBadgeText({ text: badgeText });
      console.log(`🔢 Safari badge updated: ${badgeText} UCAN requests`);
    } catch (error) {
      console.warn('⚠️ Failed to update Safari badge:', error);
    }
  }

  /**
   * Reset badge count
   */
  private async resetBadgeCount(): Promise<void> {
    try {
      this.ucanRequestCount = 0;
      await browser.action.setBadgeText({ text: '' });
      console.log('🔄 Safari badge reset');
    } catch (error) {
      console.warn('⚠️ Failed to reset Safari badge:', error);
    }
  }

  /**
   * Handle installation/update events
   */
  private setupInstallListener(): void {
    browser.runtime.onInstalled.addListener(async (details) => {
      console.log('🎉 Safari extension installed/updated:', details.reason);
      
      if (details.reason === 'install') {
        // Clear any existing data on fresh install
        await this.clearStoredRequests();
        await this.resetBadgeCount();
      }
    });
  }
}

// Initialize the Safari background service
new SafariBackgroundService();
