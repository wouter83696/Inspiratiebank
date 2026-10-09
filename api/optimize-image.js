const {optimizeImage,MAX_BYTES} = require('../lib/optimize-image.cjs');
module.exports = async function(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method !== 'POST') { res.setHeader('Allow','POST');res.statusCode=405;return res.end(); }
  if(Number(req.headers['content-length']) > MAX_BYTES) {res.statusCode=413;return res.end();}
  try {
    let input=req.body;
    if(!Buffer.isBuffer(input)) {
      if(input !== undefined) throw new Error('Binary body required');
      const chunks=[];let size=0;
      for await(const chunk of req) {size+=chunk.length;if(size>MAX_BYTES)throw new Error('Too large');chunks.push(chunk);}
      input=Buffer.concat(chunks);
    }
    const result=await optimizeImage(input);
    res.setHeader('Content-Type',result.type);
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-Image-Optimized',String(result.optimized));
    res.statusCode=200;res.end(result.data);
  } catch(_) {res.statusCode=422;res.end('Afbeelding kon niet worden geoptimaliseerd.');}
};
