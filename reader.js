document.addEventListener('DOMContentLoaded', () => {
  const inputSection = document.getElementById('input-section');
  const textInput = document.getElementById('text-input');
  const displayArea = document.getElementById('display-area');
  const controlsBottom = document.getElementById('controls-bottom');
  const themeToggle = document.getElementById('theme-toggle');

  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-reader');
    if (isDark) {
      document.body.classList.replace('dark-reader', 'light-reader');
      themeToggle.textContent = '🌙 Dark';
    } else {
      document.body.classList.replace('light-reader', 'dark-reader');
      themeToggle.textContent = '☀️ Light';
    }
  });

  
  document.getElementById('chunk-btn').addEventListener('click', () => {
    const text = textInput.value.trim();
    if (!text) return;
    
    // Convert newlines to paragraphs for better structure
    displayArea.innerHTML = '';
    const paragraphs = text.split(/\n+/);
    paragraphs.forEach(pText => {
      if (pText.trim()) {
        const p = document.createElement('p');
        p.textContent = pText;
        displayArea.appendChild(p);
      }
    });
    
    // Switch UI
    inputSection.style.display = 'none';
    displayArea.style.display = 'block';
    controlsBottom.style.display = 'block';
    
    // Programmatically select all text in displayArea to simulate user selection
    const range = document.createRange();
    range.selectNodeContents(displayArea);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Trigger the content script logic which will extract and format the range
    if (typeof startInPageChunking === 'function') {
      startInPageChunking();
    }
  });
  
  document.getElementById('rsvp-btn').addEventListener('click', () => {
    const text = textInput.value.trim();
    if (!text) return;
    
    if (typeof startRsvp === 'function') {
      startRsvp(text);
    }
  });
  
  document.getElementById('back-btn').addEventListener('click', () => {
    displayArea.innerHTML = '';
    displayArea.style.display = 'none';
    controlsBottom.style.display = 'none';
    inputSection.style.display = 'block';
  });
});
