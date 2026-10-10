const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8');
function scrolling(reduced = false){
  const frames = new Map(), events = new Map();
  let id = 0;
  const window = {
    scrollY:1000,
    matchMedia:() => ({matches:reduced}),
    scrollTo:(_, top) => { window.scrollY = top; },
    requestAnimationFrame:fn => { frames.set(++id, fn); return id; },
    cancelAnimationFrame:key => frames.delete(key),
    addEventListener:(type, fn) => events.set(type, fn)
  };
  const context = vm.createContext({window, performance:{now:() => 0}});
  const start = html.indexOf('  function prefersReducedMotion(){');
  vm.runInContext(html.slice(start, html.indexOf('  function warmHeroBackgrounds()', start)), context);
  return {context, window, frames, events};
}
test('a new navigation cancels the previous scrolling animation', () => {
  const {context, frames} = scrolling();
  context.animatePageScroll(0);
  const previous = [...frames.keys()][0];
  context.animatePageScroll(200);
  assert.equal(frames.size, 1);
  assert.equal(frames.has(previous), false);
});
test('manual scrolling and navigation keys cancel automatic scrolling', () => {
  for(const type of ['wheel','touchstart','pointerdown','keydown']){
    const {context, frames, events} = scrolling();
    context.animatePageScroll(0);
    events.get(type)({key:'PageDown'});
    assert.equal(frames.size, 0, type);
  }
});
test('reduced motion uses immediate scrolling without scheduling frames', () => {
  const {context, window, frames} = scrolling(true);
  context.animatePageScroll(200);
  assert.equal(window.scrollY, 200);
  assert.equal(frames.size, 0);
  assert.equal(context.motionScrollBehavior(), 'auto');
});
test('animated scrolling finishes at its target', () => {
  const {context, window, frames} = scrolling();
  context.animatePageScroll(200, 300);
  const [id, step] = [...frames][0];
  frames.delete(id);
  step(300);
  assert.equal(window.scrollY, 200);
  assert.equal(frames.size, 0);
});
test('all inline scripts parse', () => {
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(!match[2].trim())continue;
    if(/application\/(ld\+)?json/i.test(match[1]))JSON.parse(match[2]);
    else new vm.Script(match[2]);
  }
});
