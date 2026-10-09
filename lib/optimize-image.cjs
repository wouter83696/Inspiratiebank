const sharp = require('sharp');
const MAX_BYTES = 3500000;
const MAX_PIXELS = 16000000;
async function optimizeImage(input) {
  if (!Buffer.isBuffer(input) || !input.length || input.length > MAX_BYTES) throw new Error('Invalid image size');
  const meta = await sharp(input, {limitInputPixels:MAX_PIXELS}).metadata();
  const types = {jpeg:'image/jpeg',png:'image/png',webp:'image/webp'};
  if (!types[meta.format]) throw new Error('Unsupported image');
  const original = {data:input,type:types[meta.format],optimized:false};
  // Preserve animations, orientation and colour profiles without interpretation.
  if ((meta.pages || 1) > 1 || meta.orientation > 1 || meta.icc || meta.depth !== 'uchar') return original;
  const candidate = await sharp(input,{limitInputPixels:MAX_PIXELS}).webp({lossless:true,effort:4}).toBuffer();
  if (candidate.length >= input.length) return original;
  const before = await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const after = await sharp(candidate).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if (before.info.width !== after.info.width || before.info.height !== after.info.height || !before.data.equals(after.data)) return original;
  return {data:candidate,type:'image/webp',optimized:true};
}
module.exports = {optimizeImage,MAX_BYTES};
