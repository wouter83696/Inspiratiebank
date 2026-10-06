const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
function extract(name,next){return src.slice(src.indexOf('  function '+name+'('),src.indexOf('  function '+next+'('));}
const code=extract('normalizeIdeaLocation','ideaLocationDisplayLabel')+extract('itemIsHomeActivity','ideaMapCoordinate')+extract('normalizeIdeaDistance','normalizedIdeaField')+extract('ideaRouteDestination','ideaRouteUrl');
const f=new Function('normalize','itemDistanceKm','distanceLabelForKm','parseDistanceKm','itemCoordinate','cleanPostcode','postcodeFromText',code+'return {normalizeIdeaLocation,itemIsHomeActivity,normalizeIdeaDistance,ideaRouteDestination};')(
 v=>String(v||'').toLowerCase(),()=>3,v=>v+' km',()=>NaN,()=>null,v=>v,()=>''
);
test('home activities never get travel distances from a city in their title',()=>{
 const home={title:'Nijmegen-quiz',locationType:'Thuis',distanceBand:'Thuis'};
 assert.equal(f.normalizeIdeaDistance(home.distanceBand,home),'Thuis');
 assert.equal(f.ideaRouteDestination(home),'');
});
test('explicit outside venues are not made home by incidental text',()=>{
 assert.equal(f.itemIsHomeActivity({locationType:'Buiten de deur',materials:'Voor thuis alvast voorbereiden.'}),false);
 assert.equal(f.normalizeIdeaLocation('Niet thuis'),'Op pad');
});
test('self-chosen outdoor activities have no invented travel distance or destination',()=>{
 const item={title:'Kubb / frisbee / spikeball',locationType:'Buiten',distanceBand:'Op locatie'};
 assert.equal(f.normalizeIdeaDistance(item.distanceBand,item),'Op locatie');
 assert.equal(f.ideaRouteDestination(item),'');
 assert.equal(f.ideaRouteDestination({title:'Museum',address:'Straat 1, Nijmegen'}),'Straat 1, Nijmegen');
});
test('graffiti is home and does not carry a destination',()=>{
 const data=JSON.parse(fs.readFileSync(path.join(root,'website-bestanden/data/zomerprogramma_data.json'),'utf8'));
 const item=data.inspiration.find(i=>i.title==='Graffiti op doek of houten panelen');
 assert.equal(item.locationType,'Thuis');assert.equal(item.distanceBand,'Thuis');
 assert.equal(f.ideaRouteDestination(item),'');
});
