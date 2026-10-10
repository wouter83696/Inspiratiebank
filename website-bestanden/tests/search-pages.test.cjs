const {test}=require('node:test'),assert=require('node:assert/strict');
const select=require('../../lib/search-catalogue.generated.cjs');
const {render,sitemap,entries,activityPath}=require('../../lib/search-pages.cjs');
const data={inspiration:[{title:'Zichtbaar',domain:'Cultuur',address:'Nijmegen'},{title:'Verborgen'},{title:'Verwijderd'}],external:[],teamIdeas:[]};
test('search catalogue applies approval, hidden and deletion rules before exposing submissions',()=>{
 const result=select(data,{hiddenInspirationTitles:['verborgen'],deletedInspirationKeys:['verwijderd'],colleagueIdeas:[{id:'pending',title:'Onbeoordeeld'},{id:'approved',title:'Goedgekeurd'},{id:'hidden',title:'Verborgen inzending'}],approvedColleagueIdeaIds:['approved','hidden'],hiddenColleagueIdeaIds:['hidden']});
 assert.deepEqual(result.inspiration.map(i=>i.title),['Zichtbaar','Goedgekeurd']);
});
test('agenda publication honours overrides, blocked sources and deletions',()=>{
 const base={inspiration:[],teamIdeas:[],external:[{id:'old',title:'Oud',date:'2026-11-01'},{id:'blocked',title:'Geblokkeerd',url:'https://blocked.test'}]};
 const result=select(base,{agendaItemOverrides:[{id:'old',title:'Bijgewerkt'}],blockedAgendaRules:[{type:'source',value:'blocked.test'}],autoAgendaItems:[{id:'deleted',title:'Weg'}],deletedAgendaItemIds:['deleted']});
 assert.deepEqual(result.agenda.map(i=>i.title),['Bijgewerkt']);
});
test('expired agenda items leave the sitemap and receive an actual 404',()=>{
 const old={title:'Voorbij',date:'1 januari 2026'},future={title:'Later',date:'10 t/m 12 november 2026'};
 const cat={inspiration:[],agenda:[old,future]};
 assert.equal(entries(cat,'2026-11-11').length,1);
 assert(!sitemap(cat,'2026-11-11').includes(activityPath(old,'agenda')));
 assert.equal(render(activityPath(old,'agenda'),cat,'2026-11-11').status,404);
});
test('search pages escape source content and never render unsafe URL schemes or private fields',()=>{
 const item={title:'<script>test</script>',fit:'<img onerror=alert(1)>',domain:'Cultuur',url:'javascript:alert(1)',by:'PRIVATE SUBMITTER',email:'PRIVATE EMAIL'};
 const cat={inspiration:[item],agenda:[]};const result=render(activityPath(item,'inspiration'),cat);
 assert.equal(result.status,200);assert(result.html.includes('&lt;img'));assert(!result.html.includes('javascript:'));assert(!result.html.includes('PRIVATE'));assert(result.html.includes('rel="canonical"'));
 assert.equal(render('/activiteiten/verkeerde-naam--'+require('../activity-details.js').identity(item)+'/',cat).status,308);
});
test('regional listings do not mislabel home activities as local venues',()=>{
 const cat={inspiration:[{title:'Nijmegen tekenen',locationType:'Thuis'},{title:'Museum Nijmegen',address:'Nijmegen'}],agenda:[]};
 const html=render('/plaatsen/nijmegen/',cat).html;assert(html.includes('Museum Nijmegen'));assert(!html.includes('Nijmegen tekenen'));
 assert.equal(render('/plaatsen/onbekend/',cat).status,404);
});
test('search API fails closed on unavailable publication state and rejects mutations',async()=>{
 const handler=require('../../api/discover.js'),original=global.fetch;
 const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=body}});
 try{
  global.fetch=async()=>({ok:false});const res=response();await handler({method:'GET',url:'/activiteiten/'},res);assert.equal(res.statusCode,503);assert.equal(res.headers['Cache-Control'],'no-store');assert(!res.body.includes('Zichtbaar'));
  const post=response();await handler({method:'POST',url:'/activiteiten/'},post);assert.equal(post.statusCode,405);
 }finally{global.fetch=original;}
});
test('category pages contain only matching activities and are linked in the sitemap',()=>{
 const cat={inspiration:[{title:'Schilderen',domain:'Creatief & Expressie'},{title:'Voetbal',domain:'Sport & Bewegen'},{title:'Bordspel',domain:'Ontmoeten, Spel & Vaardigheden'}],agenda:[]};
 const html=render('/categorie/creatief/',cat).html;
 assert(html.includes('Schilderen'));assert(!html.includes('Voetbal'));assert(!html.includes('Bordspel'));
 assert(html.includes('/?categorie=creatief'));assert(sitemap(cat).includes('/categorie/creatief/'));
 assert(!sitemap(cat).includes('/categorie/natuur/'));
 assert.equal(render('/categorie/onbekend/',cat).status,404);
 assert.equal(render('/categorie/__proto__/',cat).status,404);
});
