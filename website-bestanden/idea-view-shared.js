(function(){
  function renderFeaturedCard(view={}){
    return `<button class="ideaFeaturedCard ${escape(view.themeClass||'')}" type="button" ${view.attributes||''} data-featured-slide="${view.index||0}" aria-hidden="${!!view.index}"${view.index?' inert':''} aria-label="${escape(view.label||view.title)}">
      <div class="ideaFeaturedMedia">${view.media||''}<span class="ideaFeaturedSideLabel">${view.icon||'✦'}<span>Uitgelicht</span></span></div>
      <div class="ideaFeaturedContent"><h3>${escape(view.title)}</h3><div class="ideaFeaturedBottom"><div class="ideaFeaturedMeta"><span class="cardLabels">${view.pills||''}</span>${view.meta||''}</div><span class="ideaFeaturedArrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14"></path><path d="m14 7 5 5-5 5"></path></svg></span></div></div>
    </button>`;
  }
  function renderMetadata(view={}){
    const classes = ['sharedMetaBlock', view.className || ''].filter(Boolean).join(' ');
    const pillClasses = ['cardPillGroup', view.pillsClass || ''].filter(Boolean).join(' ');
    return `<span class="${classes}"><span class="${pillClasses}">${view.pills || ''}</span>${view.meta || ''}</span>`;
  }

  function renderPractical(content, open=false, extra=''){
    return content || extra ? `<details class="ideaPracticalDetails"${open ? ' open' : ''}><summary>Praktisch</summary>${content ? `<p class="ideaPracticalText">${content}</p>` : ''}${extra}</details>` : '';
  }

  function renderOutdoorPill(icon){
    return `<span class="pill locationPill homeLocationPill outdoorLocationPill" title="Buiten · zelf een plek kiezen" aria-label="Buiten">${icon}</span>`;
  }
  function materialItems(value){
    const text=String(value || '').trim();
    return text.split(text.includes('\n') ? /\n+/ : /[,;]+/).map(item=>item.trim().replace(/^[-•]\s*/, '').replace(/\.$/, '')).filter(Boolean);
  }
  function renderMaterials(value, activity=''){
    const items=materialItems(value);
    if(!items.length)return '';
    const rows=items.map((text,index)=>{
      const key='inspiration-material:'+JSON.stringify([activity,String(value),index]);
      let checked=false;try{checked=window.localStorage?.getItem(key)==='1';}catch(_){}
      return `<li><label><input type="checkbox" data-material-key="${escape(key)}"${checked?' checked':''}><span>${escape(text)}</span></label></li>`;
    }).join('');
    return `<details class="ideaPracticalDetails ideaMaterialsDetails"><summary>Materialen</summary><div class="ideaMaterialsList"><div class="ideaMaterialsHeading"><span>${items.length} ${items.length===1?'materiaal':'materialen'}</span><button type="button" class="materialToggle" aria-pressed="false">Afvinken</button></div><ul class="ideaMaterialChecklist">${rows}</ul></div></details>`;
  }
  if(typeof document!=='undefined')document.addEventListener('change',event=>{
    const input=event.target;
    if(!input.matches?.('input[data-material-key]'))return;
    try{if(input.checked)window.localStorage.setItem(input.dataset.materialKey,'1');else window.localStorage.removeItem(input.dataset.materialKey);}catch(_){}
    document.querySelectorAll('input[data-material-key]').forEach(other=>{if(other.dataset.materialKey===input.dataset.materialKey)other.checked=input.checked;});
  });

  if(typeof document!=='undefined')document.addEventListener('click',event=>{
    const button=event.target.closest?.('.materialToggle');if(!button)return;
    const list=button.closest('.ideaMaterialsList');
    const active=list.classList.toggle('isChecking');
    button.setAttribute('aria-pressed',String(active));button.textContent=active?'Klaar':'Afvinken';
  });
  function editMaterials(textarea){
    if(!textarea)return;
    let host=textarea.nextElementSibling;
    if(!host?.classList.contains('materialEditor')){
      host=document.createElement('div');host.className='materialEditor';textarea.after(host);textarea.hidden=true;
      const sync=()=>{textarea.value=[...host.querySelectorAll('input')].map(input=>input.value.trim()).filter(Boolean).join('\n');textarea.dispatchEvent(new Event('input',{bubbles:true}));};
      host.addEventListener('input',event=>{if(event.target.tagName!=='INPUT')return;sync();if([...host.querySelectorAll('input')].at(-1).value.trim())row('');});
      host.addEventListener('keydown',event=>{if(event.key!=='Enter'||event.target.tagName!=='INPUT')return;event.preventDefault();const inputs=[...host.querySelectorAll('input')];inputs[inputs.indexOf(event.target)+1]?.focus();});
      host.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;const line=button.parentElement;const next=line.nextElementSibling?.querySelector('input');line.remove();sync();next?.focus();});
      host.addRow=row;
      function row(value){const line=document.createElement('div');const input=document.createElement('input');input.type='text';input.placeholder='Bijv. schaar';input.setAttribute('aria-label','Materiaal');input.value=value;const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Materiaal verwijderen');line.append(input,remove);host.append(line);}
      textarea.form?.addEventListener('reset',()=>setTimeout(()=>editMaterials(textarea),0));
    }
    host.replaceChildren();materialItems(textarea.value).forEach(value=>host.addRow(value));host.addRow('');
  }
  if(typeof document!=='undefined'){
    const init=()=>editMaterials(document.getElementById('teamIdeaSuppliesInput'));
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  }

  function renderPracticalList(content){
    return content ? `<p class="ideaPracticalListText">${content}</p>` : '<span class="ideaPracticalEmpty">-</span>';
  }

  function renderCard(view){
    const classes = ['card', 'ideaThemeCard', 'sharedIdeaCard', view.themeClass || '', view.hasImage ? 'hasImage' : '', view.hidden ? 'hiddenItem' : '']
      .filter(Boolean).join(' ');
    const attributes = view.attributes || '';
    const pills = view.pills || '';
    const source = view.source ? `<div class="small">${view.source}</div>` : '';
    const body = view.description ? `<p>${view.description}</p>` : '';
    const practical = renderPractical(view.practical, view.practicalOpen === true);
    const footer = `<div class="cardFooter">${view.website || ''}${view.actions || ''}</div>${view.manageActions !== undefined ? `<div class="agendaReviewCardActions ideaAdminCardActions">${view.manageActions || ''}</div>` : ''}`;
    return `<article class="${classes}"${attributes ? ` ${attributes}` : ''}>
      ${view.toolbar || ''}
      ${view.image || ''}
      ${view.themePill ? `<div class="cardThemePill">${view.themePill}</div>` : ''}
      <h3>${view.title || ''}</h3>
      ${renderMetadata({className:'cardMetaBlock', pillsClass:'cardLabels', pills, meta:view.meta})}
      ${source}${body}${practical}${renderMaterials(view.supplies,view.materialsKey || view.title || view.activity?.title || '')}${footer}
    </article>`;
  }

  function renderRow(view){
    const classes = ['ideaThemeRow', view.themeClass || '', view.hidden ? 'hiddenItem' : ''].filter(Boolean).join(' ');
    const attributes = view.attributes || '';
    const cells = (view.cells || []).map(cell => `<td${cell.label ? ` data-label="${cell.label}"` : ''}>${cell.html || ''}</td>`).join('');
    return `<tr class="${classes}"${attributes ? ` ${attributes}` : ''}>${cells}</tr>`;
  }

  function escape(value=''){
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  }

  // Both pages supply data; the thumbnail, category badge and website link have
  // one renderer so the management list cannot drift from the public list.
  function renderListActivity(activity={}){
    const image = activity.image;
    const title = activity.url
      ? `<a class="ideaListTitleLink" href="${escape(activity.url)}" target="_blank" rel="noopener">${escape(activity.title)}</a>`
      : `<span class="ideaTitleText">${escape(activity.title)}</span>`;
    const visual = `<span class="ideaListVisual${image ? ' hasImage' : ''}" aria-hidden="true">${image ? `<img class="ideaListThumb${image.className ? ` ${escape(image.className)}` : ''}" src="${escape(image.src)}" alt="" loading="lazy" decoding="async">` : ''}<span class="domainIcon">${activity.icon || ''}</span></span>`;
    return `<span class="nameWithIcon">${visual}<span class="ideaListTitleRow">${title}</span></span>`;
  }

  // Canonical content contract: callers pass the activity, never separate
  // description/practical/title fields. Management adds selection attributes only.
  function renderActivityRow(item, view={}){
    const describe = view.formatDescription || (text => text);
    return renderDesktopRow({
      ...view,
      activity:{title:item.title, url:item.url, image:view.image, icon:view.icon},
      description:escape(describe(item.fit || item.description || '')),
      practical:escape(item.materials || item.rules || ''),
      materialsKey:item.id || item.title,
      supplies:item.supplies
    });
  }

  function renderDesktopRow(view){
    const cells = [
      {label:'Activiteit', html:view.activity ? renderListActivity(view.activity) : (view.title || '')},
      {label:'Kenmerken', html:renderMetadata({pills:view.pills, meta:view.meta})},
      {label:'Beschrijving', html:renderPracticalList(view.description)},
      {label:'Praktisch', html:(view.practical || !String(view.supplies || '').trim() ? renderPracticalList(view.practical) : '') + renderMaterials(view.supplies,view.materialsKey || view.title || view.activity?.title || '')}
    ];
    if(view.manageActions !== undefined){
      const manageCell = {label:'Beheer', html:`<div class="ideaAdminListActions">${view.manageActions || ''}</div>`};
      if(view.manageFirst) cells.unshift(manageCell);
      else cells.push(manageCell);
    }
    return renderRow({...view, cells});
  }

  // Shared photo-tile structure for the public grid and management workspace.
  function renderPhotoTileContent({media='',icon='',pills='',meta='',title='',compact=true}={}){
    const badge=`<span class="domainIcon" aria-hidden="true">${icon}</span>`;
    const facts=`<span class="photoTileFacts"><span class="photoTileMeta">${pills}</span>${compact?'':`<span class="photoTileExtra">${meta}</span>`}</span>`;
    return compact
      ? `<span class="photoTileMedia">${media}<span class="photoTileOverlay">${badge}${facts}</span></span><span class="photoTileContent"><span class="photoTileTitle"><span>${escape(title)}</span></span></span>`
      : `${media}<span class="photoTileContent"><span class="photoTileTitle">${badge}<span>${escape(title)}</span></span>${facts}</span>`;
  }

  function renderDesktopTable(view={}){
    const admin = view.admin === true;
    const headers = ['Activiteit', 'Kenmerken', 'Beschrijving', 'Praktisch'];
    if(admin && view.manageFirst) headers.unshift('Beheer');
    else if(admin) headers.push('Beheer');
    return `<table><thead><tr>${headers.map(label => `<th>${label}</th>`).join('')}</tr></thead><tbody>${view.rows || ''}</tbody></table>`;
  }

  window.IdeaViewShared = Object.freeze({editMaterials,renderListActivity,materialItems, renderOutdoorPill, renderFeaturedCard, renderPhotoTileContent, renderMaterials, renderPractical, renderMetadata, renderCard, renderRow, renderActivityRow, renderDesktopRow, renderDesktopTable});
})();
