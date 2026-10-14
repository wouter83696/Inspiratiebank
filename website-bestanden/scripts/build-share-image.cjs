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
 <image href="${hero}" x="-270" y="0" width="1470" height="630"/>
 <image href="${mark}" x="36" y="67" width="112" height="112"/>
 <text x="156" y="150" fill="#306571" font-family="Arial, sans-serif" font-size="80" font-weight="700">Inspiratiebank</text>
 <text x="158" y="217" fill="#477f89" font-family="Georgia, serif" font-size="50">Ontdek iets nieuws</text>
 </svg>`;
 await sharp(Buffer.from(svg)).jpeg({quality:92,mozjpeg:true}).toFile(path.join(root,'assets/social/inspiratiebank-delen-v4.jpg'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
