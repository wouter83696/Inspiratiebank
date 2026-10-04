/* Optional photo presentation; classic cards remain the source for detail content. */
(function(){
  let current=new Map(),enabled=false,compact=false,returnFocus=null;
  let dialog,activeKey=null;
  const wide=window.matchMedia('(min-width:1280px)');
  function getDialog(){
    if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.className='photoDetailLayer ideaFilterSheetLayer';dialog.setAttribute('aria-labelledby','photoDetailTitle');
    dialog.innerHTML='<button type="button" class="ideaFilterSheetBackdrop" tabindex="-1" aria-label="Detailpaneel sluiten"></button><section class="ideaFilterSheet photoDetailPanel"><header class="ideaFilterSheetHeader"><button class="ideaFilterSheetClose" type="button" aria-label="Details sluiten"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"></path></svg></button></header><div class="photoDetailBody ideaFilterSheetBody sharedIdeaCards"></div></section>';
    document.body.append(dialog);
    dialog.querySelector('header button').addEventListener('click',close);
    dialog.querySelector('.ideaFilterSheetBackdrop').addEventListener('click',close);
    dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
    dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.addEventListener('close',()=>{document.body.classList.remove('photoDetailOpen','photoDetailDocked');document.querySelectorAll('.photoTile.isSelected').forEach(el=>el.classList.remove('isSelected'));if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
    return dialog;
  }
  let closeTimer;
  function close(){
    if(!dialog?.open)return;
    dialog.classList.remove('isOpen');
    const durations=getComputedStyle(dialog.querySelector('.ideaFilterSheet')).transitionDuration.split(',').map(x=>parseFloat(x)*(x.trim().endsWith('ms')?1:1000));
    clearTimeout(closeTimer);closeTimer=setTimeout(()=>dialog.close(),Math.max(...durations,0));
  }
  function routeChoices(item){
    const destination=ideaRouteDestination(item);if(!destination)return '';
    const query=encodeURIComponent(destination);
    return `<details class="photoRouteChoices"><summary>Route plannen ↗</summary><div><a href="https://www.google.com/maps/dir/?api=1&destination=${query}" target="_blank" rel="noopener">Google Maps</a><a href="https://maps.apple.com/?daddr=${query}" target="_blank" rel="noopener">Apple Kaarten</a></div><small>Op je telefoon opent de gekozen kaartapp als je toestel dit ondersteunt.</small></details>`;
  }
  function detailContent(item){
    const image=approvedIdeaImage(item),metadata=sharedIdeaMetadata(item,{map:true});
    const location=String(item.address||item.where||item.place||item.location||'').trim();
    const extras=(Array.isArray(item.images)?item.images:[]).filter(image=>image&&typeof image==='object'&&(image.status==='approved'||image.approved===true)&&/^https?:\/\//i.test(image.src||''));
    const gallery=extras.length?`<details class="photoDetailSection"><summary>Foto’s</summary><div class="photoDetailGallery">${extras.map(image=>`<img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt||item.title)}" loading="lazy">`).join('')}</div></details>`:'';
    return `<article class="photoDetailArticle ${domainThemeClass(item.domain)}">${image?`<img class="photoDetailHero" src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt||item.title)}">`:''}<div class="photoDetailInfo"><span class="photoDetailBadge domainIcon" aria-hidden="true">${domainIcon(item.domain)}</span><h2 id="photoDetailTitle">${escapeHtml(item.title)}</h2>${IdeaViewShared.renderMetadata({className:'cardMetaBlock',pillsClass:'cardLabels',pills:metadata.pills,meta:metadata.meta})}<p class="photoDetailDescription">${escapeHtml(audienceText(item.fit||item.description||''))}</p>${gallery}${IdeaViewShared.renderPractical(escapeHtml(item.materials||item.rules||''),false,`${location?`<p class="ideaPracticalText">${escapeHtml(location)}${item.postcode?`<br>${escapeHtml(item.postcode)}`:''}</p>`:''}${routeChoices(item)}`)}<div class="photoDetailActions">${/^https?:\/\//i.test(item.url||'')?`<a class="button primary" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Naar website ↗</a>`:''}${compact?'':reportMenu('inspiratiebank',ideaDomKey(item),item.title)}</div></div></article>`;
  }
  function present(sheet){
    const docked=wide.matches;
    sheet.classList.toggle('isDocked',docked);
    document.body.classList.toggle('photoDetailDocked',docked);
    document.body.classList.toggle('photoDetailOpen',!docked);
    if(!sheet.open){if(docked)sheet.show();else sheet.showModal();}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(sheet.open)sheet.classList.add('isOpen');}));
  }
  function open(key){
    const item=current.get(key);if(!item)return false;
    const sheet=getDialog(),wasOpen=sheet.open;
    returnFocus=document.activeElement;activeKey=key;
    sheet.querySelector('.photoDetailBody').innerHTML=detailContent(item);
    clearTimeout(closeTimer);present(sheet);
    document.querySelectorAll('.photoTile').forEach(el=>el.classList.toggle('isSelected',el.dataset.ideaKey===key));
    sheet.querySelector('.photoDetailBody').scrollTop=0;
    if(!wasOpen)sheet.querySelector('header button').focus();return true;
  }
  wide.addEventListener('change',()=>{if(dialog?.open){close();}});
  function render(items,style){
    const on=style!=='classic';compact=style==='compact';
    enabled=on;current=new Map(items.map(item=>[ideaDomKey(item),item]));
    if(dialog?.open&&(!on||!current.has(activeKey)))close();
    const grid=document.getElementById('ideaCards');grid.classList.toggle('photoTiles',on);grid.classList.toggle('compactTiles',style==='compact');if(!on)return;
    grid.querySelectorAll('.ideaFeaturedGroup').forEach(group=>group.replaceWith(...group.childNodes));
    const featured=grid.querySelector('.ideaFeaturedCarousel');if(featured)grid.prepend(featured);
    grid.querySelectorAll('article[data-idea-key]').forEach(card=>{
      const item=current.get(card.dataset.ideaKey);if(!item)return;
      const image=approvedIdeaImage(item),metadata=sharedIdeaMetadata(item);
      const button=document.createElement('button');button.type='button';button.className='photoTile '+domainThemeClass(item.domain);button.dataset.ideaKey=ideaDomKey(item);button.dataset.photoDetail=ideaDomKey(item);button.setAttribute('aria-label','Bekijk '+item.title);button.setAttribute('aria-haspopup','dialog');
      button.innerHTML=`${image?`<img src="${escapeHtml(image.src)}" alt="" loading="lazy" decoding="async">`:'<span class="photoTilePlaceholder" aria-hidden="true"></span>'}<span class="photoTileContent"><span class="photoTileTitle"><span class="domainIcon" aria-hidden="true">${domainIcon(item.domain)}</span><span>${escapeHtml(item.title)}</span></span><span class="photoTileFacts"><span class="photoTileMeta">${metadata.pills}</span><span class="photoTileExtra">${metadata.meta}</span></span></span>`;
      card.replaceWith(button);
    });
    grid.querySelectorAll('[data-featured-target]').forEach(button=>{button.setAttribute('aria-label','Bekijk '+(current.get(button.dataset.featuredTarget)?.title||'uitgelichte activiteit'));button.setAttribute('aria-haspopup','dialog');});
  }
  document.addEventListener('click',e=>{const button=e.target.closest('[data-photo-detail]');if(button)open(button.dataset.photoDetail);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog?.open&&dialog.classList.contains('isDocked')&&!document.querySelector('dialog:modal')){e.preventDefault();close();}});
  window.PhotoTiles={render,openFeatured:key=>enabled&&open(key)};
})();
