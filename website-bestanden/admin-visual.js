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
  let sorting=null,suppressClick=false;
  const sortList=$('featuredAdminList');
  function placeFeaturedGap(before){
    const gap=sorting.gap;
    if(gap.parentNode===sortList&&gap.nextElementSibling===before)return;
    const rows=[...sortList.querySelectorAll('[data-featured-sort-key]')].filter(row=>row!==sorting.row);
    const positions=new Map(rows.map(row=>[row,row.getBoundingClientRect().top]));
    sortList.insertBefore(gap,before);
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)rows.forEach(row=>{
      const dy=positions.get(row)-row.getBoundingClientRect().top;
      if(dy)row.animate([{transform:`translateY(${dy}px)`},{transform:'translateY(0)'}],{duration:180,easing:'ease-out'});
    });
  }
  document.addEventListener('pointerdown',event=>{
    if(featuredPanel.hidden||event.button!==0)return;
    const handle=event.target.closest('.featuredDragHandle');
    const tile=event.target.closest('#adminIdeaCards [data-idea-key],#adminIdeaList [data-idea-key]');
    if(!handle&&!tile)return;
    const item=tile&&allAdminIdeas().find(item=>item.key===tile.dataset.ideaKey);
    if(tile&&(!item||item.hidden))return;
    const row=handle?.closest('[data-featured-sort-key]');
    sorting={key:row?row.dataset.featuredSortKey:adminFeaturedIdeaKey(item),source:row?'selection':'catalog',handle:handle||tile,x:event.clientX,y:event.clientY,active:false};
    sorting.handle.setPointerCapture(event.pointerId);event.preventDefault();
  });
  document.addEventListener('pointermove',event=>{
    if(!sorting)return;
    if(!sorting.active&&Math.hypot(event.clientX-sorting.x,event.clientY-sorting.y)<6)return;
    if(!sorting.active){sorting.active=true;sorting.handle.setPointerCapture(event.pointerId);sorting.handle.classList.add('isDragging');
      const item=allAdminIdeas().find(item=>adminFeaturedIdeaKey(item)===sorting.key);
      const ghost=document.createElement('div');ghost.className='featuredDragGhost '+domainThemeClass(item.domain);ghost.setAttribute('aria-hidden','true');
      ghost.innerHTML=IdeaViewShared.renderListActivity({title:item.title,image:adminIdeaImage(item),icon:domainIcon(item.domain)})+'<small></small>';
      document.body.append(ghost);sorting.ghost=ghost;
      sorting.row=[...sortList.querySelectorAll('[data-featured-sort-key]')].find(row=>row.dataset.featuredSortKey===sorting.key);
      const gap=document.createElement('div');gap.className='featuredInsertGap';gap.textContent='Hier plaatsen';gap.setAttribute('aria-hidden','true');
      gap.style.height=`${sorting.row?.getBoundingClientRect().height||74}px`;sorting.gap=gap;
      if(sorting.row){sortList.insertBefore(gap,sorting.row);sorting.row.hidden=true;}

    }
    sorting.ghost.style.transform=`translate3d(${event.clientX+16}px,${event.clientY+16}px,0)`;
    event.preventDefault();
    const target=document.elementFromPoint(event.clientX,event.clientY);
    sorting.into=!!target?.closest('#adminFeaturedSheet');
    sorting.out=!!target?.closest('#adminIdeaCards,#adminIdeaList');
    sorting.ghost.querySelector('small').textContent=sorting.into?'Loslaten in Uitgelicht':sorting.out&&sorting.source==='selection'?'Uit Uitgelicht halen':'Sleep naar Uitgelicht';
    featuredPanel.classList.toggle('isDropTarget',sorting.into);
    if(sorting.into){
      const rows=[...sortList.querySelectorAll('[data-featured-sort-key]')].filter(row=>row!==sorting.row);
      const before=rows.find(row=>event.clientY<row.getBoundingClientRect().top+row.offsetHeight/2);
      sorting.target=before?.dataset.featuredSortKey;
      placeFeaturedGap(before||null);
    }else sorting.gap.remove();
  },{passive:false});
  function clearSort(){
    sorting?.ghost?.remove();sorting?.gap?.remove();if(sorting?.row)sorting.row.hidden=false;sorting?.handle.classList.remove('isDragging');featuredPanel.classList.remove('isDropTarget');
    sortList.querySelectorAll('.isDropTarget').forEach(row=>row.classList.remove('isDropTarget'));sorting=null;
  }
  document.addEventListener('pointercancel',clearSort);
  document.addEventListener('dragstart',event=>{if(sorting)event.preventDefault();});
  document.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}},true);
  document.addEventListener('pointerup',async()=>{
    if(!sorting)return;
    const drag=sorting;clearSort();if(!drag.active)return;
    suppressClick=true;setTimeout(()=>{suppressClick=false;},0);
    const keys=featuredIdeaKeys();const from=keys.indexOf(drag.key);
    if(drag.source==='selection'&&drag.out){if(from<0)return;keys.splice(from,1);}
    else if(drag.into){
      if(from<0&&keys.length>=5){setStatus('#adminStatus','Er passen maximaal vijf activiteiten in Uitgelicht. Verwijder eerst een activiteit.','warn');return;}
      if(from>=0)keys.splice(from,1);
      const to=keys.indexOf(drag.target);
      keys.splice(to<0?keys.length:to,0,drag.key);
    }else return;
    if(await saveFeaturedIdeaKeys(keys)){renderIdeas();setStatus('#adminStatus','Uitgelicht opgeslagen.','ok');}
    else setStatus('#adminStatus',storageErrorMessage('Opslaan lukte niet.'),'warn');
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
