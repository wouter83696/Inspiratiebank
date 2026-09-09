(function(){
  function renderCard(view){
    const classes = ['card', 'ideaThemeCard', view.themeClass || '', view.hasImage ? 'hasImage' : '', view.hidden ? 'hiddenItem' : '']
      .filter(Boolean).join(' ');
    const attributes = view.attributes || '';
    const pillsClass = view.admin ? 'cardPills' : 'cardLabels';
    const pills = view.admin ? `<div class="cardPillGroup">${view.pills || ''}</div>` : (view.pills || '');
    const source = view.source ? `<div class="small">${view.source}</div>` : '';
    const body = view.description ? `<p>${view.description}</p>` : '';
    const practical = `<p class="fine"><strong>Praktisch:</strong>${view.practical || ''}</p>`;
    const footer = view.admin
      ? `<div class="ideaAdminCardBottom">${view.website ? `<div class="cardFooter">${view.website}</div>` : ''}<div class="agendaReviewCardActions ideaAdminCardActions">${view.actions || ''}</div></div>`
      : `<div class="cardFooter">${view.website || ''}${view.actions || ''}</div>`;
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

  window.IdeaViewShared = Object.freeze({renderCard, renderRow});
})();
