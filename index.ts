import '@logseq/libs';

async function main() {
  logseq.App.showMsg('Link Hints loaded!');

  const visibleLinks = new Set<Element>();
  
  const observeRoot = parent.document.getElementById('app-container');
  if (observeRoot === null) {
    logseq.App.showMsg('Link Hints Error: Failed to find app container element');
    return;
  }

  const linkContainer = await addLinkContainer();

  observeLinkChanges(observeRoot, ({target, isIntersecting}: IntersectionObserverEntry) => {
    if (isIntersecting) visibleLinks.add(target,);
    else visibleLinks.delete(target);
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
  async () => {
    console.log('pressed!')
    const fragment = document.createDocumentFragment();
    const gen = keyGenerator();
    
    // previous observations don't seem to give us enough info to know where the links are now
    // so observe again (instead of getBoundingClientRect directly which has performance issues)
    const currentPosMap = new Map<Element, DOMRectReadOnly>()
    const tmpIntersectionObs = new IntersectionObserver(entries => {
      entries.forEach(({target, isIntersecting, boundingClientRect}) => {
        if (isIntersecting) currentPosMap.set(target, boundingClientRect);
      });
    });
    visibleLinks.forEach(link => tmpIntersectionObs.observe(link))


    await delay(0);
    console.log('posMap', currentPosMap);

    currentPosMap.forEach((boundingRect, el) => {
      fragment.appendChild(createHint(el, boundingRect, gen.next().value));
    });

    linkContainer.appendChild(fragment);
    console.log("added hints", fragment);

    beginCaptureInput();
  });

  // TODO find proper colors for hints
  logseq.provideStyle(`
    #link-hints-container {
      position: absolute;
      top: 0;
      left: 0;
    }

    .link-hint {
      background: white;
      position: relative;
    }
  `);
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

function addLinkContainer() {
  logseq.provideUI({
    key: 'link-hints-container',
    path: 'body',
    template: '<div id="link-hints-container"></div>'
  });

  return new Promise<Element>((resolve) => {
    setTimeout(() => resolve(parent.document.getElementById('link-hints-container') as Element), 0)
  });
}

function* keyGenerator(): Generator<string> {
  while (true) {
    yield 'f'
  }
}

function createHint(element: Element, boundingRect: DOMRectReadOnly, keys: string) {
  const hint = document.createElement('div');

  hint.textContent = keys;
  hint.className = 'link-hint';

  hint.style.position = 'relative';
  hint.style.top = `${boundingRect.top}px`;
  hint.style.left = `${boundingRect.left}px`;

  return hint
}

function beginCaptureInput() {
  // TODO implement
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

logseq.ready(main).catch(console.error);
