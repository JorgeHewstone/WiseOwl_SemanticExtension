import './styles.css';

const HIGHLIGHT_CLASS = 'semantic-highlight';
const MIN_NODE_LENGTH = 10; 

// --- Database Cache ---
// We use a cache so we don't load the big JSON file every time
let topicDatabase = null;

/**
 * Loads the topic-keyword JSON database from the extension files.
 */
async function loadDatabase() {
  if (topicDatabase) {
    return topicDatabase; // Return from cache
  }
  
  try {
    // This URL points to the file in our 'public/data/' folder
    const url = chrome.runtime.getURL('data/topics.json');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load topics: ${response.statusText}`);
    }
    topicDatabase = await response.json();
    console.log('Topic database loaded into content script.');
    return topicDatabase;
  } catch (error) {
    console.error('Error loading topic database:', error);
    return null;
  }
}

// --- Message Listener ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'HIGHLIGHT_TOPIC') {
    const topic = request.topic;

    (async () => {
      clearHighlights();
      
      // 1. Make sure the database is loaded
      const db = await loadDatabase();
      if (!db) {
        sendResponse({ status: 'Error: Database not loaded' });
        return;
      }
      
      // 2. Get the keywords for the *exact* topic name
      const keywords = db[topic]; 

      if (!keywords || keywords.length === 0) {
        console.log(`No keywords found for topic: ${topic}`);
        sendResponse({ status: 'No keywords for topic' });
        return;
      }

      // 3. Highlight (this logic is unchanged)
      findAndHighlight(keywords);
      sendResponse({ status: 'Highlights applied' });
    })();
    
    return true; // Indicates an async response
  }

  if (request.action === 'CLEAR_HIGHLIGHTS') {
    clearHighlights();
    sendResponse({ status: 'Highlights cleared' });
  }
});

// --- Core DOM Functions (Unchanged) ---

/**
 * Finds text nodes and applies highlights if they match keywords.
 * @param {Array<string>} keywords A list of keywords to search for.
 */
function findAndHighlight(keywords) {
  const textNodes = getTextNodes(document.body);

  textNodes.forEach(node => {
    const nodeText = node.textContent.toLowerCase();

    // Check if this node's text contains ANY of the keywords
    const matches = keywords.some(keyword => nodeText.includes(keyword));

    if (matches) {
      wrapNode(node);
    }
  });
}

/**
 * Traverses the DOM to find all valid text nodes.
 */
function getTextNodes(element) {
  const nodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  
  let node;
  while ((node = walker.nextNode())) {
    const parentTag = node.parentElement?.tagName.toUpperCase();
    const text = node.textContent;

    if (
      parentTag !== 'SCRIPT' &&
      parentTag !== 'STYLE' &&
      parentTag !== 'NOSCRIPT' &&
      text.trim().length > MIN_NODE_LENGTH
    ) {
      nodes.push(node);
    }
  }
  return nodes;
}

/**
 * Wraps a text node with a <span class="semantic-highlight"> element.
 */
function wrapNode(textNode) {
  const span = document.createElement('span');
  span.className = HIGHLIGHT_CLASS;
  
  if (textNode.parentNode) {
      textNode.parentNode.insertBefore(span, textNode);
      span.appendChild(textNode);
  }
}

/**
 * Removes all highlights from the page.
 */
function clearHighlights() {
  const highlights = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
  highlights.forEach(span => {
    const textNode = span.firstChild;
    if (textNode && span.parentNode) {
      span.parentNode.replaceChild(textNode, span);
    } else if (span.parentNode) {
      span.parentNode.removeChild(span);
    }
  });
}