/* Management-only behaviour: responsive navigation, feedback and draft protection. */
(function(){
  const $=id=>document.getElementById(id);
  const app=$('adminApp'), mobile=matchMedia('(max-width:820px)');
  let ideaSnapshot='', settingsSnapshot='', originalPhoto=null, approvedClick=false, noticeTimer;
  const snapshot=form=>JSON.stringify([...form.elements].filter(e=>e.tagName!=='BUTTON').map(e=>[e.id,e.type==='checkbox'?e.checked:e.value]).sort((a,b)=>a[0].localeCompare(b[0])));
  const ideaDirty=()=>!$('adminIdeaEditPanel').hidden && ideaSnapshot!==snapshot($('adminIdeaEditForm'));
  const settingsDirty=()=>window.AdminSiteSettings?.hasUnsaved?.() || false;
  function captureIdea(){ideaSnapshot=snapshot($('adminIdeaEditForm'));originalPhoto={image:$('adminEditIdeaImage').value,approved:$('adminEditIdeaImageApproved').checked};}
  function captureSettings(){settingsSnapshot=snapshot($('siteSettingsForm'));}
  function status(message,kind){
    clearTimeout(noticeTimer);$('adminNotice').hidden=!message;
    if(message && kind!=='warn')noticeTimer=setTimeout(()=>{$('adminNotice').hidden=true;},8000);
  }
  function closeMenu(){app.classList.remove('mobileMenuOpen');$('adminMobileMenuButton').setAttribute('aria-expanded','false');}
  const homes=[...document.querySelectorAll('.adminActionTopbar .adminHeroActions')].map(node=>({node,home:node.parentElement}));
  for(const {node} of homes){
    for(const button of node.querySelectorAll('button')){
      const text=button.querySelector('span');
      const short=button.id==='addAdminAgendaBtn'?'Agenda':button.hasAttribute('data-add-admin-source')?'Bron':'';
      if(text&&short){button.setAttribute('aria-label',text.textContent);text.classList.add('adminActionLong');const label=document.createElement('span');label.className='adminActionShort';label.setAttribute('aria-hidden','true');label.textContent=short;button.append(label);}
    }
  }
  new ResizeObserver(()=>app.style.setProperty('--admin-mobile-bar-height',`${document.querySelector('.adminMobileTopbar').getBoundingClientRect().height}px`)).observe(document.querySelector('.adminMobileTopbar'));
  function syncMobile(){
    const workspace=document.querySelector('[data-admin-workspace]:not([hidden])');
    const top=mobile.matches;
    app.classList.toggle('adminMobileNavigation',top);
    $('adminMenuLabel').textContent=(document.querySelector('.adminNavButton.active .adminNavText')?.textContent||'Inspiratiebank')+' beheer';
    for(const {node,home} of homes){const target=top&&workspace?.contains(home)?$('adminMobileActions'):home;if(node.parentElement!==target)target.append(node);}
    if(!top)closeMenu();
  }
  $('adminMobileMenuButton').addEventListener('click',()=>{const open=!app.classList.contains('mobileMenuOpen');app.classList.toggle('mobileMenuOpen',open);$('adminMobileMenuButton').setAttribute('aria-expanded',String(open));});
  document.addEventListener('click',event=>{
    if(!event.target.closest('.adminSidebar,#adminMobileMenuButton'))closeMenu();
    if(event.target.closest('[data-admin-target]')){closeMenu();syncMobile();}
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&app.classList.contains('mobileMenuOpen')){closeMenu();$('adminMobileMenuButton').focus();}});
  new MutationObserver(syncMobile).observe(app,{subtree:true,attributes:true,attributeFilter:['hidden']});
  mobile.addEventListener('change',syncMobile);
  $('adminNoticeClose').addEventListener('click',()=>{$('adminNotice').hidden=true;});
  $('adminIdeaStatusFilter').addEventListener('change',renderIdeas);
  function setPhoto(image,approved){
    $('adminEditIdeaImage').value=image;$('adminEditIdeaImageApproved').checked=approved;
    $('adminEditIdeaImageUpload').value='';$('adminEditIdeaImageUploadName').textContent='Geen bestand geselecteerd';
    syncAdminIdeaImagePreview();syncAdminIdeaImageSuggestion();
  }
  $('adminIdeaPhotoClear').addEventListener('click',()=>setPhoto('',false));
  $('adminIdeaPhotoReset').addEventListener('click',()=>setPhoto(originalPhoto?.image||'',originalPhoto?.approved||false));
  document.addEventListener('click',async event=>{
    if(approvedClick)return;
    const target=event.target.closest('#addAdminIdeaBtn,[data-edit-idea],[data-idea-key],[data-admin-featured-key],[data-feature-idea],[data-delete-idea],[data-title-action],[data-team-action],#adminIdeaEditCancelBtn,[data-admin-target],#logoutBtn,#siteSettingsCancel');
    if(!target)return;
    const leaving=target.id==='logoutBtn' || (target.hasAttribute('data-admin-target') && target.dataset.adminTarget!==document.querySelector('[data-admin-workspace]:not([hidden])')?.dataset.adminWorkspace);
    const discardIdea=ideaDirty()&&(leaving||target.matches('#addAdminIdeaBtn,[data-edit-idea],[data-idea-key],[data-admin-featured-key],[data-feature-idea],[data-delete-idea],[data-title-action],[data-team-action],#adminIdeaEditCancelBtn'));
    const discardSettings=settingsDirty()&&(leaving||target.id==='siteSettingsCancel');
    if(!discardIdea&&!discardSettings)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(!await confirmDialog('Je hebt wijzigingen die nog niet zijn opgeslagen. Wil je deze weggooien?',{title:'Wijzigingen bewaren?',confirmText:'Wijzigingen weggooien',cancelText:'Verder bewerken'}))return;
    if(discardIdea)resetAdminIdeaEditForm();
    if(discardSettings)AdminSiteSettings.load();
    approvedClick=true;try{target.click();}finally{approvedClick=false;}
  },true);
  window.addEventListener('beforeunload',event=>{if(ideaDirty()||settingsDirty()){event.preventDefault();event.returnValue='';}});
  // Keep keyboard focus inside confirmation/edit dialogs and return it on close.
  let dialogFocus=null;
  new MutationObserver(()=>{
    const open=!$('confirmModal').hidden?$('confirmModal'):document.querySelector('.confirmModal:not([hidden])');
    if(open){dialogFocus=open;}
    else if(!open&&dialogFocus){dialogFocus=null;}
  }).observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden']});
  document.addEventListener('keydown',event=>{
    if(event.key!=='Tab'||!dialogFocus)return;
    const buttons=[...dialogFocus.querySelectorAll('button,input,select,textarea,a[href]')].filter(e=>!e.disabled&&e.getClientRects().length);
    const first=buttons[0],last=buttons[buttons.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  });
  window.AdminPolish={ideaDirty,captureIdea,captureSettings,status,syncMobile};
  captureIdea();captureSettings();syncMobile();
})();
