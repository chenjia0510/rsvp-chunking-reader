let rsvpActive = false;
let playbackTimeout = null;
let currentChunkIndex = 0;
let chunks = [];
let cachedWpm = 300;
let isPaused = false;
let hoverTimeout = null;

let isTooltipLocked = false;
let lockedWordElement = null;
let currentAudio = null;

// Use compromise.js for Natural Semantic Chunking
function nlpChunking(text, maxWords) {
  if (typeof nlp === 'undefined') {
    console.error("Compromise.js NLP library not loaded!");
    return text.split(/\s+/);
  }

  let doc = nlp(text);
  let terms = doc.json(); 
  
  let finalChunks = [];
  let currentWords = [];
  
  // Rule definitions
  const PUNC_REGEX = /[.,;:!?—]/;
  const SPLIT_WORDS = new Set(['in', 'on', 'at', 'with', 'to', 'for', 'from', 'about', 'and', 'but', 'because', 'although', 'if', 'that', 'which', 'who', 'where']);

  function pushCurrent() {
    if (currentWords.length > 0) {
      finalChunks.push(currentWords.join(' '));
      currentWords = [];
    }
  }

  terms.forEach(sentence => {
     let sTerms = sentence.terms;
     for (let i = 0; i < sTerms.length; i++) {
        let t = sTerms[i];
        let wordStr = (t.pre || '') + t.text + (t.post || ''); 
        let displayWord = wordStr.trim();
        let cleanWord = t.normal || displayWord.toLowerCase().replace(/[^a-z]/g, ''); 
        let pos = t.tags || []; 
        
        let shouldSplitBefore = false;
        
        // Rule 2 & 3: Prepositions, Conjunctions (Split Before)
        if (SPLIT_WORDS.has(cleanWord)) {
           shouldSplitBefore = true;
        }
        
        // Rule 4: Participles V-ing / V-ed (acting as supplementary)
        if (pos.includes('Gerund') || pos.includes('Participle')) {
            let prevT = i > 0 ? sTerms[i-1] : null;
            let prevTags = prevT ? (prevT.tags || []) : [];
            // Only split if it isn't part of a continuous verb tense (e.g. "is playing", "have played")
            if (prevT && !prevTags.includes('Copula') && !prevTags.includes('Auxiliary')) {
                 shouldSplitBefore = true;
            }
        }
        
        // Rule 5: Long Subjects
        if (pos.includes('Verb') && !pos.includes('Auxiliary') && !pos.includes('Copula')) {
           // If we have accumulated a lot of words (e.g., subject is 4+ words), and hit a main verb, split before it.
           if (currentWords.length >= 4) { 
               shouldSplitBefore = true;
           }
        }
        
        // Hard Maximum Limit Enforcement
        if (currentWords.length >= maxWords) {
           shouldSplitBefore = true;
        }
        
        // Execute Split Before
        // Only split if we have at least 2 words (preventing 1-word chunks) OR if hitting maxWords
        let isForcedByMaxWords = currentWords.length >= maxWords;
        if (shouldSplitBefore && (currentWords.length >= 2 || isForcedByMaxWords)) {
           pushCurrent();
        }
        
        currentWords.push(displayWord);
        
        // Rule 1: Punctuation (Split After)
        if (PUNC_REGEX.test(displayWord) || PUNC_REGEX.test(t.post || '')) {
           pushCurrent();
        }
     }
     pushCurrent(); // ensure end of sentence is flushed
  });
  
  return finalChunks.filter(c => c && c.trim().length > 0);
}

function stopRsvp() {
  rsvpActive = false;
  isPaused = false;
  clearTimeout(playbackTimeout);
  const overlay = document.getElementById('rsvp-chunking-overlay');
  if (overlay) {
    overlay.classList.add('rsvp-fade-out');
    setTimeout(() => overlay.remove(), 300);
  }
  hideDictionary();
}

function togglePause() {
  isPaused = !isPaused;
  const btn = document.getElementById('rsvp-play-btn');
  if (btn) btn.innerHTML = isPaused ? '▶ <span class="btn-text">Play</span>' : '⏸ <span class="btn-text">Pause</span>';
  
  if (!isPaused) {
    hideDictionary(); // Hide dictionary if unpaused
    
    // Clear styles from all words
    document.querySelectorAll('.rsvp-word').forEach(el => el.style.color = '');
    
    playMainLoop();
  } else {
    clearTimeout(playbackTimeout);
    // When paused, we ensure the current chunk is displayed as words so we can hover
    displayCurrentChunk();
  }
}

