const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const code=source.slice(source.indexOf('  function moveFeaturedCarousel('),source.indexOf('  function surpriseIdeaCard('));
function fixture(reduced=false){
 const target=()=>({events:{},attrs:{},addEventListener(name,fn){this.events[name]=fn;},setAttribute(name,value){this.attrs[name]=value;}});
 const slides=Array.from({length:3},target),dots=Array.from({length:3},target),pause=target();
 const carousel=Object.assign(target(),{dataset:{featuredIndex:'0'},querySelectorAll:q=>q==='[data-featured-slide]'?slides:dots,querySelector:()=>pause,contains:el=>el===pause});
 const doc=Object.assign(target(),{hidden:false,activeElement:null,querySelector:()=>carousel});
 const motion=Object.assign(target(),{matches:reduced});
 const timers=new Map();let id=0,observer;
 const ctx={document:doc,AbortController,queueMicrotask:fn=>fn(),window:{matchMedia:()=>motion,setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)},IntersectionObserver:class{constructor(fn){this.fn=fn;observer=this;}observe(){}disconnect(){this.disconnected=true;}}};
 vm.createContext(ctx);vm.runInContext(code,ctx);ctx.setupFeaturedCarousel();
 return {ctx,carousel,slides,dots,pause,doc,motion,timers,visible:r=>observer.fn([{isIntersecting:r>0,intersectionRatio:r}]),tick(){const [id,timer]=[...timers][0];timers.delete(id);timer.fn();},observer:()=>observer};
}
test('featured autoplay waits seven seconds, wraps and updates dots/inert slides',()=>{
 const f=fixture();assert.equal(f.timers.size,0);f.visible(.8);
 assert.equal([...f.timers.values()][0].ms,7000);
 f.tick();assert.equal(f.carousel.dataset.featuredIndex,'1');assert.equal(f.slides[0].inert,true);assert.equal(f.slides[1].inert,false);assert.equal(f.dots[1].attrs['aria-pressed'],'true');
 f.tick();f.tick();assert.equal(f.carousel.dataset.featuredIndex,'0');assert.equal(f.timers.size,1);
});
test('autoplay pauses offscreen, on hover, focus, hidden tab and explicit pause',()=>{
 const f=fixture();f.visible(.3);assert.equal(f.timers.size,0);f.visible(.8);
 f.carousel.events.pointerenter({pointerType:'mouse'});assert.equal(f.timers.size,0);
 f.carousel.events.pointerleave();assert.equal(f.timers.size,1);
 f.doc.activeElement=f.pause;f.carousel.events.focusin();assert.equal(f.timers.size,0);
 f.doc.activeElement=null;f.carousel.events.focusout();assert.equal(f.timers.size,1);
 f.doc.hidden=true;f.doc.events.visibilitychange();assert.equal(f.timers.size,0);
 f.doc.hidden=false;f.doc.events.visibilitychange();f.pause.events.click();assert.equal(f.timers.size,0);
 assert.equal(f.pause.attrs['aria-label'],'Automatisch wisselen starten');f.pause.events.click();assert.equal(f.timers.size,1);
});
test('reduced motion disables autoplay and rerender cleans up the old observer/timer',()=>{
 const f=fixture(true);f.visible(1);assert.equal(f.timers.size,0);
 f.pause.events.click();assert.equal(f.timers.size,1);
 const old=f.observer();f.ctx.setupFeaturedCarousel();assert.equal(old.disconnected,true);assert.equal(f.timers.size,0);
});
