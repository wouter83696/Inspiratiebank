/* Optional photo presentation; classic cards remain the source for detail content. */
(function(){
  let current=new Map(),enabled=false,returnFocus=null,scrollTop=0;
  let dialog;
  function getDialog(){
    if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.className='photoDetailLayer ideaFilterSheetLayer';dialog.setAttribute('aria-labelledby','photoDetailTitle');
    dialog.innerHTML='<button type="button" class="ideaFilterSheetBackdrop" tabindex="-1" aria-label="Detailpaneel sluiten"></button><section class="ideaFilterSheet photoDetailPanel"><header class="ideaFilterSheetHeader"><h2 id="photoDetailTitle">Activiteit</h2><button class="ideaFilterSheetClose" type="button" aria-label="Details sluiten"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"></path></svg></button></header><div class="photoDetailBody ideaFilterSheetBody sharedIdeaCards"></div></section>';
    document.body.append(dialog);
    dialog.querySelector('header button').addEventListener('click',close);
    dialog.querySelector('.ideaFilterSheetBackdrop').addEventListener('click',close);
    dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
    dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.addEventListener('close',()=>{document.body.classList.remove('photoDetailOpen');window.scrollTo({top:scrollTop,behavior:'instant'});if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
    return dialog;
  }
  let closeTimer;
  function close(){
    if(!dialog?.open)return;
    dialog.classList.remove('isOpen');
    const durations=getComputedStyle(dialog.querySelector('.ideaFilterSheet')).transitionDuration.split(',').map(x=>parseFloat(x)*(x.trim().endsWith('ms')?1:1000));
    clearTimeout(closeTimer);closeTimer=setTimeout(()=>dialog.close(),Math.max(...durations,0));
  }
  function open(key){
    const item=current.get(key);if(!item)return false;
    returnFocus=document.activeElement;scrollTop=window.scrollY;
    const sheet=getDialog();sheet.querySelector('h2').textContent=item.title;
    sheet.querySelector('.photoDetailBody').innerHTML=cardIdea(item,{mapDetailAction:'close'})+`<div class="photoDetailActions">${/^https?:\/\//i.test(item.url||'')?`<a class="button primary" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Website bekijken ↗</a>`:''}${ideaRouteButton(item)}${reportMenu('inspiratiebank',ideaDomKey(item),item.title)}</div>`;
    clearTimeout(closeTimer);sheet.showModal();requestAnimationFrame(()=>requestAnimationFrame(()=>{if(sheet.open)sheet.classList.add('isOpen');}));document.body.classList.add('photoDetailOpen');sheet.querySelector('.photoDetailBody').scrollTop=0;sheet.querySelector('header button').focus();return true;
  }
  function render(items,on){
    enabled=on;current=new Map(items.map(item=>[ideaDomKey(item),item]));
    const grid=document.getElementById('ideaCards');grid.classList.toggle('photoTiles',on);if(!on)return;
    grid.querySelectorAll('.ideaFeaturedGroup').forEach(group=>group.replaceWith(...group.childNodes));
    const featured=grid.querySelector('.ideaFeaturedCarousel');if(featured)grid.prepend(featured);
    grid.querySelectorAll('article[data-idea-key]').forEach(card=>{
      const item=current.get(card.dataset.ideaKey);if(!item)return;
      const image=approvedIdeaImage(item),metadata=sharedIdeaMetadata(item);
      const button=document.createElement('button');button.type='button';button.className='photoTile '+domainThemeClass(item.domain);button.dataset.ideaKey=ideaDomKey(item);button.dataset.photoDetail=ideaDomKey(item);button.setAttribute('aria-label','Bekijk '+item.title);button.setAttribute('aria-haspopup','dialog');
      button.innerHTML=`${image?`<img src="${escapeHtml(image.src)}" alt="" loading="lazy" decoding="async">`:'<span class="photoTilePlaceholder" aria-hidden="true"></span>'}<span class="photoTileContent"><span class="photoTileTitle"><span class="domainIcon" aria-hidden="true">${domainIcon(item.domain)}</span><span>${escapeHtml(item.title)}</span></span><span class="photoTileMeta">${metadata.pills}</span><span class="photoTileExtra">${metadata.meta}</span></span>`;
      card.replaceWith(button);
    });
    grid.querySelectorAll('[data-featured-target]').forEach(button=>{button.setAttribute('aria-label','Bekijk '+(current.get(button.dataset.featuredTarget)?.title||'uitgelichte activiteit'));button.setAttribute('aria-haspopup','dialog');});
  }
  document.addEventListener('click',e=>{const button=e.target.closest('[data-photo-detail]');if(button)open(button.dataset.photoDetail);});
  window.PhotoTiles={render,openFeatured:key=>enabled&&open(key)};
})();
