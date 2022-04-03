import { mapKeys } from "./keyMapper";
import { delay } from "./utils";

let hints: Map<string, Element> = new Map();
let onMatchCallback: (matched: Element) => void = () => {};

const inputCaptureID = 'link-hints-input-jail';

export async function beginHinting(
  container: Element,
  elements: Map<Element, DOMRectReadOnly>,
  hintKeys: string,
  onMatch: (matched: Element) => void
) {
  const { mapping, reverse } = mapKeys([...elements.keys()], hintKeys);
  const fragment = createHintsFragment(elements, reverse);
  container.appendChild(fragment);

  hints = mapping;
  onMatchCallback = onMatch;

  // steal focus so we can watch inputs and prevent other hotkeys
  const input = await addInputCapture();
  input?.focus()
}

function createHintsFragment(
  elements: Map<Element, DOMRectReadOnly>,
  hintMap: Map<Element, string>
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  
  elements.forEach((boundingRect, el) => {
    fragment.appendChild(createHint(boundingRect, hintMap.get(el) || ''));
  });

  return fragment;
}

function createHint(boundingRect: DOMRectReadOnly, keys: string) {
  const hint = document.createElement('div');
  const text = document.createElement('span');
  hint.appendChild(text);

  text.textContent = keys;
  hint.className = 'link-hint';

  hint.style.top = `calc(${boundingRect.top}px - 1rem)`;
  hint.style.left = `max(2px, calc(${boundingRect.left}px - 1.5em))`;

  return hint
}

export async function addInputCapture(): Promise<HTMLElement | null> {
  logseq.provideModel({
    checkInput: checkInput(),
    cleanup,
  }).provideUI({
    key: inputCaptureID,
    path: 'body',
    template: `
      <input id="${inputCaptureID}"
             data-on-keyup="checkInput"
             data-on-focusout="cleanup"
      />
    `,
  });

  await delay(0);
  return parent.document.getElementById('link-hints-input-jail');
}

function checkInput() {
  let lastVal: string | null = null;

  return (data: { value: string }) => {
    // TODO should have a better way of ESC cancelling the hints than this
    if (data.value === lastVal) cleanup();
    lastVal = data.value
    
    const matches = getMatchingLinks(data.value);
    
    if (matches.length === 0) cleanup();

    if (matches.length === 1) {
      cleanup();
      onMatchCallback(matches[0] as Element);
    }
  }
}

function cleanup() {
  console.log('called cleanup')
  const linkhints = parent.document.getElementById('link-hints-container');
  if (linkhints) linkhints.innerHTML = '';

  parent.document.getElementById(inputCaptureID)?.remove();
}

function getMatchingLinks(value: string) {
  if (value.length > 2) return []
  const el = hints.get(value);
  return el ? [el] : ['fake', 'options']
}


export async function addLinkContainer(): Promise<Element> {
  logseq.provideStyle(`
    #link-hints-container {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 9999999;
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
  `).provideUI({
    key: 'link-hints-container',
    path: 'body',
    template: `
      <div id="link-hints-container"></div>
    `,
  });

  await delay(0);
  return parent.document.getElementById('link-hints-container') as Element;
}