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
  function detailIcon(kind){
    const paths={info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',route:'<path d="M9 18l-5-5 5-5M4 13h10a5 5 0 0 1 5 5v2"/>',photo:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 3-3 5 5"/>'};
    return `<svg class="photoDetailSectionIcon" viewBox="0 0 24 24" aria-hidden="true">${paths[kind]}</svg>`;
  }
  function routeChoices(item){
    const destination=ideaRouteDestination(item);if(!destination)return '';
    const query=encodeURIComponent(destination);
    return `<details class="photoRouteChoices"><summary>${detailIcon('route')}<span>Route plannen</span></summary><div><a href="https://www.google.com/maps/dir/?api=1&destination=${query}" target="_blank" rel="noopener">${detailIcon('route')}<span>Google Maps</span></a><a href="https://maps.apple.com/?daddr=${query}" target="_blank" rel="noopener">${detailIcon('route')}<span>Apple Kaarten</span></a></div><small>Op je telefoon opent de gekozen kaartapp als je toestel dit ondersteunt.</small></details>`;
  }
  function detailContent(item){
    const location=String(item.address||item.where||item.place||item.location||'').trim();
    const extras=(Array.isArray(item.images)?item.images:[]).filter(image=>image&&typeof image==='object'&&(image.status==='approved'||image.approved===true)&&/^https?:\/\//i.test(image.src||''));
    const gallery=extras.length?`<details class="photoDetailSection"><summary>${detailIcon('photo')}<span>Foto’s</span></summary><div class="photoDetailGallery">${extras.map(image=>`<img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt||item.title)}" loading="lazy">`).join('')}</div></details>`:'';
    // Use the very same card renderer as the map detail, including image and metadata.
    const template=document.createElement('template');
    template.innerHTML=cardIdea(item,{mapDetailAction:'close'});
    const card=template.content.querySelector('article');
    card.querySelector('h3').id='photoDetailTitle';
    card.querySelector('.ideaPracticalDetails')?.remove();
    card.querySelector('.cardFooter')?.remove();
    card.insertAdjacentHTML('beforeend',`${gallery}${IdeaViewShared.renderPractical(escapeHtml(item.materials||item.rules||''),false,`${location?`<p class="ideaPracticalText">${escapeHtml(location)}${item.postcode?`<br>${escapeHtml(item.postcode)}`:''}</p>`:''}`)}${routeChoices(item)}<div class="photoDetailActions">${/^https?:\/\//i.test(item.url||'')?`<a class="ideaRouteButton" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Naar website ↗</a>`:''}</div>`);
    const practicalSummary=card.querySelector('.ideaPracticalDetails>summary');
    if(practicalSummary) practicalSummary.innerHTML=`${detailIcon('info')}<span>Praktische informatie</span>`;
    return card.outerHTML;
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
      button.innerHTML=`${image?`<img src="${escapeHtml(image.src)}" alt="" loading="lazy" decoding="async">`:'<span class="photoTilePlaceholder" aria-hidden="true"></span>'}<span class="photoTileContent"><span class="photoTileTitle"><span class="domainIcon" aria-hidden="true">${domainIcon(item.domain)}</span><span>${escapeHtml(item.title)}</span></span><span class="photoTileFacts"><span class="photoTileMeta">${metadata.pills}</span>${compact?'':`<span class="photoTileExtra">${metadata.meta}</span>`}</span></span>`;
      card.replaceWith(button);
    });
    let column=0;
    for(const child of grid.children){
      if(!child.classList.contains('photoTile')){column=0;continue;}
      child.classList.toggle('photoTileOffset',column++%2===1);
    }
    grid.querySelectorAll('[data-featured-target]').forEach(button=>{button.setAttribute('aria-label','Bekijk '+(current.get(button.dataset.featuredTarget)?.title||'uitgelichte activiteit'));button.setAttribute('aria-haspopup','dialog');});
  }
  document.addEventListener('click',e=>{const button=e.target.closest('[data-photo-detail]');if(button)open(button.dataset.photoDetail);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog?.open&&dialog.classList.contains('isDocked')&&!document.querySelector('dialog:modal')){e.preventDefault();close();}});
  window.PhotoTiles={render,openFeatured:key=>enabled&&open(key)};
})();
