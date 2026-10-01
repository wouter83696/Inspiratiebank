const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../../beheer/index.html'),'utf8');
const code=html.slice(html.indexOf('  function sourceAgendaCheckedAt(){'),html.indexOf('  async function requestAgendaSourceCheck(){'));
function render(status,manual=''){
 const title={},detail={},button={};
 const ctx={BASE:{sourceCheck:{lastCheckedAt:'2026-09-30T18:31:00Z',sourcesChecked:41,newCandidateCount:0}},centralStorage:{sourceCheck:{lastCheckedAt:'2026-09-16T10:38:00Z'},agendaManualCheckedAt:manual},centralStorageActive:()=>true,$$:s=>s==='[data-agenda-check-title]'?[title]:s==='[data-agenda-check-text]'?[detail]:[button],AGENDA_CHECK_REFRESH_MS:1000,agendaCheckRefreshTimer:null,window:{setInterval:()=>1},Date};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 ctx.agendaSourceCheckRequestState=()=>({status,completedAt:'2026-09-16T10:38:00Z',requestedAt:'2026-09-16T10:00:00Z',startedAt:'2026-09-16T10:01:00Z'});
 vm.runInContext('renderAgendaCheckStatus()',ctx);
 return {ctx,title:title.textContent,detail:detail.textContent,button};
}
test('old completed request cannot replace the published source-check date',()=>{
 const r=render('done');assert.match(r.title,/30 sep/);assert.match(r.detail,/16 sep/);assert.equal(vm.runInContext('latestAgendaCheckedAt()',r.ctx),'2026-09-30T18:31:00Z');
});
test('queued, running, expired and failed requests retain the last successful source date',()=>{
 for(const status of ['queued','running','expired','error']){const r=render(status);assert.match(r.title,/30 sep/);assert.equal(r.button.disabled,['queued','running'].includes(status));}
});
test('manual verification is labelled separately and does not replace the source date',()=>{
 const r=render('idle','2026-10-01T10:00:00Z');assert.match(r.title,/30 sep/);assert.match(r.detail,/Handmatig.*1 okt/);
});
test('without a published source report, a completed request is not presented as source verification',()=>{
 const r=render('done');r.ctx.BASE={};vm.runInContext('renderAgendaCheckStatus()',r.ctx);assert.equal(vm.runInContext('sourceAgendaCheckedAt()',r.ctx),'');
});
