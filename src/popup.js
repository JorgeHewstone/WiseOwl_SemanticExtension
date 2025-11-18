import Fuse from 'fuse.js';

let fuse = null; // The search engine
let topicList = []; // The list of 100+ topic names

/**
 * Loads the topic names from the JSON file to power the search.
 */
async function initializeSearch() {
  try {
    const url = chrome.runtime.getURL('data/topics.json');
    const response = await fetch(url);
    const db = await response.json();
    
    // We only need the names (the "keys" from the JSON object)
    topicList = Object.keys(db); 
    
    // Configure Fuse.js
    const options = {
      includeScore: true,
      // We search the topic names directly
      threshold: 0.4, // How "fuzzy" the search is (0=exact, 1=anything)
    };
    
    // Fuse needs a list of strings
    fuse = new Fuse(topicList, options);
    
    console.log('Fuse.js search initialized with topics.');

  } catch (error)
    {
    console.error('Failed to initialize search:', error);
  }
}

/**
 * Updates the <ul> with the top 10 search results.
 */
function updateResults(query) {
  const resultsList = document.getElementById('results-list');
  resultsList.innerHTML = ''; // Clear previous results

  if (!fuse || !query) {
    return; // No engine or no query
  }

  // 1. Search with Fuse.js
  const results = fuse.search(query, { limit: 10 }); // Get top 10

  // 2. Render the <li> elements
  results.forEach(result => {
    const topicName = result.item; // The matching topic name (string)
    const li = document.createElement('li');
    li.textContent = topicName;
    li.dataset.topic = topicName; // Store the exact name
    resultsList.appendChild(li);
  });
}

// --- Main execution ---

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const resultsList = document.getElementById('results-list');
  const clearButton = document.getElementById('clear-button');

  // 1. Load the topic database for the search
  initializeSearch();

  // 2. Listen to every keystroke in the search box
  searchInput.addEventListener('input', (e) => {
    updateResults(e.target.value);
  });

  // 3. Listen for clicks on the results list
  resultsList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
      const topic = e.target.dataset.topic; // Get the topic name we stored
      if (topic) {
        // Send the selected topic to content.js
        sendMessageToContent('HIGHLIGHT_TOPIC', { topic: topic });
        searchInput.value = topic; // Put the full name in the search box
        resultsList.innerHTML = ''; // Close the droplist
      }
    }
  });

  // 4. Clear button (same as before)
  clearButton.addEventListener('click', () => {
    sendMessageToContent('CLEAR_HIGHLIGHTS');
  });
});


/**
 * Helper function to send messages to the content script.
 */
function sendMessageToContent(action, payload = {}) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { action, ...payload }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError.message);
        } else {
          console.log('Message response:', response?.status);
        }
      });
    }
  });
}