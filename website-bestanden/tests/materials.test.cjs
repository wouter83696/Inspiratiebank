const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../idea-view-shared.js'),'utf8'),sandbox);
const view=sandbox.window.IdeaViewShared;
test('materials are optional and whitespace does not create an empty section',()=>{
 for(const value of [undefined,null,'','   ']) assert.equal(view.renderMaterials(value),'');
 assert.doesNotMatch(view.renderCard({practical:'Reserveer vooraf'}),/Materialen/);
});
test('materials stay separate from practical information and are escaped',()=>{
 const html=view.renderCard({practical:'Reserveer vooraf',supplies:'Schaar & <papier>'});
 assert.match(html,/<summary>Praktisch<\/summary>/);
 assert.match(html,/<summary>Materialen<\/summary>/);
 assert.match(html,/Schaar &amp; &lt;papier&gt;/);
 assert.equal((html.match(/Schaar/g)||[]).length,1);
});

test('list view uses the same optional materials source',()=>{
 const html=view.renderActivityRow({title:'Knutselen',supplies:'Papier',materials:'Reserveer vooraf'});
 assert.match(html,/<summary>Materialen<\/summary>/);
 assert.match(html,/Reserveer vooraf/);
 assert.equal((html.match(/Papier/g)||[]).length,1);
 assert.doesNotMatch(view.renderActivityRow({title:'Wandelen'}),/Materialen/);
});
