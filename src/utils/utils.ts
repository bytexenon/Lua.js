export interface TrieNode {
  [key: string]: TrieNode | TrieLeaf;
}
export interface TrieLeaf {
  word?: string;
}

/**
 * Creates a trie (prefix tree) from an array of words.
 *
 * @param {readonly string[]} words - An array of words to be inserted into the trie.
 * @returns {TrieNode} The root node of the constructed trie.
 */
export function makeTrie(words: readonly string[]): TrieNode {
  const trie: TrieNode = {};
  for (const word of words) {
    let node: TrieNode = trie;
    for (const char of word) {
      node[char] = node[char] ?? {};
      node = node[char] as TrieNode;
    }
    (node as TrieLeaf).word = word;
  }
  return trie;
}
