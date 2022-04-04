import "@logseq/libs";
import { addInputCapture, addLinkContainer, beginHinting } from "./ui";
import { createObserver } from "./observer";
import { delay } from "./utils";
import { Action, actions, PredefinedAction } from "./actions";

const hintKeys = "fjdkslaghrucm";
const doc = window.parent.document;

type Mode = {
  id: string;
  keybind: string;
  description: string;
  action: PredefinedAction | Action;
};

const modes: Mode[] = [
  {
    id: "link-hints-follow",
    description: "Link Hints: follow",
    action: "click",
    keybind: "f",
  },
  {
    id: "link-hints-shift-follow",
    description: "Link Hints: Shift Click",
    action: "shiftClick",
    keybind: "shift+f",
  },
];

async function main() {
  logseq.App.showMsg("Link Hints loaded!");

  const observeRoot = doc.getElementById("app-container");
  if (observeRoot === null) {
    logseq.App.showMsg(
      "Link Hints Error: Failed to find app container element"
    );
    return;
  }

  addInputCapture();
  const linkContainer = await addLinkContainer();

  // TODO figure out why left menu links don't get observed without this delay
  await delay(2000);
  const observer = createObserver(observeRoot, ".page-ref, .recent-item > a");

  for (const { id, keybind, description, action } of modes) {
    const onMatch = action instanceof Function ? action : actions[action];

    logseq.App.registerCommandPalette(
      {
        key: id,
        label: description,
        keybinding: {
          mode: "non-editing",
          binding: keybind,
        },
      },
      async () => {
        const currentPosMap = await observer.getVisible();
        beginHinting(linkContainer, currentPosMap, hintKeys, onMatch);
      }
    );
  }
}

logseq.ready(main).catch(console.error);
