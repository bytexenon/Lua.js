/**
 * Creates a trie (prefix tree) from an array of words.
 *
 * @param {string[]} words - An array of words to be inserted into the trie.
 * @returns {Object} The root node of the constructed trie.
 */
export function makeTrie(words: string[]): { [key: string]: any } {
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

/**
 * Mixes properties from source objects into the target object's prototype.
 *
 * @param {Function} target - The target constructor function whose prototype will be extended.
 * @param {...Function} sources - One or more source constructor functions whose prototype properties will be copied.
 */
export function mixin(target: Function, ...sources: Function[]): void {
  for (const source of sources) {
    Object.getOwnPropertyNames(source.prototype).forEach((name) => {
      if (name !== "constructor") {
        Object.defineProperty(
          target.prototype,
          name,
          Object.getOwnPropertyDescriptor(source.prototype, name) ||
            Object.create(null)
        );
      }
    });
  }
}
