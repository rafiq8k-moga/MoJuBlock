/**
 * MoJuBlock - Service Worker (Background Script)
 * Handles asset fetching, URL blocking, and reporting
 */

const ASSETS_CONFIG = {
  urlBlacklist: 'https://github.com/rafiq8k-moga/mojuassets/raw/refs/heads/main/mojublockurl.txt',
  wordBlacklist: 'https://github.com/rafiq8k-moga/mojuassets/raw/refs/heads/main/mojublockword.txt'
};

const CACHE_KEYS = {
  urlBlacklist: 'mojublock_url_blacklist',
  wordBlacklist: 'mojublock_word_blacklist',
  lastUpdate: 'mojublock_last_update'
};

const STORAGE_KEYS = {
  ignoredSites: 'mojublock_ignored_sites',
  reportedLinks: 'mojublock_reported_links'
};

/**
 * Initialize extension on install/update
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    console.log('[MoJuBlock] Extension installed/updated');
    await updateAssets();
  }
});

/**
 * Fetch and update blocklists from remote repository
 */
async function updateAssets() {
  try {
    console.log('[MoJuBlock] Updating assets...');
    
    // Fetch URL blacklist
    const urlResponse = await fetch(ASSETS_CONFIG.urlBlacklist);
    const urlData = await urlResponse.text();
    const urls = parseBlacklist(urlData);
    
    // Fetch word blacklist
    const wordResponse = await fetch(ASSETS_CONFIG.wordBlacklist);
    const wordData = await wordResponse.text();
    const words = parseBlacklist(wordData);
    
    // Store in Chrome storage
    await chrome.storage.local.set({
      [CACHE_KEYS.urlBlacklist]: urls,
      [CACHE_KEYS.wordBlacklist]: words,
      [CACHE_KEYS.lastUpdate]: new Date().getTime()
    });
    
    console.log(`[MoJuBlock] Assets updated - URLs: ${urls.length}, Words: ${words.length}`);
  } catch (error) {
    console.error('[MoJuBlock] Error updating assets:', error);
  }
}

/**
 * Parse blacklist text file
 */
function parseBlacklist(data) {
  return data
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

/**
 * Check if hostname matches URL blacklist
 */
async function checkUrlBlacklist(hostname) {
  const data = await chrome.storage.local.get(CACHE_KEYS.urlBlacklist);
  const blacklist = data[CACHE_KEYS.urlBlacklist] || [];
  
  return blacklist.some(blockedHost => 
    hostname.includes(blockedHost) || blockedHost.includes(hostname)
  );
}

/**
 * Check if page content contains judol keywords
 */
async function checkWordBlacklist(hostname, pageTitle, pageContent) {
  const data = await chrome.storage.local.get(CACHE_KEYS.wordBlacklist);
  const blacklist = data[CACHE_KEYS.wordBlacklist] || [];
  
  const contentToCheck = `${hostname} ${pageTitle} ${pageContent}`.toLowerCase();
  
  return blacklist.some(keyword => 
    new RegExp(keyword, 'i').test(contentToCheck)
  );
}

/**
 * Check if site is in ignored list (7-day whitelist)
 */
async function isIgnoredSite(hostname) {
  const data = await chrome.storage.local.get(STORAGE_KEYS.ignoredSites);
  const ignored = data[STORAGE_KEYS.ignoredSites] || {};
  
  const expiry = ignored[hostname];
  if (!expiry) return false;
  
  if (Date.now() > expiry) {
    // Remove expired entry
    delete ignored[hostname];
    await chrome.storage.local.set({ [STORAGE_KEYS.ignoredSites]: ignored });
    return false;
  }
  
  return true;
}

/**
 * Add site to ignored list (7 days)
 */
async function ignoresite(hostname) {
  const data = await chrome.storage.local.get(STORAGE_KEYS.ignoredSites);
  const ignored = data[STORAGE_KEYS.ignoredSites] || {};
  
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  ignored[hostname] = Date.now() + sevenDaysMs;
  
  await chrome.storage.local.set({ [STORAGE_KEYS.ignoredSites]: ignored });
  console.log(`[MoJuBlock] ${hostname} ignored for 7 days`);
}

/**
 * Report suspicious link
 */
async function reportLink(hostname, title, reason) {
  const report = {
    hostname,
    title,
    reason,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };
  
  try {
    // Log locally first
    const data = await chrome.storage.local.get(STORAGE_KEYS.reportedLinks);
    const reports = data[STORAGE_KEYS.reportedLinks] || [];
    reports.push(report);
    await chrome.storage.local.set({ [STORAGE_KEYS.reportedLinks]: reports });
    
    console.log('[MoJuBlock] Link reported:', report);
    
    // TODO: Send to reporting endpoint
    // await fetch('YOUR_REPORTING_ENDPOINT', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(report)
    // });
  } catch (error) {
    console.error('[MoJuBlock] Error reporting link:', error);
  }
}

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'CHECK_URL_BLACKLIST':
        const urlBlocked = await checkUrlBlacklist(message.hostname);
        sendResponse({ blocked: urlBlocked });
        break;
        
      case 'CHECK_WORD_BLACKLIST':
        const isIgnored = await isIgnoredSite(message.hostname);
        if (isIgnored) {
          sendResponse({ blocked: false });
          break;
        }
        const wordBlocked = await checkWordBlacklist(
          message.hostname,
          message.title,
          message.content
        );
        sendResponse({ blocked: wordBlocked });
        break;
        
      case 'IGNORE_SITE':
        await ignoresite(message.hostname);
        sendResponse({ success: true });
        break;
        
      case 'REPORT_LINK':
        await reportLink(message.hostname, message.title, message.reason);
        sendResponse({ success: true });
        break;
        
      case 'UPDATE_ASSETS':
        await updateAssets();
        sendResponse({ success: true });
        break;
        
      case 'CLOSE_TAB':
        // Get the tab from sender and close it
        if (sender.tab && sender.tab.id) {
          chrome.tabs.remove(sender.tab.id);
        }
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  })();
  
  return true; // Keep channel open for async response
});

/**
 * Auto-update assets daily
 */
async function setupAlarm() {
  const alarms = await chrome.alarms.getAll();
  const hasUpdateAlarm = alarms.some(alarm => alarm.name === 'updateAssets');
  
  if (!hasUpdateAlarm) {
    chrome.alarms.create('updateAssets', { periodInMinutes: 1440 }); // 24 hours
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateAssets') {
    updateAssets();
  }
});

// Initial setup on first run
chrome.storage.local.get(CACHE_KEYS.urlBlacklist, (data) => {
  if (!data[CACHE_KEYS.urlBlacklist]) {
    updateAssets();
  }
  setupAlarm();
});
