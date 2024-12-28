/* Imports */
import { makeTrie } from "../../src/utils/utils.js";

/* Tests */
describe("Utils", () => {
  describe("makeTrie", () => {
    it("should create a trie from an array of words with no shared prefixes", () => {
      const trie = makeTrie(["123", "124"]);
      expect(trie).toEqual({
        "1": {
          "2": {
            "3": {
              word: "123",
            },
            "4": {
              word: "124",
            },
          },
        },
      });
    });

    it("should create a trie from an array of words with shared prefixes", () => {
      const trie = makeTrie(["ant", "anteater", "antelope"]);
      expect(trie).toEqual({
        a: {
          n: {
            t: {
              word: "ant",
              e: {
                a: {
                  t: {
                    e: {
                      r: {
                        word: "anteater",
                      },
                    },
                  },
                },
                l: {
                  o: {
                    p: {
                      e: {
                        word: "antelope",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it("should create an empty trie for an empty array", () => {
      const trie = makeTrie([]);
      expect(trie).toEqual({});
    });

    it("should create a trie from a single character word", () => {
      const trie = makeTrie(["a"]);
      expect(trie).toEqual({
        a: {
          word: "a",
        },
      });
    });

    it("should create a trie from a single word", () => {
      const trie = makeTrie(["cat"]);
      expect(trie).toEqual({
        c: {
          a: {
            t: {
              word: "cat",
            },
          },
        },
      });
    });

    it("should handle words with overlapping prefixes", () => {
      const trie = makeTrie(["an", "ant"]);
      expect(trie).toEqual({
        a: {
          n: {
            word: "an",
            t: {
              word: "ant",
            },
          },
        },
      });
    });
  });
});
