/**
 * MoJuBlock - Popup Script
 * Handles popup UI and interactions
 */

const CACHE_KEYS = {
  urlBlacklist: 'mojublock_url_blacklist',
  wordBlacklist: 'mojublock_word_blacklist',
  lastUpdate: 'mojublock_last_update'
};

const STORAGE_KEYS = {
  ignoredSites: 'mojublock_ignored_sites'
};

/**
 * Format timestamp
 */
function formatDate(timestamp) {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Load and display statistics
 */
async function loadStats() {
  const data = await chrome.storage.local.get([
    CACHE_KEYS.urlBlacklist,
    CACHE_KEYS.wordBlacklist,
    CACHE_KEYS.lastUpdate
  ]);
  
  document.getElementById('urlCount').textContent = 
    (data[CACHE_KEYS.urlBlacklist] || []).length;
  document.getElementById('wordCount').textContent = 
    (data[CACHE_KEYS.wordBlacklist] || []).length;
  document.getElementById('lastUpdate').textContent = 
    formatDate(data[CACHE_KEYS.lastUpdate]);
}

/**
 * Load and display ignored sites
 */
async function loadIgnoredSites() {
  const data = await chrome.storage.local.get(STORAGE_KEYS.ignoredSites);
  const ignored = data[STORAGE_KEYS.ignoredSites] || {};
  
  const listContainer = document.getElementById('ignoredList');
  listContainer.innerHTML = '';
  
  const entries = Object.entries(ignored);
  
  if (entries.length === 0) {
    listContainer.innerHTML = '<p class="empty-state">No ignored sites</p>';
    return;
  }
  
  entries.forEach(([hostname, expiry]) => {
    if (Date.now() > expiry) {
      // Remove expired entry
      delete ignored[hostname];
      return;
    }
    
    const item = document.createElement('div');
    item.className = 'list-item';
    
    const expiryDate = new Date(expiry);
    const text = document.createElement('span');
    text.className = 'list-item-text';
    text.textContent = `${hostname} (until ${expiryDate.toLocaleDateString()})`;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'list-item-remove';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = async () => {
      delete ignored[hostname];
      await chrome.storage.local.set({ [STORAGE_KEYS.ignoredSites]: ignored });
      loadIgnoredSites();
    };
    
    item.appendChild(text);
    item.appendChild(removeBtn);
    listContainer.appendChild(item);
  });
  
  // Save cleaned ignored sites
  await chrome.storage.local.set({ [STORAGE_KEYS.ignoredSites]: ignored });
}

/**
 * Event Listeners
 */
document.getElementById('updateBtn').addEventListener('click', async () => {
  const btn = document.getElementById('updateBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Updating...';
  
  chrome.runtime.sendMessage({ type: 'UPDATE_ASSETS' }, () => {
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = '🔄 Update Blocklists Now';
      loadStats();
      alert('Blocklists updated successfully!');
    }, 1000);
  });
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  // TODO: Open settings page
  alert('Settings page coming soon!');
});

document.getElementById('reportsBtn').addEventListener('click', () => {
  // TODO: Open reports page
  alert('Reports page coming soon!');
});

/**
 * Initialize popup on load
 */
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadIgnoredSites();
});
