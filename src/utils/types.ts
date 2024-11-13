/**
 * Represents a node in a Trie data structure.
 * Each key in the node can either be another TrieNode or a TrieLeaf.
 */
export interface TrieNode {
  [key: string]: TrieNode | TrieLeaf;
}
export interface TrieLeaf {
  word?: string;
}
