import { calculateSimilarities } from './pipeline';

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if this is the job we're looking for
  if (request.action === 'CALCULATE_SIMILARITY') {
    const { topic, texts } = request;

    // Perform the heavy AI task
    calculateSimilarities(topic, texts)
      .then(results => {
        // Send the results back to the content script that requested it
        sendResponse({ status: 'success', results: results });
      })
      .catch(error => {
        console.error('Error in background AI processing:', error);
        sendResponse({ status: 'error', message: error.message });
      });
    
    // Return true to indicate that we will send a response asynchronously
    return true;
  }
});