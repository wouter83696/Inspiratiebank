/* Reproducible production output; original source files remain readable. */
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const esbuild=require('esbuild'),sharp=require('sharp');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'dist');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex').slice(0,16);
const ignored=new Set(['.git','.github','node_modules','dist','api','lib','supabase']);
async function files(dir){let result=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())result.push(...await files(p));else if(entry.isFile())result.push(p);}return result;}
async function minify(text,loader){return (await esbuild.transform(text,{loader,minifyWhitespace:true,minifyIdentifiers:false,minifySyntax:false,legalComments:'inline',logLevel:'silent'})).code;}
async function main(){
 require('./build-search-catalogue.cjs')();
 await fs.rm(out,{recursive:true,force:true});await fs.mkdir(out);
 for(const entry of await fs.readdir(root,{withFileTypes:true})){
  if(ignored.has(entry.name)||entry.name.startsWith('.')||['package.json','package-lock.json','vercel.json'].includes(entry.name))continue;
  await fs.cp(path.join(root,entry.name),path.join(out,entry.name),{recursive:true});
 }
 // Development scripts and test fixtures are not public assets.
 for(const name of ['scripts','tests','audits'])await fs.rm(path.join(out,'website-bestanden',name),{recursive:true,force:true});
 let saved=0;const all=await files(out);
 for(const file of all){
  if(!/\.(js|css)$/.test(file))continue;
  const old=await fs.readFile(file,'utf8'),next=await minify(old,path.extname(file).slice(1));
  await fs.writeFile(file,next);saved+=Buffer.byteLength(old)-Buffer.byteLength(next);
 }
 // Lossless PNG recompression keeps URLs, dimensions and colour data intact.
 let imageSaved=0;
 for(const file of all.filter(f=>f.endsWith('.png'))){
  const old=await fs.readFile(file),meta=await sharp(old).metadata();
  if(meta.icc||meta.orientation>1||(meta.pages||1)>1||meta.depth!=='uchar')continue;
  const next=await sharp(old).png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();
  if(next.length>=old.length)continue;
  const a=await sharp(old).ensureAlpha().raw().toBuffer(),b=await sharp(next).ensureAlpha().raw().toBuffer();
  if(!a.equals(b))continue;
  await fs.writeFile(file,next);imageSaved+=old.length-next.length;
 }
 const fingerprints=new Map();
 for(const file of all.filter(f=>f.endsWith('.html'))){
  let html=await fs.readFile(file,'utf8');
  const inline=/<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let result='',last=0;
  for(const match of html.matchAll(inline)){
   result+=html.slice(last,match.index);let content=match[3];
   if(match[1].toLowerCase()==='style') content=await minify(content,'css');
   else if(!/\bsrc\s*=|\btype\s*=\s*["'](?:application\/ld\+json|application\/json)/i.test(match[2])&&content.trim())content=await minify(content,'js');
   result+=`<${match[1]}${match[2]}>${content}</${match[1]}>`;last=match.index+match[0].length;
  }
  html=result+html.slice(last);
  const refs=/<(?:script|link)\b[^>]*\b(?:src|href)="([^"?#]+\.(?:js|css))(?:\?[^"#]*)?"[^>]*>/gi;
  html=await replaceAsync(html,refs,async(match,url)=>{
   if(/^(?:https?:|\/\/)/.test(url))return match;
   const target=url.startsWith('/')?path.join(out,url):path.resolve(path.dirname(file),url);
   if(!target.startsWith(out+path.sep))throw new Error('Asset outside output');
   let version=fingerprints.get(target);
   if(!version){const data=await fs.readFile(target);version=target.replace(/\.(js|css)$/,`.${hash(data)}.cache.$1`);await fs.writeFile(version,data);fingerprints.set(target,version);}
   const next=url.replace(/\.(js|css)$/,`.${path.basename(version).split('.').slice(-3).join('.')}`);
   return match.replace(/((?:src|href)=")[^"]+"/,`$1${next}"`);
  });
  await fs.writeFile(file,html);
 }
 // Serve the complete app immediately on the agenda route, with its own metadata.
 const homepage=await fs.readFile(path.join(out,'index.html'),'utf8');
 const agenda=homepage.replace('<head>','<head><base href="/">').replace(/<title>[^<]*<\/title>/,'<title>UIT-agenda Arnhem en Nijmegen | Inspiratiebank</title>').replace(/(<link rel="canonical" href=")[^"]+/, '$1https://inspiratiebank.uitgesproken.me/uit-agenda/');
 await fs.writeFile(path.join(out,'uit-agenda/index.html'),agenda);
 console.log(`Production built: ${saved} bytes saved in external code; ${imageSaved} bytes saved in PNGs; ${fingerprints.size} versioned assets.`);
}
async function replaceAsync(text,regex,fn){let result='',last=0;for(const m of text.matchAll(regex)){result+=text.slice(last,m.index)+await fn(...m);last=m.index+m[0].length;}return result+text.slice(last);}
main().catch(error=>{console.error(error);process.exitCode=1;});
