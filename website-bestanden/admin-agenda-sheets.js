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
 ['Date','Time','Where','Domain'].forEach(key=>$('agendaEdit'+key).closest('label').classList.add('wide'));
 const advanced=document.createElement('details');advanced.className='adminAgendaAdvanced wide';
 advanced.innerHTML='<summary>Bron en extra opties</summary><div class="adminAgendaAdvancedFields"></div><div class="adminAgendaExtraActions"></div>';
 ['Source','Url'].forEach(key=>advanced.querySelector('.adminAgendaAdvancedFields').append($('agendaEdit'+key).closest('label')));
 grid.append(advanced);

 function updatePreview(){
   preview.innerHTML=AgendaViewShared.renderItem({themeClass:domainThemeClass($('agendaEditDomain').value),title:titleWithIcon($('agendaEditItemTitle').value||'Titel van de activiteit',$('agendaEditDomain').value,'agendaItemTitle'),meta:[$('agendaEditTime').value,$('agendaEditWhere').value].filter(Boolean).map(escapeHtml).join(' • ')});
 }
 form.addEventListener('input',updatePreview);form.addEventListener('change',updatePreview);
 const originalOpen=AdminEditors.openAgenda;
 AdminEditors.openAgenda=function(){
   manager.hidden=true;window.AdminSources?.close();$('adminIdeaEditPanel').hidden=true;AdminVisual.featuredPanel.hidden=true;
   const category=$('agendaEditDomain'),currentTheme=domainThemeClass(category.value);
   const categories=[...$('adminEditIdeaDomain').options];
   const matching=categories.find(option=>domainThemeClass(option.value)===currentTheme);
   if(matching){
     category.replaceChildren(...categories.map(option=>new Option(option.textContent,option.value)));
     category.value=matching.value;
   }
   category.dataset.themeSelect='true';
   ['Domain','Distance','Cost','Stimulus','Week'].forEach(key=>enhanceCustomSelect($('agendaEdit'+key)));
   footer.querySelector('button[type=submit]').textContent='Opslaan';
   toolbar.replaceChildren();advanced.querySelector('.adminAgendaExtraActions').replaceChildren();advanced.open=false;
   [['Kenmerken','Domain','sliders'],['Locatie','Where','pin']].forEach(([label,key,icon])=>{
     const button=document.createElement('button');button.type='button';button.title=label;button.setAttribute('aria-label',label);button.innerHTML=icon==='pin'?'<svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/></svg>':'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/></svg>';button.addEventListener('click',()=>{$('agendaEdit'+key).closest('label').scrollIntoView({block:'center',behavior:'smooth'});});toolbar.append(button);
   });
   if(!editingAgendaSource?.isNew){
     selectedAgendaItemId=String(editingAgendaSource.id);renderAgendaSelectionToolbar();
     const source=$('agendaSelectionActions');
     source.querySelectorAll('button,a').forEach(control=>{if(control.matches('[data-edit-agenda],[data-edit-ongoing]'))return;const clone=control.cloneNode(true);
       if(control.matches('[data-block-agenda-source],[data-block-agenda-title]')){
         clone.textContent=control.getAttribute('aria-label')||control.title;
         advanced.querySelector('.adminAgendaExtraActions').append(clone);
       }else toolbar.append(clone);});
   }
   updatePreview();originalOpen();body.scrollTop=0;
 };
 const manager=document.createElement('section');manager.id='adminAgendaManagerSheet';manager.className='adminEditorCard adminPublicSurface';manager.hidden=true;
 manager.innerHTML='<header class="panelHead"><h3>Agenda beheren</h3><button type="button" class="adminEditorClose" aria-label="Agenda beheren sluiten">×</button></header><div class="adminAgendaManagerBody"></div><footer class="adminActivityFooter ideaFilterSheetFooter"><button type="button" class="ideaFilterSheetAction primary">Klaar</button></footer>';
 const old=document.querySelector('.adminAgendaManagementFilters');
 const link=document.createElement('button');link.type='button';link.className='adminAgendaManageLink';link.textContent='Agenda beheren';const actions=$('addAdminAgendaBtn').parentElement;actions.classList.add('adminAgendaHeaderActions');actions.prepend(link);
 old.querySelector('summary')?.remove();manager.querySelector('.adminAgendaManagerBody').append(...old.children);old.remove();layer.append(manager);
 const managerBody=manager.querySelector('.adminAgendaManagerBody');
 const pending=$('agendaPendingList');
 const search=document.createElement('input');search.type='search';search.placeholder='Zoek in te controleren items…';search.setAttribute('aria-label','Zoek in te controleren items');search.className='adminAgendaManagerSearch';pending.before(search);
 const pager=document.createElement('nav');pager.className='adminAgendaPager';pager.setAttribute('aria-label','Door controlelijst bladeren');
 pager.innerHTML='<button type="button" class="button">Vorige</button><span aria-live="polite"></span><button type="button" class="button">Volgende</button>';pending.after(pager);
 let page=0;
 function paginate(){
   const rows=[...pending.querySelectorAll('.agendaPendingRow')],query=search.value.trim().toLocaleLowerCase('nl');
   const matches=rows.filter(row=>row.textContent.toLocaleLowerCase('nl').includes(query));
   page=Math.min(page,Math.max(0,Math.ceil(matches.length/6)-1));
   rows.forEach(row=>row.hidden=true);matches.slice(page*6,page*6+6).forEach(row=>row.hidden=false);
   pager.querySelector('span').textContent=matches.length?`${page*6+1}–${Math.min(page*6+6,matches.length)} van ${matches.length}`:'Geen resultaten';
   pager.firstElementChild.disabled=page===0;pager.lastElementChild.disabled=(page+1)*6>=matches.length;
 }
 search.addEventListener('input',()=>{page=0;paginate();});
 pager.firstElementChild.addEventListener('click',()=>{page--;paginate();search.scrollIntoView({block:'start',behavior:'smooth'});});
 pager.lastElementChild.addEventListener('click',()=>{page++;paginate();search.scrollIntoView({block:'start',behavior:'smooth'});});
 new MutationObserver(()=>{page=0;paginate();}).observe(pending,{childList:true});paginate();
 manager.querySelector('#agendaAdminSection p').textContent='Bekijk nieuwe activiteiten en keur ze goed. Zoek hieronder gericht in de lijst.';
 const ongoing=manager.querySelector('.ongoingAdminPicker'),extra=document.createElement('details');extra.className='adminAgendaAdvanced';extra.innerHTML='<summary>Doorlopend aanbod instellen</summary>';ongoing.before(extra);extra.append(ongoing);
 let returnFocus;
 function closeManager(){manager.hidden=true;AdminEditors.sync();returnFocus?.focus();}
 manager.querySelector('.adminEditorClose').addEventListener('click',closeManager);manager.querySelector('footer button').addEventListener('click',closeManager);
 link.addEventListener('click',async()=>{
   if(!modal.hidden){await AdminEditors.requestAgendaClose();if(!modal.hidden)return;}
   window.AdminSources?.close();returnFocus=document.activeElement;manager.hidden=false;AdminEditors.sync();manager.querySelector('.adminEditorClose').focus();
 });
 new MutationObserver(()=>AdminEditors.sync()).observe(manager,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!manager.hidden){event.preventDefault();closeManager();}});
 const sources=document.createElement('section');sources.id='adminSourcesSheet';sources.className='adminEditorCard adminPublicSurface';sources.hidden=true;
 sources.innerHTML='<header class="panelHead"><h3>Bronnen</h3><button class="adminEditorClose" type="button" aria-label="Bronnen sluiten">×</button></header><div class="adminAgendaManagerBody"></div><footer class="adminActivityFooter ideaFilterSheetFooter"><button class="ideaFilterSheetAction primary" type="button">Klaar</button></footer>';
 layer.append(sources);
 const sourcePanel=$('sourceOwnPanel');sources.querySelector('.adminAgendaManagerBody').append(sourcePanel);
 sourcePanel.querySelector('h2').remove();$('linkForm').hidden=true;
 const sourceLink=document.createElement('button');sourceLink.type='button';sourceLink.className='adminAgendaManageLink';sourceLink.textContent='Bronnen';link.after(sourceLink);
 actions.querySelector('[data-add-admin-source]')?.remove();
 const navigation=document.createElement('nav');navigation.className='adminAgendaHeaderNavigation';navigation.setAttribute('aria-label','Agendabeheer');link.before(navigation);navigation.append(link,sourceLink);
 let sourceFocus;
 function closeSources(){sources.hidden=true;AdminEditors.sync();}
 async function openSources(){
   if(!modal.hidden){await AdminEditors.requestAgendaClose();if(!modal.hidden)return;}
   if(!$('adminIdeaEditPanel').hidden){$('adminIdeaEditCancelBtn').click();if(!$('adminIdeaEditPanel').hidden)return;}
   manager.hidden=true;AdminVisual.featuredPanel.hidden=true;sourceFocus=document.activeElement;sources.hidden=false;AdminEditors.sync();sources.querySelector('.adminEditorClose').focus();
 }
 sourceLink.addEventListener('click',openSources);
 sources.querySelectorAll('header button,footer button').forEach(button=>button.addEventListener('click',()=>{closeSources();sourceFocus?.focus();}));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!sources.hidden){event.preventDefault();closeSources();sourceFocus?.focus();}});
 document.addEventListener('click',event=>{
   if(event.target.closest('[data-admin-scroll="sourceOwnPanel"]')){event.preventDefault();event.stopImmediatePropagation();openSources();}
   if(event.target.closest('#sourceOwnPanel [data-add-admin-source]')){event.preventDefault();event.stopImmediatePropagation();resetLinkForm();$('linkForm').hidden=false;$('linkName').focus();}
 },true);
 new MutationObserver(()=>{sourceLink.setAttribute('aria-expanded',String(!sources.hidden));AdminEditors.sync();}).observe(sources,{attributes:true,attributeFilter:['hidden']});
 window.AdminSources={open:openSources,close:closeSources};
 $('agendaSelectionToolbar').hidden=true;
})();
