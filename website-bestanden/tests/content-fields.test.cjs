const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/zomerprogramma_data.json'),'utf8'));
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'data/beheer_items.js'),'utf8'),context);
vm.runInNewContext(fs.readFileSync(path.join(root,'agenda-view-shared.js'),'utf8'),context);
test('published JSON and offline management data contain the same content',()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(context.window.BCJN_BEHEER_BASE)),data);
});
test('supplies and preparation are separate for mixed activity content',()=>{
 const drums=data.inspiration.find(x=>x.title==='Drum- of percussiesessie');
 assert.match(drums.supplies,/Djembés/);
 assert.doesNotMatch(drums.supplies,/geluidsafspraken/);
 assert.match(drums.materials,/geluidsafspraken/);
 const walk=data.inspiration.find(x=>x.title==='Wandeling Ooijpolder');
 assert.match(walk.supplies,/water/);
 assert.match(walk.materials,/geen rondwandeling/);
 assert.doesNotMatch(walk.fit,/terugreis/);
});
test('agenda preparation remains visible separately and escapes text',()=>{
 const render=context.window.AgendaViewShared.renderPreparation;
 assert.equal(render({}), '');
 const html=render({note:'Plan <rust>',supplies:'Oordoppen & water'});
 assert.match(html,/<summary>Praktisch<\/summary>/);
 assert.match(html,/<summary>Materialen<\/summary>/);
 assert.match(html,/&lt;rust&gt;/);
 assert.match(html,/Oordoppen &amp; water/);
});
