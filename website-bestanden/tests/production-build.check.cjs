const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'dist');let checked=0;
for(const name of ['index.html','beheer/index.html']){
 const file=path.join(out,name),html=fs.readFileSync(file,'utf8');
 assert(html.includes('image-optimizer.'),'Upload optimizer present');
 for(const m of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"?#]+\.(?:js|css))(?:\?[^"#]*)?"/g)){
  if(/^(?:https?:|\/\/)/.test(m[1]))continue;
  const asset=m[1].startsWith('/')?path.join(out,m[1]):path.resolve(path.dirname(file),m[1]);
  assert(fs.existsSync(asset),asset);assert(/\.[a-f0-9]{16}\.cache\.(js|css)$/.test(asset),asset);
  const bytes=fs.readFileSync(asset),hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16);assert(asset.includes('.'+hash+'.cache.'));checked++;
 }
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/src=|application\/(ld\+)?json/.test(m[1]))new vm.Script(m[2]);
 assert(fs.statSync(file).size<fs.statSync(path.join(root,name)).size,'HTML smaller than source');
}
assert(!fs.existsSync(path.join(out,'lib')));assert(!fs.existsSync(path.join(out,'website-bestanden/tests')));
console.log(`Production output validated: ${checked} versioned references; inline scripts parse.`);
