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
    dialog.querySelector('.photoDetailBody').addEventListener('click',animateSection);
    dialog.querySelector('.ideaFilterSheetBackdrop').addEventListener('click',close);
    dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
    dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.addEventListener('close',()=>{document.body.classList.remove('photoDetailOpen','photoDetailDocked');document.querySelectorAll('.photoTile.isSelected').forEach(el=>el.classList.remove('isSelected'));if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
    return dialog;
  }
  let closeTimer,openFrame,closeListener;
  let layoutAnimations=[];
  function setDock(docked){
    if(document.body.classList.contains('photoDetailDocked')===docked)return;
    // Animate the column change in either direction, including sticky controls.
    const elements=[...document.querySelectorAll('.topbar,.tabHero,.desktopStickyControls,#ideaCards > *,.ideaToolbar:not(.desktopStickyControls *)')];
    const before=elements.map(element=>({element,rect:element.getBoundingClientRect()}));
    document.body.classList.toggle('photoDetailDocked',docked);
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const style=getComputedStyle(dialog);
    const time=style.transitionDuration.split(',')[0].trim();
    const duration=parseFloat(time)*(time.endsWith('ms')?1:1000);
    layoutAnimations=before.flatMap(({element,rect})=>{
      const next=element.getBoundingClientRect();
      if(!rect.width||!next.width||!rect.height||!next.height||(rect.bottom<0&&next.bottom<0)||(rect.top>innerHeight&&next.top>innerHeight))return [];
      return [element.animate([
        {transformOrigin:'0 0',transform:`translate(${rect.left-next.left}px,${rect.top-next.top}px) scale(${rect.width/next.width},${rect.height/next.height})`},
        {transformOrigin:'0 0',transform:'none'}
      ],{duration,easing:style.transitionTimingFunction.split(/,(?![^()]*\))/)[0],fill:'none'})];
    });
  }
  function cancelPendingMotion(){
    cancelAnimationFrame(openFrame);clearTimeout(closeTimer);
    if(closeListener){closeListener.target.removeEventListener('transitionend',closeListener.handler);closeListener=null;}
  }
  function close({immediate=false,restoreFocus=true}={}){
    if(!dialog?.open)return;
    cancelPendingMotion();
    if(!restoreFocus)returnFocus=null;
    if(immediate){
      layoutAnimations.forEach(animation=>animation.cancel());layoutAnimations=[];
      dialog.classList.remove('isOpen','isClosing');
      document.body.classList.remove('photoDetailOpen','photoDetailDocked');
      dialog.close();
      return;
    }
    const target=dialog.classList.contains('isDocked')?dialog:dialog.querySelector('.ideaFilterSheet');
    const finish=()=>{cancelPendingMotion();if(dialog.open)dialog.close();};
    const handler=event=>{if(event.target===target&&event.propertyName==='transform')finish();};
    closeListener={target,handler};target.addEventListener('transitionend',handler);
    dialog.classList.add('isClosing');
    dialog.classList.remove('isOpen');
    setDock(false);
    const durations=getComputedStyle(target).transitionDuration.split(',').map(x=>parseFloat(x)*(x.trim().endsWith('ms')?1:1000));
    closeTimer=setTimeout(finish,Math.max(...durations,0)+50);
  }

  const sectionMotion=new WeakMap();
  function animateSection(event){
    const summary=event.target.closest('summary');
    if(!summary||summary.parentElement.tagName!=='DETAILS')return;
    const details=summary.parentElement;
    if(details.classList.contains('detailAddressDisclosure')&&window.matchMedia('(min-width:641px) and (hover:hover) and (pointer:fine)').matches){event.preventDefault();details.open=true;return;}
    event.preventDefault();
    summary.focus({preventScroll:true});
    const previous=sectionMotion.get(details);
    const opening=previous?!previous.opening:!details.open;
    const start=details.getBoundingClientRect().height;
    if(previous){previous.animation.onfinish=null;previous.animation.cancel();}
    details.style.height='';details.style.overflow='';
    details.classList.remove('isSectionClosing');
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){details.open=opening;sectionMotion.delete(details);return;}
    // Keep the content rendered while measuring and collapsing: toggling open
    // off and on in one frame can make Safari skip the closing animation.
    details.open=true;
    const style=getComputedStyle(details);
    const outer=['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'].reduce((n,key)=>n+(parseFloat(style[key])||0),0);
    const end=opening?details.getBoundingClientRect().height:summary.getBoundingClientRect().height+outer;
    details.style.height=`${start}px`;
    details.style.overflow='hidden';
    details.classList.toggle('isSectionClosing',!opening);
    const animation=details.animate([{height:`${start}px`},{height:`${end}px`}],{duration:260,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
    sectionMotion.set(details,{animation,opening});
    animation.onfinish=()=>{
      details.open=opening;details.style.height='';details.style.overflow='';details.classList.remove('isSectionClosing');sectionMotion.delete(details);animation.cancel();
    };
  }
  function detailIcon(kind){
    const paths={location:'<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',route:'<path d="M9 18l-5-5 5-5M4 13h10a5 5 0 0 1 5 5v2"/>',photo:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 3-3 5 5"/>'};
    return `<svg class="photoDetailSectionIcon" viewBox="0 0 24 24" aria-hidden="true">${paths[kind]}</svg>`;
  }
  function mapAppIcon(app){
    if(app==='waze')return '<svg class="mapAppLogo" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 24c-3-3-3-8-2-12C5 2 22 1 28 10c5 9-2 17-11 17H7l-4-3Z" fill="#b9edf5" stroke="#315f6b" stroke-width="1.5"/><circle cx="10" cy="27" r="3" fill="#315f6b"/><circle cx="24" cy="27" r="3" fill="#315f6b"/><circle cx="12" cy="13" r="1.5" fill="#315f6b"/><circle cx="23" cy="13" r="1.5" fill="#315f6b"/><path d="M12 18q6 6 11-1" fill="none" stroke="#315f6b" stroke-width="1.5"/></svg>';
    return app==='google'
      ? '<svg class="mapAppLogo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#34a853" d="M24 2C13.5 2 7 9.6 7 19c0 11 11 20 14 25 1.4 2.6 4.6 2.6 6 0 3-5 14-14 14-25C41 9.6 34.5 2 24 2Z"/><path fill="#4285f4" d="M24 2C13.5 2 7 9.6 7 19c0 3.7 1.3 7.2 3.2 10.5L34.8 5.7A17 17 0 0 0 24 2Z"/><path fill="#ea4335" d="M10.5 8.5 20 18l14.8-12.3A17 17 0 0 0 24 2c-5.6 0-10.3 2.3-13.5 6.5Z"/><path fill="#fbbc04" d="m10.2 29.5 8.1 10.4L39 13a17 17 0 0 0-4.2-7.3Z"/><path fill="#4285f4" d="m19 20-8.8 9.5c2 3.5 5 7.2 8.1 10.4L28 27Z"/><circle cx="24" cy="18.5" r="7" fill="white"/></svg>'
      : '<svg class="mapAppLogo" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="6" fill="#e8efdf"/><path fill="#b3dc98" d="M2 3h11v12H2zm19 16h9v11h-9Z"/><path stroke="white" stroke-width="5" fill="none" d="m2 26 28-18M12 1l8 30"/><path stroke="#f9c84c" stroke-width="2" d="m2 26 28-18"/><path fill="#3295ee" stroke="white" stroke-width="1.5" d="m19 8 7 17-8-3-7 5Z"/></svg>';
  }
  function routeChoices(item){
    if(itemIsHomeActivity(item))return '';
    const format=value=>String(value||'').trim().replace(/\b(\d{4})\s*([A-Za-z]{2})\b/g,(_,digits,letters)=>`${digits} ${letters.toUpperCase()}`);
    const key=value=>format(value).toLocaleLowerCase('nl').replace(/[\s,]+/g,' ').trim();
    const address=format(item.address||item.where);
    const place=format(item.place||item.location);
    const postcode=format(item.postcode);
    const name=format(item.locationName||item.venue);
    const addressParts=address.split(/,?\s+(?=\d{4} [A-Z]{2}\b)/);
    if(addressParts.length===1&&place&&key(address).endsWith(' '+key(place))){
      const suffix=address.toLowerCase().lastIndexOf(place.toLowerCase());
      if(suffix>0)addressParts.splice(0,1,address.slice(0,suffix).replace(/[,\s]+$/,''),place);
    }
    const addressKey=key(address);
    const extra=[postcode,place].filter(value=>value&&!(` ${addressKey} `).includes(` ${key(value)} `)).join(' ');
    const seen=new Set();
    const lines=[name,...addressParts,extra].filter(value=>{
      const normalized=key(value);
      if(!normalized||seen.has(normalized))return false;
      seen.add(normalized);return true;
    });
    const destination=ideaRouteDestination(item);
    if(!destination&&!lines.length)return '';
    const locationText=`<p class="ideaPracticalText">${lines.length?lines.map(escapeHtml).join('<br>'):'Adres nog niet opgegeven'}</p>`;
    const query=encodeURIComponent(destination);
    const search=encodeURIComponent([item.title,...lines].filter(Boolean).join(', ')||destination);
    return `<section class="photoRouteChoices">${locationText}${destination?`<div class="detailRouteLinks"><a href="https://www.google.com/maps/search/?api=1&query=${search}" target="_blank" rel="noopener" class="detailGoogle">${mapAppIcon('google')}<span>Bekijk op Google Maps</span></a><a href="https://maps.apple.com/?daddr=${query}" target="_blank" rel="noopener">${mapAppIcon('apple')}<span>Apple Kaarten</span></a><a href="https://waze.com/ul?q=${query}&navigate=yes" target="_blank" rel="noopener">${mapAppIcon('waze')}<span>Waze</span></a></div>`:''}</section>`;
  }
  let detailTabSequence=0;
  function detailContent(item, titleId='photoDetailTitle', view={}){
    const extras=(Array.isArray(item.images)?item.images:[]).filter(image=>image&&typeof image==='object'&&(image.status==='approved'||image.approved===true)&&/^https?:\/\//i.test(image.src||''));
    const gallery=extras.length?`<details class="photoDetailSection"><summary>${detailIcon('photo')}<span>Foto’s</span></summary><div class="photoDetailGallery">${extras.map(image=>`<img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt||item.title)}" loading="lazy">`).join('')}</div></details>`:'';
    // Use the very same card renderer as the map detail, including image and metadata.
    const template=document.createElement('template');
    template.innerHTML=view.card || cardIdea(item,{mapDetailAction:'close'});
    const card=template.content.querySelector('article');
    const title=card.querySelector('h3');
    title.id=titleId;
    title.querySelectorAll('.domainIcon').forEach(icon=>icon.remove());
    card.prepend(title);
    card.querySelector('.ideaPracticalDetails:not(.ideaMaterialsDetails)')?.remove();
    card.querySelector('.cardFooter')?.remove();
    card.insertAdjacentHTML('beforeend',`${gallery}${IdeaViewShared.renderPractical(escapeHtml(item.materials||item.rules||''))}${view.routes !== undefined ? view.routes : routeChoices(item)}<div class="photoDetailActions">${/^https?:\/\//i.test(item.url||'')?`<a class="ideaRouteButton" href="${escapeHtml(item.url)}" target="_blank" rel="noopener"><svg class="websiteGlobe" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg><span>Website bezoeken</span></a>`:''}</div>`);
    const materials=card.querySelector('.ideaMaterialsDetails');
    if(materials) materials.remove();
    const actions=card.querySelector('.photoDetailActions');
    const external='<svg class="detailExternal" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7M21 3 10 14M10 3H3v18h18v-7"/></svg>';
    actions.querySelector('a')?.insertAdjacentHTML('beforeend',external);
    const practical=document.createElement('section');
    card.querySelectorAll('.ideaPracticalDetails,.photoDetailSection').forEach(section=>{
      section.querySelector('summary')?.remove();
      while(section.firstChild)practical.append(section.firstChild);
      section.remove();
    });
    if(!practical.childNodes.length)practical.innerHTML='<p>Geen aanvullende praktische informatie.</p>';
    const tabs=document.createElement('div');tabs.className='photoDetailTabs';
    const id=`detail-info-${++detailTabSequence}`;
    tabs.innerHTML=`<div role="tablist" aria-label="Activiteitsinformatie"><button type="button" role="tab" id="${id}-description-tab" aria-controls="${id}-description" aria-selected="true">Beschrijving</button><button type="button" role="tab" id="${id}-practical-tab" aria-controls="${id}-practical" aria-selected="false" tabindex="-1">Praktisch</button></div><section role="tabpanel" id="${id}-description" aria-labelledby="${id}-description-tab" tabindex="0"></section>`;
    const description=tabs.querySelector('[role="tabpanel"]');
    Array.from(card.children).filter(node=>node.tagName==='P').forEach(node=>description.append(node));
    if(!description.childNodes.length)description.innerHTML='<p>Geen beschrijving beschikbaar.</p>';
    practical.id=`${id}-practical`;practical.setAttribute('role','tabpanel');practical.setAttribute('aria-labelledby',`${id}-practical-tab`);practical.tabIndex=0;practical.hidden=true;
    tabs.append(practical);
    if(materials){
      tabs.querySelector('[role="tablist"]').insertAdjacentHTML('beforeend',`<button type="button" role="tab" id="${id}-materials-tab" aria-controls="${id}-materials" aria-selected="false" tabindex="-1">Materialen</button>`);
      const panel=document.createElement('section');
      panel.id=`${id}-materials`;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',`${id}-materials-tab`);panel.tabIndex=0;panel.hidden=true;
      materials.querySelector('summary')?.remove();
      while(materials.firstChild)panel.append(materials.firstChild);
      tabs.append(panel);
    }
    card.insertBefore(tabs,actions);
    const route=card.querySelector('.photoRouteChoices');
    if(route){
      const disclosure=document.createElement('details');
      disclosure.className='photoRouteChoices detailRouteCompact detailAddressDisclosure';
      const address=route.querySelector('.ideaPracticalText');
      const addressText=address?address.innerHTML.replace(/<br\s*\/?\s*>/gi,', '):'Locatie bekijken';
      const copyAddress=address&&address.textContent.trim()!=='Adres nog niet opgegeven'?`<button type="button" class="detailCopyAddress" aria-label="Adres kopiëren" title="Adres kopiëren"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/></svg></button><span class="detailCopyStatus" role="status"></span>`:'';
      disclosure.innerHTML=`<summary>${detailIcon('location')}<span class="detailAddressText">${addressText}</span>${copyAddress}</summary>`;
      address?.remove();
      route.querySelectorAll('.detailRouteLinks a').forEach(link=>{
        const label=link.textContent.trim();
        link.setAttribute('aria-label',label);link.title=label;
        link.querySelector('span')?.remove();
      });
      route.querySelectorAll('.ideaPracticalText br').forEach(br=>br.replaceWith(document.createTextNode(', ')));
      while(route.firstChild)disclosure.append(route.firstChild);
      route.remove();
      const copy=disclosure.querySelector('.detailCopyAddress');
      const links=disclosure.querySelector('.detailRouteLinks');
      if(copy&&links){const mobileCopy=copy.cloneNode(true);mobileCopy.classList.add('detailCopyAddressMobile');links.append(mobileCopy);}
      actions.insertBefore(disclosure,actions.querySelector('a'));
    }
    return card.outerHTML;
  }
  function present(sheet){
    sheet.classList.remove('isClosing');
    const docked=wide.matches;
    sheet.classList.toggle('isDocked',docked);
    setDock(docked);
    document.body.classList.toggle('photoDetailOpen',!docked);
    if(!sheet.open){if(docked)sheet.show();else sheet.showModal();}
    openFrame=requestAnimationFrame(()=>{openFrame=requestAnimationFrame(()=>{if(sheet.open)sheet.classList.add('isOpen');});});
  }
  function open(key){
    const item=current.get(key);if(!item)return false;
    const sheet=getDialog(),wasOpen=sheet.open;
    returnFocus=document.activeElement;activeKey=key;
    sheet.querySelector('.photoDetailBody').innerHTML=detailContent(item);
    const header=sheet.querySelector('.ideaFilterSheetHeader');
    header.querySelector('#photoDetailTitle')?.remove();
    const heading=sheet.querySelector('.photoDetailBody #photoDetailTitle');
    if(heading)header.prepend(heading);
    cancelPendingMotion();layoutAnimations.forEach(animation=>animation.cancel());layoutAnimations=[];present(sheet);
    document.querySelectorAll('.photoTile').forEach(el=>el.classList.toggle('isSelected',el.dataset.ideaKey===key));
    sheet.scrollTop=0;
    sheet.querySelector('.photoDetailPanel').scrollTop=0;
    sheet.querySelector('.photoDetailBody').scrollTo({top:0,left:0,behavior:'instant'});
    if(!wasOpen)sheet.querySelector('header button').focus({preventScroll:true});return true;
  }
  wide.addEventListener('change',()=>{if(dialog?.open){close();}});
  // Short display names only: search, accessibility and details retain the full title.
  const compactTitles=new Map([
    ['Makerspace of creatieve werkplaats verkennen','Makerspace ontdekken'],
    ['Skatepark, pumptrack of urban sports sessie','Skaten, pumptrack of urban sports'],
    ['Route kiezen met maximaal drie haltes','Route met drie haltes'],
    ['Graffiti op doek of houten panelen','Graffiti op doek of hout'],
    ['Podcastwandeling of audio-opdracht','Podcastwandeling'],
    ['Park Sonsbeek of Meinerswijk met natuurmissie','Natuurmissie Sonsbeek / Meinerswijk'],
    ['Vlooienmarkt of rommelmarkt speurmissie','Speurmissie op de rommelmarkt'],
    ['Special interest route: strips, games of platenzaken','Strips, games en platenroute'],
    ['Hindernis- of Expeditie Robinson challenge in Ewijk','Hindernischallenge in Ewijk'],
    ['Vierdaagsefeesten met persoonlijk blokkenschema','Vierdaagsefeesten op jouw tempo'],
    ['Stevenskerk bezoeken en Stevenstoren beklimmen','Stevenskerk en Stevenstoren'],
    ['Esports of game-toernooi op kleine schaal','Klein esports- of gametoernooi']
  ]);
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
      const media=image?`<img src="${escapeHtml(image.src)}" alt="" loading="lazy" decoding="async">`:'<span class="photoTilePlaceholder" aria-hidden="true"></span>';
      button.innerHTML=IdeaViewShared.renderPhotoTileContent({media,icon:domainIcon(item.domain),pills:metadata.pills,meta:metadata.meta,title:compact?(compactTitles.get(item.title)||item.title):item.title,compact});
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
  document.addEventListener('click',async event=>{
    const button=event.target.closest('.detailCopyAddress');if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    const summary=button.closest('.detailAddressDisclosure').querySelector('summary');
    const status=summary.querySelector('.detailCopyStatus');
    try{
      await navigator.clipboard.writeText(summary.querySelector('.detailAddressText').textContent.trim());
      status.textContent='Adres gekopieerd';
    }catch(error){status.textContent='Kopiëren niet gelukt';}
    clearTimeout(button.copyStatusTimer);
    button.copyStatusTimer=setTimeout(()=>{status.textContent='';},2200);
  },true);
  const addressHover=window.matchMedia('(min-width:641px) and (hover:hover) and (pointer:fine)');
  document.addEventListener('pointerover',event=>{
    const row=event.target.closest('.detailAddressDisclosure');
    if(addressHover.matches&&row){row.open=true;}
  });
  document.addEventListener('pointerout',event=>{
    const row=event.target.closest('.detailAddressDisclosure');
    if(addressHover.matches&&row&&!row.contains(event.relatedTarget)&&!row.contains(document.activeElement))row.open=false;
  });
  document.addEventListener('focusin',event=>{const row=event.target.closest('.detailAddressDisclosure');if(addressHover.matches&&row&&!event.target.closest('.detailCopyAddress'))row.open=true;});
  document.addEventListener('focusout',event=>{const row=event.target.closest('.detailAddressDisclosure');if(addressHover.matches&&row&&!row.contains(event.relatedTarget)&&!row.matches(':hover'))row.open=false;});
  function selectInfoTab(tab){
    const group=tab.closest('.photoDetailTabs');
    group.querySelectorAll('[role="tab"]').forEach(button=>{const selected=button===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
    group.querySelectorAll('[role="tabpanel"]').forEach(panel=>{panel.hidden=panel.id!==tab.getAttribute('aria-controls');});
  }
  document.addEventListener('click',event=>{const tab=event.target.closest('.photoDetailTabs [role="tab"]');if(tab)selectInfoTab(tab);});
  document.addEventListener('keydown',event=>{
    const tab=event.target.closest('.photoDetailTabs [role="tab"]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const buttons=[...tab.parentElement.querySelectorAll('[role="tab"]')];
    const index=event.key==='Home'?0:event.key==='End'?buttons.length-1:(buttons.indexOf(tab)+(event.key==='ArrowLeft'?-1:1)+buttons.length)%buttons.length;
    selectInfoTab(buttons[index]);buttons[index].focus();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog?.open&&dialog.classList.contains('isDocked')&&!document.querySelector('dialog:modal')){e.preventDefault();close();}});
  document.addEventListener('click',event=>{if(event.target.closest('.ideaMapSingleCard.photoDetailBody'))animateSection(event);});
  // Observe only visible detail layouts; coalesce layout work into one frame.
  let actionFrame=0;
  const observedActionContent=new Set();
  const actionResize=new ResizeObserver(queueActionSurface);
  const desktopMap=matchMedia('(min-width:981px)');
  function mountMapHeader(panel){
    if(panel.querySelector('.activityMapHeader'))return;
    const title=panel.querySelector('.ideaMapSingleCard h3');
    const toolbar=panel.querySelector('.ideaMapDetailToolbar');
    if(!title||!toolbar)return;
    const header=document.createElement('div');header.className='activityMapHeader';
    toolbar.before(header);header.append(title,toolbar);
  }
  function fitMapPhoto(panel,observe){
    const results=panel.querySelector('.ideaMapResults');
    const card=panel.querySelector('.ideaMapSingleCard .sharedIdeaCard');
    const photo=card?.querySelector('.ideaImageFrame');
    if(!results||!card||!photo)return;
    if(!desktopMap.matches){photo.style.removeProperty('--map-photo-height');return;}
    observe(panel);observe(card);
    const photoRect=photo.getBoundingClientRect();
    const resultStyle=getComputedStyle(results);
    const wrapperStyle=getComputedStyle(card.parentElement);
    const padding=[resultStyle.paddingTop,resultStyle.paddingBottom,wrapperStyle.paddingTop,wrapperStyle.paddingBottom]
      .reduce((sum,value)=>sum+(parseFloat(value)||0),0);
    const otherHeight=card.getBoundingClientRect().height-photoRect.height;
    const available=panel.getBoundingClientRect().bottom-results.getBoundingClientRect().top-padding-otherHeight-2;
    const height=Math.floor(Math.max(Math.min(120,photoRect.width*9/16),Math.min(photoRect.width*9/16,available)));
    const value=height+'px';
    if(photo.style.getPropertyValue('--map-photo-height')!==value)photo.style.setProperty('--map-photo-height',value);
  }
  function refreshDetailLayout(){
    actionFrame=0;
    const wanted=new Set();
    const observe=node=>wanted.add(node);
    document.querySelectorAll('#ideaMap .ideaMapPanel.isSingleDetail').forEach(panel=>{
      if(!panel.getClientRects().length)return;
      mountMapHeader(panel);fitMapPhoto(panel,observe);
    });
    document.querySelectorAll('.photoDetailLayer .photoDetailPanel').forEach(panel=>{
      const body=panel.querySelector('.photoDetailBody'),card=body?.querySelector('.sharedIdeaCard'),photo=card?.querySelector('.ideaImageFrame');
      if(!photo||!panel.getClientRects().length)return;
      observe(panel);observe(card);observe(body);
      const style=getComputedStyle(body),rect=photo.getBoundingClientRect();
      const other=card.getBoundingClientRect().height-rect.height;
      const room=body.clientHeight-(parseFloat(style.paddingTop)||0)-(parseFloat(style.paddingBottom)||0)-other;
      const height=Math.floor(Math.max(Math.min(120,rect.width*0.625),Math.min(rect.width*0.625,room)));
      if(photo.style.getPropertyValue('--detail-photo-height')!==height+'px')photo.style.setProperty('--detail-photo-height',height+'px');
    });
    document.querySelectorAll('.photoDetailActions').forEach(actions=>{
      if(!actions.getClientRects().length)return;
      const content=actions.previousElementSibling;
      if(!content)return;
      observe(content);observe(actions);
      const rect=actions.getBoundingClientRect();
      const overlap=rect.height>0&&content.getBoundingClientRect().bottom>rect.top+1;
      if(actions.classList.contains('isOverContent')!==overlap)actions.classList.toggle('isOverContent',overlap);
    });
    observedActionContent.forEach(node=>{
      if(!wanted.has(node)){actionResize.unobserve(node);observedActionContent.delete(node);}
    });
    wanted.forEach(node=>{
      if(!observedActionContent.has(node)){observedActionContent.add(node);actionResize.observe(node);}
    });
  }
  function queueActionSurface(){
    if(!actionFrame)actionFrame=requestAnimationFrame(refreshDetailLayout);
  }
  document.addEventListener('scroll',event=>{
    if(event.target instanceof Element&&event.target.closest('.photoDetailBody,.ideaMapResults'))queueActionSurface();
  },{capture:true,passive:true});
  window.addEventListener('resize',queueActionSurface,{passive:true});
  const detailSelector='.photoDetailBody,.photoDetailActions,.ideaMapPanel';
  new MutationObserver(records=>{
    if(records.some(record=>record.target instanceof Element&&record.target.closest(detailSelector)
      ||[...record.addedNodes,...record.removedNodes].some(node=>node instanceof Element&&(node.matches(detailSelector)||node.querySelector(detailSelector)))))queueActionSurface();
  }).observe(document.body,{childList:true,subtree:true});
  queueActionSurface();
  window.PhotoTiles={render,detailContent,close,openFeatured:key=>enabled&&open(key)};
})();