function jumpBack() {
  if (currentChunkIndex > 0) {
    currentChunkIndex--;
    if (isPaused) displayCurrentChunk();
  }
}

function jumpForward() {
  if (currentChunkIndex < chunks.length - 1) {
    currentChunkIndex++;
    if (isPaused) displayCurrentChunk();
  }
}

function calculateDelay(chunk, wpm) {
  const msPerWord = 60000 / wpm;
  const wordCount = Math.max(1, chunk.split(/\s+/).length);
  let delay = wordCount * msPerWord;
  if (/[.!?]\s*$/.test(chunk)) delay += (msPerWord * 2.5);
  else if (/[,;:\-—]\s*$/.test(chunk)) delay += msPerWord;
  return Math.max(200, Math.min(delay, 3000));
}

// Interactive Display logic
function displayCurrentChunk() {
  const displayElement = document.getElementById('rsvp-chunking-display');
  const progressBar = document.getElementById('rsvp-progress-bar');
  const overlay = document.getElementById('rsvp-chunking-overlay');
  
  if (!displayElement) return;

  const chunkText = chunks[currentChunkIndex];
  displayElement.innerHTML = '';
  
  // Wrap words for Dictionary Integration
  const words = chunkText.split(/\s+/).filter(Boolean);
  words.forEach(word => {
    const span = document.createElement('span');
    span.className = 'rsvp-word';
    span.textContent = word;
    
    const cleanWord = word.replace(/[^a-zA-Z-]/g, '');
    span.dataset.word = cleanWord.toLowerCase();
    
    span.addEventListener('mouseenter', handleWordHover);
    span.addEventListener('mouseleave', handleWordHoverOut);
    span.addEventListener('click', handleWordClick);
    
    displayElement.appendChild(span);
  });
  
  displayElement.style.transform = 'scale(0.98)';
  setTimeout(() => displayElement.style.transform = 'scale(1)', 50);

  if (progressBar) {
    progressBar.style.width = `${((currentChunkIndex + 1) / chunks.length) * 100}%`;
  }
}

function playMainLoop() {
  if (!rsvpActive || isPaused) return;

  if (currentChunkIndex >= chunks.length) {
    setTimeout(stopRsvp, 1000);
    return;
  }

  displayCurrentChunk();
  const chunkText = chunks[currentChunkIndex];
  const delay = calculateDelay(chunkText, cachedWpm);
  
  currentChunkIndex++;
  playbackTimeout = setTimeout(playMainLoop, delay);
}

// --- Interactive Dictionary (Hover & Click) ---

function handleWordHover(e) {
  if (isTooltipLocked) return;

  const isRsvpActive = !!document.getElementById('rsvp-chunking-overlay');
  if (isRsvpActive && !isPaused) return; // Only prevent if RSVP playing
  
  const target = e.target;
  const word = target.dataset.word;
  if (!word) return;

  const useDarkTheme = isRsvpActive || document.body.classList.contains('dark-reader');

  target.style.color = useDarkTheme ? '#fbbf24' : '#2563eb'; // Amber in dark mode, Solid Blue in light page
  target.style.background = useDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.2)';
  
  hoverTimeout = setTimeout(() => {
    showDictionary(word, target);
  }, 350); 
}

function handleWordHoverOut(e) {
  if (isTooltipLocked) return;

  const isRsvpActive = !!document.getElementById('rsvp-chunking-overlay');
  if (isRsvpActive && !isPaused) return;
  
  e.target.style.color = '';
  e.target.style.background = '';
  clearTimeout(hoverTimeout);
  hideDictionary();
}

function handleWordClick(e) {
  e.preventDefault();
  e.stopPropagation();

  const isRsvpActive = !!document.getElementById('rsvp-chunking-overlay');
  if (isRsvpActive && !isPaused) return;

  const target = e.target;
  const word = target.dataset.word;

  const tooltip = document.getElementById('rsvp-tooltip');
  const isCurrentlyShowingThisWord = tooltip && tooltip.classList.contains('visible') && tooltip.dataset.word === word;

  if (isTooltipLocked && lockedWordElement === target) {
    if (currentAudio) {
      currentAudio.currentTime = 0;
      currentAudio.play().catch(err => console.log('Audio blocked', err));
    }
    return;
  }

  if (isCurrentlyShowingThisWord) {
    if (currentAudio) {
      currentAudio.currentTime = 0;
      currentAudio.play().catch(err => console.log('Audio blocked', err));
    }
  } else {
    clearTimeout(hoverTimeout);
    showDictionary(word, target);
  }

  isTooltipLocked = true;
  
  if (lockedWordElement && lockedWordElement !== target) {
    lockedWordElement.classList.remove('rsvp-word-locked');
    lockedWordElement.style.color = '';
    lockedWordElement.style.background = '';
  }

  lockedWordElement = target;
  const useDarkTheme = isRsvpActive || document.body.classList.contains('dark-reader');
  lockedWordElement.classList.add('rsvp-word-locked');
  lockedWordElement.style.color = useDarkTheme ? '#fbbf24' : '#2563eb';
}

