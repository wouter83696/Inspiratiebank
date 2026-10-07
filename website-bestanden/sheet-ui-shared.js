/* Canonical sheet structure for public submissions, discovery and management.
   Host adapters retain their own validation, permissions and persistence. */
(function(){
  const selectors='.ideaFilterSheet,.ideaSubmitSheet,#adminIdeaEditPanel,#agendaEditModal .adminEditorCard,#adminAgendaManagerSheet,#adminSourcesSheet';
  function mount(root=document){
    root.querySelectorAll(selectors).forEach(panel=>{
      panel.classList.add('sharedSheet');
      if(!document.getElementById('adminApp'))panel.closest('.ideaFilterSheetLayer,.ideaSubmitSheetLayer')?.classList.add('sharedPublicSheetLayer');
      const header=panel.querySelector(':scope > header,:scope > .panelHead,:scope > .confirmModalTop');
      header?.classList.add('sharedSheetHeader');
      panel.querySelectorAll('.ideaFilterSheetBody,.ideaSubmitSheetBody,.adminAgendaManagerBody,.adminAgendaEditBody,.adminEditFields').forEach(body=>body.classList.add('sharedSheetBody'));
      panel.querySelectorAll('.ideaFilterSheetFooter,.adminActivityFooter').forEach(footer=>footer.classList.add('sharedSheetFooter'));
    });
  }
  function submissionFooter(panel,form,closeAttribute){
    const bar=form.querySelector('.teamActionBar');
    if(!bar||panel.querySelector(':scope > .sharedSheetFooter'))return;
    const save=bar.querySelector('button[type=submit]');
    if(!save)return;
    const footer=document.createElement('footer');footer.className='sharedSheetFooter ideaFilterSheetFooter';
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Annuleren';cancel.setAttribute(closeAttribute,'');cancel.className='ideaFilterSheetAction secondary';
    // Dispatch through the host close control so its focus handling stays intact.
    cancel.addEventListener('click',()=>panel.querySelector('header ['+closeAttribute+']').click());
    save.setAttribute('form',form.id);save.className='ideaFilterSheetAction primary';
    footer.append(cancel,save);panel.append(footer);
    bar.classList.add('sharedSheetStatus');
  }
  function photoPicker(figure,input,{required=false,onError=()=>{}}={}){
    const button=document.createElement('button');button.type='button';button.className='adminPhotoDropzone sharedPhotoDropzone';
    button.setAttribute('aria-label','Foto toevoegen: klik of sleep een foto');
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m4 18 6-6 4 4 3-3 4 5"/></svg><strong>Sleep hier een foto naartoe</strong><span>of klik om een foto te kiezen</span><small>'+ (required?'Foto verplicht':'Foto optioneel')+' · maximaal 1,5 MB</small>';
    button.addEventListener('click',()=>input.click());figure.append(button);
    figure.addEventListener('dragover',event=>{event.preventDefault();button.classList.add('isDragging');});
    figure.addEventListener('dragleave',()=>button.classList.remove('isDragging'));
    figure.addEventListener('drop',event=>{
      event.preventDefault();button.classList.remove('isDragging');const files=event.dataTransfer?.files;
      if(!files?.length)return;
      if(files.length!==1||!files[0].type.startsWith('image/')){onError('Kies één afbeeldingsbestand.');return;}
      input.files=files;input.dispatchEvent(new Event('change',{bubbles:true}));
    });
    return button;
  }
  function editorToolbar(header,label='Activiteit beheren'){
    const toolbar=document.createElement('div');toolbar.className='adminEditToolbar sharedEditorToolbar';toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label',label);header.after(toolbar);return toolbar;
  }
  function publicActivityPreview(){
    const form=document.getElementById('teamIdeaForm');if(!form)return;
    const field=id=>document.getElementById('teamIdea'+id+'Input');
    const title=field('Title').closest('label'),upload=field('Image');
    const toolbar=editorToolbar(form.closest('aside').querySelector('header'),'Activiteit toevoegen');
    const icons=['<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m4 18 6-6 4 4 3-3 4 5"/>','<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>','<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'];
    toolbar.classList.add('sharedSectionNav');
    const sectionTargets=()=>[document.getElementById('teamIdeaImageSuggest'),field('Domain').closest('label'),field('Location').closest('label')];
    const selectSection=index=>[...toolbar.children].forEach((button,i)=>{button.classList.toggle('isActive',i===index);if(i===index)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});
    ['Foto','Kenmerken','Locatie'].forEach((label,index)=>{
      const button=document.createElement('button');button.type='button';button.className='ideaFilterSheetAction secondary';button.title=label;button.setAttribute('aria-label',label);button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[index]+'</svg><span>'+label+'</span>';
      button.addEventListener('click',()=>{selectSection(index);sectionTargets()[index].scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});toolbar.append(button);
    });
    selectSection(0);
    const scrollBody=form.closest('.ideaSubmitSheetBody');
    scrollBody?.addEventListener('scroll',()=>{const edge=scrollBody.getBoundingClientRect().top+80;let active=0;sectionTargets().forEach((target,index)=>{if(target.getBoundingClientRect().top<=edge)active=index;});selectSection(active);},{passive:true});
    const figure=document.createElement('figure');figure.className='sharedSheetPhoto';title.after(figure);
    const img=document.createElement('img');img.alt='Voorbeeld van je activiteit';img.hidden=true;figure.append(img);
    const picker=photoPicker(figure,upload,{required:true,onError:message=>{document.getElementById('teamIdeaStatus').textContent=message;}});
    let objectUrl;
    const reset=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null;img.hidden=true;picker.hidden=false;img.removeAttribute('src');};
    upload.addEventListener('change',()=>{reset();const file=upload.files?.[0];if(file){objectUrl=URL.createObjectURL(file);img.src=objectUrl;img.hidden=false;picker.hidden=true;}});
    form.addEventListener('reset',reset);
    const name=field('By');name.closest('label').querySelector('span').textContent='Ingebracht door';
    field('Group').closest('label').after(name.closest('label'));
    title.querySelector('span').textContent='Titel';
    // Keep the existing upload and suggestion handlers in one photo section.
    const website=field('Url').closest('label');title.after(website);
    website.querySelector('span').textContent='Website (optioneel)';
    const suggestion=document.getElementById('teamIdeaImageSuggest');
    suggestion.classList.add('sharedPhotoSection');website.after(suggestion);
    const caption=document.createElement('div');caption.className='sharedPhotoLabel';caption.id='teamIdeaPhotoLabel';caption.textContent='Foto (verplicht)';suggestion.prepend(caption);suggestion.setAttribute('role','group');suggestion.setAttribute('aria-labelledby',caption.id);
    const top=suggestion.querySelector('.ideaImageSuggestTop');
    const status=document.getElementById('teamIdeaImageSuggestStatus');
    const actions=suggestion.querySelector('.ideaImageSuggestActions');
    top.append(...actions.children);actions.remove();
    const photoBody=document.createElement('div');photoBody.className='sharedPhotoBody';
    top.after(photoBody);photoBody.append(status,figure,document.getElementById('teamIdeaImageSuggestPreview'));
    document.getElementById('teamIdeaSkipImage').hidden=true;
    const uploadField=upload.closest('label');
    uploadField.hidden=true;
    document.getElementById('teamIdeaReplaceImage').textContent='Upload foto';
    document.getElementById('teamIdeaStartFreeImage').textContent='Zoek foto';
    document.getElementById('teamIdeaFindFreeImage').textContent='Andere foto';
    const syncPhoto=()=>{figure.hidden=!document.getElementById('teamIdeaImageSuggestPreview').hidden;};
    new MutationObserver(syncPhoto).observe(document.getElementById('teamIdeaImageSuggestPreview'),{attributes:true,attributeFilter:['hidden']});
    syncPhoto();
  }
  function sourceFields(form,ids){
    // Keep the host's controls (and their handlers); both hosts use this field layout.
    const grid=form.querySelector('.teamFormGrid')||form;
    const definitions=[['name','Naam','Bijv. lokale agenda'],['url','Website','https://']];
    const fields=definitions.map(([key,label,placeholder])=>{
      let input=document.getElementById(ids[key]);
      if(!input){input=document.createElement('input');input.id=ids[key];input.name=key;input.type='text';const field=document.createElement('label');field.append(input);grid.prepend(field);}
      const field=input.closest('label');field.classList.add('teamField','wide');
      let caption=field.querySelector(':scope > span');
      if(!caption){[...field.childNodes].filter(node=>node.nodeType===3).forEach(node=>node.remove());caption=document.createElement('span');field.prepend(caption);}
      caption.textContent=label;input.placeholder=placeholder;return field;
    });
    fields[1].before(fields[0]);
  }
  function setup(){
    [['ideaSubmitSheetLayer','teamIdeaForm','data-idea-submit-close'],['agendaSourceSheetLayer','linkAddForm','data-agenda-source-close']].forEach(([id,formId,close])=>{
      const layer=document.getElementById(id),form=document.getElementById(formId);
      if(layer&&form){layer.classList.add('sharedPublicSheetLayer');submissionFooter(layer.querySelector('aside'),form,close);}
    });
    if(!document.getElementById('adminApp'))document.querySelectorAll('.ideaFilterSheetLayer').forEach(layer=>layer.classList.add('sharedPublicSheetLayer'));
    if(!document.getElementById('adminApp')){
      const layer=document.getElementById('ideaFilterSheetLayer');
      if(layer)['ideaLocation','ideaCost','ideaDuration','ideaStimulus'].forEach(filter=>{
        DiscoveryViewShared.filterDropdown(layer,filter,{keepButtons:true,onChange:value=>layer.querySelector(`[data-sheet-filter="${filter}"][data-value="${value}"]`)?.click()});
      });
      DiscoveryViewShared.syncDropdowns();
    }
    const publicSource=document.getElementById('linkAddForm');
    if(publicSource)sourceFields(publicSource,{name:'linkNameInput',url:'linkUrlInput'});
    const adminSource=document.getElementById('linkForm');
    if(adminSource)sourceFields(adminSource,{name:'linkName',url:'linkUrl'});
    const materials=document.getElementById('teamIdeaSuppliesInput');
    if(materials)window.IdeaViewShared?.editMaterials(materials);
    publicActivityPreview();
    document.querySelectorAll('.sharedPublicSheetLayer').forEach(layer=>layer.addEventListener('keydown',event=>{
      if(event.key!=='Tab'||!layer.classList.contains('isOpen'))return;
      const panel=layer.querySelector('[role=dialog]');if(!panel)return;
      const nodes=[...panel.querySelectorAll('button,input,textarea,select,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length);
      const first=nodes[0],last=nodes.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }));
    mount();
    new MutationObserver(records=>{if(records.some(record=>record.addedNodes.length))mount();}).observe(document.body,{childList:true,subtree:true});
  }
  window.SheetUIShared=Object.freeze({mount,submissionFooter,photoPicker,editorToolbar});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
