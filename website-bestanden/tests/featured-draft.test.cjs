const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../beheer/index.html'),'utf8');
const code=source.slice(source.indexOf('  let featuredDraft=null;'),source.indexOf('  async function toggleFeaturedIdea'));
test('featured changes remain draft until explicit save and cancel restores stored selection',async()=>{
 let writes=0;
 const ctx=vm.createContext({centralStorageActive:()=>true,centralStorage:{featuredIdeaKeys:['a']},localStorage:{setItem(){writes++},removeItem(){}},FEATURED_IDEAS_KEY:'keys',FEATURED_IDEA_KEY:'key',saveCentralStorage:async()=>true,window:{}});
 vm.runInContext(code,ctx);
 vm.runInContext('featuredDraft=featuredIdeaKeys(true)',ctx);
 await vm.runInContext("saveFeaturedIdeaKeys(['b'])",ctx);
 assert.equal(writes,0);assert.equal(ctx.centralStorage.featuredIdeaKeys[0],'a');
 vm.runInContext('featuredDraft=null',ctx);
 assert.equal(vm.runInContext('featuredIdeaKeys()[0]',ctx),'a');
 vm.runInContext("featuredDraft=['c']",ctx);
 await vm.runInContext('saveFeaturedIdeaKeys(featuredDraft,true)',ctx);
 assert.equal(ctx.centralStorage.featuredIdeaKeys[0],'c');assert.ok(writes>0);
});
