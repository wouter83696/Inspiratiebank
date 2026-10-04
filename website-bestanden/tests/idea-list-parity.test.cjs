const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
function adapter(file,name,next){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const start=source.indexOf(`  function ${name}(item){`);
  return source.slice(start,source.indexOf(`  function ${next}(`,start));
}
const shared=fs.readFileSync(path.join(root,'website-bestanden/idea-view-shared.js'),'utf8');
function context(){
  const sandbox={window:{},selectedAdminIdeaKey:'selected',
    normalizeIdeaLocation:x=>x,normalizeIdeaDistance:x=>x,normalizeIdeaCost:x=>x,normalizeIdeaStimulus:x=>x,
    compactPlacePills:()=>[],locationPill:()=>'',costPill:()=>'',stimulusPill:()=>'',cardMetaLine:()=>'',
    domainThemeClass:()=>'',domainIcon:()=>'<svg></svg>',audienceText:x=>x,escapeHtml:x=>x,
    ideaDomKey:x=>x.key,sharedIdeaMetadata:()=>({pills:'',meta:''}),
    approvedIdeaImage:()=>({src:'https://example.org/photo.jpg'}),adminIdeaImage:()=>({src:'https://example.org/photo.jpg'})};
  vm.createContext(sandbox);vm.runInContext(shared,sandbox);sandbox.IdeaViewShared=sandbox.window.IdeaViewShared;
  vm.runInContext(adapter('index.html','ideaRow','agendaSectionNavigation'),sandbox);
  vm.runInContext(adapter('beheer/index.html','adminIdeaStatusLabel','adminIdeaCard'),sandbox);
  vm.runInContext(adapter('beheer/index.html','adminIdeaRow','renderIdeas'),sandbox);
  return sandbox;
}
function content(html){return html.match(/<td[\s\S]*<\/td>/)[0].replace(/>\s+</g,'><');}
test('public and management adapters retain identical activity content',()=>{
  const ctx=context();
  for(const item of [
    {key:'selected',title:'Workshop & muziek',fit:'Een concrete beschrijving',materials:'Laptop en koptelefoon',url:'https://example.org/?a=1&b=2'},
    {key:'other',title:'Zonder website',description:'Beschrijving uit een inzending',rules:'Reserveer vooraf'},
    {key:'empty',title:'Activiteit met ontbrekende details'}
  ]){
    const publicRow=ctx.ideaRow(item),adminRow=ctx.adminIdeaRow(item);
    assert.equal(content(adminRow),content(publicRow));
    assert(adminRow.includes('ideaListThumb'));
    if(item.fit || item.description)assert(adminRow.includes(item.fit || item.description));
    if(item.materials || item.rules)assert(adminRow.includes(item.materials || item.rules));
    if(item.url)assert(adminRow.includes('class="ideaListTitleLink"'));
  }
});
test('shared content overrides incomplete or stale caller-supplied text',()=>{
  const ctx=context();
  const html=ctx.IdeaViewShared.renderActivityRow({title:'Actueel',fit:'Juiste beschrijving',materials:'Juiste informatie'}, {description:'Oud',practical:'Oud',title:'Oude titel'});
  assert(html.includes('Juiste beschrijving'));assert(html.includes('Juiste informatie'));assert(!html.includes('Oud'));
});
test('activity content is escaped in text and attributes',()=>{
  const ctx=context();
  const html=ctx.IdeaViewShared.renderActivityRow({title:'<script>',fit:'<img onerror="x">',materials:'A & B',url:'https://example.org/" onmouseover="x'});
  assert(!html.includes('<script>'));assert(!html.includes('<img onerror'));assert(html.includes('A &amp; B'));assert(html.includes('&quot;'));
});
test('management status labels distinguish hidden and pending activities',()=>{
 const ctx=context();
 assert.match(ctx.adminIdeaRow({title:'Verborgen activiteit',hidden:true}),/Verborgen<\/span>/);
 assert.match(ctx.adminIdeaRow({title:'Ingezonden activiteit',kind:'collega-toegevoegd',approved:false}),/Nog goed te keuren/);
 assert.doesNotMatch(ctx.adminIdeaRow({title:'Zichtbaar',kind:'collega-toegevoegd',approved:true}),/adminItemStatus/);
});
