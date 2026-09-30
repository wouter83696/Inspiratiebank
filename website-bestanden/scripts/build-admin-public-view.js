/* Rebuild the admin preview from the CURRENT public page, in its exact cascade order.
   Run after public styling changes: node website-bestanden/scripts/build-admin-public-view.js
   Management behavior lives in beheer/index.html; never copy public application scripts. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = {
  'tab-inspiratie':'inspirationAdminPanel', 'tab-weken':'agendaReviewPanel',
  ideaCards:'adminIdeaCards', ideaList:'adminIdeaList',
  weekPanels:'agendaReviewList', longerOffers:'ongoingAdminSection', flexibleOffersWrap:'ongoingAdminList',
};
const chunks = [];
for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>|<link\b[^>]*rel="stylesheet"[^>]*>/g)) {
  if(match[1] !== undefined) chunks.push(match[1]);
  else {
    const href = match[0].match(/href="([^"]+)"/)?.[1].split('?')[0];
    if(href?.startsWith('website-bestanden/') && !href.includes('loading-screen')) chunks.push(fs.readFileSync(path.join(root, href), 'utf8'));
  }
}
let css = chunks.join('\n');
css = css.replace(/#([\w-]+)/g, (all, id) => ids[id] ? `#${ids[id]}` : all);
// Explicit :scope lets public tab selectors match the scope root itself.
css = css.replace(/#(inspirationAdminPanel|agendaReviewPanel)\b/g, ':scope#$1');
css = css.replace(/:root\b/g, ':scope');
css = css.replace(/\b(?:html|body)(?=[\s.{:#>,])/g, ':scope');
css = css.replace(/url\((['"]?)website-bestanden\//g, 'url($1');
const output = '/* Generated from index.html and its local stylesheets. Do not edit. */\n@scope (.adminPublicSurface) {\n' + css + '\n}\n';
const target = path.join(root, 'website-bestanden/admin-public-view.css');
if(process.argv.includes('--check')) {
  if(fs.readFileSync(target, 'utf8') !== output) throw new Error('Admin public view is stale; run the build script.');
} else fs.writeFileSync(target, output);
