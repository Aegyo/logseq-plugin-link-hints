import '@logseq/libs';
import { addInputCapture, addLinkContainer, beginHinting } from './ui';
import { createObserver } from './observer';

const hintKeys = 'fjdkslaghrucm';

type Mode = {
  keybind: string;
  action: (match: Element) => void;
}

const modes: Mode[] = [
  {
    keybind: 'f',
    action: (match: Element) => {
      const page = (match as unknown as HTMLOrSVGElement).dataset?.ref;
      if (page) logseq.Editor.scrollToBlockInPage(page,'');
    },
  },
]

async function main() {
  logseq.App.showMsg('Link Hints loaded!');

  const observeRoot = parent.document.getElementById('app-container');
  if (observeRoot === null) {
    logseq.App.showMsg('Link Hints Error: Failed to find app container element');
    return;
  }

  addInputCapture();
  const linkContainer = await addLinkContainer();
  const observer = createObserver(observeRoot, '.page-ref, .recent-item');

  for (let { keybind, action } of modes) {
    logseq.App.registerCommandPalette(
      {
        key: 'link-hints-activate',
        label: 'Show Link Hints',
        keybinding: {
          mode: 'non-editing',
          binding: keybind,
        },
      },
    async () => {
      const currentPosMap = await observer.getVisible();
      beginHinting(linkContainer, currentPosMap, hintKeys, action);
    });
  }
}


logseq.ready(main).catch(console.error);
