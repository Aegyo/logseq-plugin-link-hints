import '@logseq/libs';
import { mapKeys } from './keyMapper';
import { createObserver } from './VisibilityObserver';

let hints: Map<string, Element> = new Map();
const hintKeys = 'fjdkslaghrucm';

async function main() {
  logseq.App.showMsg('Link Hints loaded!');

  const observeRoot = parent.document.getElementById('app-container');
  if (observeRoot === null) {
    logseq.App.showMsg('Link Hints Error: Failed to find app container element');
    return;
  }

  addInputCapture();
  const linkContainer = await addLinkContainer();

  const observer = createObserver(observeRoot, 'a[data-ref]');

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
    const fragment = document.createDocumentFragment();
    
    const currentPosMap = await observer.getVisible();
    console.log('posMap', currentPosMap);
    const { mapping, reverse } = mapKeys([...currentPosMap.keys()], hintKeys);
    hints = mapping;

    currentPosMap.forEach((boundingRect, el) => {
      fragment.appendChild(createHint(el, boundingRect, reverse.get(el) || ''));
    });

    linkContainer.appendChild(fragment);
    console.log("added hints", fragment);

    beginCaptureInput();
  });
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
  let lastVal: string | null = null;

  logseq.provideModel({
    captureInput(data: { value: string }) {
      console.log(data);
      if (data.value === lastVal) cleanup();
      lastVal = data.value
      
      const matches = getMatchingLinks(data.value);
      if (matches.length === 0) cleanup();

      if (matches.length === 1) {
        cleanup();
        const page = (matches[0] as unknown as HTMLOrSVGElement).dataset?.ref;
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

function getMatchingLinks(value: string) {
  if (value.length > 2) return []
  const el = hints.get(value);
  return el ? [el] : ['fake', 'options']
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
  parent.document.getElementById('link-hints-input-jail')?.focus()
  console.log(document.activeElement);
}

logseq.ready(main).catch(console.error);
