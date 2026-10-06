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
 assert.equal((html.match(/<span>Schaar/g)||[]).length,1);
});

test('list view uses the same optional materials source',()=>{
 const html=view.renderActivityRow({title:'Knutselen',supplies:'Papier',materials:'Reserveer vooraf'});
 assert.match(html,/<summary>Materialen<\/summary>/);
 assert.match(html,/Reserveer vooraf/);
 assert.equal((html.match(/<span>Papier/g)||[]).length,1);
 assert.doesNotMatch(view.renderActivityRow({title:'Wandelen'}),/Materialen/);
});

test('checklists split legacy commas and preserve commas within explicit lines',()=>{
 assert.deepEqual(Array.from(view.materialItems('Papier, schaar; lijm.')),['Papier','schaar','lijm']);
 assert.deepEqual(Array.from(view.materialItems('Papier, A4\n- Schaar')),['Papier, A4','Schaar']);
 assert.equal((view.renderMaterials('Papier, schaar','a').match(/type="checkbox"/g)||[]).length,2);
});
test('checkmarks persist locally and are isolated by activity',()=>{
 const store=new Map();const events={};
 const context={window:{localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}},document:{addEventListener:(name,fn)=>events[name]=fn,querySelectorAll:()=>[]}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../idea-view-shared.js'),'utf8'),context);
 const key='inspiration-material:'+JSON.stringify(['a','Papier',0]);
 events.change({target:{matches:()=>true,dataset:{materialKey:key},checked:true}});
 assert.match(context.window.IdeaViewShared.renderMaterials('Papier','a'),/ checked/);
 assert.doesNotMatch(context.window.IdeaViewShared.renderMaterials('Papier','b'),/ checked/);
 events.change({target:{matches:()=>true,dataset:{materialKey:key},checked:false}});
 assert.doesNotMatch(context.window.IdeaViewShared.renderMaterials('Papier','a'),/ checked/);
});
