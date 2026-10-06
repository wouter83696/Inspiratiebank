/* Agenda editors reuse the same dock and action footer as inspiration. */
(function(){
 const $=id=>document.getElementById(id),layer=AdminVisual.layer,modal=$('agendaEditModal');
 layer.append(modal);modal.classList.add('adminAgendaSheet');
 const card=modal.querySelector('.adminEditorCard'),form=$('agendaEditForm'),head=card.querySelector('.confirmModalTop');
 card.classList.add('adminPublicSurface');head.classList.add('panelHead');
 const toolbar=document.createElement('div');toolbar.className='adminAgendaToolbar';toolbar.setAttribute('aria-label','Agenda-item beheren');head.after(toolbar);
 const body=document.createElement('div');body.className='adminAgendaEditBody';
 const footer=form.querySelector('.confirmModalActions');footer.className='adminActivityFooter ideaFilterSheetFooter';
 footer.querySelector('button[type=button]').className='ideaFilterSheetAction secondary';footer.querySelector('button[type=submit]').className='ideaFilterSheetAction primary';
 const grid=document.createElement('div');grid.className='adminAgendaFieldGrid';
 [...form.children].filter(node=>node!==footer).forEach(node=>grid.append(node));
 const preview=document.createElement('div');preview.className='adminAgendaLivePreview';preview.setAttribute('aria-label','Voorbeeld agendategel');
 body.append(preview,grid);form.prepend(body);
 function updatePreview(){
   preview.innerHTML=AgendaViewShared.renderItem({themeClass:domainThemeClass($('agendaEditDomain').value),title:titleWithIcon($('agendaEditItemTitle').value||'Titel van de activiteit',$('agendaEditDomain').value,'agendaItemTitle'),meta:[$('agendaEditTime').value,$('agendaEditWhere').value].filter(Boolean).map(escapeHtml).join(' • ')});
 }
 form.addEventListener('input',updatePreview);form.addEventListener('change',updatePreview);
 const originalOpen=AdminEditors.openAgenda;
 AdminEditors.openAgenda=function(){
   manager.hidden=true;$('adminIdeaEditPanel').hidden=true;AdminVisual.featuredPanel.hidden=true;
   ['Domain','Distance','Cost','Stimulus','Week'].forEach(key=>enhanceCustomSelect($('agendaEdit'+key)));
   footer.querySelector('button[type=submit]').textContent='Opslaan';
   toolbar.replaceChildren();
   [['Kenmerken','Domain','sliders'],['Locatie','Where','pin']].forEach(([label,key,icon])=>{
     const button=document.createElement('button');button.type='button';button.title=label;button.setAttribute('aria-label',label);button.innerHTML=icon==='pin'?'<svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/></svg>':'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/></svg>';button.addEventListener('click',()=>{$('agendaEdit'+key).closest('label').scrollIntoView({block:'center',behavior:'smooth'});});toolbar.append(button);
   });
   if(!editingAgendaSource?.isNew){
     selectedAgendaItemId=String(editingAgendaSource.id);renderAgendaSelectionToolbar();
     const source=$('agendaSelectionActions');
     source.querySelectorAll('button,a').forEach(control=>{if(control.matches('[data-edit-agenda],[data-edit-ongoing]'))return;toolbar.append(control.cloneNode(true));});
   }
   updatePreview();originalOpen();body.scrollTop=0;
 };
 const manager=document.createElement('section');manager.id='adminAgendaManagerSheet';manager.className='adminEditorCard adminPublicSurface';manager.hidden=true;
 manager.innerHTML='<header class="panelHead"><h3>Agenda beheren</h3><button type="button" class="adminEditorClose" aria-label="Agenda beheren sluiten">×</button></header><div class="adminAgendaManagerBody"></div><footer class="adminActivityFooter ideaFilterSheetFooter"><button type="button" class="ideaFilterSheetAction primary">Klaar</button></footer>';
 const old=document.querySelector('.adminAgendaManagementFilters');
 const link=document.createElement('button');link.type='button';link.className='adminAgendaManageLink';link.textContent='Agenda beheren';old.before(link);
 old.querySelector('summary')?.remove();manager.querySelector('.adminAgendaManagerBody').append(...old.children);old.remove();layer.append(manager);
 let returnFocus;
 function closeManager(){manager.hidden=true;AdminEditors.sync();returnFocus?.focus();}
 manager.querySelector('.adminEditorClose').addEventListener('click',closeManager);manager.querySelector('footer button').addEventListener('click',closeManager);
 link.addEventListener('click',async()=>{
   if(!modal.hidden){await AdminEditors.requestAgendaClose();if(!modal.hidden)return;}
   returnFocus=document.activeElement;manager.hidden=false;AdminEditors.sync();manager.querySelector('.adminEditorClose').focus();
 });
 new MutationObserver(()=>AdminEditors.sync()).observe(manager,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!manager.hidden){event.preventDefault();closeManager();}});
 $('agendaSelectionToolbar').hidden=true;
})();
