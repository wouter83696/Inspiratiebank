(function(){
  function sourceButtonLabel(item={}){
    const source = String(item.source || '').trim();
    if(source && !/^ingebracht door\b/i.test(source) && source.toLocaleLowerCase('nl-NL') !== 'inzending') return source;
    try{
      const host = new URL(String(item.url || '')).hostname.replace(/^www\./i, '');
      const name = host.split('.')[0].replace(/[-_]+/g, ' ').trim();
      return name ? name.replace(/\b\w/g, letter => letter.toUpperCase()) : host;
    }catch(error){
      return 'Bekijk website';
    }
  }

  function renderItem(view){
    const classes = ['agendaItem', view.themeClass || '', view.compact ? 'multiDayItem' : '', view.admin ? 'adminAgendaItem agendaReviewCard' : '', view.hidden ? 'hiddenItem' : '', view.isNew ? 'newItem' : '']
      .filter(Boolean).join(' ');
    const content = `${view.title || ''}${view.review || ''}<span class="agendaItemMeta${view.admin ? ' agendaReviewCardMeta' : ''}">${view.meta || ''}</span>`;
    const main = view.href
      ? `<a class="agendaItemLink" href="${view.href}" target="_blank" rel="noopener">${content}</a>`
      : `<div class="agendaItemLink">${content}</div>`;
    const actionsClass = view.admin ? 'agendaItemActions agendaReviewCardActions' : 'agendaItemActions';
    return `<article class="${classes}">${main}${view.status || ''}<div class="${actionsClass}">${view.actions || ''}</div></article>`;
  }

  function renderDay(view){
    const classes = ['agendaDay', view.admin ? 'agendaReviewDay' : '', view.past ? 'pastDay' : '', view.today ? 'today' : '', view.expanded ? 'expanded' : '']
      .filter(Boolean).join(' ');
    return `<article class="${classes}" data-agenda-day="${view.key || ''}" tabindex="0"${view.today ? ' aria-current="date"' : ''}>
      <div class="agendaHead${view.admin ? ' agendaReviewDayHead' : ''}"><div><strong>${view.label || ''}</strong><span>${view.date || ''}</span></div></div>
      <div class="agendaList${view.admin ? ' agendaReviewDayItems' : ''}"><div class="agendaGroup">${view.items || ''}${view.more || ''}${view.empty || ''}</div></div>
    </article>`;
  }

  function renderWeek(view){
    return `<article class="weekPanel${view.admin ? ' agendaReviewWeek adminAgendaWeek' : ''}"${view.id ? ` id="${view.id}"` : ''}>
      <div class="weekTop${view.admin ? ' agendaReviewWeekHead' : ''}">
        <div class="weekTitle${view.admin ? ' agendaReviewWeekTitle' : ''}">
          <div class="weekBadge${view.admin ? ' agendaReviewWeekBadge' : ''}"><span class="weekBadgeNumber">${view.week || ''}</span></div>
          <div class="weekTitleContent"><div class="weekHeadingRow"><div class="weekHeadingMain"><div class="weekDateLine"><h3>${view.title || ''}</h3>${view.freshness || ''}</div><div class="weekHeaderMeta">${view.count || ''}</div></div>${view.navigation || ''}</div>${view.status || ''}</div>
        </div>
      </div>
      <div class="weekBody"><div class="subBlock"><div class="agendaBoard${view.admin ? ' agendaReviewBoard' : ''}"${view.boardAttribute || ''}>${view.days || ''}</div></div></div>
    </article>`;
  }

  function renderOngoingRow(view){
    const classes = ['ideaThemeRow', view.themeClass || '', view.hidden ? 'hiddenItem' : ''].filter(Boolean).join(' ');
    return `<tr class="${classes}">
      <td class="ongoingTitleCell"><span class="name">${view.title || ''}</span>${view.review || ''}<div class="small">${view.date || ''}</div></td>
      <td class="ongoingWeeksCell">${view.weeks || ''}</td>
      <td class="ongoingLocationCell">${view.mobileLabels || ''}<div class="cardPillGroup ongoingAdminLocation">${view.place || ''}</div>${view.locationDetail || ''}</td>
      <td class="ongoingCostCell">${view.cost || ''}</td>
      <td class="ongoingStimulusCell">${view.stimulus || ''}</td>
      <td class="ongoingFitCell">${view.meta || ''}<div class="small ongoingAdminDescription">${view.description || ''}</div></td>
      <td class="websiteCell">${view.website || ''}</td>
      ${view.actions !== undefined ? `<td class="ongoingManageCell"><div class="ongoingAdminActions">${view.actions || ''}</div></td>` : ''}
    </tr>`;
  }

  function renderAgendaRow(view){
    const classes = ['ideaThemeRow', view.themeClass || '', view.hidden ? 'hiddenItem' : '', view.isNew ? 'newItem' : ''].filter(Boolean).join(' ');
    return `<tr class="${classes}">
      <td data-label="Activiteit"><span class="name">${view.title || ''}</span>${view.review || ''}<div class="small">${view.date || ''}</div></td>
      <td data-label="Categorie">${view.domain || ''}</td>
      <td data-label="Locatie en afstand">${view.location || ''}</td>
      <td data-label="Kosten">${view.cost || ''}</td>
      <td data-label="Prikkel">${view.stimulus || ''}</td>
      <td data-label="Beschrijving"><div class="small">${view.description || ''}</div></td>
      <td class="websiteCell" data-label="Website">${view.website || ''}</td>
      ${view.actions !== undefined ? `<td data-label="Beheer"><div class="agendaTableActions">${view.actions || ''}</div></td>` : ''}
    </tr>`;
  }

  window.AgendaViewShared = Object.freeze({sourceButtonLabel, renderItem, renderDay, renderWeek, renderOngoingRow, renderAgendaRow});
})();
