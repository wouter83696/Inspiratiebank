const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function fn(name){
 const start=html.indexOf(`  function ${name}(`);
 assert(start>=0,name);
 return html.slice(start,html.indexOf('\n  function ',start+1));
}
function context(){
 const ctx={window:{},normalize:(v='')=>String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),
 userLocation:{isDefault:true},DEFAULT_LOCATION:{lat:51.84,lon:5.85},KNOWN_PLACE_COORDS:{}};
 vm.createContext(ctx);
 for(const name of ['normalizeIdeaLocation','itemIsHomeActivity','haversineKm','itemCoordinate','parseDistanceKm','itemDistanceKm','itemWithinRadius','compactIdeaBadgeLabel','isHomeLocationBadge','compactPlacePills'])vm.runInContext(fn(name),ctx);
 vm.runInContext(fs.readFileSync(path.join(root,'website-bestanden/agenda-view-shared.js'),'utf8'),ctx);
 return ctx;
}
test('mixed source time formats sort by start time, unknown times last',()=>{
 const ctx=context();
 const times=['20.00 uur','van 13:30 tot 15:30 uur','diverse tijden','19:00 / 23:00','van 18:30 tot 21:30 uur','9 uur','09:15',''];
 const original=times.map(time=>({time}));
 const actual=ctx.window.AgendaViewShared.sortAgendaItems(original).map(x=>x.time);
 assert.deepEqual(Array.from(actual),['9 uur','09:15','van 13:30 tot 15:30 uur','van 18:30 tot 21:30 uur','19:00 / 23:00','20.00 uur','diverse tijden','']);
 assert.deepEqual(original.map(x=>x.time),times);
});
test('radius handles measured distances, legacy bands, unknown venues and own-location activities',()=>{
 const ctx=context();
 for(const radius of [3,10,25])assert.equal(ctx.itemWithinRadius({distanceBand:'25–50 km',locationType:'Op pad'},radius),false);
 assert.equal(ctx.itemWithinRadius({distanceBand:'0–10 km',locationType:'Op pad'},3),false);
 assert.equal(ctx.itemWithinRadius({distanceBand:'0–10 km',locationType:'Op pad'},10),true);
 assert.equal(ctx.itemWithinRadius({distanceKm:'4.5',locationType:'Op pad'},3),false);
 assert.equal(ctx.itemWithinRadius({distanceKm:'4.5',locationType:'Op pad'},5),true);
 assert.equal(ctx.itemWithinRadius({locationType:'Op pad'},10),false);
 assert.equal(ctx.itemWithinRadius({locationType:'Thuis'},3),true);
 assert.equal(ctx.itemWithinRadius({locationType:'Buiten',distanceBand:'Op locatie'},3),true);
 assert.equal(ctx.itemWithinRadius({distanceBand:'50+ km'},50),true);
 ctx.userLocation={isDefault:false,lat:52,lon:6};
 assert.equal(ctx.itemWithinRadius({distanceKm:'2',locationType:'Op pad'},10),false);
 assert.equal(ctx.itemWithinRadius({distanceBand:'0–10 km',locationType:'Op pad'},10),false);
});
test('home and outdoor cards do not get an invented indoor badge',()=>{
 const ctx=context();
 assert.deepEqual(Array.from(ctx.compactPlacePills('Thuis','Op locatie')),['Thuis']);
 assert.deepEqual(Array.from(ctx.compactPlacePills('Buiten','Op locatie')),['Buiten']);
 const data=JSON.parse(fs.readFileSync(path.join(root,'website-bestanden/data/zomerprogramma_data.json'),'utf8'));
 for(const title of ['Wandeling met zoekopdrachten','Watermiddag','Bootcamp']){
  const item=data.inspiration.find(x=>x.title===title);
  assert.equal(item.locationType,'Buiten');
  assert(!item.tags.includes('thuis'));
 }
});
