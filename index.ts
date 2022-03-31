import '@logseq/libs';

console.log("We have arrived")

async function main() {
  logseq.App.showMsg('Link Hints loaded!');
}

logseq.ready(main).catch(console.error);
