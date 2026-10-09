const config=require('../lib/search-config.generated.json');
const select=require('../lib/search-catalogue.generated.cjs');
const base=require('../website-bestanden/data/zomerprogramma_data.json');
const {render,sitemap}=require('../lib/search-pages.cjs');
async function loadCatalogue(){
 const params=new URLSearchParams({id:`eq.${config.id}`,select:config.fields.map(key=>`${key}:data->${key}`).join(',')});
 const response=await fetch(`${config.url}/rest/v1/${config.table}?${params}`,{headers:{apikey:config.key},signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw new Error('Public catalogue unavailable');
 const rows=await response.json();
 if(!Array.isArray(rows)||!rows[0])throw new Error('Public catalogue missing');
 return select(base,rows[0]);
}
async function handler(req,res){
 if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');res.statusCode=405;return res.end();}
 const request=new URL(req.url,'https://inspiratiebank.uitgesproken.me');
 const route=String(req.query?.path||request.searchParams.get('path')||'');
 const path=route?'/'+route.replace(/^\/+|\/+$/g,'')+'/':request.pathname;
 try{
  const catalogue=await loadCatalogue();
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=60');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(path==='/sitemap.xml/'||path==='/sitemap.xml'){
   res.setHeader('Content-Type','application/xml; charset=utf-8');return res.end(req.method==='HEAD'?'':sitemap(catalogue));
  }
  const result=render(path,catalogue);res.statusCode=result.status;
  if(result.location){res.setHeader('Location',result.location);return res.end();}
  res.setHeader('Content-Type','text/html; charset=utf-8');
  return res.end(req.method==='HEAD'?'':result.html);
 }catch{
  res.statusCode=503;res.setHeader('Cache-Control','no-store');res.setHeader('Retry-After','60');res.setHeader('Content-Type','text/plain; charset=utf-8');
  return res.end(req.method==='HEAD'?'':'Het aanbod is tijdelijk niet beschikbaar. Probeer het zo opnieuw.');
 }
}
module.exports=handler;module.exports.loadCatalogue=loadCatalogue;
