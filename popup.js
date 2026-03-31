document.addEventListener('DOMContentLoaded', () => {
  const wpmInput = document.getElementById('wpm');
  const wpmValue = document.getElementById('wpm-value');
  const chunkInput = document.getElementById('chunk-size');
  const chunkValue = document.getElementById('chunk-value');

  // Load existing settings
  chrome.storage.sync.get(['rsvpWpm', 'rsvpMaxChunk'], (result) => {
    if (result.rsvpWpm) {
      wpmInput.value = result.rsvpWpm;
      wpmValue.textContent = result.rsvpWpm;
    }
    if (result.rsvpMaxChunk) {
      chunkInput.value = result.rsvpMaxChunk;
      chunkValue.textContent = result.rsvpMaxChunk;
    }
  });

  // Save settings when changed
  wpmInput.addEventListener('input', (e) => {
    const val = e.target.value;
    wpmValue.textContent = val;
    chrome.storage.sync.set({ rsvpWpm: parseInt(val, 10) });
  });

  chunkInput.addEventListener('input', (e) => {
    const val = e.target.value;
    chunkValue.textContent = val;
    chrome.storage.sync.set({ rsvpMaxChunk: parseInt(val, 10) });
  });

  document.getElementById('open-reader-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('reader.html') });
  });
});
