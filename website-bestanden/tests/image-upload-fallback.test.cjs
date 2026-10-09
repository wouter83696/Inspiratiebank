const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../image-optimizer.js'),'utf8');
function fixture(fetch){const context={window:{},location:{protocol:'https:'},AbortController,setTimeout,clearTimeout,fetch,
 FileReader:class{readAsDataURL(file){file.arrayBuffer().then(bytes=>{this.result=`data:${file.type};base64,${Buffer.from(bytes).toString('base64')}`;this.onload();});}}};vm.createContext(context);vm.runInContext(source,context);return context.window.ImageOptimizer;}
test('a failed optimizer does not block the original upload',async()=>{
 const file=new Blob(['original'],{type:'image/png'}),optimizer=fixture(async()=>{throw Error('offline')});
 assert.equal(await optimizer.readFile(file),'data:image/png;base64,b3JpZ2luYWw=');
});
test('larger server responses retain original upload',async()=>{
 const file=new Blob(['original'],{type:'image/png'}),optimizer=fixture(async()=>({ok:true,blob:async()=>new Blob(['larger than original'],{type:'image/webp'})}));
 assert.equal(await optimizer.readFile(file),'data:image/png;base64,b3JpZ2luYWw=');
});
test('smaller optimized image is used automatically',async()=>{
 const file=new Blob(['original'],{type:'image/png'}),optimizer=fixture(async()=>({ok:true,blob:async()=>new Blob(['small'],{type:'image/webp'})}));
 assert.equal(await optimizer.readFile(file),'data:image/webp;base64,c21hbGw=');
});