document.addEventListener('click', (e) => {
  if (isTooltipLocked) {
    if (e.target.closest('#rsvp-tooltip')) return; // Ignore clicks inside tooltip
    if (e.target.classList.contains('rsvp-word')) return; // handled by handleWordClick
    
    isTooltipLocked = false;
    if (lockedWordElement) {
       lockedWordElement.classList.remove('rsvp-word-locked');
       lockedWordElement.style.color = '';
       lockedWordElement.style.background = '';
       lockedWordElement = null;
    }
    hideDictionary();
  }
});

async function showDictionary(word, element) {
  currentAudio = null;
  let tooltip = document.getElementById('rsvp-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'rsvp-tooltip';
    tooltip.addEventListener('click', (e) => e.stopPropagation());
    
    // Attach to RSVP overlay if it exists, otherwise body 
    const overlay = document.getElementById('rsvp-chunking-overlay');
    if (overlay) overlay.appendChild(tooltip);
    else document.body.appendChild(tooltip);
  }
  
  tooltip.dataset.word = word;
  
  const rect = element.getBoundingClientRect();
  // Adjust fixed positioning for in-page scrolling
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  
  const overlay = document.getElementById('rsvp-chunking-overlay');
  if (overlay) {
      tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
      tooltip.style.top = `${rect.top - 15}px`;
  } else {
      tooltip.style.left = `${rect.left + scrollX + (rect.width / 2)}px`;
      tooltip.style.top = `${rect.top + scrollY - 15}px`;
  }
  
  tooltip.innerHTML = '<div class="rsvp-dict-loading">Loading...</div>';
  tooltip.classList.add('visible');
  
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    const entry = data[0];
    
    if (entry.phonetics) {
       for (let p of entry.phonetics) {
           if (p.audio) { 
               currentAudio = new Audio(p.audio); 
               currentAudio.volume = 0.5;
               break; 
           }
       }
    }
    const phonetic = entry.phonetic || (entry.phonetics.find(p => p.text)?.text) || '';

    let meaningsHtml = '';
    const meaningsToShow = entry.meanings.slice(0, 3);
    
    meaningsToShow.forEach(meaning => {
        const defObj = meaning.definitions[0];
        const pos = meaning.partOfSpeech;
        const def = defObj.definition;
        const example = defObj.example;
        
        meaningsHtml += `
          <div class="rsvp-dict-meaning">
            <div class="rsvp-dict-pos">${pos}</div>
            <div class="rsvp-dict-def">• ${def}</div>
            ${example ? `<div class="rsvp-dict-ex">"${example}"</div>` : ''}
          </div>
        `;
    });

    tooltip.innerHTML = `
      <div class="rsvp-dict-header">
        <strong>${entry.word}</strong>
        ${phonetic ? `<span class="rsvp-phonetic">${phonetic}</span>` : ''}
      </div>
      <div class="rsvp-dict-body">
        ${meaningsHtml}
      </div>
      <div class="rsvp-dict-footer">👆 Click word to lock & hear pronunciation</div>
    `;
    
  } catch(e) {
    tooltip.innerHTML = `<div class="rsvp-dict-notfound">Definition not found.</div>`;
  }
}

function hideDictionary() {
  const tooltip = document.getElementById('rsvp-tooltip');
  if (tooltip) tooltip.classList.remove('visible');
}

// --- Overlay Creation ---

