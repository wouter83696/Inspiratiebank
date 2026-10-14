// Compose the share card from the existing brand assets; no changes to site imagery.
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const root=path.resolve(__dirname,'../..');
async function main(){
 const embedded=(file,mime)=>`data:${mime};base64,${fs.readFileSync(path.join(root,file)).toString('base64')}`;
 const hero=embedded('website-bestanden/hero-achtergronden/inspiratiebank-header.png','image/png');
 const mark=embedded('inspiratiebank-app-icon-180.png','image/png');
 const letteringSource=fs.readFileSync(path.join(root,'assets/social/share-header-lettering.svg'),'utf8')
  .replace('translate(156,150) scale(0.08,-0.08)','translate(110,150) scale(0.088,-0.088)')
  .replace('translate(158,218) scale(0.024,-0.024)','translate(112,214) scale(0.022,-0.022)');
 const lettering=`data:image/svg+xml;base64,${Buffer.from(letteringSource).toString('base64')}`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
 <defs><linearGradient id="text-space"><stop offset="0" stop-color="#fff8ee"/><stop offset="0.48" stop-color="#fff8ee"/><stop offset="0.64" stop-color="#fff8ee" stop-opacity="0"/></linearGradient></defs>
 <image href="${hero}" x="-200" y="0" width="1400" height="600"/>
 <rect width="1200" height="600" fill="url(#text-space)"/>
 <image href="${mark}" x="28" y="204" width="70" height="70"/>
 <image href="${lettering}" x="0" y="120" width="1200" height="630"/>
 </svg>`;
 await sharp(Buffer.from(svg)).jpeg({quality:92,mozjpeg:true}).toFile(path.join(root,'assets/social/inspiratiebank-delen-v10.jpg'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
