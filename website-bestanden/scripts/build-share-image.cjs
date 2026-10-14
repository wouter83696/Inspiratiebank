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
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
 <rect width="1200" height="630" fill="#fff8ee"/>
 <image href="${hero}" x="-100" y="0" width="1470" height="630"/>
 <g transform="translate(8,242) scale(0.66)">
 <image href="${mark}" x="28" y="23" width="112" height="112"/>
 <image href="${lettering}" x="-8" y="-44" width="1200" height="630"/>
 </g>
 </svg>`;
 await sharp(Buffer.from(svg)).jpeg({quality:92,mozjpeg:true}).toFile(path.join(root,'assets/social/inspiratiebank-delen-v7.jpg'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
