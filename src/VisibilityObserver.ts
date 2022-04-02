export function createObserver(root: ParentNode, selector: string) {
  const visible = new Set<Element>();
  
  const intersectionObs = new IntersectionObserver((entries) => {
    entries.forEach(({target, isIntersecting}) => {
      if (isIntersecting) visible.add(target);
      else visible.delete(target);
    })
  })

  const mutationObs = new MutationObserver((mutationList) => {
    mutationList.filter(mutation => mutation.type === 'childList')
      .forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          find(node as ParentNode, selector).forEach(link => intersectionObs.observe(link));
        })

        mutation.removedNodes.forEach(node => {
          find(node as ParentNode, selector).forEach(link => intersectionObs.unobserve(link));
        });
    });
  });

  find(root, selector).forEach(link => intersectionObs.observe(link));
  mutationObs.observe(root, { childList: true, subtree: true });

  return {
    getVisible() {
      return getVisibleRects(visible);
    },

    disconnect() {
      intersectionObs.disconnect();
      mutationObs.disconnect();
    }
  };
}

async function getVisibleRects(elements: Set<Element>) {
  const currentPosMap = new Map<Element, DOMRectReadOnly>()
  
  const tmpIntersectionObs = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting, boundingClientRect}) => {
      if (isIntersecting) currentPosMap.set(target, boundingClientRect);
    });
  });

  elements.forEach(elem => tmpIntersectionObs.observe(elem))

  await delay(0);

  return currentPosMap;
}

function find(root: Node, selector: string) {
  if (root.hasChildNodes()) {
    return (root as ParentNode).querySelectorAll(selector);
  }
  else if (root instanceof Element) {
    return root.matches(selector) ? [root] : [];
  }

  return [];
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
