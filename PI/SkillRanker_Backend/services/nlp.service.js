// const nlp = require('compromise');

// function extractKeywords(text) {
//   return nlp(text).nouns().out('array');
// }

// module.exports = { extractKeywords };
// services/nlp.service.js
const nlp = require('compromise');

function extractKeywords(text) {
  return nlp(text).nouns().out('array'); // ياخذ الأسماء من النص
}

module.exports = { extractKeywords };