function createOverlay() {
  const existing = document.getElementById('rsvp-chunking-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'rsvp-chunking-overlay';
  overlay.className = 'rsvp-fade-in';

  const progress = document.createElement('div');
  progress.id = 'rsvp-progress-bar';
  progress.className = 'rsvp-progress';
  overlay.appendChild(progress);

  const display = document.createElement('div');
  display.id = 'rsvp-chunking-display';
  display.textContent = 'Getting ready...';
  overlay.appendChild(display);
  
  const instruction = document.createElement('div');
  instruction.className = 'rsvp-instruction';
  instruction.innerHTML = 'Press <b>Space</b> to pause, <b>Left/Right</b> to navigate chunks. Hover words while paused.';
  overlay.appendChild(instruction);

  const controls = document.createElement('div');
  controls.className = 'rsvp-controls';

  const playBtn = document.createElement('button');
  playBtn.id = 'rsvp-play-btn';
  playBtn.className = 'rsvp-btn';
  playBtn.innerHTML = '⏸ <span class="btn-text">Pause</span>';
  playBtn.onclick = togglePause;
  controls.appendChild(playBtn);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'rsvp-btn close-btn';
  closeBtn.innerHTML = '✖ <span class="btn-text">Close</span>';
  closeBtn.onclick = stopRsvp;
  controls.appendChild(closeBtn);

  overlay.appendChild(controls);
  document.body.appendChild(overlay);
}

function startRsvp(text) {
  if (!text || text.trim().length === 0) return;

  chrome.storage.sync.get(['rsvpWpm', 'rsvpMaxChunk'], (result) => {
    cachedWpm = result.rsvpWpm || 300;
    const maxChunk = result.rsvpMaxChunk || 4;

    chunks = nlpChunking(text, maxChunk);
    
    if (chunks.length === 0) return;

    currentChunkIndex = 0;
    rsvpActive = true;
    isPaused = false;
    clearTimeout(playbackTimeout);

    createOverlay();
    
    setTimeout(() => {
        playMainLoop();
    }, 600);
  });
}

// --- In-Page Chunking ---

function chunkHtmlNode(node, maxChunk) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.nodeValue;
    if (!text.trim()) return;

    const leadingSpace = text.match(/^\s*/)[0];
    const trailingSpace = text.match(/\s*$/)[0];

    const chunks = nlpChunking(text.trim(), maxChunk);
    if (chunks.length === 0) return;

    const fragment = document.createDocumentFragment();
    if (leadingSpace) fragment.appendChild(document.createTextNode(leadingSpace));

    chunks.forEach((chunkText, index) => {
      const chunkSpan = document.createElement('span');
      chunkSpan.className = 'in-page-chunk';

      const words = chunkText.split(/\s+/).filter(Boolean);
      words.forEach((word, wIdx) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'rsvp-word'; 
        wordSpan.textContent = word;
        
        const cleanWord = word.replace(/[^a-zA-Z-]/g, '');
        wordSpan.dataset.word = cleanWord.toLowerCase();
        
        wordSpan.addEventListener('mouseenter', handleWordHover);
        wordSpan.addEventListener('mouseleave', handleWordHoverOut);
        wordSpan.addEventListener('click', handleWordClick);

        chunkSpan.appendChild(wordSpan);
        if (wIdx < words.length - 1) chunkSpan.appendChild(document.createTextNode(' '));
      });

      fragment.appendChild(chunkSpan);
      if (index < chunks.length - 1) fragment.appendChild(document.createTextNode(' '));
    });

    if (trailingSpace) fragment.appendChild(document.createTextNode(trailingSpace));

    node.parentNode.replaceChild(fragment, node);
  } else if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (['SCRIPT', 'STYLE', 'BUTTON', 'SVG', 'IMG', 'CODE'].includes(node.tagName.toUpperCase())) return;
      if (node.classList && node.classList.contains('in-page-chunk')) return;
    }

    const children = Array.from(node.childNodes);
    children.forEach(child => chunkHtmlNode(child, maxChunk));
  }
}

function startInPageChunking() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0 || selection.toString().trim() === '') return;
  
  const range = selection.getRangeAt(0);
  const fragment = range.extractContents(); // Preserves HTML tags

  chrome.storage.sync.get(['rsvpMaxChunk'], (result) => {
    const maxChunk = parseInt(result.rsvpMaxChunk, 10) || 4;
    
    chunkHtmlNode(fragment, maxChunk);
    
    range.insertNode(fragment);
    selection.removeAllRanges();
  });
}

// Communication Handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start_rsvp" && request.text) {
    startRsvp(request.text);
  } else if (request.action === "get_selection_and_start") {
    const selectedText = window.getSelection().toString();
    startRsvp(selectedText);
  } else if (request.action === "start_in_page" || request.action === "get_selection_and_inpage") {
    startInPageChunking();
  }
});

// Global Keyboard Navigation
document.addEventListener('keydown', (e) => {
  if (!rsvpActive) return;

  if (e.key === 'Escape') {
    stopRsvp();
  } else if (e.key === ' ') {
    e.preventDefault(); 
    togglePause();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    jumpBack();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    jumpForward();
  }
});
