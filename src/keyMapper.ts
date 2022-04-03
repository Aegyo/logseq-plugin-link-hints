import { empty, insert, Trie } from "./trie";

function keyCombos(keys: Set<string>, num: number): string[] {
  if (num < 2) return [...keys];

  return [...keys].flatMap((k1) =>
    keyCombos(keys, num - 1).map((k2) => k1 + k2)
  );
}

export function mapKeys<T>(
  things: T[],
  keys: string
): {
  mapping: Trie<T>;
  reverse: Map<T, string>;
} {
  const chars = new Set(keys);

  const mapping: Trie<T> = empty();
  const reverse = new Map<T, string>();

  const tlen = things.length;
  const klen = keys.length;
  const maxKeys = Math.ceil(Math.log(tlen) / Math.log(klen));
  const combos = keyCombos(chars, maxKeys);

  things.forEach((thing, index) => {
    insert(mapping, thing, combos[index]);
    reverse.set(thing, combos[index]);
  });

  return {
    mapping,
    reverse,
  };
}
