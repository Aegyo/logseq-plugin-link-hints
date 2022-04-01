import '@logseq/libs';

let hints: Record<string, Element> = {};
const reverseHints: Map<Element, string> = new Map();
const hintKeys = 'asdfghjkl';

async function main() {
  logseq.App.showMsg('Link Hints loaded!');

  const visibleLinks = new Set<Element>();
  
  const observeRoot = parent.document.getElementById('app-container');
  if (observeRoot === null) {
    logseq.App.showMsg('Link Hints Error: Failed to find app container element');
    return;
  }

  addInputCapture();
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
    // const gen = keyGenerator();
    
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
    assignKeys(currentPosMap);

    currentPosMap.forEach((boundingRect, el) => {
      fragment.appendChild(createHint(el, boundingRect, reverseHints.get(el) || ''));
    });

    linkContainer.appendChild(fragment);
    console.log("added hints", fragment);

    beginCaptureInput();
  });
}

// TODO replace this with a proper impl
function assignKeys(map: Map<Element, unknown>) {
  let i = 0;
  const len = hintKeys.length;
  hints = {};
  reverseHints.clear();
  map.forEach((_, el) => {
    const keys = `${hintKeys[Math.floor(i / len)]}${hintKeys[i % len]}`
    hints[keys] = el
    reverseHints.set(el, keys);
    i += 1;
  })
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

  logseq.provideStyle(`
    #link-hints-container {
      position: absolute;
      top: 0;
      left: 0;
    }

    .link-hint {
      background: var(--ls-primary-background-color);
      color: var(--ls-link-text-hover-color);
      padding: 0 0.25em;
      border-radius: 0.25em;
      box-shadow: 0 0 0.25em;
      position: absolute;
      word-break: normal;
    }

    #link-hints-input-jail {
      position: absolute;
      height: 0px;
    }
  `);

  logseq.provideUI({
    key: 'link-hints-container',
    path: 'body',
    template: `
      <div id="link-hints-container"></div>
    `,
  });

  return new Promise<Element>((resolve) => {
    setTimeout(() => resolve(parent.document.getElementById('link-hints-container') as Element), 0)
  });
}

function addInputCapture() {
  let lastVal = null;

  logseq.provideModel({
    captureInput(data) {
      console.log(data);
      if (data.value === lastVal) cleanup();
      lastVal = data.value
      
      const matches = getMatchingLinks(data.value);
      if (matches.length === 0) cleanup();

      if (matches.length === 1) {
        cleanup();
        const page = matches[0].dataset.ref;
        console.log(page);
        if (page) logseq.Editor.scrollToBlockInPage(page,'');
      }
    },
    cleanup,
  })

  logseq.provideUI({
    key: 'link-hints-input-jail',
    path: 'body',
    template: `
      <input id="link-hints-input-jail" data-on-keyup="captureInput" data-on-focusout="cleanup" />
    `,
  });
}

function cleanup() {
  console.log('called cleanup')
  const linkhints = parent.document.getElementById('link-hints-container');
  if (linkhints) linkhints.innerHTML = '';

  parent.document.getElementById('link-hints-input-jail')?.remove();

  addInputCapture();
}

function getMatchingLinks(value) {
  if (value.length > 2) return []
  if (value.length < 2) return ['fake', 'options']
  const el = hints[value]
  return el ? [el] : []
}

function* keyGenerator(): Generator<string> {
  while (true) {
    yield 'f'
  }
}

function createHint(element: Element, boundingRect: DOMRectReadOnly, keys: string) {
  const hint = document.createElement('div');
  const text = document.createElement('span');
  hint.appendChild(text);

  text.textContent = keys;
  hint.className = 'link-hint';

  hint.style.top = `calc(${boundingRect.top}px - 1rem)`;
  hint.style.left = `calc(${boundingRect.left}px - 1.5em)`;

  return hint
}

function beginCaptureInput() {
  // const onInput = (e: Event) => {
  //   e.stopPropagation();
  //   console.log(e);
  // }

  // const container = parent.document.getElementById('app-container');
  // if (container === null) return;

  // container.addEventListener('keyup', onInput);
  // container.addEventListener('keydown', onInput);

  // setTimeout(() => {
  //   container.removeEventListener('keyup', onInput);
  //   container.removeEventListener('keydown', onInput);
  // }, 10000)

  parent.document.getElementById('link-hints-input-jail')?.focus()
  console.log(document.activeElement);
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

logseq.ready(main).catch(console.error);
