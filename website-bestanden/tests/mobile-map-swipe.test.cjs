const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../../index.html'),'utf8');
const start=html.indexOf('    // Touch events survive');
const end=html.indexOf("    document.addEventListener('pointerdown'",start);
function setup(){
 const handlers={};const results={scrollLeft:120,scrollTop:90};
 const sheet={querySelector:()=>results};const target={closest:()=>({closest:()=>sheet})};
 const context={document:{addEventListener:(name,fn)=>handlers[name]=fn},mobile:()=>true,performance:{now:()=>100},suppressSheetClickUntil:0,ideaMapPanelExpanded:false,ideaMapPanelTall:false,syncIdeaMapPanelPresentation:()=>{}};
 vm.createContext(context);vm.runInContext(html.slice(start,end),context);
 const send=(type,x,y)=>handlers[type]({target,touches:[{clientX:x,clientY:y}],cancelable:true,preventDefault(){this.prevented=true;}});
 return {context,results,send,handlers};
}
test('upward touch swipe opens vertical list and resets rail offset',()=>{
 const s=setup();s.send('touchstart',200,600);s.send('touchmove',205,520);s.handlers.touchend();
 assert.equal(s.context.ideaMapPanelTall,true);assert.equal(s.context.ideaMapPanelExpanded,true);assert.equal(s.results.scrollLeft,0);assert.equal(s.results.scrollTop,0);
});
test('horizontal swipe, tap and cancelled swipe do not open list',()=>{
 for(const kind of ['horizontal','tap','cancel']){
  const s=setup();s.send('touchstart',200,600);
  if(kind==='horizontal')s.send('touchmove',100,590);
  if(kind==='cancel'){s.send('touchmove',200,500);s.handlers.touchcancel();}
  s.handlers.touchend();assert.equal(s.context.ideaMapPanelTall,false);
 }
});
test('closing tall mobile list restores the rail without clearing its selection',()=>{
 const classes=new Set(['isList','isExpanded']);
 const results={scrollLeft:320,scrollTop:0};
 const panel={dataset:{},classList:{contains:c=>classes.has(c),toggle(c,on){on?classes.add(c):classes.delete(c);}},querySelector:s=>s==='.ideaMapResults'?results:null};
 const context={$:()=>panel,window:{matchMedia:()=>({matches:true})},ideaMapPanelTall:false,ideaMapPanelExpanded:true,ideaMapDetailKey:'',activeIdeaMapClusterKeys:['a','b'],activeIdeaMapKey:'b'};
 vm.createContext(context);
 const sync=html.slice(html.indexOf('  function syncIdeaMapPanelPresentation(){'),html.indexOf('  function setActiveIdeaMapItem('));
 const close=html.slice(html.indexOf('  function closeIdeaMapOverlay(){'),html.indexOf('  function resetIdeaMapTransientState(){'));
 vm.runInContext(sync+close,context);
 context.ideaMapPanelTall=true;context.syncIdeaMapPanelPresentation();
 results.scrollLeft=0;results.scrollTop=400;
 context.closeIdeaMapOverlay();
 assert.equal(context.ideaMapPanelTall,false);assert.equal(context.ideaMapPanelExpanded,true);
 assert.equal(results.scrollLeft,320);assert.equal(results.scrollTop,0);
 assert.deepEqual(context.activeIdeaMapClusterKeys,['a','b']);assert.equal(context.activeIdeaMapKey,'b');
});
