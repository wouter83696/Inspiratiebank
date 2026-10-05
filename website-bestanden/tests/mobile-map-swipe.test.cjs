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
