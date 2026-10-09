const {test}=require('node:test'),assert=require('node:assert/strict'),sharp=require('sharp');
const {optimizeImage}=require('../../lib/optimize-image.cjs');
const handler=require('../../api/optimize-image.js');
const {Readable}=require('node:stream');
test('lossless upload optimization preserves every pixel and dimensions',async()=>{
 const png=await sharp({create:{width:200,height:120,channels:4,background:'#247a91'}}).png({compressionLevel:0}).toBuffer();
 const result=await optimizeImage(png);assert(result.optimized);assert(result.data.length<png.length);
 const before=await sharp(png).ensureAlpha().raw().toBuffer(),after=await sharp(result.data).ensureAlpha().raw().toBuffer();assert(before.equals(after));
 const meta=await sharp(result.data).metadata();assert.equal(meta.width,200);assert.equal(meta.height,120);
});
test('already compact images are never made larger',async()=>{
 const original=await sharp({create:{width:8,height:8,channels:3,background:'red'}}).webp({lossless:true}).toBuffer();
 const result=await optimizeImage(original);assert(result.data.length<=original.length);
});
test('invalid and oversized uploads are rejected',async()=>{
 await assert.rejects(optimizeImage(Buffer.from('not an image')));
 await assert.rejects(optimizeImage(Buffer.alloc(3500001)));
});
test('binary API accepts streamed bodies and returns an image without caching',async()=>{
 const png=await sharp({create:{width:80,height:80,channels:3,background:'blue'}}).png({compressionLevel:0}).toBuffer();
 const req=Readable.from([png]);req.method='POST';req.headers={'content-length':String(png.length)};
 const headers={};let body;const res={setHeader:(k,v)=>headers[k]=v,end:b=>body=b};await handler(req,res);
 assert.equal(res.statusCode,200);assert.equal(headers['Cache-Control'],'no-store');assert.equal(headers['Content-Type'],'image/webp');assert(body.length<png.length);
});
