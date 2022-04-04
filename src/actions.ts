export type Action = (match: Element) => void;

const clickWithOptions =
  (extraEventOptions: MouseEventInit = {}): Action =>
  (element: Element) => {
    const options = {
      bubbles: true,
      cancelable: true,
      composed: true,
      ...extraEventOptions,
    };

    const mousedownEvent = new MouseEvent("mousedown", {
      ...options,
      buttons: 1,
    });
    const mouseupEvent = new MouseEvent("mouseup", options);
    const clickEvent = new MouseEvent("click", options);

    if (element instanceof HTMLElement) element.focus();

    element.dispatchEvent(mousedownEvent);
    element.dispatchEvent(mouseupEvent);
    element.dispatchEvent(clickEvent);
  };

// Typescript fudge so we can typecheck record values as actions,
//  but also `keyof typeof` the object and get the actual keys instead of generic 'string'
const mkActions = <T extends Record<string, Action>>(actions: T): T => actions;

export const actions = mkActions({
  click: clickWithOptions(),
  shiftClick: clickWithOptions({ shiftKey: true }),
  ctrlClick: clickWithOptions({ ctrlKey: true }),
});

export type PredefinedAction = keyof typeof actions;
