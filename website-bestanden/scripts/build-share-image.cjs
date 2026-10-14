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
  .replace('translate(156,150) scale(0.08,-0.08)','translate(164,125) scale(0.08,-0.08)')
  .replace('translate(158,218) scale(0.024,-0.024)','translate(166,182) scale(0.024,-0.024)');
 const lettering=`data:image/svg+xml;base64,${Buffer.from(letteringSource).toString('base64')}`;
 // Start farther into the original illustration so the greenery reaches the left edge.
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
 <image href="${hero}" x="-820" y="-60" width="2020" height="865.574" preserveAspectRatio="xMidYMid meet"/>
 <image href="${mark}" x="48" y="46" width="100" height="100"/>
 <image href="${lettering}" width="1200" height="630"/>
 </svg>`;
 await sharp(Buffer.from(svg)).jpeg({quality:92,mozjpeg:true}).toFile(path.join(root,'assets/social/inspiratiebank-delen-v16.jpg'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
