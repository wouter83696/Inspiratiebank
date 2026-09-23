(function(){
  function renderMetadata(view={}){
    const classes = ['sharedMetaBlock', view.className || ''].filter(Boolean).join(' ');
    const pillClasses = ['cardPillGroup', view.pillsClass || ''].filter(Boolean).join(' ');
    return `<span class="${classes}"><span class="${pillClasses}">${view.pills || ''}</span>${view.meta || ''}</span>`;
  }

  function renderPractical(content, open=false){
    return content ? `<details class="ideaPracticalDetails"${open ? ' open' : ''}><summary>Praktisch</summary><p class="ideaPracticalText">${content}</p></details>` : '';
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
      ${source}${body}${practical}${footer}
    </article>`;
  }

  function renderRow(view){
    const classes = ['ideaThemeRow', view.themeClass || '', view.hidden ? 'hiddenItem' : ''].filter(Boolean).join(' ');
    const attributes = view.attributes || '';
    const cells = (view.cells || []).map(cell => `<td${cell.label ? ` data-label="${cell.label}"` : ''}>${cell.html || ''}</td>`).join('');
    return `<tr class="${classes}"${attributes ? ` ${attributes}` : ''}>${cells}</tr>`;
  }

  function renderDesktopRow(view){
    const cells = [
      {label:'Activiteit', html:`${view.title || ''}`},
      {label:'Kenmerken', html:renderMetadata({pills:view.pills, meta:view.meta})},
      {label:'Praktisch', html:renderPracticalList(view.practical)}
    ];
    if(view.manageActions !== undefined){
      cells.push({label:'Website', html:`<div class="ideaActions">${view.website || ''}${view.actions || ''}</div>`});
      const manageCell = {label:'Beheer', html:`<div class="ideaAdminListActions">${view.manageActions || ''}</div>`};
      if(view.manageFirst) cells.unshift(manageCell);
      else cells.push(manageCell);
    }else{
      cells.push({label:'Website', html:`<div class="ideaActions">${view.website || ''}</div>`});
    }
    return renderRow({...view, cells});
  }

  function renderDesktopTable(view={}){
    const admin = view.admin === true;
    const headers = ['Activiteit', 'Kenmerken', 'Praktisch', 'Website'];
    if(admin && view.manageFirst) headers.unshift('Beheer');
    else if(admin) headers.push('Beheer');
    return `<table><thead><tr>${headers.map(label => `<th>${label}</th>`).join('')}</tr></thead><tbody>${view.rows || ''}</tbody></table>`;
  }

  window.IdeaViewShared = Object.freeze({renderMetadata, renderCard, renderRow, renderDesktopRow, renderDesktopTable});
})();
