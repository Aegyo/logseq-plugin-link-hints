import "@logseq/libs";
import { provideUI, beginHinting } from "./ui";
import { createObserver, Observer } from "./observer";
import { delay } from "./utils";
import { Action, actions, PredefinedAction } from "./actions";
import { Settings, SettingsKeys, settingsSchema } from "./settings";

const doc = window.parent.document;

logseq.useSettingsSchema(settingsSchema);

type Mode = {
  id: string;
  keybind: SettingsKeys;
  description: string;
  action: PredefinedAction | Action;
};

const modes: Mode[] = [
  {
    id: "link-hints-click",
    description: "Link Hints: Click",
    action: "click",
    keybind: "click",
  },
  {
    id: "link-hints-shift-click",
    description: "Link Hints: Shift Click",
    action: "shiftClick",
    keybind: "shiftClick",
  },
  {
    id: "link-hints-ctrl-click",
    description: "Link Hints: Ctrl Click",
    action: "ctrlClick",
    keybind: "ctrlClick",
  },
];

const modeSettings: Record<string, Mode> = modes.reduce(
  (acc, m) => ({ ...acc, [m.keybind]: m }),
  {}
);

function registerMode(
  { id, description, keybind, action }: Mode,
  observer: Observer
) {
  // eslint-disable-next-line prefer-destructuring
  const settings = logseq.settings as unknown as Settings;

  const onMatch = action instanceof Function ? action : actions[action];
  const shortcut = settings[keybind];

  logseq.App.registerCommandPalette(
    {
      key: id,
      label: description,
      keybinding: {
        mode: "non-editing",
        binding: shortcut,
      },
    },
    async () => {
      const currentPosMap = await observer.getVisible();
      beginHinting(currentPosMap, settings.hintKeys, onMatch);
    }
  );
}

function unregisterMode({ id }: Mode) {
  const cmdID = `${logseq.baseInfo.id}/${id}`;
  logseq.App.unregister_plugin_simple_command(cmdID);
}

async function main() {
  logseq.App.showMsg("Link Hints loaded!");

  const observeRoot = doc.getElementById("app-container");
  if (observeRoot === null) {
    logseq.App.showMsg(
      "Link Hints Error: Failed to find app container element"
    );
    return;
  }

  await provideUI();

  // TODO figure out why left menu links don't get observed without this delay
  await delay(2000);
  const observer = createObserver(
    observeRoot,
    ".page-ref, #left-sidebar a, input[type='checkbox']"
  );

  for (const mode of modes) {
    registerMode(mode, observer);
  }

  let oldSettings = { ...logseq.settings! };
  function handleSettingsChanged(newSettings: typeof oldSettings) {
    console.log(oldSettings, newSettings);
    const tmp = oldSettings;
    oldSettings = newSettings;

    Object.entries(newSettings).forEach(([key, value]) => {
      if (value !== tmp[key]) {
        const mode = modeSettings[key];
        if (mode) {
          unregisterMode(mode);
          registerMode(mode, observer);
          logseq.App.showMsg(
            `Updated shortcut for '${mode.description}' to '${value}'`
          );
        }
      }
    });
  }

  let settingsChangedTimeout: number;
  logseq.on("settings:changed", (after) => {
    clearTimeout(settingsChangedTimeout);
    settingsChangedTimeout = setTimeout(
      () => handleSettingsChanged(after),
      1000
    );
  });
}

logseq.ready(main).catch(console.error);
