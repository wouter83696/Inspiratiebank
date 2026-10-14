// Compose the share card from the existing brand assets; no changes to site imagery.
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const root=path.resolve(__dirname,'../..');
async function main(){
 const embedded=(file,mime)=>`data:${mime};base64,${fs.readFileSync(path.join(root,file)).toString('base64')}`;
 const hero=embedded('website-bestanden/hero-achtergronden/inspiratiebank-header.png','image/png');
 const mark=embedded('inspiratiebank-app-icon-180.png','image/png');
 const lettering=embedded('assets/social/share-header-lettering.svg','image/svg+xml');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="514" viewBox="0 0 1200 514">
 <defs><linearGradient id="edge"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset="0.1" stop-color="white"/></linearGradient><mask id="edge-mask"><rect width="1200" height="514" fill="url(#edge)"/></mask></defs>
 <rect width="1200" height="514" fill="#fff8ee"/>
 <g transform="translate(140,0)"><image href="${hero}" width="1200" height="514" mask="url(#edge-mask)"/></g>
 <g transform="translate(24,119) scale(0.8)">
 <image href="${mark}" x="40" y="35" width="88" height="88"/>
 <image href="${lettering}" x="-8" y="-44" width="1200" height="630"/>
 </g>
 </svg>`;
 await sharp(Buffer.from(svg)).extract({left:0,top:30,width:1200,height:370}).jpeg({quality:92,mozjpeg:true}).toFile(path.join(root,'assets/social/inspiratiebank-delen-v9.jpg'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
