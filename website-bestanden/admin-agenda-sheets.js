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

 let agendaSaveBaseline='';
 const agendaSaveSnapshot=()=>JSON.stringify([...form.querySelectorAll('input,select,textarea')].map(field=>field.type==='checkbox'?field.checked:field.value));
 function updatePreview(){
   footer.querySelector('button[type=submit]').classList.toggle('hasChanges',agendaSaveSnapshot()!==agendaSaveBaseline);
   preview.innerHTML=AgendaViewShared.renderItem({themeClass:domainThemeClass($('agendaEditDomain').value),title:titleWithIcon($('agendaEditItemTitle').value||'Titel van de activiteit',$('agendaEditDomain').value,'agendaItemTitle'),meta:[$('agendaEditTime').value,$('agendaEditWhere').value].filter(Boolean).map(escapeHtml).join(' • ')});
 }
 form.addEventListener('input',updatePreview);form.addEventListener('change',updatePreview);
 const originalOpen=AdminEditors.openAgenda;
 AdminEditors.openAgenda=async function(){
   if(window.AdminSources && !await window.AdminSources.canLeave())return;
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
       }else{
         if(control.matches('[data-verify-agenda],[data-hide-agenda],button:disabled')){
           const label=document.createElement('span');label.textContent=control.getAttribute('aria-label')||control.title||'Goedgekeurd';clone.append(label);clone.classList.add('adminLabelledAction');
         }
         toolbar.append(clone);
       }});
   }
   SheetUIShared.sectionNavigation(toolbar,[[toolbar.children[0],'Kenmerken'],[toolbar.children[1],'Locatie']]);
   agendaSaveBaseline=agendaSaveSnapshot();updatePreview();originalOpen();body.scrollTop=0;
   if(editingAgendaSource?.isNew)openCombinedAdd();
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
   if(window.AdminSources && !await window.AdminSources.canLeave())return;window.AdminSources?.close();returnFocus=document.activeElement;manager.hidden=false;AdminEditors.sync();manager.querySelector('.adminEditorClose').focus();
 });
 link.setAttribute('aria-expanded','false');
 new MutationObserver(()=>{link.setAttribute('aria-expanded',String(!manager.hidden));AdminEditors.sync();}).observe(manager,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!manager.hidden){event.preventDefault();closeManager();}});
 const sources=document.createElement('section');sources.id='adminSourcesSheet';sources.className='adminEditorCard adminPublicSurface';sources.hidden=true;
 sources.innerHTML='<header class="panelHead"><h3>Bronnen</h3><button class="adminEditorClose" type="button" aria-label="Bronnen sluiten">×</button></header><div class="adminAgendaManagerBody"></div><footer class="adminActivityFooter ideaFilterSheetFooter"><button class="ideaFilterSheetAction primary" type="button">Klaar</button></footer>';
 layer.append(sources);
 const sourcePanel=$('sourceOwnPanel');sources.querySelector('.adminAgendaManagerBody').append(sourcePanel);
 sourcePanel.querySelector('h2').remove();$('linkForm').hidden=true;
 const sourceLink=document.createElement('button');sourceLink.type='button';sourceLink.className='adminAgendaManageLink';sourceLink.textContent='Bronnen';link.after(sourceLink);
 let addSource=actions.querySelector('[data-add-admin-source]');
 if(!addSource){addSource=document.createElement('button');addSource.type='button';addSource.dataset.addAdminSource='';actions.append(addSource);}
 addSource.className=$('addAdminAgendaBtn').className;
 addSource.innerHTML=$('addAdminAgendaBtn').innerHTML.replace('Agenda-item toevoegen','Bron toevoegen');
 const inlineAdd=sourcePanel.querySelector('[data-add-admin-source]');inlineAdd.className=addSource.className;inlineAdd.innerHTML=addSource.innerHTML;sources.querySelector('header').insertBefore(inlineAdd,sources.querySelector('.adminEditorClose'));
 const rulesPanel=$('agendaRulesPanel'),tabs=document.createElement('div');tabs.className='adminSourceTabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Bronnen beheren');
 tabs.innerHTML='<button type="button" role="tab" id="sourceOverviewTab" aria-controls="sourceOwnPanel">Bronnen</button><button type="button" role="tab" id="sourceRulesTab" aria-controls="agendaRulesPanel">Uitsluitingen</button>';
 sourcePanel.before(tabs);sourcePanel.after(rulesPanel);
 [sourcePanel,rulesPanel].forEach((panel,i)=>{panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',i?'sourceRulesTab':'sourceOverviewTab');});
 function selectSourceTab(rules=false){
   sourcePanel.hidden=rules;rulesPanel.hidden=!rules;
   [...tabs.children].forEach((tab,i)=>{const active=Boolean(i)===rules;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
 }
 [...tabs.children].forEach((tab,i)=>tab.addEventListener('click',async()=>{if(!await canLeaveSource())return;selectSourceTab(Boolean(i));}));
 tabs.addEventListener('keydown',async event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();if(!await canLeaveSource())return;const rules=event.key==='End'||(event.key!=='Home'&&sourcePanel.hidden===false);selectSourceTab(rules);tabs.children[rules?1:0].focus();});
 selectSourceTab();
 const navigation=document.createElement('nav');navigation.className='adminAgendaHeaderNavigation';navigation.setAttribute('aria-label','Agendabeheer');link.before(navigation);navigation.append(link,sourceLink);
 let sourceFocus;
 function closeSources(){sources.hidden=true;AdminEditors.sync();}
 async function openSources(options={}){
   if(!modal.hidden){await AdminEditors.requestAgendaClose();if(!modal.hidden)return;}
   if(!$('adminIdeaEditPanel').hidden){$('adminIdeaEditCancelBtn').click();if(!$('adminIdeaEditPanel').hidden)return;}
   selectSourceTab(options.rules===true);manager.hidden=true;AdminVisual.featuredPanel.hidden=true;sourceFocus=document.activeElement;sources.hidden=false;AdminEditors.sync();sources.querySelector('.adminEditorClose').focus();
 }
 sourceLink.addEventListener('click',()=>openSources());
 sources.querySelectorAll('header .adminEditorClose,footer button').forEach(button=>button.addEventListener('click',async()=>{if(!await canLeaveSource())return;closeSources();sourceFocus?.focus();}));
 document.addEventListener('keydown',async event=>{if(event.key==='Escape'&&!sources.hidden&&!sourceConfirm){event.preventDefault();if(!await canLeaveSource())return;closeSources();sourceFocus?.focus();}});
 document.addEventListener('click',event=>{
   if(event.target.closest('[data-admin-scroll="sourceOwnPanel"]')){event.preventDefault();event.stopImmediatePropagation();openSources();}
   if(event.target.closest('[data-add-admin-source]')){event.preventDefault();event.stopImmediatePropagation();canLeaveSource().then(async allowed=>{if(!allowed)return;await openSources();if(sources.hidden)return;resetLinkForm();$('linkForm').hidden=false;beginSourceEdit();$('linkName').focus();});}
 },true);

 const sourceForm=$('linkForm'),sourceFooter=sources.querySelector('footer'),doneSource=sourceFooter.querySelector('button');
 const cancelSource=document.createElement('button');cancelSource.type='button';cancelSource.className='ideaFilterSheetAction secondary';cancelSource.textContent='Annuleren';cancelSource.hidden=true;
 const saveSource=$('linkSubmitBtn');saveSource.className='ideaFilterSheetAction primary';saveSource.setAttribute('form','linkForm');saveSource.textContent='Opslaan';saveSource.hidden=true;
 sourceFooter.append(cancelSource,saveSource);sourceForm.querySelector('.linkFormActions').hidden=true;
 sourceForm.after($('linkStatus'));
 const sourceSearch=document.createElement('input');sourceSearch.type='search';sourceSearch.placeholder='Zoek bronnen…';sourceSearch.setAttribute('aria-label','Zoek bronnen');sourceSearch.className='adminSourceSearch';$('customLinkList').before(sourceSearch);
 const noSources=document.createElement('p');noSources.textContent='Geen bronnen gevonden.';noSources.hidden=true;$('customLinkList').after(noSources);
 function filterSources(){const query=sourceSearch.value.trim().toLocaleLowerCase('nl');const rows=[...$('customLinkList').querySelectorAll('.sharedSourceRow')];rows.forEach(row=>row.hidden=!row.querySelector('.sharedSourceMain').textContent.toLocaleLowerCase('nl').includes(query));noSources.hidden=!rows.length||rows.some(row=>!row.hidden);}
 sourceSearch.addEventListener('input',filterSources);new MutationObserver(filterSources).observe($('customLinkList'),{childList:true});
 let sourceDraft='',sourceEditing=false,sourceConfirm=null;
 const sourceSnapshot=()=>JSON.stringify(['linkName','linkUrl','linkCategory'].map(id=>$(id).value));
 function sourceDirty(){return sourceEditing&&sourceSnapshot()!==sourceDraft;}
 function syncSourceSave(){saveSource.classList.toggle('hasChanges',sourceDirty());}
 function beginSourceEdit(){inlineAdd.hidden=true;sourceEditing=true;sourceDraft=sourceSnapshot();sourceForm.hidden=false;saveSource.hidden=false;cancelSource.hidden=false;doneSource.hidden=true;saveSource.textContent='Opslaan';sourceFooter.classList.add('isEditing');$('customLinkList').hidden=true;sourceSearch.hidden=true;noSources.hidden=true;sourcePanel.querySelector('.panelHead').hidden=true;sources.querySelector('header h3').textContent=editingSourceLink?'Bron bewerken':'Bron toevoegen';syncSourceSave();}
 function finishSourceEdit(){inlineAdd.hidden=false;sourceEditing=false;sourceForm.hidden=true;saveSource.hidden=true;cancelSource.hidden=true;doneSource.hidden=false;sourceFooter.classList.remove('isEditing');$('customLinkList').hidden=false;sourceSearch.hidden=false;sourcePanel.querySelector('.panelHead').hidden=false;sources.querySelector('header h3').textContent='Bronnen';filterSources();}
 async function canLeaveSource(){
   if(sourceEditing&&saveSource.disabled)return false;
   if(sourceConfirm)return sourceConfirm;
   if(sourceDirty()){
     sourceConfirm=confirmDialog('Je hebt wijzigingen die nog niet zijn opgeslagen. Wil je deze weggooien?',{title:'Wijzigingen bewaren?',confirmText:'Wijzigingen weggooien',cancelText:'Verder bewerken'});
     let allowed;try{allowed=await sourceConfirm;}finally{sourceConfirm=null;}if(!allowed)return false;
   }
   if(sourceEditing){resetLinkForm();finishSourceEdit();}return true;
 }
 cancelSource.addEventListener('click',canLeaveSource);
 sourceForm.addEventListener('input',syncSourceSave);sourceForm.addEventListener('change',syncSourceSave);
 window.addEventListener('beforeunload',event=>{if(sourceDirty()){event.preventDefault();event.returnValue='';}});
 // Guard workspace changes before their existing handlers reset forms.
 let replaySourceNavigation=false;
 document.addEventListener('click',async event=>{
   const target=event.target.closest('[data-admin-target],#addAdminIdeaBtn,#adminSidebarToggle,#logoutBtn');
   if(!target||!sourceEditing||replaySourceNavigation)return;
   event.preventDefault();event.stopImmediatePropagation();if(!await canLeaveSource())return;
   closeSources();replaySourceNavigation=true;try{target.click();}finally{replaySourceNavigation=false;}
 },true);
 new MutationObserver(()=>syncHeaderSelection()).observe(manager,{attributes:true,attributeFilter:['hidden']});
 function syncHeaderSelection(){
   sourceLink.setAttribute('aria-expanded',String(!sources.hidden));
   [link,sourceLink].forEach(button=>button.removeAttribute('aria-current'));
   if(!sources.hidden)sourceLink.setAttribute('aria-current','true');
   else if(!manager.hidden)link.setAttribute('aria-current','true');
 }
 syncHeaderSelection();
 new MutationObserver(()=>{syncHeaderSelection();AdminEditors.sync();}).observe(sources,{attributes:true,attributeFilter:['hidden']});
 window.AdminSources={open:openSources,close:closeSources,requestClose:async()=>{if(await canLeaveSource()){closeSources();sourceFocus?.focus();}},canLeave:canLeaveSource,beginEdit:beginSourceEdit,saved:finishSourceEdit};
 // Keep the two existing forms mounted: tab changes never reset either draft.
 const addTabs=document.createElement('div');addTabs.className='sharedSectionNav adminCombinedAddTabs';addTabs.hidden=true;addTabs.setAttribute('role','tablist');addTabs.setAttribute('aria-label','Toevoegen aan UIT-agenda');
 addTabs.innerHTML='<button type="button" role="tab" id="agendaAddActivityTab" aria-controls="agendaEditForm">Activiteit</button><button type="button" role="tab" id="agendaAddSourceTab" aria-controls="combinedSourcePanel">Bron</button>';
 head.after(addTabs);
 const sourceHost=document.createElement('div');sourceHost.id='combinedSourcePanel';sourceHost.className='adminAgendaManagerBody adminCombinedSourceBody';sourceHost.hidden=true;
 sourceHost.setAttribute('role','tabpanel');sourceHost.setAttribute('aria-labelledby','agendaAddSourceTab');
 const sourceAnchor=document.createComment('source form home');sourceForm.before(sourceAnchor);
 const footerAnchor=document.createComment('source footer home');sourceFooter.before(footerAnchor);
 const statusAnchor=document.createComment('source status home');$('linkStatus').before(statusAnchor);
 card.append(sourceHost);
 let combinedAdd=false;
 function selectAddTab(source=false){
   [...addTabs.children].forEach((tab,i)=>{const active=Boolean(i)===source;tab.classList.toggle('isActive',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
   form.hidden=source;toolbar.hidden=source;sourceHost.hidden=!source;sourceFooter.hidden=!source;
   form.setAttribute('role','tabpanel');form.setAttribute('aria-labelledby','agendaAddActivityTab');
   saveSource.textContent='Bron toevoegen';footer.querySelector('button[type=submit]').textContent='Activiteit toevoegen';
 }
 function openCombinedAdd(){
   combinedAdd=true;addTabs.hidden=false;card.classList.add('isCombinedAdd');
   $('agendaEditTitle').textContent='Toevoegen aan UIT-agenda';
   resetLinkForm();beginSourceEdit();sourceHost.append(sourceForm,$('linkStatus'));card.append(sourceFooter);
   sourceForm.hidden=false;selectAddTab(false);
 }
 function restoreCombinedAdd(){
   if(!combinedAdd)return;combinedAdd=false;addTabs.hidden=true;card.classList.remove('isCombinedAdd');
   sourceAnchor.after(sourceForm);footerAnchor.after(sourceFooter);statusAnchor.after($('linkStatus'));
   sourceHost.hidden=true;form.hidden=false;toolbar.hidden=false;sourceFooter.hidden=false;
   form.removeAttribute('role');form.removeAttribute('aria-labelledby');
   resetLinkForm();finishSourceEdit();
 }
 [...addTabs.children].forEach((tab,i)=>tab.addEventListener('click',()=>selectAddTab(Boolean(i))));
 addTabs.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const source=event.key==='End'||(event.key!=='Home'&&addTabs.children[0].getAttribute('aria-selected')==='true');selectAddTab(source);addTabs.children[source?1:0].focus();});
 new MutationObserver(()=>{if(modal.hidden)restoreCombinedAdd();}).observe(modal,{attributes:true,attributeFilter:['hidden']});
 cancelSource.addEventListener('click',event=>{if(!combinedAdd)return;event.preventDefault();event.stopImmediatePropagation();AdminEditors.requestAgendaClose();},true);
 window.AdminSources.canLeaveCombined=async()=>!combinedAdd||!sourceDirty()||await confirmDialog('Je hebt een bron ingevuld die nog niet is toegevoegd. Wil je deze weggooien?',{title:'Wijzigingen bewaren?',confirmText:'Wijzigingen weggooien',cancelText:'Verder bewerken'});
 let replayCombinedSubmit=false;
 form.addEventListener('submit',async event=>{if(!combinedAdd||!sourceDirty()||replayCombinedSubmit)return;event.preventDefault();event.stopImmediatePropagation();if(!await window.AdminSources.canLeaveCombined())return;replayCombinedSubmit=true;try{form.requestSubmit();}finally{replayCombinedSubmit=false;}},true);
 const savedSource=window.AdminSources.saved;
 window.AdminSources.saved=()=>{if(!combinedAdd){savedSource();return;}beginSourceEdit();selectAddTab(true);};
 new MutationObserver(()=>{const button=footer.querySelector('button[type=submit]');if(combinedAdd&&!button.disabled)button.textContent='Activiteit toevoegen';}).observe(footer.querySelector('button[type=submit]'),{attributes:true,attributeFilter:['disabled']});
 new MutationObserver(()=>{if(combinedAdd&&!saveSource.disabled)saveSource.textContent='Bron toevoegen';}).observe(saveSource,{attributes:true,attributeFilter:['disabled']});
 $('addAdminAgendaBtn').querySelector('span').textContent='Toevoegen';
 $('addAdminAgendaBtn').setAttribute('aria-label','Toevoegen');$('addAdminAgendaBtn').title='Toevoegen';
 addSource.remove();
 $('agendaSelectionToolbar').hidden=true;
})();
