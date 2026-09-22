(function(){
  function renderPractical(content){
    return content ? `<details class="ideaPracticalDetails"><summary>Praktisch</summary><p class="ideaPracticalText">${content}</p></details>` : '';
  }

  function renderCard(view){
    const classes = ['card', 'ideaThemeCard', view.themeClass || '', view.hasImage ? 'hasImage' : '', view.hidden ? 'hiddenItem' : '']
      .filter(Boolean).join(' ');
    const attributes = view.attributes || '';
    const pillsClass = 'cardLabels';
    const pills = view.pills || '';
    const source = view.source ? `<div class="small">${view.source}</div>` : '';
    const body = view.description ? `<p>${view.description}</p>` : '';
    const practical = renderPractical(view.practical);
    const footer = `<div class="cardFooter">${view.website || ''}${view.actions || ''}</div>${view.manageActions !== undefined ? `<div class="agendaReviewCardActions ideaAdminCardActions">${view.manageActions || ''}</div>` : ''}`;
    return `<article class="${classes}"${attributes ? ` ${attributes}` : ''}>
      ${view.image || ''}
      ${view.themePill ? `<div class="cardThemePill">${view.themePill}</div>` : ''}
      <h3>${view.title || ''}</h3>
      <div class="cardMetaBlock"><div class="${pillsClass}">${pills}</div>${view.meta || ''}</div>
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
      {label:'Activiteit', html:`${view.title || ''}${view.meta ? `<div class="small ideaListMeta">${view.meta}</div>` : ''}`},
      {label:'Badges', html:`<div class="cardPillGroup">${view.pills || ''}</div>${view.meta ? `<div class="mobileIdeaListMeta">${view.meta}</div>` : ''}`},
      {label:'Praktisch', html:renderPractical(view.practical)}
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
    const headers = ['Activiteit', 'Badges', 'Praktisch', 'Website'];
    if(admin && view.manageFirst) headers.unshift('Beheer');
    else if(admin) headers.push('Beheer');
    return `<table><thead><tr>${headers.map(label => `<th>${label}</th>`).join('')}</tr></thead><tbody>${view.rows || ''}</tbody></table>`;
  }

  window.IdeaViewShared = Object.freeze({renderCard, renderRow, renderDesktopRow, renderDesktopTable});
})();
