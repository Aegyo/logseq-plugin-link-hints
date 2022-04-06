import "@logseq/libs";
import { provideUI } from "./ui";
import { createObserver, Observer } from "./observer";
import { delay } from "./utils";
import { settingsSchema } from "./settings";
import {
  modes,
  modeSettings,
  registerMode,
  Targets,
  unregisterMode,
} from "./modes";

const doc = window.parent.document;

logseq.useSettingsSchema(settingsSchema);

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
  const observers: Record<Targets, Observer> = {
    links: createObserver(
      observeRoot,
      ".page-ref, #left-sidebar a, input[type='checkbox']"
    ),
    blocks: createObserver(observeRoot, ".ls-block"),
  };

  for (const mode of modes) {
    registerMode(mode, observers);
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
          registerMode(mode, observers);
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
