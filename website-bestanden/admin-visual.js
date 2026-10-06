/* Compact inspiration management: one selection, one left-hand detail/editor. */
(function(){
  const $=id=>document.getElementById(id);
  const layer=document.createElement('div');
  layer.id='adminIdeaLayer';layer.className='adminEditorLayer adminIdeaLayer';layer.hidden=true;
  layer.innerHTML='<section id="adminIdeaPreview" class="adminEditorCard adminPublicSurface photoDetailPanel" aria-labelledby="adminPreviewTitle"><header class="adminPreviewHeader"><h2 id="adminPreviewTitle"></h2><button class="adminEditorClose" type="button" aria-label="Activiteit sluiten">×</button></header><div class="photoDetailBody sharedIdeaCards"></div><footer class="adminPreviewActions" aria-label="Activiteit beheren"></footer></section>';
  document.body.append(layer);
  const preview=$('adminIdeaPreview'),body=preview.querySelector('.photoDetailBody'),actions=preview.querySelector('footer');
  let returnFocus=null,tab='Beschrijving';
  function tile(item,featured=false){
    const image=adminIdeaImage(item);
    const media=image?`<img src="${escapeHtml(image.src)}" alt="" loading="lazy" decoding="async">`:'<span class="photoTilePlaceholder" aria-hidden="true"></span>';
    const pills=compactPlacePills(normalizeIdeaLocation(item.locationType),normalizeIdeaDistance(item.distanceBand,item)).map(locationPill).join(' ')+costPill(normalizeIdeaCost(item.cost))+stimulusPill(normalizeIdeaStimulus(item.stimulus));
    const status=adminIdeaStatusLabel(item);
    return `<button type="button" class="photoTile ${domainThemeClass(item.domain)}${selectedAdminIdeaKey===item.key?' isSelected':''}${featured?' adminFeaturedTile':''}" data-idea-key="${escapeHtml(item.key)}" aria-label="Beheer ${escapeHtml(item.title)}" aria-haspopup="dialog">${IdeaViewShared.renderPhotoTileContent({media,icon:domainIcon(item.domain),pills,title:item.title})}${status}${featured?'<span class="adminFeaturedBadge">✦ Uitgelicht</span>':''}</button>`;
  }
  function refresh(){
    const items=allAdminIdeas();
    const featured=featuredIdeaKeys().map(key=>items.find(item=>adminFeaturedIdeaKey(item)===key)).filter(Boolean);
    const host=$('adminFeaturedPreview');
    // Deliberately no timer: a manager must be able to inspect a stable selection.
    host.innerHTML=featured.length?`<div class="adminFeaturedRail photoTiles compactTiles">${featured.map(item=>tile(item,true)).join('')}</div>`:'';
    const item=items.find(item=>item.key===selectedAdminIdeaKey);
    if(!item){if(selectedAdminIdeaKey)close();return;}
    if(layer.hidden)return;
    $('adminPreviewTitle').textContent=item.title;
    const address=String(item.address||item.where||'').trim();
    const routes=address?`<section class="photoRouteChoices"><p class="ideaPracticalText">${escapeHtml(address)}</p></section>`:'';
    body.innerHTML=PhotoTiles.detailContent(item,'adminDetailTitle',{card:adminIdeaCard(item),routes});
    body.querySelector('h3')?.remove();
    actions.innerHTML=adminIdeaActions(item);
    // Expose explicit labels in the sheet rather than a row of unexplained icons.
    actions.querySelectorAll('button').forEach(button=>{const label=button.getAttribute('aria-label');button.insertAdjacentHTML('beforeend',`<span>${escapeHtml(label==='Wijzig'?'Bewerken':label)}</span>`);});
    const remembered=[...body.querySelectorAll('[role="tab"]')].find(button=>button.textContent===tab);
    remembered?.click();
    document.querySelectorAll('#adminIdeaCards [data-idea-key],#adminIdeaList [data-idea-key]').forEach(node=>node.classList.toggle('isSelected',node.dataset.ideaKey===selectedAdminIdeaKey));
  }
  function open(key){
    const wasOpen=!layer.hidden;
    selectedAdminIdeaKey=key;returnFocus=document.activeElement;tab='Beschrijving';
    layer.hidden=false;preview.hidden=false;refresh();window.AdminEditors?.sync();
    preview.scrollTop=0;
    if(!wasOpen)preview.querySelector('.adminEditorClose').focus({preventScroll:true});
  }
  function close(){
    if(!$('adminIdeaEditPanel').hidden){$('adminIdeaEditCancelBtn').click();return;}
    const previousKey=selectedAdminIdeaKey;
    selectedAdminIdeaKey='';layer.hidden=true;
    document.querySelectorAll('#adminIdeaCards .isSelected,#adminIdeaList .isSelected').forEach(node=>node.classList.remove('isSelected'));
    window.AdminEditors?.sync();
    const target=returnFocus?.isConnected?returnFocus:document.querySelector(`#adminIdeaCards [data-idea-key="${CSS.escape(previousKey)}"]`);
    (target||$('ideaSearch'))?.focus({preventScroll:true});
  }
  preview.querySelector('.adminEditorClose').addEventListener('click',close);
  body.addEventListener('click',event=>{const button=event.target.closest('[role="tab"]');if(button)tab=button.textContent;});
  document.addEventListener('click',event=>{
    const featured=event.target.closest('#adminFeaturedPreview [data-idea-key]');
    if(featured)open(featured.dataset.ideaKey);
  });
  $('manageFeaturedBtn').addEventListener('click',()=>{
    const manager=$('featuredManager');manager.open=!manager.open;
    if(manager.open)manager.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
  });
  document.addEventListener('keydown',event=>{
    if(!event.defaultPrevented&&event.key==='Escape'&&!layer.hidden&&$('adminIdeaEditPanel').hidden&&$('confirmModal').hidden){event.preventDefault();close();}
  });
  window.AdminVisual={tile,open,close,refresh,layer,preview};
})();
