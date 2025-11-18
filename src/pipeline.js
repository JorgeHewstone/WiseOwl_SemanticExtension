import { pipeline, cos_sim } from '@xenova/transformers';

// --- Singleton Model Loader ---
// We use a promise-based singleton to ensure the model is loaded only once,
// even if multiple requests come in simultaneously.
let modelPromise = null;

/**
 * Private function to load and cache the model pipeline.
 * @returns {Promise<Function>} A promise that resolves to the embedding pipeline.
 */
function _loadModel() {
  if (modelPromise === null) {
    console.log('Loading embedding model...');
    // Load the feature-extraction pipeline.
    // 'Xenova/all-MiniLM-L6-v2' is a small, fast, and effective model
    // for sentence/paragraph embeddings.
    modelPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return modelPromise;
}

/**
 * Calculates similarity between one "topic" and an array of "texts".
 * This is much more efficient than calculating one-by-one.
 *
 * @param {string} topic The single topic string (e.g., "Artificial Intelligence").
 * @param {Array<string>} texts An array of text strings (e.g., paragraphs from the page).
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects,
 * each containing the text and its similarity score.
 */
export async function calculateSimilarities(topic, texts) {
  const model = await _loadModel();

  // 1. Embed the topic and all texts in a single batch
  const embeddings = await model([topic, ...texts], {
    pooling: 'mean',   // Average all tokens to get a single vector per text
    normalize: true, // Normalize vectors for accurate cosine similarity
  });

  // 2. Extract the topic embedding
  // .data holds the actual embedding vector (a Float32Array)
  const topicEmbedding = embeddings[0].data;

  // 3. Extract the text embeddings
  const textEmbeddings = embeddings.slice(1); // Get all embeddings except the first one

  // 4. Calculate cosine similarity for each text against the topic
  const results = [];
  for (let i = 0; i < textEmbeddings.length; i++) {
    const textEmbedding = textEmbeddings[i].data;
    const score = cos_sim(topicEmbedding, textEmbedding);

    results.push({
      text: texts[i],
      score: score,
    });
  }

  return results;
}