import { mapKeys } from "./keyMapper";
import { empty, getNode, Trie } from "./trie";
import { delay } from "./utils";

let hints: Trie<Element> = empty();
let onMatchCallback: (matched: Element) => void = () => {};

const inputCaptureID = "link-hints-input-jail";

const doc = window.parent.document;

function createHint(boundingRect: DOMRectReadOnly, keys: string) {
  const hint = document.createElement("div");
  const text = document.createElement("span");
  hint.appendChild(text);

  text.textContent = keys;
  hint.className = "link-hint";

  hint.style.top = `calc(${boundingRect.top}px - 0.1em)`;
  hint.style.left = `max(2px, calc(${boundingRect.left}px - 2em))`;

  return hint;
}

function createHintsFragment(
  elements: Map<Element, DOMRectReadOnly>,
  hintMap: Map<Element, string>
): DocumentFragment {
  const fragment = document.createDocumentFragment();

  elements.forEach((boundingRect, el) => {
    fragment.appendChild(createHint(boundingRect, hintMap.get(el) || ""));
  });

  return fragment;
}

function cleanup() {
  console.log("called cleanup");
  const linkhints = doc.getElementById("link-hints-container");
  if (linkhints) linkhints.innerHTML = "";

  doc.getElementById(inputCaptureID)?.remove();
}

function checkInput() {
  let lastVal: string | null = null;

  return (data: { value: string }) => {
    // TODO should have a better way of ESC cancelling the hints than this
    if (data.value === lastVal) cleanup();
    lastVal = data.value;

    const trieNode = getNode(hints, data.value);

    if (!trieNode) {
      cleanup();
    } else if (trieNode.value) {
      cleanup();
      onMatchCallback(trieNode.value);
    } else if (!Object.keys(trieNode.children).length) {
      cleanup();
    } else {
      // TODO filter the shown hints to only trieNode.children
    }
  };
}
export async function addInputCapture(): Promise<HTMLElement | null> {
  logseq
    .provideModel({
      checkInput: checkInput(),
      cleanup,
    })
    .provideUI({
      key: inputCaptureID,
      path: "body",
      template: `
      <input id="${inputCaptureID}"
             data-on-keyup="checkInput"
             data-on-focusout="cleanup"
      />
    `,
    });

  await delay(0);
  return doc.getElementById("link-hints-input-jail");
}

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
  input?.focus();
}

export async function addLinkContainer(): Promise<Element> {
  logseq
    .provideStyle(
      `
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
  `
    )
    .provideUI({
      key: "link-hints-container",
      path: "body",
      template: `
      <div id="link-hints-container"></div>
    `,
    });

  await delay(0);
  return doc.getElementById("link-hints-container") as Element;
}
