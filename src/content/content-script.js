/**
 * MoJuBlock - Content Script
 * Injected on all pages to detect and block adult content
 */

const BLOCK_DELAY = 500; // ms to wait before blocking

/**
 * Get current page metadata
 */
function getPageMetadata() {
  const metadata = {
    hostname: window.location.hostname,
    title: document.title,
    meta: [],
    headings: []
  };
  
  // Collect meta tags
  document.querySelectorAll('meta').forEach(meta => {
    const content = meta.getAttribute('content') || '';
    const name = meta.getAttribute('name') || meta.getAttribute('property') || '';
    if (content && name) {
      metadata.meta.push(`${name}:${content}`);
    }
  });
  
  // Collect headings (h1-h4)
  document.querySelectorAll('h1, h2, h3, h4').forEach(heading => {
    metadata.headings.push(heading.textContent.substring(0, 200));
  });
  
  // Collect span texts (first 50)
  const spans = [];
  document.querySelectorAll('span').forEach((span, index) => {
    if (index < 50) {
      spans.push(span.textContent.substring(0, 100));
    }
  });
  metadata.spans = spans;
  
  return metadata;
}

/**
 * Check URL blacklist
 */
async function checkUrlBlacklist() {
  const hostname = window.location.hostname;
  
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: 'CHECK_URL_BLACKLIST',
        hostname: hostname
      },
      (response) => {
        resolve(response?.blocked || false);
      }
    );
  });
}

/**
 * Check word blacklist
 */
async function checkWordBlacklist() {
  const metadata = getPageMetadata();
  const contentString = [
    metadata.hostname,
    metadata.title,
    metadata.meta.join(' '),
    metadata.headings.join(' '),
    metadata.spans.join(' ')
  ].join(' ');
  
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: 'CHECK_WORD_BLACKLIST',
        hostname: metadata.hostname,
        title: metadata.title,
        content: contentString
      },
      (response) => {
        resolve(response?.blocked || false);
      }
    );
  });
}

/**
 * Close current tab
 */
function closeTab() {
  // In MV3, we can't directly close tabs from content script
  // Instead, send message to background to close it
  chrome.runtime.sendMessage({
    type: 'CLOSE_TAB'
  });
}

/**
 * Show popup notification
 */
function showBlockPopup(reason = 'word') {
  const hostname = window.location.hostname;
  const title = document.title;
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'mojublock-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 2147483646;
  `;
  document.body.appendChild(overlay);
  
  // Create popup
  const popup = document.createElement('div');
  popup.id = 'mojublock-popup';
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2147483647;
    background: white;
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    padding: 30px;
    max-width: 500px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    text-align: center;
  `;
  
  const titleEl = document.createElement('h2');
  titleEl.textContent = '⚠️ MoJuBlock Detected';
  titleEl.style.cssText = 'margin: 0 0 15px 0; color: #d32f2f; font-size: 22px;';
  
  const descEl = document.createElement('p');
  descEl.textContent = reason === 'url' 
    ? 'This website has been blocked due to its content.'
    : `This website (${hostname}) contains content that matches our judol detection filters.`;
  descEl.style.cssText = 'margin: 0 0 20px 0; color: #555; line-height: 1.6;';
  
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center;';
  
  if (reason === 'word') {
    const ignoreBtn = document.createElement('button');
    ignoreBtn.textContent = '✓ Abaikan (7 hari)';
    ignoreBtn.style.cssText = `
      padding: 10px 20px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    ignoreBtn.onclick = () => {
      chrome.runtime.sendMessage({
        type: 'IGNORE_SITE',
        hostname: hostname
      });
      popup.remove();
      overlay.remove();
      alert('Website akan diabaikan selama 7 hari');
    };
    buttonsContainer.appendChild(ignoreBtn);
  }
  
  const reportBtn = document.createElement('button');
  reportBtn.textContent = '📢 Laporkan Link';
  reportBtn.style.cssText = `
    padding: 10px 20px;
    background: #ff9800;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  `;
  reportBtn.onclick = () => {
    chrome.runtime.sendMessage({
      type: 'REPORT_LINK',
      hostname: hostname,
      title: title,
      reason: reason
    });
    popup.remove();
    overlay.remove();
    alert('Link telah dilaporkan. Terima kasih!');
    
    // Close tab after alert
    chrome.runtime.sendMessage({
      type: 'CLOSE_TAB'
    });
  };
  buttonsContainer.appendChild(reportBtn);
  
  popup.appendChild(titleEl);
  popup.appendChild(descEl);
  popup.appendChild(buttonsContainer);
  document.body.appendChild(popup);
}

/**
 * Main blocking logic
 */
async function performBlocking() {
  try {
    // Wait a bit for page to load
    await new Promise(resolve => setTimeout(resolve, BLOCK_DELAY));
    
    // Check URL blacklist first
    const urlBlocked = await checkUrlBlacklist();
    if (urlBlocked) {
      console.log('[MoJuBlock] URL blocked:', window.location.hostname);
      showBlockPopup('url');
      return;
    }
    
    // Check word blacklist
    const wordBlocked = await checkWordBlacklist();
    if (wordBlocked) {
      console.log('[MoJuBlock] Word blocked:', window.location.hostname);
      showBlockPopup('word');
    }
  } catch (error) {
    console.error('[MoJuBlock] Error during blocking:', error);
  }
}

// Start blocking check
performBlocking();
