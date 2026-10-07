const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../photo-tiles.js'),'utf8');
const code=source.slice(source.indexOf('  function fitMapPhoto('),source.indexOf('  function refreshDetailLayout('));
function fit({bottom=600,other=300,width=400,mobile=false}={}){
 const values=new Map();
 const photo={getBoundingClientRect:()=>({width,height:160}),style:{getPropertyValue:k=>values.get(k),setProperty:(k,v)=>values.set(k,v),removeProperty:k=>values.delete(k)}};
 const card={parentElement:{},querySelector:()=>photo,getBoundingClientRect:()=>({height:other+160})};
 const results={getBoundingClientRect:()=>({top:60})};
 const panel={querySelector:s=>s==='.ideaMapResults'?results:card,getBoundingClientRect:()=>({bottom})};
 const context={desktopMap:{matches:!mobile},getComputedStyle:()=>({paddingTop:'0px',paddingBottom:'0px'})};
 vm.createContext(context);vm.runInContext(code,context);
 context.fitMapPhoto(panel,()=>{});
 return values.get('--map-photo-height');
}
test('map photo preserves its ratio when all detail content fits',()=>assert.equal(fit(),'225px'));
test('map photo yields to text and links at smaller viewport heights',()=>assert.equal(fit({bottom:500}),'138px'));
test('very long content retains a small photo and mobile keeps its own sizing',()=>{
 assert.equal(fit({other:600}),'80px');assert.equal(fit({mobile:true}),undefined);
});
