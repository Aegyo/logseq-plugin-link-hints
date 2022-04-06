import { Action, actions, PredefinedAction } from "./actions";
import { Observer } from "./observer";
import { Settings, SettingsKeys } from "./settings";
import { beginHinting } from "./ui";

export type Targets = "links" | "blocks";

export type Mode = {
  id: string;
  keybind: SettingsKeys;
  description: string;
  action: PredefinedAction | Action;
  targets: Targets;
};

export const modes: Mode[] = [
  {
    id: "link-hints-click",
    description: "Link Hints: Click",
    action: "click",
    keybind: "click",
    targets: "links",
  },
  {
    id: "link-hints-shift-click",
    description: "Link Hints: Shift Click",
    action: "shiftClick",
    keybind: "shiftClick",
    targets: "links",
  },
  {
    id: "link-hints-ctrl-click",
    description: "Link Hints: Ctrl Click",
    action: "ctrlClick",
    keybind: "ctrlClick",
    targets: "links",
  },
  {
    id: "link-hints-edit-block",
    description: "Link Hints: Edit Block",
    action: "editBlock",
    keybind: "editBlock",
    targets: "blocks",
  },
  {
    id: "link-hints-jump-to-block",
    description: "Link Hints: Jump to Block",
    action: "jumpToBlock",
    keybind: "jumpToBlock",
    targets: "blocks",
  },
];

export const modeSettings: Record<string, Mode> = modes.reduce(
  (acc, m) => ({ ...acc, [m.keybind]: m }),
  {}
);

export function registerMode(
  { id, description, keybind, action, targets }: Mode,
  observers: Record<Targets, Observer>
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
      const currentPosMap = await observers[targets].getVisible();
      beginHinting(currentPosMap, settings.hintKeys, onMatch);
    }
  );
}

export function unregisterMode({ id }: Mode) {
  const cmdID = `${logseq.baseInfo.id}/${id}`;
  logseq.App.unregister_plugin_simple_command(cmdID);
}
