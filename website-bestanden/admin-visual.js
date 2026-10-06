/* Compact inspiration management: one selection, one left-hand detail/editor. */
(function(){
  const $=id=>document.getElementById(id);
  const layer=document.createElement('div');
  layer.id='adminIdeaLayer';layer.className='adminEditorLayer adminIdeaLayer';layer.hidden=true;
  layer.innerHTML='<section id="adminIdeaPreview" class="adminEditorCard adminPublicSurface photoDetailPanel" aria-labelledby="adminPreviewTitle"><header class="adminPreviewHeader"><h2 id="adminPreviewTitle"></h2><button class="adminEditorClose" type="button" aria-label="Activiteit sluiten"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><div class="adminPreviewActions" role="group" aria-label="Activiteit beheren"></div><div class="photoDetailBody sharedIdeaCards"></div></section>';
  document.body.append(layer);
  const preview=$('adminIdeaPreview'),body=preview.querySelector('.photoDetailBody'),actions=preview.querySelector('.adminPreviewActions');
  let returnFocus=null,tab='Beschrijving';
  const featuredPanel=document.createElement('section');
  featuredPanel.id='adminFeaturedSheet';featuredPanel.className='adminEditorCard adminPublicSurface photoDetailPanel';featuredPanel.hidden=true;
  featuredPanel.setAttribute('aria-labelledby','adminFeaturedHeading');
  featuredPanel.innerHTML='<header class="panelHead"><h3 id="adminFeaturedHeading">Uitgelicht beheren</h3><button class="adminEditorClose" type="button" aria-label="Uitgelicht sluiten">×</button></header><div class="adminFeaturedBody"><div class="adminFeaturedSelection"></div><label class="teamField"><span>Activiteit toevoegen aan Uitgelicht</span><input type="search" id="adminFeaturedSearch" placeholder="Zoek een activiteit"></label><div class="adminFeaturedChoices"></div><p role="status" class="adminFeaturedStatus"></p></div>';
  featuredPanel.querySelector('.adminEditorClose').innerHTML=actionIcon('close');
  layer.append(featuredPanel);
  const oldManager=$('featuredManager');const manager=document.createElement('div');manager.id='featuredManager';manager.className='featuredAdminPanel';oldManager.querySelector('summary').remove();manager.append(...oldManager.childNodes);oldManager.replaceWith(manager);
  featuredPanel.querySelector('.adminFeaturedSelection').append(manager);
  $('manageFeaturedBtn')?.remove();
  function featuredChoices(){
    const query=$('adminFeaturedSearch').value.toLocaleLowerCase();
    const selected=featuredIdeaKeys();
    const choices=allAdminIdeas().filter(item=>!item.hidden&&!selected.includes(adminFeaturedIdeaKey(item))&&item.title.toLocaleLowerCase().includes(query));
    featuredPanel.querySelector('.adminFeaturedChoices').innerHTML=choices.map(item=>`<button class="button" type="button" data-feature-idea="${escapeHtml(adminFeaturedIdeaKey(item))}" ${selected.length>=5?'disabled':''}><span>${escapeHtml(item.title)}</span>${actionIcon('plus')}</button>`).join('')||'<p>Geen activiteiten gevonden.</p>';
  }
  function openFeatured(){
    returnFocus=document.activeElement;
    $('adminIdeaEditPanel').hidden=true;preview.hidden=true;featuredPanel.hidden=false;layer.hidden=false;
    renderFeaturedIdeaManager();featuredChoices();window.AdminEditors?.sync();
    featuredPanel.querySelector('.adminEditorClose').focus({preventScroll:true});
  }
  featuredPanel.querySelector('.adminEditorClose').addEventListener('click',()=>{featuredPanel.hidden=true;window.AdminEditors?.sync();returnFocus?.focus({preventScroll:true});});
  $('adminFeaturedSearch').addEventListener('input',featuredChoices);
  let sorting=null;
  const sortList=$('featuredAdminList');
  sortList.addEventListener('pointerdown',event=>{
    const handle=event.target.closest('.featuredDragHandle');if(!handle||event.button!==0)return;
    const row=handle.closest('[data-featured-sort-key]');
    sorting={key:row.dataset.featuredSortKey,target:row.dataset.featuredSortKey,handle};
    handle.setPointerCapture(event.pointerId);row.classList.add('isDragging');event.preventDefault();
  });
  sortList.addEventListener('pointermove',event=>{
    if(!sorting)return;
    const row=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-featured-sort-key]');
    sortList.querySelectorAll('.isDropTarget').forEach(item=>item.classList.remove('isDropTarget'));
    if(row){sorting.target=row.dataset.featuredSortKey;row.classList.add('isDropTarget');}
  });
  function clearSort(){sortList.querySelectorAll('.isDragging,.isDropTarget').forEach(item=>item.classList.remove('isDragging','isDropTarget'));sorting=null;}
  sortList.addEventListener('pointercancel',clearSort);
  sortList.addEventListener('pointerup',async()=>{
    if(!sorting)return;
    const {key,target}=sorting;clearSort();if(key===target)return;
    const keys=featuredIdeaKeys();const from=keys.indexOf(key),to=keys.indexOf(target);if(from<0||to<0)return;
    keys.splice(from,1);keys.splice(to,0,key);
    if(await saveFeaturedIdeaKeys(keys)){renderIdeas();setStatus('#adminStatus','Volgorde van Uitgelicht aangepast.','ok');}
    else setStatus('#adminStatus',storageErrorMessage('Volgorde opslaan lukte niet.'),'warn');
  });

  new MutationObserver(()=>{featuredPanel.querySelector('.adminFeaturedStatus').textContent=$('adminStatus').textContent;}).observe($('adminStatus'),{childList:true,subtree:true,characterData:true});

  function tile(item){
    const image=adminIdeaImage(item);
    const media=image?`<img src="${escapeHtml(image.src)}" alt="" loading="lazy" decoding="async">`:'<span class="photoTilePlaceholder" aria-hidden="true"></span>';
    const pills=compactPlacePills(normalizeIdeaLocation(item.locationType),normalizeIdeaDistance(item.distanceBand,item)).map(locationPill).join(' ')+costPill(normalizeIdeaCost(item.cost))+stimulusPill(normalizeIdeaStimulus(item.stimulus));
    const status=adminIdeaStatusLabel(item);
    return `<button type="button" class="photoTile ${domainThemeClass(item.domain)}${selectedAdminIdeaKey===item.key?' isSelected':''}" data-idea-key="${escapeHtml(item.key)}" aria-label="Beheer ${escapeHtml(item.title)}" aria-haspopup="dialog">${IdeaViewShared.renderPhotoTileContent({media,icon:domainIcon(item.domain),pills,title:item.title})}${status}</button>`;
  }
  function refresh(){
    const items=allAdminIdeas();
    const featured=featuredIdeaKeys().map(key=>items.find(item=>adminFeaturedIdeaKey(item)===key)).filter(Boolean);
    if(!featured.length){const fallback=items.find(item=>!item.hidden&&adminIdeaImage(item));if(fallback)featured.push(fallback);}
    if(!featuredPanel.hidden)featuredChoices();
    const host=$('adminIdeaCards');
    host.querySelector('.ideaFeaturedCarousel')?.remove();
    if(featured.length){
      const slides=featured.map((item,index)=>{
        const image=adminIdeaImage(item);
        return IdeaViewShared.renderFeaturedCard({title:item.title,themeClass:domainThemeClass(item.domain),index,
          attributes:`data-admin-featured-key="${escapeHtml(item.key)}"`,label:`Uitgelicht beheren: ${item.title}`,icon:actionIcon('spark'),
          media:image?`<img src="${escapeHtml(image.src)}" alt="" loading="lazy">`:''});
      }).join('');
      const dots=featured.length>1?`<div class="ideaFeaturedNav" aria-label="Blader door Uitgelicht">${featured.map((item,index)=>`<button type="button" class="ideaFeaturedDot" data-admin-featured-index="${index}" aria-label="Toon ${escapeHtml(item.title)}" aria-pressed="${index===0}"></button>`).join('')}</div>`:'';
      host.insertAdjacentHTML('afterbegin',`<div class="ideaFeaturedCarousel" role="region" aria-label="Uitgelichte activiteiten"><div class="ideaFeaturedSlides">${slides}</div>${dots}</div>`);
    }
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
    const actionRow=actions.querySelector('.ideaActions');
    const editButton=actionRow.querySelector('[data-edit-idea]');
    if(editButton)actionRow.prepend(editButton);
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
    const dot=event.target.closest('[data-admin-featured-index]');
    if(dot){const carousel=dot.closest('.ideaFeaturedCarousel');const index=Number(dot.dataset.adminFeaturedIndex);carousel.querySelectorAll('[data-featured-slide]').forEach((slide,i)=>{slide.setAttribute('aria-hidden',String(i!==index));slide.inert=i!==index;});carousel.querySelectorAll('[data-admin-featured-index]').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));return;}
    const featured=event.target.closest('[data-admin-featured-key]');
    if(featured){openFeatured();}

  });
  document.addEventListener('keydown',event=>{
    if(!event.defaultPrevented&&event.key==='Escape'&&!layer.hidden&&$('adminIdeaEditPanel').hidden&&$('confirmModal').hidden){event.preventDefault();if(!featuredPanel.hidden)featuredPanel.querySelector('.adminEditorClose').click();else close();}
  });
  window.AdminVisual={tile,open,close,refresh,layer,preview,featuredPanel};
})();
