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
  .replace('translate(156,150) scale(0.08,-0.08)','translate(100,170) scale(0.064,-0.064)')
  .replace('translate(158,218) scale(0.024,-0.024)','translate(102,226) scale(0.018,-0.018)');
 const lettering=`data:image/svg+xml;base64,${Buffer.from(letteringSource).toString('base64')}`;
 // Keep the original illustration intact: proportional sizing, no overlay or added fade.
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="514" viewBox="0 0 1200 514">
 <image href="${hero}" width="1200" height="514" preserveAspectRatio="xMidYMid slice"/>
 <image href="${mark}" x="24" y="116" width="60" height="60"/>
 <image href="${lettering}" width="1200" height="630"/>
 </svg>`;
 await sharp(Buffer.from(svg)).jpeg({quality:92,mozjpeg:true}).toFile(path.join(root,'assets/social/inspiratiebank-delen-v12.jpg'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
