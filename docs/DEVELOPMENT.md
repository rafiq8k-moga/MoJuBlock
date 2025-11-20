# MoJuBlock Development Guide

## Setup Environment

### Prerequisites
- Chrome browser (v88+)
- Text editor or IDE (VS Code recommended)
- Git (optional)

### Quick Start

1. **Clone/Extract Repository**
   ```bash
   git clone https://github.com/rafiq8k-moga/mojublock.git
   cd mojublock
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the `mojublock` folder

3. **View Logs**
   - Go to `chrome://extensions/`
   - Click "Service Worker" under MoJuBlock to see background script logs
   - On any page, right-click → "Inspect" → Console to see content script logs

## File Structure Details

### `manifest.json`
- Defines extension configuration
- Declares permissions and host access
- Links to service worker and content scripts
- Specifies popup UI

### `src/background/service-worker.js`
- **Purpose**: Main extension logic runner
- **Key Functions**:
  - `updateAssets()`: Fetch blocklists from MoJuAssets
  - `checkUrlBlacklist()`: Check hostname against URL list
  - `checkWordBlacklist()`: Check content against keyword list
  - `ignoresite()`: Add site to 7-day whitelist
  - `reportLink()`: Store report data
- **Message Handlers**: Receives messages from content scripts

### `src/content/content-script.js`
- **Purpose**: Runs on every webpage
- **Key Functions**:
  - `getPageMetadata()`: Extract page information
  - `checkUrlBlacklist()`: Query service worker for URL check
  - `checkWordBlacklist()`: Query service worker for content check
  - `showBlockPopup()`: Display popup notification
  - `performBlocking()`: Main blocking logic
- **Execution**: Starts on document_start for early detection

### `src/popup/popup.*`
- **popup.html**: Extension popup interface
- **popup.css**: Styling for popup
- **popup.js**: Popup interactions and stats display

## Development Workflow

### 1. Modify Code
```javascript
// Edit src/background/service-worker.js, src/content/content-script.js, etc.
// Changes are picked up on reload
```

### 2. Reload Extension
- Go to `chrome://extensions/`
- Click the reload icon under MoJuBlock
- Or press Ctrl+R on the extension page

### 3. Test Changes
- Visit a test website
- Check console logs for `[MoJuBlock]` messages
- Verify blocking behavior

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup displays correct stats
- [ ] URL blocking works (show popup)
- [ ] Content blocking works (show popup)
- [ ] Ignore site feature works (7-day whitelist)
- [ ] Report link sends data
- [ ] Auto-update runs daily
- [ ] No console errors

## Adding New Features

### Example: Add a new blocklist type

1. **Update `manifest.json`** if needed
2. **Modify `src/background/service-worker.js`**:
   ```javascript
   const CACHE_KEYS = {
     urlBlacklist: 'mojublock_url_blacklist',
     wordBlacklist: 'mojublock_word_blacklist',
     newFeature: 'mojublock_new_feature' // Add new key
   };
   ```

3. **Update `updateAssets()` function**:
   ```javascript
   const newResponse = await fetch(ASSETS_CONFIG.newFeature);
   // ... process and cache
   ```

4. **Add message handler** in `chrome.runtime.onMessage.addListener()`:
   ```javascript
   case 'CHECK_NEW_FEATURE':
     // ... implement logic
     break;
   ```

5. **Update content script** to use new feature
6. **Test thoroughly**

## Common Issues

### Extension shows errors
- Check `chrome://extensions/` → Details → Errors
- Review console logs (Service Worker)
- Ensure all file paths match manifest.json

### Blocklists not updating
- Check internet connection
- Verify GitHub URLs are accessible
- Check `chrome://extensions/` → Service Worker logs
- Look for 403 Forbidden (GitHub rate limit)

### Popup not showing
- Verify `src/popup/popup.html` exists
- Check content script is injected (console should show logs)
- Ensure blocking threshold is met

### Content script not running
- Verify `manifest.json` has correct content_scripts entry
- Check page matches `<all_urls>` pattern
- Reload extension and page

## Advanced Debugging

### Using Chrome DevTools

**For Service Worker:**
```
1. chrome://extensions/
2. Click "Service Worker" link under MoJuBlock
3. DevTools opens for background script
4. Set breakpoints and debug
```

**For Content Script:**
```
1. Right-click on webpage → Inspect
2. Go to Console tab
3. Look for [MoJuBlock] logs
4. Add console.log() for debugging
```

### Memory Usage

Check extension memory:
```
chrome://extensions/ → Details → "Inspect views"
```

### Storage Management

View stored data:
```javascript
chrome.storage.local.get(null, (data) => {
  console.log('All stored data:', data);
});
```

## Performance Optimization

### Content Script
- Use `document_start` for early detection
- Limit DOM queries (cache results)
- Avoid heavy operations

### Service Worker
- Keep message handlers fast
- Use async/await properly
- Batch storage operations

### Popup
- Lazy-load ignored sites list
- Pagination for large datasets
- Debounce update operations

## Building for Release

### Prepare Package
1. Update version in `manifest.json` and `package.json`
2. Test all features thoroughly
3. Create `.crx` file:
   - Go to `chrome://extensions/`
   - Click "Pack extension"
   - Select extension folder
   - Click "Pack extension"

### Distribution
- Upload to Chrome Web Store
- Create GitHub Release with `.crx` file
- Update documentation

## Resources

- [Chrome Extension MV3 Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Chrome Tabs API](https://developer.chrome.com/docs/extensions/reference/tabs/)
- [Chrome Runtime API](https://developer.chrome.com/docs/extensions/reference/runtime/)

## Contributing

- Fork the repository
- Create feature branch: `git checkout -b feature/new-feature`
- Commit changes: `git commit -am 'Add new feature'`
- Push to branch: `git push origin feature/new-feature`
- Submit Pull Request

## Getting Help

- Check existing GitHub issues
- Create new issue with detailed description
- Join discussions for feature requests
