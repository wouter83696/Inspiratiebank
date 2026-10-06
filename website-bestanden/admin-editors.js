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
  const footer=form.querySelector('.teamActionBar');footer.prepend($('adminIdeaEditCancelBtn'));
  $('adminIdeaEditSubmitBtn').textContent='Opslaan';$('adminIdeaEditCancelBtn').textContent='Annuleren';
  const photoPreview=$('adminEditIdeaImagePreview');
  function syncPhoto(){
    const image=fields.querySelector('.ideaImageFrame img');
    const src=photoPreview.querySelector('img')?.getAttribute('src');
    if(image){image.hidden=!src;if(src)image.src=src;}
    const button=fields.querySelector('.adminInlinePhotoButton');
    if(button)button.textContent=src?'Foto wijzigen':'Foto uploaden (verplicht)';
  }
  new MutationObserver(syncPhoto).observe(photoPreview,{childList:true,subtree:true});
  function mountDetail(){
    allFields.forEach(field=>oldGrid.append(field));
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
    if(!figure.querySelector('img'))figure.insertAdjacentHTML('afterbegin','<img alt="">');
    const photoButton=document.createElement('button');photoButton.type='button';photoButton.className='ideaFilterSheetAction secondary adminInlinePhotoButton';
    photoButton.addEventListener('click',()=>$('adminEditIdeaImageUpload').click());figure.append(photoButton);
    const photoField=fieldFor('ImageUpload');photoField.classList.add('adminInlineUpload');figure.after(photoField);
    const metadata=article.querySelector('.cardMetaBlock');
    const details=document.createElement('details');details.className='adminInlineMetadata';
    const summary=document.createElement('summary');summary.setAttribute('aria-label','Kenmerken aanpassen');
    if(metadata){metadata.replaceWith(details);summary.append(metadata);}else article.append(details);
    summary.insertAdjacentHTML('beforeend','<span class="adminInlineHint">Kenmerken aanpassen</span>');details.append(summary);
    const grid=document.createElement('div');grid.className='teamFormGrid';details.append(grid);
    ['Domain','Location','Cost','Stimulus','Duration','Group','By'].forEach(id=>grid.append(fieldFor(id)));
    const panels=article.querySelectorAll('[role="tabpanel"]');
    panels[0].replaceChildren(fieldFor('Description'));
    panels[1].replaceChildren(fieldFor('Rules'));
    panels[2]?.replaceChildren(fieldFor('Supplies'));
    const contact=article.querySelector('.photoDetailActions');
    ['Postcode','HouseNumber','Address','DistanceKm','Url'].forEach(id=>contact.append(fieldFor(id)));
    const actions=document.createElement('div');actions.className='adminPreviewActions';actions.innerHTML=item.isNew?'':adminIdeaActions(item);
    actions.querySelector('[data-edit-idea]')?.remove();
    actions.querySelectorAll('button').forEach(button=>{button.insertAdjacentHTML('beforeend',`<span>${escapeHtml(button.getAttribute('aria-label'))}</span>`);});
    // State-changing management actions are kept separate from the unsaved draft.
    if(!item.isNew){const more=document.createElement('details');more.className='adminInlineManagement';more.innerHTML='<summary>Beheeracties</summary>';more.append(actions);article.append(more);}
    syncPhoto();
  }
  function updateMetadata(){
    if(!editingAdminIdea)return;
    const draft=editedIdeaPayload(editingAdminIdea);
    const template=document.createElement('template');template.innerHTML=adminIdeaCard(draft);
    const current=fields.querySelector('.adminInlineMetadata .cardMetaBlock');
    const next=template.content.querySelector('.cardMetaBlock');
    if(current&&next)current.replaceWith(next);
    const badge=fields.querySelector('.ideaImageDomainBadge');
    if(badge)badge.innerHTML=domainIcon(draft.domain);
  }
  form.addEventListener('change',updateMetadata);
  const locationFields=['Postcode','HouseNumber','Address','DistanceKm'].map(id=>$('adminEditIdea'+id).closest('.teamField'));
  function syncLocationFields(){
    const value=normalizeIdeaLocation($('adminEditIdeaLocation').value);
    const show=value==='Op pad'||value==='Binnen'||Boolean($('adminEditIdeaAddress').value.trim());
    locationFields.forEach(field=>{field.hidden=!show;});
  }
  $('adminEditIdeaLocation').closest('.teamField').classList.add('wide');
  $('adminEditIdeaLocation').addEventListener('change',syncLocationFields);
  const title=idea.querySelector('h3');title.id='adminEditorTitle';
  function closeButton(parent,action){const button=document.createElement('button');button.type='button';button.className='adminEditorClose';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';button.setAttribute('aria-label','Formulier sluiten');button.addEventListener('click',action);parent.append(button);}
  closeButton(idea.querySelector('.panelHead'),()=>$('adminIdeaEditCancelBtn').click());
  closeButton(agenda.querySelector('.confirmModalTop'),()=>requestAgendaClose());
  layer.addEventListener('click',e=>{if(e.target===layer){if(!idea.hidden)$('adminIdeaEditCancelBtn').click();else AdminVisual.close();}});
  let ideaFocus=null,agendaFocus=null,agendaDraft='',closing=false;
  const snapshot=()=>JSON.stringify([...$('agendaEditForm').elements].filter(e=>e.tagName!=='BUTTON').map(e=>[e.id,e.type==='checkbox'?e.checked:e.value]));
  function sync(){
    const detail=false;
    layer.hidden=idea.hidden&&!detail;
    AdminVisual.preview.hidden=!idea.hidden;
    const modal=!agenda.hidden||(!idea.hidden&&matchMedia('(max-width:1100px)').matches);
    const open=modal;
    layer.setAttribute('role',modal?'dialog':'region');
    layer.setAttribute('aria-label',!idea.hidden?'Activiteit bewerken':'Activiteitsdetails');
    if(modal)layer.setAttribute('aria-modal','true');else layer.removeAttribute('aria-modal');
    layer.classList.toggle('isEditing',!idea.hidden);
    layer.classList.toggle('isModal',modal);
    document.body.classList.toggle('adminDetailDocked',!layer.hidden&&!modal);
    document.body.classList.toggle('adminEditorOpen',open);
    $('adminApp').inert=open;
    if(idea.hidden&&ideaFocus){if(detail){AdminVisual.refresh();AdminVisual.preview.querySelector('.adminEditorClose').focus({preventScroll:true});}else if(ideaFocus.isConnected)ideaFocus.focus({preventScroll:true});ideaFocus=null;}
    if(agenda.hidden&&agendaFocus){if(agendaFocus.isConnected)agendaFocus.focus({preventScroll:true});agendaFocus=null;}
  }
  async function requestAgendaClose(){
    if(closing)return;closing=true;
    try{
      if(snapshot()!==agendaDraft&&!await confirmDialog('Je hebt wijzigingen die nog niet zijn opgeslagen. Wil je deze weggooien?',{title:'Wijzigingen bewaren?',confirmText:'Wijzigingen weggooien',cancelText:'Verder bewerken'}))return;
      closeAgendaEdit();
    }finally{closing=false;}
  }
  window.addEventListener('beforeunload',event=>{if(!agenda.hidden&&snapshot()!==agendaDraft){event.preventDefault();event.returnValue='';}});
  new MutationObserver(sync).observe(idea,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(sync).observe(agenda,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('keydown',e=>{
    if(e.key!=='Tab'||!$('confirmModal').hidden)return;
    const panel=!layer.hidden&&layer.classList.contains('isModal')?layer:!agenda.hidden?agenda:null;if(!panel)return;
    const fields=[...panel.querySelectorAll('button,input,textarea,select,a[href],[tabindex="0"]')].filter(x=>!x.disabled&&x.getClientRects().length);
    const first=fields[0],last=fields.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  },true);
  window.addEventListener('resize',sync);
  window.AdminEditors={
    openIdea(isNew){ideaFocus=document.activeElement;title.textContent=isNew?'Activiteit toevoegen':'Activiteit bewerken';mountDetail();sync();syncLocationFields();fields.scrollTop=0;window.AdminPolish?.captureIdea();},
    openAgenda(){agendaFocus=document.activeElement;agendaDraft=snapshot();sync();agenda.querySelector('.adminEditorCard').scrollTop=0;},
    sync,requestAgendaClose
  };
})();
