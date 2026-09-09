(function(){
  function renderCard(view){
    const classes = ['card', 'ideaThemeCard', view.themeClass || '', view.hasImage ? 'hasImage' : '', view.hidden ? 'hiddenItem' : '']
      .filter(Boolean).join(' ');
    const attributes = view.attributes || '';
    const pillsClass = 'cardLabels';
    const pills = view.pills || '';
    const source = view.source ? `<div class="small">${view.source}</div>` : '';
    const body = view.description ? `<p>${view.description}</p>` : '';
    const practical = `<p class="fine"><strong>Praktisch:</strong>${view.practical || ''}</p>`;
    const footer = `<div class="cardFooter">${view.website || ''}${view.actions || ''}</div>${view.manageActions !== undefined ? `<div class="agendaReviewCardActions ideaAdminCardActions">${view.manageActions || ''}</div>` : ''}`;
    return `<article class="${classes}"${attributes ? ` ${attributes}` : ''}>
      ${view.image || ''}
      <h3>${view.title || ''}</h3>
      <div class="${pillsClass}">${pills}</div>
      ${view.meta || ''}${source}${body}${practical}${footer}
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
      {label:'Badges', html:`<div class="cardPillGroup">${view.pills || ''}</div>`},
      {label:'Praktisch', html:`<div class="small">${view.practical || ''}</div>`},
      {label:'Website', html:`<div class="ideaActions">${view.website || ''}${view.actions || ''}</div>`}
    ];
    if(view.manageActions !== undefined) cells.push({label:'Beheer', html:view.manageActions || ''});
    return renderRow({...view, cells});
  }

  window.IdeaViewShared = Object.freeze({renderCard, renderRow, renderDesktopRow});
})();
