const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
function fixture(){
  let ready,active=false,items=['old'];const rendered=[];
  const context={document:{addEventListener:(type,fn)=>{assert.equal(type,'DOMContentLoaded');ready=fn;}},
    $:()=>({classList:{contains:()=>active}}),filteredInspirationItems:()=>items,renderIdeaMap:items=>rendered.push(items)};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  let mapScriptsLoaded ='),source.indexOf('  function renderIdeaMap(')),context);
  return {ready:()=>ready(),select:value=>active=value,filter:value=>items=value,rendered,
    loaded:()=>vm.runInContext('mapScriptsLoaded',context),promise:vm.runInContext('mapScriptsReady',context)};
}
test('opening a map before scripts finish uses the latest filter results when ready',async()=>{
  const f=fixture();f.select(true);f.filter(['latest']);assert.equal(f.loaded(),false);assert.equal(f.rendered.length,0);
  f.ready();await f.promise;assert.equal(f.loaded(),true);assert.deepEqual(f.rendered,[['latest']]);
});
test('returning to tiles while scripts load does not reopen the map',async()=>{
  const f=fixture();f.select(true);f.select(false);f.ready();await f.promise;assert.equal(f.rendered.length,0);
});
