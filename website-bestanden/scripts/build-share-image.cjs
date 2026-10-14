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
 <image href="${hero}" x="0" y="58" width="1200" height="514"/>
 <image href="${mark}" x="50" y="221" width="64" height="64"/>
 <text x="122" y="268" fill="#306571" font-family="Arial, sans-serif" font-size="46" font-weight="700">Inspiratiebank</text>
 <text x="123" y="316" fill="#477f89" font-family="Georgia, serif" font-size="30">Ontdek iets nieuws</text>
 </svg>`;
 await sharp(Buffer.from(svg)).jpeg({quality:92,mozjpeg:true}).toFile(path.join(root,'assets/social/inspiratiebank-delen-v3.jpg'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
