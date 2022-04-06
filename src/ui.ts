import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user";
import { Action, jumpToBlock } from "./actions";
import { mapKeys } from "./keyMapper";
import { empty, getNode, Trie } from "./trie";
import { delay } from "./utils";

let hints: Trie<Element> = empty();
let onMatchCallback: Action = () => {};

const inputCaptureID = "link-hints-input-jail";
const hintsContainerID = "link-hints-container";

const doc = window.parent.document;

function createHint(boundingRect: DOMRectReadOnly, keys: string) {
  const hint = document.createElement("div");
  const text = document.createElement("span");
  hint.appendChild(text);

  text.textContent = keys;
  hint.className = "link-hint";

  hint.style.bottom = `calc(-${boundingRect.bottom}px + ${
    boundingRect.height / 2
  }px - 0.75em)`;
  hint.style.left = `max(2px, calc(${boundingRect.left}px - 0.3em))`;

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
  const linkhints = doc.getElementById(hintsContainerID);
  if (linkhints) linkhints.innerHTML = "";

  const input = doc.getElementById(inputCaptureID) as HTMLInputElement;
  if (input) {
    input.value = "";
    input.blur();
  }
}

let prevBlock: BlockEntity | null;

function checkInput(event: KeyboardEvent) {
  if (event.code === "Escape") {
    cleanup();

    // Unable to find a way to stop ESC also losing the current block selection,
    //  so just jump back there
    if (prevBlock) {
      jumpToBlock(prevBlock.uuid);
    }

    return;
  }

  const input = event.target as HTMLInputElement;
  if (!input) {
    cleanup();
    return;
  }

  const trieNode = getNode(hints, input.value.toLowerCase());

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
}

export async function addInputCapture(): Promise<HTMLElement | null> {
  const input = document.createElement("input");
  input.id = inputCaptureID;
  input.addEventListener("keyup", checkInput);
  input.addEventListener("focusout", cleanup);
  doc.getElementById("link-hints-wrapper")?.appendChild(input);

  await delay(0);
  return doc.getElementById(inputCaptureID);
}

export async function beginHinting(
  elements: Map<Element, DOMRectReadOnly>,
  hintKeys: string,
  onMatch: Action
) {
  const container = doc.getElementById(hintsContainerID);
  if (!container) return;

  prevBlock = await logseq.Editor.getCurrentBlock();

  const { mapping, reverse } = mapKeys([...elements.keys()], hintKeys);
  const fragment = createHintsFragment(elements, reverse);
  container.appendChild(fragment);

  hints = mapping;
  onMatchCallback = onMatch;

  // steal focus so we can watch inputs and prevent other hotkeys
  const input = doc.getElementById(inputCaptureID);
  input?.focus();
}

export async function provideUI() {
  logseq
    .provideStyle(
      `
    #${hintsContainerID} {
      position: fixed;
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

    #${inputCaptureID} {
      position: fixed;
      height: 0px;
    }
  `
    )
    .provideUI({
      key: "link-hints-container",
      path: "body",
      template: `
      <div id="link-hints-wrapper">
        <div id="${hintsContainerID}"></div>
      </div>
    `,
    });

  await delay(0);

  addInputCapture();
}
