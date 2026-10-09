const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const details=require('../activity-details.js');
test('activity URLs round-trip unsafe titles without leaking visitor filters',()=>{
 const item={title:'Café <script> & muziek / Nijmegen',domain:'Cultuur'};
 const url=details.activityPath(item);assert(!url.includes('<'));assert(!url.includes('postcode'));
 assert.equal(details.route(new URL(url,'https://example.test').search).activity,details.identity(item));
 assert.equal(details.route('?activiteit=bad').invalidActivity,true);
});
test('agenda links survive reordered base indices and separate dated occurrences',()=>{
 const item={title:'Workshop',date:'2026-10-09',where:'Nijmegen',url:'https://example.test/workshop'};
 assert.equal(details.identity({...item,id:'base-1'},'agenda'),details.identity({...item,id:'base-99'},'agenda'));
 assert.notEqual(details.identity(item,'agenda'),details.identity({...item,date:'2026-10-10'},'agenda'));
});
test('source refresh, image approval and address checks never imply all details were verified',()=>{
 const item={lastCheckedAt:'2026-10-01',imageStatus:'approved',addressCheckedAt:'2026-10-02'};
 const html=details.verification(item);assert(html.includes('Adres gecontroleerd'));assert(!html.includes('Activiteitinformatie gecontroleerd'));
 assert(details.verification({}).includes('Nog geen inhoudelijke controledatum'));
 assert.equal(details.date('2099-01-01'),'');assert.equal(details.date('geen datum'),'');
});
test('practical facts escape content and never invent missing prices or opening hours',()=>{
 const html=details.practical({duration:'90 min',group:'2–8',note:'<img src=x onerror=alert(1)>'});
 assert(html.includes('90 min'));assert(html.includes('2–8'));assert(!html.includes('<img'));assert(!html.includes('Openingstijden'));assert(!html.includes('Prijsindicatie'));
});
test('place links match full place names and do not assign a destination to home activities',()=>{
 details.configurePlaces(['Nijmegen','Berg en Dal','Grave']);
 assert.equal(details.itemPlace({address:'Dorpsstraat, Berg en Dal'}).name,'Berg en Dal');
 assert.equal(details.itemPlace({address:'Gravelpad 3'}),null);
 assert.equal(details.itemPlace({address:'Nijmegen',locationType:'Thuis'}),null);
 assert.equal(details.placePath('Berg en Dal'),'/?plaats=berg-en-dal');
});
test('current base activities have distinct public identities',()=>{
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/zomerprogramma_data.json')));
 for(const [kind,items] of [['inspiration',data.inspiration],['agenda',data.external]]){
 const seen=new Map();for(const item of items){const key=details.identity(item,kind);const value=JSON.stringify([item.title,item.date,item.where,item.url]);if(seen.has(key))assert.equal(seen.get(key),value,'Different activities cannot share a link');seen.set(key,value);}
 }
});

test('practical information omits metadata duplicates while retaining additional details',()=>{
 const item={duration:'2–3 uur',group:'1–8',cost:'€€',openingHours:'10–17 uur',accessibility:'Rolstoeltoegankelijk',note:'Reserveer vooraf'};
 const html=details.practical(item,{omit:['duration','group','cost']});
 for(const label of ['Duur','Groepsgrootte','Prijsindicatie'])assert(!html.includes(label));
 for(const value of ['10–17 uur','Rolstoeltoegankelijk','Reserveer vooraf'])assert(html.includes(value));
 assert(details.practical(item,{omit:['cost']}).includes('2–3 uur'));
});
