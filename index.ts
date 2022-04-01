import '@logseq/libs';

async function main() {
  logseq.App.showMsg('Link Hints loaded!');

  const visibleLinks: Map<Element, DOMRectReadOnly> = new Map();
  
  const observeRoot = parent.document.getElementById('app-container');
  if (observeRoot === null) {
    logseq.App.showMsg('Link Hints Error: Failed to find app container element');
    return;
  }

  observeLinkChanges(observeRoot, ({target, isIntersecting, boundingClientRect, rootBounds}: IntersectionObserverEntry) => {
    if (isIntersecting) visibleLinks.set(target, boundingClientRect);
    else visibleLinks.delete(target);

    console.log(target, isIntersecting, boundingClientRect, rootBounds);
  });

  logseq.App.registerCommandPalette(
    {
      key: 'link-hints-activate',
      label: 'Show Link Hints',
      keybinding: {
        mode: 'non-editing',
        binding: 'f',
      },
    },
  () => {
    console.log('pressed!')
    const fragment = document.createDocumentFragment();
    const gen = keyGenerator();
    
    visibleLinks.forEach((boundingRect, el) => {
      fragment.appendChild(createHint(el, boundingRect, gen.next().value));
    });

    parent.document.documentElement.appendChild(fragment);
    console.log("added hints", fragment);

    beginCaptureInput();
  });
}

function observeLinkChanges(
  rootElem: Element,
  onChangeCallback: (entry: IntersectionObserverEntry) => void,
): [MutationObserver, IntersectionObserver] {
  const intersectionObs = new IntersectionObserver((entries) => {
    entries.forEach(onChangeCallback)
  })

  const mutationObs = new MutationObserver((mutationList) => {
    mutationList.filter(mutation => mutation.type === 'childList')
      .forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          findLinks(node).forEach(link => intersectionObs.observe(link));
        })

        mutation.removedNodes.forEach(node => {
          findLinks(node).forEach(link => intersectionObs.unobserve(link));
        });
    });
  });

  const mutationObserverOptions = {
    childList: true,
    subtree: true,
  }

  findLinks(rootElem).forEach(link => intersectionObs.observe(link));
  mutationObs.observe(rootElem, mutationObserverOptions);

  return [mutationObs, intersectionObs];
}

function findLinks(node: Node) {
  return (node as Element)?.querySelectorAll('a[data-ref]') || [];
}

function onHotkey(callback) {
  // TODO implement
}

function* keyGenerator(): Generator<string> {
  while (true) {
    yield 'f'
  }
}

function createHint(element: Element, boundingRect: DOMRectReadOnly, keys: string) {
  const hint = document.createElement('div');

  hint.textContent = keys;

  hint.style.position = 'relative';
  hint.style.top = `${boundingRect.top}px`;
  hint.style.left = `${boundingRect.left}px`;

  return hint
}

function beginCaptureInput() {
  // TODO implement
}

logseq.ready(main).catch(console.error);
