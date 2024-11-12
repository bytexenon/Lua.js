/**
 * Creates a trie (prefix tree) from an array of words.
 *
 * @param {string[]} words - An array of words to be inserted into the trie.
 * @returns {Object} The root node of the constructed trie.
 */
export function makeTrie(words: readonly string[]): { [key: string]: any } {
  const trie: { [key: string]: any } = {};
  for (const word of words) {
    let node = trie;
    for (const char of word) {
      node[char] = node[char] || {};
      node = node[char];
    }
    node["word"] = word;
  }
  return trie;
}
