export type Trie<T> = {
  value?: T;
  children: Record<string, Trie<T>>;
}

export const empty = () => ({ children: {} });

export function insert<T>(trie: Trie<T>, val: T, path: string) {
  let prev = null;
  let next = trie

  for (let char of path) {
    prev = next;
    next = prev.children[char];
    if (!next) prev.children[char] = next = empty()
  }

  next.value = val;
}

export function getNode<T>(trie: Trie<T>, path: string): Trie<T> | null {
  if (!path) return trie;
  
  let prev = null;
  let next = trie;

  for (let char of path) {
    prev = next
    next = prev.children[char];
    if (!next) return null
  }

  return next;
}