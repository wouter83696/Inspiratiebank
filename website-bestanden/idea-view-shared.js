(function(){
  function renderMetadata(view={}){
    const classes = ['sharedMetaBlock', view.className || ''].filter(Boolean).join(' ');
    const pillClasses = ['cardPillGroup', view.pillsClass || ''].filter(Boolean).join(' ');
    return `<span class="${classes}"><span class="${pillClasses}">${view.pills || ''}</span>${view.meta || ''}</span>`;
  }

  function renderPractical(content, open=false, extra=''){
    return content || extra ? `<details class="ideaPracticalDetails"${open ? ' open' : ''}><summary>Praktisch</summary>${content ? `<p class="ideaPracticalText">${content}</p>` : ''}${extra}</details>` : '';
  }

  function renderMaterials(value){
    const text=String(value || '').trim();
    return text ? `<details class="ideaPracticalDetails ideaMaterialsDetails"><summary>Materialen</summary><p class="ideaPracticalText">${escape(text)}</p></details>` : '';
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
      ${source}${body}${practical}${renderMaterials(view.supplies)}${footer}
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
      supplies:item.supplies
    });
  }

  function renderDesktopRow(view){
    const cells = [
      {label:'Activiteit', html:view.activity ? renderListActivity(view.activity) : (view.title || '')},
      {label:'Kenmerken', html:renderMetadata({pills:view.pills, meta:view.meta})},
      {label:'Beschrijving', html:renderPracticalList(view.description)},
      {label:'Praktisch', html:(view.practical || !String(view.supplies || '').trim() ? renderPracticalList(view.practical) : '') + renderMaterials(view.supplies)}
    ];
    if(view.manageActions !== undefined){
      const manageCell = {label:'Beheer', html:`<div class="ideaAdminListActions">${view.manageActions || ''}</div>`};
      if(view.manageFirst) cells.unshift(manageCell);
      else cells.push(manageCell);
    }
    return renderRow({...view, cells});
  }

  function renderDesktopTable(view={}){
    const admin = view.admin === true;
    const headers = ['Activiteit', 'Kenmerken', 'Beschrijving', 'Praktisch'];
    if(admin && view.manageFirst) headers.unshift('Beheer');
    else if(admin) headers.push('Beheer');
    return `<table><thead><tr>${headers.map(label => `<th>${label}</th>`).join('')}</tr></thead><tbody>${view.rows || ''}</tbody></table>`;
  }

  window.IdeaViewShared = Object.freeze({renderMaterials, renderPractical, renderMetadata, renderCard, renderRow, renderActivityRow, renderDesktopRow, renderDesktopTable});
})();
