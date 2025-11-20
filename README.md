# MoJuBlock - Mouto-chan Judol Block

A powerful Chrome Extension (MV3) designed to effectively block adult and judol content from websites.

## Features

✅ **Dual Detection System**
- **URL-based blocking**: Hostname detection with automatic tab closure or popup notification
- **Content-based blocking**: Keyword detection through hostname, page title, meta tags, headings, and span elements

✅ **Smart Filtering**
- 7-day whitelist for false positives
- Content detection via regex patterns
- Regular automatic updates of blocklists

✅ **User Reporting**
- Report suspicious links directly
- Contribute to community-maintained blocklist

✅ **Chrome MV3 Compliant**
- Uses Service Workers instead of background pages
- Future-proof extension architecture

## Installation

### From Source (Development)

1. Clone or extract this repository
2. Open `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `MoJuBlock` folder
6. The extension should now appear in your Chrome toolbar

### Manual Installation (After Packaging)

1. Download the `.crx` file
2. Open `chrome://extensions/`
3. Drag and drop the `.crx` file onto the page

## Project Structure

```
MoJuBlock/
├── manifest.json                 # Extension configuration (MV3)
├── src/
│   ├── background/
│   │   └── service-worker.js     # Background script (asset fetching, blocking logic)
│   ├── content/
│   │   └── content-script.js     # Content script (page analysis & detection)
│   ├── popup/
│   │   ├── popup.html            # Extension popup UI
│   │   ├── popup.css             # Popup styling
│   │   └── popup.js              # Popup interactions
│   └── utils/
│       └── page-scripts.js       # Utility scripts (if needed)
├── assets/
│   ├── icon-16.png              # 16x16 extension icon
│   ├── icon-48.png              # 48x48 extension icon
│   └── icon-128.png             # 128x128 extension icon
├── docs/
│   └── DEVELOPMENT.md           # Development guide
└── README.md                    # This file
```

## How It Works

### 1. Asset Loading
- On installation/update, the extension fetches two blocklists from MoJuAssets:
  - `mojublockurl.txt` - Blocked hostnames
  - `mojublockword.txt` - Blocked keywords

### 2. URL-Based Blocking
- When a page loads, content script checks hostname against URL blacklist
- If matched: Shows popup notification
- Users can report the link or ignore it for 7 days

### 3. Content-Based Blocking
- Content script extracts:
  - Page hostname
  - Page title
  - Meta tags
  - Headings (h1-h4)
  - Span elements
- Checks extracted content against keyword blacklist
- If matched: Shows popup with options:
  - ✓ **Abaikan (7 hari)**: Whitelist site for 7 days
  - 📢 **Laporkan Link**: Report suspicious link to database

### 4. Auto-Updates
- Blocklists auto-update every 24 hours
- Manual update available via popup

## Configuration

### Blocklist Format

Both `mojublockurl.txt` and `mojublockword.txt` are plain text files with one entry per line:

```
# Comments start with #
example.com
another-site.net
keyword1|keyword2
regex_pattern
```

### Ignored Sites Storage

Ignored sites are stored in Chrome's `storage.local` with 7-day expiry:

```javascript
{
  "mojublock_ignored_sites": {
    "example.com": 1735689600000, // Unix timestamp (7 days from now)
    "another-site.net": 1735776000000
  }
}
```

## Development

### Adding New Features

1. Modify content script (`src/content/content-script.js`) for page analysis
2. Update service worker (`src/background/service-worker.js`) for blocking logic
3. Enhance popup UI (`src/popup/popup.html`) if needed
4. Test changes by reloading extension

### Testing

1. Load extension in development mode
2. Visit test websites
3. Check Chrome DevTools console for `[MoJuBlock]` logs
4. Verify popup appears and blocking works correctly

### Debugging

- Open `chrome://extensions/`
- Click "Service Worker" under MoJuBlock to view logs
- Content script logs visible on inspected page console

## API Reference

### Service Worker Messages

#### CHECK_URL_BLACKLIST
```javascript
chrome.runtime.sendMessage({
  type: 'CHECK_URL_BLACKLIST',
  hostname: 'example.com'
}, (response) => {
  console.log(response.blocked); // true/false
});
```

#### CHECK_WORD_BLACKLIST
```javascript
chrome.runtime.sendMessage({
  type: 'CHECK_WORD_BLACKLIST',
  hostname: 'example.com',
  title: 'Page Title',
  content: 'page content string'
}, (response) => {
  console.log(response.blocked); // true/false
});
```

#### IGNORE_SITE
```javascript
chrome.runtime.sendMessage({
  type: 'IGNORE_SITE',
  hostname: 'example.com'
}, (response) => {
  console.log(response.success);
});
```

#### REPORT_LINK
```javascript
chrome.runtime.sendMessage({
  type: 'REPORT_LINK',
  hostname: 'example.com',
  title: 'Page Title',
  reason: 'word' // or 'url'
}, (response) => {
  console.log(response.success);
});
```

#### UPDATE_ASSETS
```javascript
chrome.runtime.sendMessage({
  type: 'UPDATE_ASSETS'
}, (response) => {
  console.log(response.success);
});
```

## Storage Usage

- **URL Blacklist**: ~500KB (typical)
- **Word Blacklist**: ~200KB (typical)
- **Ignored Sites**: ~10KB (typical)
- **Total Allocation**: 10MB (Chrome extension storage limit)

## Privacy

- ✅ No data sent to external servers (except blocklist updates)
- ✅ All reports stored locally until user chooses to send
- ✅ No tracking or analytics
- ✅ No user profiling

## Browser Support

- 🟢 Chrome 88+
- 🟢 Chromium-based browsers (Edge, Brave, Vivaldi, etc.)
- 🔴 Firefox (requires MV2 version - not implemented yet)

## Contributing

To contribute to MoJuAssets blocklists:

1. Visit [MoJuAssets Repository](https://github.com/rafiq8k-moga/mojuassets)
2. Submit pull requests with new entries
3. Ensure entries follow format guidelines

## License

MIT License - Feel free to fork and modify

## Support

- 🐛 Found a bug? [Open an issue](https://github.com/rafiq8k-moga/mojublock/issues)
- 💡 Have a suggestion? [Start a discussion](https://github.com/rafiq8k-moga/mojublock/discussions)
- 📧 Contact: r8kstudio@gmail.com

## Changelog

### v1.0.0 (Nov 20, 2025)
- Initial release
- Dual detection system (URL + Keywords)
- 7-day whitelist feature
- Auto-update blocklists
- Popup UI with reporting

---

**Made with ❤️ by the MoJuBlock Team**

Stay safe, stay pure. 🛡️
