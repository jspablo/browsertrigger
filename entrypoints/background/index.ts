// Configuration: Set to false to disable auto-opening index page on context menu actions
const AUTO_OPEN_ON_CONTEXT_MENU = true;

export default defineBackground(() => {
  // Helper function to open or focus the index page
  const openOrFocusIndexPage = async () => {
    const extensionURL = browser.runtime.getURL('/index.html');

    // Search for existing tabs with the extension page
    const existingTabs = await browser.tabs.query({ url: extensionURL });

    if (existingTabs.length > 0) {
      // Tab already exists, activate it
      const tab = existingTabs[0];
      await browser.tabs.update(tab.id, { active: true });

      // Also focus the window containing the tab
      if (tab.windowId) {
        await browser.windows.update(tab.windowId, { focused: true });
      }
    } else {
      // No existing tab, create a new one
      await browser.tabs.create({
        url: '/index.html'
      });
    }
  };

  // Listen for clicks on the browser action icon - cross-browser compatible
  // Chrome uses browser.action (MV3), Firefox uses browser.browserAction (MV2)
  if (browser.action?.onClicked) {
    browser.action.onClicked.addListener(async () => {
      await openOrFocusIndexPage();
    });
  } else if ((browser as any).browserAction?.onClicked) {
    (browser as any).browserAction.onClicked.addListener(async () => {
      await openOrFocusIndexPage();
    });
  }

  // Create context menu on install
  browser.runtime.onInstalled.addListener(() => {
    // Create parent menu
    browser.contextMenus.create({
      id: 'browsertrigger',
      title: 'browsertrigger',
      contexts: ['page', 'selection'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });

    // Create submenu items
    browser.contextMenus.create({
      id: 'send-text-selected',
      parentId: 'browsertrigger',
      title: 'Send Text Selected',
      contexts: ['selection'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });

    browser.contextMenus.create({
      id: 'send-full-page',
      parentId: 'browsertrigger',
      title: 'Send Full Page',
      contexts: ['page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });

    browser.contextMenus.create({
      id: 'send-screenshot',
      parentId: 'browsertrigger',
      title: 'Send Screenshot',
      contexts: ['page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
  });

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) return;

    // Process content BEFORE opening index page to maintain activeTab permission
    switch (info.menuItemId) {
      case 'send-text-selected':
        if (info.selectionText) {
          // Clear webhook response when new content is captured
          await browser.storage.local.remove('webhookResponse');

          // Save selected text to storage with content type and source URL
          await browser.storage.local.set({
            currentContent: {
              type: 'selected',
              data: info.selectionText,
              sourceUrl: tab.url || ''
            }
          });
          console.log('Saved selected text to storage');
        }
        break;

      case 'send-full-page':
        try {
          // Clear webhook response when new content is captured
          await browser.storage.local.remove('webhookResponse');

          // Execute script to get full page text
          const results = await browser.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.body.innerText
          });

          if (results && results[0]?.result) {
            await browser.storage.local.set({
              currentContent: {
                type: 'fullPage',
                data: results[0].result,
                sourceUrl: tab.url || ''
              }
            });
            console.log('Saved full page text to storage');
          }
        } catch (error) {
          console.error('Error getting full page text:', error);
        }
        break;

      case 'send-screenshot':
        try {
          // Clear webhook response when new content is captured
          await browser.storage.local.remove('webhookResponse');

          // Capture screenshot of the visible tab BEFORE switching tabs
          const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, {
            format: 'png'
          });
          if (dataUrl) {
            await browser.storage.local.set({
              currentContent: {
                type: 'screenshot',
                data: dataUrl,
                sourceUrl: tab.url || ''
              }
            });
            console.log('Saved screenshot to storage');
          }
        } catch (error) {
          console.error('Error capturing screenshot:', error);
        }
        break;
    }

    // Open or focus the index page AFTER processing content
    if (AUTO_OPEN_ON_CONTEXT_MENU) {
      await openOrFocusIndexPage();
    }
  });
});
