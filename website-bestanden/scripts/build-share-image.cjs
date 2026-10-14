// Compose the share card from the existing brand assets; no changes to site imagery.
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const root=path.resolve(__dirname,'../..');
async function main(){
 const embedded=(file,mime)=>`data:${mime};base64,${fs.readFileSync(path.join(root,file)).toString('base64')}`;
 const hero=embedded('website-bestanden/hero-achtergronden/inspiratiebank-header.png','image/png');
 const mark=embedded('inspiratiebank-app-icon-180.png','image/png');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
 <rect width="1200" height="630" fill="#fff8ee"/>
 <image href="${hero}" x="-80" y="0" width="1470" height="630"/>
 <image href="${mark}" x="56" y="134" width="78" height="78"/>
 <text x="142" y="192" fill="#306571" font-family="Arial, sans-serif" font-size="56" font-weight="700">Inspiratiebank</text>
 <text x="144" y="250" fill="#477f89" font-family="Georgia, serif" font-size="36">Ontdek iets nieuws</text>
 </svg>`;
 await sharp(Buffer.from(svg)).jpeg({quality:92,mozjpeg:true}).toFile(path.join(root,'assets/social/inspiratiebank-delen-v2.jpg'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
