/* Shared side-panel behaviour for adding and editing inspiration and agenda items. */
(function(){
  const $=id=>document.getElementById(id);
  const idea=$('adminIdeaEditPanel'), agenda=$('agendaEditModal');
  const layer=AdminVisual.layer;layer.append(idea);
  idea.classList.add('adminEditorCard','adminPublicSurface','ideaSubmitSheet','photoDetailPanel');agenda.classList.add('adminEditorLayer');
  agenda.querySelector('.confirmModalCard').classList.add('adminEditorCard');
  // The public detail renderer owns the structure; existing form controls are
  // mounted into its title, photo, metadata and tab slots (never cloned).
  const form=$('adminIdeaEditForm'),oldGrid=form.querySelector('.teamFormGrid');
  const fields=document.createElement('div');fields.className='adminEditFields photoDetailBody';
  const bank=document.createElement('div');bank.hidden=true;bank.className='adminEditFieldBank';
  bank.append(oldGrid);form.prepend(fields,bank);
  const fieldFor=id=>$('adminEditIdea'+id)?.closest('.teamField');
  const allFields=[...oldGrid.querySelectorAll('.teamField')];
  const footer=form.querySelector('.teamActionBar');
  const saveButton=$('adminIdeaEditSubmitBtn');saveButton.setAttribute('form',form.id);
  const actions=document.createElement('footer');
  actions.className='adminActivityFooter ideaFilterSheetFooter';
  const cancelButton=$('adminIdeaEditCancelBtn');
  cancelButton.className='ideaFilterSheetAction secondary';
  saveButton.className='ideaFilterSheetAction primary';
  actions.append(cancelButton,saveButton);
  idea.append(actions);
  footer.replaceChildren($('adminIdeaEditStatus'));
  $('adminIdeaEditSubmitBtn').textContent='Opslaan';$('adminIdeaEditCancelBtn').textContent='Annuleren';
  const photoPreview=$('adminEditIdeaImagePreview');
  function syncSaveState(){const dirty=!!window.AdminPolish?.ideaDirty();saveButton.classList.toggle('hasChanges',dirty);saveButton.title=dirty?'Wijzigingen opslaan':'Opslaan — geen wijzigingen';}
  form.addEventListener('input',syncSaveState);
  form.addEventListener('change',()=>queueMicrotask(syncSaveState));
  function syncPhoto(){
    syncSaveState();
    const image=fields.querySelector('.ideaImageFrame img');
    const src=photoPreview.querySelector('img')?.getAttribute('src');
    if(image){image.hidden=!src;if(src)image.src=src;}
    const dropzone=fields.querySelector('.adminPhotoDropzone');
    if(dropzone)dropzone.hidden=!!src;
    const button=idea.querySelector('.adminInlinePhotoButton');
    if(button){button.innerHTML=actionIcon('image')+'<span>Foto</span>';button.setAttribute('aria-label',src?'Foto wijzigen':'Foto uploaden (verplicht)');}
  }
  new MutationObserver(syncPhoto).observe(photoPreview,{childList:true,subtree:true});
  function mountDetail(){
    allFields.forEach(field=>oldGrid.append(field));
    idea.querySelector('.adminEditToolbar')?.remove();
    const item=editingAdminIdea||{};
    const renderItem={...item};
    // Keep an editable materials tab even when no materials have been entered.
    renderItem.supplies=item.supplies||'Nog geen materialen';
    fields.innerHTML=PhotoTiles.detailContent(renderItem,'adminInlineTitle',{card:adminIdeaCard(renderItem),routes:''});
    const article=fields.querySelector('article');
    article.querySelector('h3').replaceWith(fieldFor('Title'));
    fieldFor('Title').classList.add('adminInlineTitle');
    let figure=article.querySelector('.ideaImageFrame');
    if(!figure){figure=document.createElement('figure');figure.className='ideaImageFrame';article.prepend(figure);}
    figure.removeAttribute('aria-hidden');
    if(figure.classList.contains('ideaImagePlaceholder')){figure.classList.remove('ideaImagePlaceholder');figure.replaceChildren();}
    if(!figure.querySelector('img'))figure.insertAdjacentHTML('afterbegin','<img alt="">');
    SheetUIShared.photoPicker(figure,$('adminEditIdeaImageUpload'),{
      required:true,onError:message=>setStatus('#adminIdeaEditStatus',message,'warn')
    });
    const photoButton=document.createElement('button');photoButton.type='button';photoButton.className='ideaFilterSheetAction secondary adminInlinePhotoButton';
    photoButton.addEventListener('click',()=>figure.scrollIntoView({block:'start',behavior:'smooth'}));
    const toolbar=SheetUIShared.editorToolbar(idea.querySelector('.panelHead'));
    toolbar.append(photoButton);
    const photoField=fieldFor('ImageUpload');photoField.classList.add('adminInlineUpload');figure.after(photoField);
    const metadata=article.querySelector('.cardMetaBlock');
    const details=document.createElement('section');details.className='adminInlineMetadata';
    const summary=document.createElement('div');summary.setAttribute('aria-label','Kenmerken aanpassen');
    if(metadata){metadata.replaceWith(details);summary.append(metadata);}else article.append(details);
    details.append(summary);
    const properties=document.createElement('button');properties.type='button';properties.className='ideaFilterSheetAction secondary';properties.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/></svg><span>Kenmerken</span>';
    properties.addEventListener('click',()=>details.scrollIntoView({block:'start',behavior:'smooth'}));toolbar.append(properties);
    const grid=document.createElement('div');grid.className='teamFormGrid';details.append(grid);
    ['Domain','By'].forEach(id=>fieldFor(id).classList.add('wide'));
    ['Domain','Location','Cost','Stimulus','Duration','Group','By'].forEach(id=>grid.append(fieldFor(id)));
    const panels=article.querySelectorAll('[role="tabpanel"]');
    panels[0].replaceChildren(fieldFor('Description'));
    panels[1].replaceChildren(fieldFor('Rules'));
    panels[2]?.replaceChildren(fieldFor('Supplies'));
    IdeaViewShared.editMaterials($('adminEditIdeaSupplies'));
    article.querySelector('[role=tablist]')?.remove();
    panels.forEach(panel=>{panel.hidden=false;panel.removeAttribute('role');panel.removeAttribute('aria-labelledby');panel.classList.add('adminEditTextSection');});
    const contact=article.querySelector('.photoDetailActions');
    contact.replaceChildren();
    const addressFields=document.createElement('div');addressFields.className='teamFormGrid adminEditAddressFields';
    ['Postcode','HouseNumber','Address'].forEach(id=>addressFields.append(fieldFor(id)));
    fieldFor('Location').after(addressFields);
    $('adminEditIdeaAddress').readOnly=true;
    $('adminEditIdeaAddress').placeholder='Wordt aangevuld via postcode en huisnummer';
    const urlField=fieldFor('Url');urlField.classList.add('adminEditUrlField');contact.before(urlField);
    contact.classList.add('adminContactPreview');
    updateContact();
    const locationShortcut=document.createElement('button');locationShortcut.type='button';locationShortcut.className='ideaFilterSheetAction secondary';locationShortcut.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span>Locatie</span>';locationShortcut.addEventListener('click',()=>{const target=fieldFor('Location');target.scrollIntoView({block:'start',behavior:'smooth'});});toolbar.append(locationShortcut);
    if(!item.isNew){
      const source=document.createElement('div');source.innerHTML=adminIdeaActions(item);
      const prepare=(button,label)=>{
        if(!button)return;
        button.className='ideaFilterSheetAction secondary';
        const icon=button.querySelector('svg')?.outerHTML||'';
        button.innerHTML=icon+'<span>'+escapeHtml(label)+'</span>';
        button.setAttribute('aria-label',label);
        return button;
      };
      const approval=source.querySelector('[data-approve-idea]');
      if(approval)toolbar.append(prepare(approval,'Goedkeuren'));
      toolbar.append(prepare(source.querySelector('.visibilityIdeaAction'),item.hidden?'Activiteit zichtbaar maken':'Activiteit verbergen'));
      const remove=prepare(source.querySelector('[data-delete-idea]'),'Verwijderen');remove.classList.add('adminDeleteAction');
      toolbar.append(remove);
    }
    toolbar.querySelectorAll(':scope > button').forEach(control=>{
      const label=control.getAttribute('aria-label')||control.textContent.trim();
      control.setAttribute('aria-label',label);control.title=label;control.classList.add('adminToolbarIcon');
    });
    SheetUIShared.sectionNavigation(toolbar,[[photoButton,'Foto'],[properties,'Kenmerken'],[locationShortcut,'Locatie']]);
    syncPhoto();
    updateMetadata();
  }
  function updateContact(){
    const host=fields.querySelector('.adminContactPreview');
    if(!host||!editingAdminIdea)return;
    const draft=editedIdeaPayload(editingAdminIdea);
    const location=normalizeIdeaLocation($('adminEditIdeaLocation').value);
    const address=(location==='Op pad'||location==='Binnen')?String(draft.address||'').trim():'';
    const routes=address?`<section class="photoRouteChoices"><p class="ideaPracticalText">${escapeHtml(address)}</p></section>`:'';
    const template=document.createElement('template');
    template.innerHTML=PhotoTiles.detailContent(draft,'adminContactPreviewTitle',{card:adminIdeaCard(draft),routes});
    host.replaceChildren(...template.content.querySelector('.photoDetailActions').childNodes);
    host.hidden=!host.childNodes.length;
  }
  function updateMetadata(){
    if(!editingAdminIdea)return;
    const draft=editedIdeaPayload(editingAdminIdea);
    const template=document.createElement('template');template.innerHTML=adminIdeaCard(draft);
    const current=fields.querySelector('.adminInlineMetadata .cardMetaBlock');
    const next=template.content.querySelector('.cardMetaBlock');
    if(current&&next){
      current.parentElement.querySelector(':scope > .adminItemStatus')?.remove();
      const status=next.querySelector('.adminItemStatus');
      if(status)current.before(status);
      current.replaceWith(next);
    }
    const badge=fields.querySelector('.ideaImageDomainBadge');
    const nextBadge=template.content.querySelector('.ideaImageDomainBadge');
    if(badge&&nextBadge)badge.replaceWith(nextBadge);
    else if(nextBadge)fields.querySelector('.ideaImageFrame')?.append(nextBadge);
    const article=fields.querySelector('article');
    const nextCard=template.content.querySelector('.sharedIdeaCard');
    if(article&&nextCard){
      [...article.classList].filter(name=>name.startsWith('theme')).forEach(name=>article.classList.remove(name));
      article.classList.add(...[...nextCard.classList].filter(name=>name.startsWith('theme')));
    }
  }
  form.addEventListener('input',updateMetadata);
  form.addEventListener('change',()=>{updateMetadata();updateContact();});
  const locationFields=['Postcode','HouseNumber','Address'].map(id=>$('adminEditIdea'+id).closest('.teamField'));
  function syncLocationFields(){
    const value=normalizeIdeaLocation($('adminEditIdeaLocation').value);
    const show=value==='Op pad'||value==='Binnen';
    const group=fields.querySelector('.adminEditAddressFields');
    if(group)group.hidden=!show;
    locationFields.forEach(field=>{field.hidden=!show;});
  }
  $('adminEditIdeaLocation').closest('.teamField').classList.add('wide');
  $('adminEditIdeaLocation').addEventListener('change',syncLocationFields);
  const title=idea.querySelector('h3');title.id='adminEditorTitle';
  function closeButton(parent,action){const button=document.createElement('button');button.type='button';button.className='adminEditorClose';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';button.setAttribute('aria-label','Formulier sluiten');button.addEventListener('click',action);parent.append(button);}
  closeButton(idea.querySelector('.panelHead'),()=>$('adminIdeaEditCancelBtn').click());
  closeButton(agenda.querySelector('.confirmModalTop'),()=>requestAgendaClose());
  layer.addEventListener('click',e=>{if(e.target===layer){if(!agenda.hidden)requestAgendaClose();else if(!idea.hidden)$('adminIdeaEditCancelBtn').click();else if(document.getElementById('adminAgendaManagerSheet')?.hidden===false)document.querySelector('#adminAgendaManagerSheet .adminEditorClose').click();else if(document.getElementById('adminSourcesSheet')?.hidden===false)window.AdminSources.requestClose();else AdminVisual.close();}});
  let ideaFocus=null,agendaFocus=null,agendaDraft='',closing=false;
  const snapshot=()=>JSON.stringify([...$('agendaEditForm').elements].filter(e=>e.tagName!=='BUTTON').map(e=>[e.id,e.type==='checkbox'?e.checked:e.value]));
  function sync(){
    const detail=!AdminVisual.featuredPanel.hidden;
    const sourcing=document.getElementById('adminSourcesSheet')?.hidden===false;
    const managing=sourcing||!!document.getElementById('adminAgendaManagerSheet')&&!document.getElementById('adminAgendaManagerSheet').hidden;
    layer.hidden=idea.hidden&&!detail&&agenda.hidden&&!managing;
    AdminVisual.preview.hidden=true;
    const addingAgenda=!agenda.hidden&&!!editingAgendaSource?.isNew;
    const modal=addingAgenda||((!idea.hidden||detail||!agenda.hidden||managing)&&matchMedia('(max-width:1100px)').matches);
    const open=modal;
    layer.setAttribute('role',modal?'dialog':'region');
    layer.setAttribute('aria-label',!agenda.hidden?(addingAgenda?'Toevoegen aan UIT-agenda':'Agenda-item bewerken'):sourcing?'Bronnen':managing?'Agenda beheren':!idea.hidden?'Activiteit bewerken':'Uitgelicht beheren');
    if(modal)layer.setAttribute('aria-modal','true');else layer.removeAttribute('aria-modal');
    agenda.setAttribute('role',modal?'dialog':'region');agenda.removeAttribute('aria-modal');
    layer.classList.toggle('isEditing',!layer.hidden);
    layer.classList.toggle('isModal',modal);
    if(!layer.hidden)layer.style.left='';
    if(layer.hidden&&document.body.classList.contains('adminDetailDocked'))layer.style.left=getComputedStyle(layer).left;
    $('agendaReviewPanel').classList.toggle('agendaEditorFocused',!agenda.hidden&&!editingAgendaSource?.isNew&&!modal);
    document.body.classList.toggle('adminAgendaFocused',!agenda.hidden&&!editingAgendaSource?.isNew&&!modal);
    document.body.classList.toggle('adminDetailDocked',!layer.hidden&&!modal);
    document.body.classList.toggle('adminEditorOpen',open);
    $('adminApp').inert=open;
    if(idea.hidden&&ideaFocus){if(detail){AdminVisual.featuredPanel.querySelector('.adminEditorClose').focus({preventScroll:true});}else if(ideaFocus.isConnected)ideaFocus.focus({preventScroll:true});ideaFocus=null;}
    if(agenda.hidden&&agendaFocus){if(agendaFocus.isConnected)agendaFocus.focus({preventScroll:true});agendaFocus=null;}
  }
  async function requestAgendaClose(){
    if(closing)return;closing=true;
    try{
      if(window.AdminSources?.canLeaveCombined&&!await window.AdminSources.canLeaveCombined())return;
      if(snapshot()!==agendaDraft&&!await confirmDialog('Je hebt wijzigingen die nog niet zijn opgeslagen. Wil je deze weggooien?',{title:'Wijzigingen bewaren?',confirmText:'Wijzigingen weggooien',cancelText:'Verder bewerken'}))return;
      closeAgendaEdit();
    }finally{closing=false;}
  }
  window.addEventListener('beforeunload',event=>{if(!agenda.hidden&&snapshot()!==agendaDraft){event.preventDefault();event.returnValue='';}});
  new MutationObserver(sync).observe(idea,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(sync).observe(agenda,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('keydown',e=>{
    if(e.key!=='Tab'||!$('confirmModal').hidden)return;
    const panel=!layer.hidden&&layer.classList.contains('isModal')?layer:null;if(!panel)return;
    const fields=[...panel.querySelectorAll('button,input,textarea,select,a[href],[tabindex="0"]')].filter(x=>!x.disabled&&x.getClientRects().length);
    const first=fields[0],last=fields.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  },true);
  window.addEventListener('resize',sync);
  window.AdminEditors={
    openIdea(isNew){window.AdminSources?.close();AdminVisual.featuredPanel.hidden=true;ideaFocus=document.activeElement;title.textContent=isNew?'Activiteit toevoegen':'Activiteit bewerken';mountDetail();sync();syncLocationFields();fields.scrollTop=0;window.AdminPolish?.captureIdea();syncSaveState();},
    openAgenda(){agendaFocus=document.activeElement;agendaDraft=snapshot();sync();agenda.querySelector('.adminEditorCard').scrollTop=0;},
    sync,requestAgendaClose
  };
})();
