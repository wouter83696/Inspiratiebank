const fs=require('node:fs');
const path=require('node:path');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/zomerprogramma_data.json'),'utf8'));
const event=(title,extra={})=>({title,week:'w40',date:'Woensdag 30 september 2026',time:'14.00',domain:'Cultuur',where:'Nijmegen',locationType:'Buiten de deur',distanceBand:'0–10 km (dichtbij)',cost:'Gratis',stimulus:'Laag',fit:'Een beschrijving voor de browsercontrole.',source:'Testbron',url:'https://example.org/event',...extra});
const external=[...Array.from({length:6},(_,i)=>event(`Testactiviteit ${i+1}`,{reviewStatus:'new',daysOfWeek:[2],time:`${10+i}.00`,url:`https://example.org/event-${i}`})),event('Test doorlopend aanbod',{date:'Dagelijks',time:'Diverse tijden',week:'w40,w41',seasonLimited:true}),event('Test volgende week',{week:'w41',date:'Woensdag 7 oktober 2026'})];
module.exports=async(context,base)=>{
 await context.addInitScript(()=>{const OriginalDate=Date;window.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:['2026-09-30T10:00:00Z']))}static now(){return new OriginalDate('2026-09-30T10:00:00Z').getTime()}}});
 await context.route(base+'/website-bestanden/data/zomerprogramma_data.json*',r=>r.fulfill({json:{...data,external}}));
};
