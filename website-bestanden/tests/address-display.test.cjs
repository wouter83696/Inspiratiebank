const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'website-bestanden/photo-tiles.js'),'utf8');
const body=source.slice(source.indexOf('    const format=value'),source.indexOf('    const destination=ideaRouteDestination(item);'));
const lines=new Function('item',body+'return lines;');
test('postcode spacing and case do not create a duplicate address line',()=>{
 assert.deepEqual(lines({address:'Leuthsestraat 3, 6576JJ Ooij',postcode:'6576 jj',place:'Ooij'}),['Leuthsestraat 3','6576 JJ Ooij']);
 assert.deepEqual(lines({address:'Dorpsstraat 2, Nijmegen',place:'Nijmegen',postcode:'6511aa'}),['Dorpsstraat 2','Nijmegen','6511 AA']);
 assert.deepEqual(lines({address:'Markt 1, 1234 AB Bergen',place:'Berg'}),['Markt 1','1234 AB Bergen','Berg']);
});
test('all stored inspiration addresses render without duplicate lines or postcodes',()=>{
 const data=JSON.parse(fs.readFileSync(path.join(root,'website-bestanden/data/zomerprogramma_data.json'),'utf8'));
 for(const item of data.inspiration){
  const result=lines(item);
  const normalized=result.map(x=>x.toLowerCase().replace(/[\s,]+/g,''));
  assert.equal(new Set(normalized).size,normalized.length,item.title);
  const codes=result.join(' ').match(/\b\d{4} [A-Z]{2}\b/g)||[];
  assert.equal(new Set(codes).size,codes.length,item.title);
 }
});
