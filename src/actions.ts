export type Action = (match: Element) => void;

// Typescript fudge so we can typecheck record values as actions,
//  but also `keyof typeof` the object and get the actual keys instead of generic 'string'
const mkActions = <T extends Record<string, Action>>(actions: T): T => actions;

export const actions = mkActions({
  click,
});

export type PredefinedAction = keyof typeof actions;

export function click(element: Element) {
  const rect = element.getBoundingClientRect();
  const options = {
    bubbles: true,
    cancelable: true,
    composed: true,
    detail: 1,
    view: window,
    clientX: Math.round(rect.left),
    clientY: Math.round(rect.top + rect.height / 2),
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
}
