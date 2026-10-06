const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const shared={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'website-bestanden/idea-view-shared.js'),'utf8'),shared);
test('shared compact tile retains media and metadata while escaping its title',()=>{
 const html=shared.window.IdeaViewShared.renderPhotoTileContent({media:'<img src="photo.jpg" alt="">',icon:'<svg></svg>',pills:'<span>3 km</span>',title:'<img onerror="bad()"> & wandeling'});
 assert.match(html,/photoTileMedia/);assert.match(html,/src="photo.jpg"/);assert.match(html,/>3 km</);
 assert.match(html,/&lt;img onerror=&quot;bad\(\)&quot;&gt; &amp; wandeling/);
 assert.doesNotMatch(html,/<img onerror=/);
});
test('opening an editor preserves existing values outside the preset options',()=>{
 const source=fs.readFileSync(path.join(root,'beheer/index.html'),'utf8');
 const code=source.slice(source.indexOf('  function setEditSelect('),source.indexOf('  function resetAdminIdeaEditForm('));
 const element={options:[{value:'30 min'}],value:'',querySelectorAll:()=>[],add(option){this.options.push(option)}};
 const context={$:()=>element,normalize:x=>x,syncCustomSelect:()=>{},Option:function(text,value){this.value=value;this.text=text;this.dataset={}}};
 vm.createContext(context);vm.runInContext(code,context);context.setEditSelect('#duration','90–150 min');
 assert.equal(element.value,'90–150 min');assert.equal(element.options.at(-1).text,'90–150 min');
});
test('shared featured cards escape content and hide inactive slides from interaction',()=>{
 const html=shared.window.IdeaViewShared.renderFeaturedCard({title:'<script>bad</script>',label:'Bewerk "titel"',index:1,media:'<img src="test.jpg">',attributes:'data-admin-featured-key="test"'});
 assert.match(html,/aria-hidden="true" inert/);assert.match(html,/data-admin-featured-key="test"/);
 assert.match(html,/&lt;script&gt;bad&lt;\/script&gt;/);assert.match(html,/Bewerk &quot;titel&quot;/);
 const active=shared.window.IdeaViewShared.renderFeaturedCard({title:'Test',index:0});
 assert.match(active,/aria-hidden="false"/);assert.doesNotMatch(active,/ inert/);
});
