const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const start=source.indexOf('  async function init(){');
const bootstrap=source.slice(start,source.indexOf('    syncLocationUi();',start))+'\n}';
function fixture(){
 const started=[],rendered=[];let site,central;
 const context={$:()=>null,loadSiteData:()=>{started.push('site');return new Promise(r=>site=r)},loadCentralStorage:()=>{started.push('central');return new Promise(r=>central=r)},
   ideaViewFromLocation:()=> 'tiles',mapScriptsReady:Promise.resolve(),renderAgenda:()=>rendered.push('agenda'),refreshCollections:()=>rendered.push('ideas'),setIdeaView:()=>{}};
 for(const name of ['setupStickyControlsBackground','setupMobileAgendaDaySync','setupTopTabNavigation','setupDesktopSidebar','setupIdeaFilterSheet','setupAgendaFilterSheet','setupBottomSheetGestures','refreshActiveWeeks','applyPublicSiteSettings','setupAgendaFilters'])context[name]=()=>{};
 vm.createContext(context);vm.runInContext(bootstrap,context);const done=context.init();
 return {started,rendered,site:value=>site(value),central:value=>central(value),done};
}
test('both sources start together and content waits for the latest central data',async()=>{
 const f=fixture();assert.deepEqual(f.started,['site','central']);f.site(true);await Promise.resolve();assert.equal(f.rendered.length,0);
 f.central(true);await f.done;assert.deepEqual(f.rendered,['agenda','ideas']);
});
test('failed central storage retains the existing site-data fallback',async()=>{
 const f=fixture();f.central(false);f.site(true);await f.done;assert.deepEqual(f.rendered,['agenda','ideas']);
});
test('failed site data never renders empty content over its load error',async()=>{
 const f=fixture();f.site(false);await f.done;assert.deepEqual(f.rendered,[]);f.central(true);
});
