const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const code=source.slice(source.indexOf('  function createLeafletMapProvider('),source.indexOf('  function createIdeaMapProvider('));
function fixture(){
  const frames=new Map(),calls=[];let id=0;
  const map={createPane(){},getPane:()=>({style:{}}),on(){},invalidateSize(){calls.push('resize')},fitBounds(){calls.push('fit')},remove(){calls.push('remove')}};
  const layer={on(){},addTo(){},clearLayers(){calls.push('clear')},refreshClusters(){}};
  const L={map:()=>map,control:{zoom:()=>({addTo(){}})},tileLayer:()=>({addTo(){}}),markerClusterGroup:()=>layer};
  const ctx={L,window:{L,requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:id=>frames.delete(id)},
    prefersReducedMotion:()=>false,MAP_STYLE_URL:'',MAP_REFERENCE_TILE_URL:'',MAP_TILE_URL:'',MAP_ATTRIBUTION:'',DEFAULT_LOCATION:{lat:1,lon:1},activeIdeaMapClusterKeys:null,activeIdeaMapKey:'',groupIdeaMapPoints:()=>[],setActiveIdeaMapItem:()=>calls.push('active')};
  vm.createContext(ctx);vm.runInContext(code,ctx);
  const provider=ctx.createLeafletMapProvider({querySelectorAll:()=>[]},[]);
  return {provider,frames,calls};
}
test('destroy before first frame cancels map positioning and tolerates a stale callback',()=>{
  const f=fixture(),stale=[...f.frames.values()][0];
  f.provider.destroy();assert.equal(f.frames.size,0);stale();f.provider.destroy();
  assert.deepEqual(f.calls,['clear','remove']);
});
test('live map still positions normally and cancels pending selection frames on destroy',()=>{
  const f=fixture();const [id,frame]=[...f.frames][0];f.frames.delete(id);frame();assert.deepEqual(f.calls,['resize','fit','active']);
  f.provider.setActive('');f.provider.setActiveCluster([]);assert.equal(f.frames.size,2);
  f.provider.destroy();assert.equal(f.frames.size,0);
});
