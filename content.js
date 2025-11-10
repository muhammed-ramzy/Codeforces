function getHandlesFromPage() {
  const elements = Array.from(document.querySelectorAll('a[href*="/profile/"]'));
  const handles = elements.map(a => a.textContent.trim());
  return [...new Set(handles)];
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getHandles') {
    const handles = getHandlesFromPage();
    sendResponse({ handles });
  }
});
