import "@logseq/libs";
import { addInputCapture, provideUI, beginHinting } from "./ui";
import { createObserver } from "./observer";
import { delay } from "./utils";
import { Action, actions, PredefinedAction } from "./actions";
import { Settings, settingsSchema } from "./settings";

const doc = window.parent.document;

logseq.useSettingsSchema(settingsSchema);

type Mode = {
  id: string;
  keybind: string;
  description: string;
  action: PredefinedAction | Action;
};

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
  await provideUI();

  // TODO figure out why left menu links don't get observed without this delay
  await delay(2000);
  const observer = createObserver(
    observeRoot,
    ".page-ref, #left-sidebar a, input[type='checkbox']"
  );

  function registerKeybinds() {
    // eslint-disable-next-line prefer-destructuring
    const settings = logseq.settings as unknown as Settings;

    const modes: Mode[] = [
      {
        id: "link-hints-click",
        description: "Link Hints: Click",
        action: "click",
        keybind: settings.click,
      },
      {
        id: "link-hints-shift-click",
        description: "Link Hints: Shift Click",
        action: "shiftClick",
        keybind: settings.shiftClick,
      },
      {
        id: "link-hints-ctrl-click",
        description: "Link Hints: Ctrl Click",
        action: "ctrlClick",
        keybind: settings.ctrlClick,
      },
    ];

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
          beginHinting(currentPosMap, settings.hintKeys, onMatch);
        }
      );
    }
  }

  registerKeybinds();

  // this just complains about command already existing
  // logseq.addListener("settings:changed", console.log);
}

logseq.ready(main).catch(console.error);
