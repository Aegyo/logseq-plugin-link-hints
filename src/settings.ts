import type { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user";

export const settingsSchema: SettingSchemaDesc[] = [
  {
    key: "click",
    type: "string",
    title: "Shortcut: Click Mode",
    description: "Shortcut to start hinting in 'click' mode",
    default: "f",
  },
  {
    key: "shiftClick",
    type: "string",
    title: "Shortcut: Shift Click Mode",
    description: "Shortcut to start hinting in 'shift click' mode",
    default: "shift+f",
  },
  {
    key: "ctrlClick",
    type: "string",
    title: "Shortcut: Ctrl Click Mode",
    description: "Shortcut to start hinting in 'ctrl click' mode",
    default: "ctrl+f",
  },
  {
    key: "hintKeys",
    type: "string",
    title: "Valid Hint Keys",
    description: "These are the only letters which will be used in hints",
    default: "fjdkslaghrucm",
  },
];

export type SettingsKeys = "click" | "shiftClick" | "ctrlClick" | "hintKeys";
export type Settings = {
  [K in SettingsKeys]: any;
};
