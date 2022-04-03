import { delay } from "./utils";

type Observer = {
  getVisible(): Promise<Map<Element, DOMRectReadOnly>>;
  disconnect(): void;
};

function find(root: Node, selector: string) {
  if (root.hasChildNodes()) {
    return (root as ParentNode).querySelectorAll(selector);
  }

  if (root instanceof Element) {
    return root.matches(selector) ? [root] : [];
  }

  return [];
}

async function getVisibleRects(elements: Set<Element>) {
  const currentPosMap = new Map<Element, DOMRectReadOnly>();

  const tmpIntersectionObs = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting, boundingClientRect }) => {
      if (isIntersecting) currentPosMap.set(target, boundingClientRect);
    });
  });

  elements.forEach((elem) => tmpIntersectionObs.observe(elem));

  await delay(0);

  return currentPosMap;
}

export function createObserver(root: ParentNode, selector: string): Observer {
  const visible = new Set<Element>();

  const intersectionObs = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) visible.add(target);
      else visible.delete(target);
    });
  });

  const mutationObs = new MutationObserver((mutationList) => {
    mutationList
      .filter((mutation) => mutation.type === "childList")
      .forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          find(node as ParentNode, selector).forEach((link) =>
            intersectionObs.observe(link)
          );
        });

        mutation.removedNodes.forEach((node) => {
          find(node as ParentNode, selector).forEach((link) =>
            intersectionObs.unobserve(link)
          );
        });
      });
  });

  mutationObs.observe(root, { childList: true, subtree: true });
  find(root, selector).forEach((link) => intersectionObs.observe(link));

  return {
    getVisible() {
      return getVisibleRects(visible);
    },

    disconnect() {
      intersectionObs.disconnect();
      mutationObs.disconnect();
    },
  };
}
