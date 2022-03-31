import '@logseq/libs';

async function main() {
  logseq.App.showMsg('Link Hints loaded!');
}

logseq.ready(main).catch(console.error);
