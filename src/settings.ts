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
    key: "editBlock",
    type: "string",
    title: "Shortcut: Edit Block",
    description: "Display hints for blocks, and begin editing on match",
    default: "g e",
  },
  {
    key: "jumpToBlock",
    type: "string",
    title: "Shortcut: Jump to Block",
    description: "Display hints for blocks, and jump to selection",
    default: "g b",
  },
  {
    key: "hintKeys",
    type: "string",
    title: "Valid Hint Keys",
    description: "These are the only letters which will be used in hints",
    default: "fjdkslaghrucm",
  },
];

export type SettingsKeys =
  | "click"
  | "shiftClick"
  | "ctrlClick"
  | "editBlock"
  | "jumpToBlock"
  | "hintKeys";
export type Settings = {
  [K in SettingsKeys]: any;
};
