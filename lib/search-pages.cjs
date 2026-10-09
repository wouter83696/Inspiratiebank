const details=require('../website-bestanden/activity-details.js');
const ORIGIN='https://inspiratiebank.uitgesproken.me';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const places={nijmegen:'Nijmegen',arnhem:'Arnhem'};
function activityPath(item,kind){return `/activiteiten/${details.slug(item.title)||'activiteit'}--${details.identity(item,kind)}/`;}
function safeUrl(value){try{const u=new URL(value,ORIGIN);return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}}
function description(item){return String(item.description||item.fit||item.note||'').replace(/Automatisch gevonden\.?\s*/gi,'').replace(/Check details voordat je dit plant\.?/gi,'').replace(/Nog te beoordelen voor opname in het weekoverzicht\.?/gi,'').replace(/Check datum, reservering, kosten en prikkelbelasting voordat je dit plant\.?/gi,'').trim();}
function endDate(item){
 const iso=String(item.date||'').match(/^\d{4}-\d{2}-\d{2}/);if(iso)return iso[0];
 const months=['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
 const match=norm(item.date).match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
 if(!match||!months.includes(match[2]))return '';
 return `${match[3]}-${String(months.indexOf(match[2])+1).padStart(2,'0')}-${match[1].padStart(2,'0')}`;
}
function entries(catalogue,today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam'}).format(new Date())){
 return [...catalogue.inspiration.map(item=>({item,kind:'inspiration'})),...catalogue.agenda.filter(item=>endDate(item)&&endDate(item)>=today).map(item=>({item,kind:'agenda'}))].filter(({item})=>item.title);
}
function inPlace(item,key){if(/thuis|online/i.test(item.locationType||''))return false;return new RegExp(`\\b${key}\\b`).test(norm([item.title,item.address,item.where,item.place].filter(Boolean).join(' ')));}
function page({title,summary,path,body,index=true,schema}){
 const url=ORIGIN+path;
 const json=JSON.stringify(schema||{'@context':'https://schema.org','@type':'WebPage',name:title,description:summary,url,inLanguage:'nl-NL'}).replace(/</g,'\\u003c');
 return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} | Inspiratiebank</title><meta name="description" content="${escape(summary)}"><meta name="robots" content="${index?'index,follow,max-image-preview:large':'noindex,follow'}"><link rel="canonical" href="${escape(url)}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(summary)}"><meta property="og:url" content="${escape(url)}"><meta property="og:locale" content="nl_NL"><meta property="og:image" content="${ORIGIN}/inspiratiebank-app-icon-180.png"><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/website-bestanden/fonts-local.css"><link rel="stylesheet" href="/website-bestanden/search-pages.css"><script type="application/ld+json">${json}</script></head><body><header><a class="brand" href="/">Inspiratiebank</a><nav aria-label="Hoofdnavigatie"><a href="/activiteiten/">Activiteiten</a><a href="/plaatsen/">Per plaats</a><a href="/uit-agenda/">UIT-agenda</a></nav></header><main><h1>${escape(title)}</h1>${body}</main><footer><a href="/">Ontdek meer in de Inspiratiebank</a><p>Activiteiten in regio Arnhem–Nijmegen en inspiratie voor thuis.</p></footer></body></html>`;
}
function cards(list){return `<ul class="activityGrid">${list.map(({item,kind})=>`<li><article><p class="category">${escape(item.domain||'Activiteit')}${kind==='agenda'?' · '+escape(item.date):''}</p><h2><a href="${escape(activityPath(item,kind))}">${escape(item.title)}</a></h2><p>${escape(description(item))}</p>${item.where||item.address?`<p class="location">${escape(item.where||item.address)}</p>`:''}</article></li>`).join('')}</ul>`;}
function render(path,catalogue,today){
 const list=entries(catalogue,today);
 if(path==='/activiteiten/')return {status:200,html:page({title:'Activiteiten en uitjes in Arnhem en Nijmegen',summary:'Ontdek creatieve activiteiten, cultuur, natuur, sport en uitjes in regio Arnhem–Nijmegen. Ook inspiratie om thuis te doen.',path,body:`<p>Vind iets dat bij je past: een uitstapje in de regio, iets creatiefs of een activiteit voor thuis. Open een activiteit voor de beschrijving en praktische informatie.</p><nav class="placeLinks"><a href="/plaatsen/nijmegen/">Activiteiten in Nijmegen</a><a href="/plaatsen/arnhem/">Activiteiten in Arnhem</a></nav>${cards(list)}`})};
 if(path==='/plaatsen/')return {status:200,html:page({title:'Activiteiten per plaats',summary:'Vind activiteiten en uitjes in Nijmegen en Arnhem.',path,body:'<p>We beginnen in regio Arnhem–Nijmegen. Kies een plaats om het aanbod te bekijken.</p><ul>'+Object.entries(places).map(([key,name])=>`<li><a href="/plaatsen/${key}/">Activiteiten in ${name}</a></li>`).join('')+'</ul>'})};
 const place=/^\/plaatsen\/([^/]+)\/$/.exec(path);
 if(place&&places[place[1]]){
  const name=places[place[1]],matching=list.filter(({item})=>inPlace(item,place[1]));
  return {status:200,html:page({title:`Activiteiten en uitjes in ${name}`,summary:`Bekijk activiteiten in ${name}: cultuur, creatieve uitjes, sport en meer. Ontdek wat bij je past in de Inspiratiebank.`,path,index:matching.length>0,body:`<p>Op zoek naar iets om te doen in ${name}? Hieronder vind je activiteiten waarvan de vermelde locatie of titel naar ${name} verwijst. Controleer actuele openingstijden en prijzen bij de aanbieder.</p><p><a class="button" href="/?plaats=${place[1]}">Verken ${name} met de filters</a></p>${matching.length?cards(matching):'<p>Er staan momenteel geen activiteiten voor deze plaats in dit overzicht.</p>'}`})};
 }
 const match=/^\/activiteiten\/[^/]+--([ia]-[a-z0-9]+)\/$/.exec(path);
 const entry=match&&list.find(({item,kind})=>details.identity(item,kind)===match[1]);
 if(entry){
  const {item,kind}=entry,canonical=activityPath(item,kind);
  if(path!==canonical)return {status:308,location:canonical};
  const info=description(item)||'Bekijk de website van de aanbieder voor meer informatie over deze activiteit.';
  const fields=[['Datum',kind==='agenda'?item.date:''],['Tijd',kind==='agenda'?item.time:''],['Locatie',item.address||item.where||item.locationType],...details.facts(item)];
  const website=safeUrl(item.url),image=item.image&&(item.imageStatus==='approved'||item.imageApproved===true)?safeUrl(item.image):'';
  const body=`<nav aria-label="Broodkruimel"><a href="/activiteiten/">Alle activiteiten</a></nav>${image?`<img class="activityPhoto" src="${escape(image)}" alt="${escape(item.imageAlt||item.title)}" width="800" height="450">`:''}<p>${escape(info)}</p><p><a class="button" href="${escape(details.activityPath(item,kind))}">Open activiteit in de Inspiratiebank</a></p><h2>Praktische informatie</h2><dl>${fields.filter(([,v])=>v).map(([k,v])=>`<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl>${item.note&&item.note!==info?`<p>${escape(item.note)}</p>`:''}${item.supplies?`<h2>Materialen</h2><p>${escape(item.supplies)}</p>`:''}${website?`<p><a href="${escape(website)}" rel="noopener">Website van de aanbieder</a></p>`:''}<p>Controleer actuele prijzen, beschikbaarheid en openingstijden bij de aanbieder.</p>`;
  return {status:200,html:page({title:item.title,summary:info.slice(0,180),path,body})};
 }
 return {status:404,html:page({title:'Activiteit niet beschikbaar',summary:'Bekijk het actuele aanbod in de Inspiratiebank.',path:'/activiteiten/',index:false,body:'<p>Deze pagina bestaat niet of de activiteit is niet meer beschikbaar.</p><p><a href="/activiteiten/">Bekijk de beschikbare activiteiten</a></p>'})};
}
function sitemap(catalogue,today){const urls=['/','/uit-agenda/','/activiteiten/','/plaatsen/',...Object.keys(places).filter(key=>entries(catalogue,today).some(({item})=>inPlace(item,key))).map(key=>`/plaatsen/${key}/`),...entries(catalogue,today).map(({item,kind})=>activityPath(item,kind))];return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...new Set(urls)].map(p=>`<url><loc>${escape(ORIGIN+p)}</loc></url>`).join('')+'</urlset>';}
module.exports={render,sitemap,entries,endDate,activityPath,ORIGIN};
