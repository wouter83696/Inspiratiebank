(function(){
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
    const classes = ['agendaItem', view.themeClass || '', view.compact ? 'multiDayItem' : '', view.hidden ? 'hiddenItem' : '', view.isNew ? 'newItem' : '']
      .filter(Boolean).join(' ');
    const content = `${view.title || ''}${view.review || ''}<span class="agendaItemMeta">${view.meta || ''}</span>`;
    const main = view.href
      ? `<a class="agendaItemLink" href="${view.href}" target="_blank" rel="noopener">${content}</a>`
      : `<div class="agendaItemLink">${content}</div>`;
    const actionsClass = view.admin ? 'agendaItemActions agendaReviewCardActions adminAgendaActions' : 'agendaItemActions';
    const actions = view.actions ? `<div class="${actionsClass}">${view.actions}</div>` : '';
    const attributes = view.attributes || '';
    return `<article class="${classes}"${attributes ? ` ${attributes}` : ''}>${main}${view.status || ''}${actions}</article>`;
  }

  function renderDay(view){
    const classes = ['agendaDay', view.past ? 'pastDay' : '', view.today ? 'today' : '', view.expanded ? 'expanded' : '']
      .filter(Boolean).join(' ');
    return `<article class="${classes}" data-agenda-day="${view.key || ''}" tabindex="0"${view.today ? ' aria-current="date"' : ''}>
      <div class="agendaHead"><div><strong>${view.label || ''}</strong><span>${view.date || ''}</span></div></div>
      <div class="agendaList"><div class="agendaGroup">${view.items || ''}${view.more || ''}${view.empty || ''}</div></div>
    </article>`;
  }

  function renderWeek(view){
    return `<article class="weekPanel${view.expanded ? ' expanded' : ''}"${view.id ? ` id="${view.id}"` : ''}>
      <div class="weekTop">
        ${view.sectionNavigation ? `<div class="weekSectionNavigation">${view.sectionNavigation}</div>` : ''}
        <div class="weekTitle">
          <div class="weekBadge"><span class="weekBadgeNumber">${view.week || ''}</span></div>
          <div class="weekTitleContent"><div class="weekHeadingRow"><div class="weekHeadingMain"><div class="weekDateLine"><h3>${view.title || ''}</h3></div><div class="weekHeaderMeta">${view.count || ''}${view.freshness || ''}</div></div><div class="weekHeadingActions">${view.showWeekFilter ? '<span id="agendaWeekFilterSlot" class="agendaWeekFilterSlot"></span>' : ''}${view.navigation || ''}</div></div>${view.status || ''}</div>
        </div>
      </div>
      ${view.dayNavigation || ''}
      <div class="weekBody"><div class="subBlock"><div class="agendaBoard"${view.boardAttribute || ''}>${view.days || ''}</div></div></div>
    </article>`;
  }

  function renderOngoingRow(view){
    const classes = ['ideaThemeRow', view.themeClass || '', view.hidden ? 'hiddenItem' : ''].filter(Boolean).join(' ');
    const titleActions = view.actionsInTitle && view.actions !== undefined
      ? `<div class="ongoingAdminActions">${view.actions || ''}</div>`
      : '';
    const manageCell = view.actions !== undefined && view.manageFirst
      ? `<td class="ongoingManageCell" data-label="Beheer"><div class="ongoingAdminActions">${view.actions || ''}</div></td>`
      : '';
    return `<tr class="${classes}"${view.attributes ? ` ${view.attributes}` : ''}>
      ${manageCell}
      <td class="ongoingTitleCell"><span class="name">${view.title || ''}</span>${view.review || ''}${view.date ? `<div class="small ongoingDateMeta">${view.date}</div>` : ''}${titleActions}</td>
      <td class="ongoingWeeksCell">${view.weeks || ''}</td>
      <td class="ongoingBadgesCell"><div class="cardPillGroup ongoingBadges">${view.place || ''}${view.cost || ''}${view.stimulus || ''}</div></td>
      <td class="ongoingFitCell">${view.meta || ''}<div class="small ongoingAdminDescription">${view.description || ''}</div></td>
      ${view.hideWebsite ? '' : `<td class="websiteCell">${view.website || ''}</td>`}
      ${view.actions !== undefined && !view.actionsInTitle && !view.manageFirst ? `<td class="ongoingManageCell" data-label="Beheer"><div class="ongoingAdminActions">${view.actions || ''}</div></td>` : ''}
    </tr>`;
  }

  function renderOngoingTable(view={}){
    const manageHeadLeft = view.admin && view.manageFirst ? '<th class="ongoingManageHead">Beheer</th>' : '';
    const manageHeadRight = view.admin && !view.manageFirst ? '<th class="ongoingManageHead">Beheer</th>' : '';
    const titleHeading = view.titleHeading || 'Aanbod';
    const badgesHeading = view.badgesHeading || 'Badges';
    return `<table${view.className ? ` class="${view.className}"` : ''}><thead><tr>${manageHeadLeft}<th class="ongoingTitleHead">${titleHeading}</th><th class="ongoingWeeksHead">Weken</th><th class="ongoingBadgesHead">${badgesHeading}</th><th class="ongoingFitHead">Beschrijving</th>${view.hideWebsite ? '' : '<th class="ongoingWebsiteHead">Website</th>'}${manageHeadRight}</tr></thead><tbody>${view.rows || ''}</tbody></table>`;
  }

  function isFlexiblePeriodOffer(item={}, spanDays=0){
    if(item.pinToAgenda) return false;
    const label = String(`${item.date || ''} ${item.time || ''}`).toLocaleLowerCase('nl-NL');
    return spanDays > 0 || /dagelijks|wisselende voorstellingen|start wanneer je wilt|diverse tijden|di t\/m zo|ma t\/m zo|maandag t\/m zondag/.test(label);
  }

  function agendaStartMinutes(value=''){
    const match = String(value).match(/(?:^|\D)([01]?\d|2[0-3])[:.]([0-5]\d)(?!\d)/);
    if(match) return Number(match[1]) * 60 + Number(match[2]);
    const hour = String(value).match(/(?:^|\D)([01]?\d|2[0-3])\s*uur\b/i);
    return hour ? Number(hour[1]) * 60 : Infinity;
  }
  function sortAgendaItems(items=[], spanDaysFor=()=>0){
    return [...items].sort((a,b) => {
      const timeA = agendaStartMinutes(a.time), timeB = agendaStartMinutes(b.time);
      if(timeA !== timeB) return timeA - timeB;
      const spanDiff = spanDaysFor(a) - spanDaysFor(b);
      if(spanDiff !== 0) return spanDiff;
      return String(a.title || '').localeCompare(String(b.title || ''), 'nl');
    });
  }

  function compactWeekLabel(ids=[], weeks=[], short=false){
    const ordered = weeks.filter(week => ids.includes(week.id));
    const numbers = ordered.map(week => week.week).filter(Boolean);
    if(!numbers.length) return '';
    const firstIndex = weeks.findIndex(week => week.id === ordered[0]?.id);
    const consecutive = ordered.every((week, index) => weeks.findIndex(candidate => candidate.id === week.id) === firstIndex + index);
    if(short){
      if(numbers.length > 1 && consecutive) return `${numbers[0]}-${numbers[numbers.length - 1]}`;
      return numbers.join(', ');
    }
    if(numbers.length > 2 && consecutive) return `Week ${numbers[0]} t/m ${numbers[numbers.length - 1]}`;
    return numbers.map(number => `Week ${number}`).join(', ');
  }

  function renderAgendaRow(view){
    const classes = ['ideaThemeRow', view.themeClass || '', view.hidden ? 'hiddenItem' : '', view.isNew ? 'newItem' : ''].filter(Boolean).join(' ');
    return `<tr class="${classes}">
      <td data-label="Activiteit"><span class="name">${view.title || ''}</span>${view.review || ''}<div class="small agendaDateMeta">${view.date || ''}</div></td>
      <td data-label="Categorie">${view.domain || ''}</td>
      <td data-label="Locatie en afstand">${view.location || ''}</td>
      <td data-label="Kosten">${view.cost || ''}</td>
      <td data-label="Prikkel">${view.stimulus || ''}</td>
      <td data-label="Beschrijving"><div class="small">${view.description || ''}</div></td>
      <td class="websiteCell" data-label="Website">${view.website || ''}</td>
      ${view.actions !== undefined ? `<td data-label="Beheer"><div class="agendaTableActions">${view.actions || ''}</div></td>` : ''}
    </tr>`;
  }

  function renderSourceRow(view){
    return `<article class="row sharedSourceRow">
      <div class="sharedSourceMain"><strong>${view.title || ''}</strong>${view.meta ? `<span>${view.meta}</span>` : ''}</div>
      <div class="rowActions sharedSourceActions">${view.status || ''}${view.website || ''}${view.actions || ''}</div>
    </article>`;
  }

  function mergeSourceLinks(options={}){
    const custom = Array.isArray(options.custom) ? options.custom : [];
    const base = Array.isArray(options.base) ? options.base : [];
    const overrides = Array.isArray(options.overrides) ? options.overrides : [];
    const hidden = new Set(options.hidden || []);
    const keyFor = typeof options.keyFor === 'function' ? options.keyFor : link => String(link?.url || link?.name || '');
    const overrideMap = new Map(overrides.map(link => [String(link.key || keyFor(link)), link]));
    const rows = [];
    const seen = new Set();
    custom.forEach((link, index) => {
      const key = keyFor(link);
      if(!key || seen.has(key)) return;
      seen.add(key);
      rows.push({link, index, key, kind:'custom', modified:false});
    });
    base.forEach(link => {
      const baseKey = keyFor(link);
      if(!baseKey || hidden.has(baseKey)) return;
      const managed = overrideMap.get(baseKey) || link;
      const visibleKey = keyFor(managed);
      if(!visibleKey || seen.has(visibleKey)) return;
      seen.add(visibleKey);
      rows.push({link:managed, index:null, key:baseKey, kind:'base', modified:overrideMap.has(baseKey)});
    });
    return rows;
  }

  function buildOngoingOffers(items=[], options={}){
    const weekIdsFor = options.weekIdsFor || (() => []);
    const orderWeeks = options.orderWeeks || (ids => [...new Set(ids)]);
    const dateStartFor = options.dateStartFor || (() => '');
    const recurringGroups = new Map();
    items.forEach(item => {
      const weekIds = orderWeeks(weekIdsFor(item));
      const start = dateStartFor(item);
      if(!weekIds.length || !start) return;
      const key = options.recurringKey ? options.recurringKey(item) : `${item.title || ''}|${item.where || ''}`;
      if(!key || key === '|') return;
      if(!recurringGroups.has(key)) recurringGroups.set(key, []);
      recurringGroups.get(key).push({item, weekIds, start});
    });
    const recurring = [...recurringGroups.values()].flatMap(entries => {
      const weekIds = orderWeeks(entries.flatMap(entry => entry.weekIds));
      if(weekIds.length < 2) return [];
      const dates = entries.map(entry => entry.start).filter(Boolean).sort();
      const first = entries[0].item;
      const times = [...new Set(entries.map(entry => entry.item.time).filter(Boolean))];
      const recurringItem = {
        ...first,
        week:weekIds.join(','),
        date:options.formatRange ? options.formatRange(dates) : first.date,
        time:times.length === 1 ? first.time : 'diverse tijden',
        seasonLimited:true,
        derivedRecurring:true
      };
      if(options.groupIdsFor) recurringItem.groupIds = options.groupIdsFor(entries.map(entry => entry.item));
      return [recurringItem];
    });
    const candidates = [...items, ...recurring]
      .filter(item => options.isOngoing ? options.isOngoing(item) : item.seasonLimited === true)
      .filter(item => item.derivedRecurring || !options.isActive || options.isActive(item))
      .filter(item => !options.exclude || !options.exclude(item));
    const merged = new Map();
    candidates.forEach(item => {
      const key = options.itemKey ? options.itemKey(item) : `${item.title || ''}|${item.url || ''}`;
      const weekIds = weekIdsFor(item);
      if(!merged.has(key)){
        merged.set(key, {...item, weekIds:[...weekIds]});
        return;
      }
      const current = merged.get(key);
      current.weekIds = orderWeeks([...current.weekIds, ...weekIds]);
      const currentIds = current.groupIds || (current.id ? [String(current.id)] : []);
      const nextIds = item.groupIds || (item.id ? [String(item.id)] : []);
      if(currentIds.length || nextIds.length) current.groupIds = [...new Set([...currentIds, ...nextIds])];
      if(item.derivedRecurring){
        current.derivedRecurring = true;
        current.seasonLimited = true;
        current.date = item.date || current.date;
        current.time = item.time || current.time;
      }
    });
    const result = [...merged.values()].map(item => ({...item, week:orderWeeks(item.weekIds || weekIdsFor(item)).join(',')}));
    return options.sort ? options.sort(result) : result;
  }

  function renderWeekNavigation(weeks,currentId){
    const index = weeks.findIndex(week => week.id === currentId);
    const previous = index > 0 ? weeks[index - 1] : null;
    const next = index >= 0 && index < weeks.length - 1 ? weeks[index + 1] : null;
    return `<div class="weekNav" aria-label="Door weken bladeren">
      <button class="weekNavButton" type="button" data-week-jump="${escapeHtml(previous?.id || '')}" aria-label="Vorige week" title="Vorige week"${previous ? '' : ' disabled'}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
      </button>
      <button class="weekNavButton" type="button" data-week-jump="${escapeHtml(next?.id || '')}" aria-label="Volgende week" title="Volgende week"${next ? '' : ' disabled'}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>
      </button>
    </div>`;
  }
  function renderDayNavigation(weekId,days,selectedAgendaDayKey,todayIso){
    const defaultDay = days.some(day => day.iso === todayIso) ? todayIso : days[0]?.iso;
    const selectedKey = selectedAgendaDayKey.startsWith(`${weekId}:`)
      ? selectedAgendaDayKey
      : `${weekId}:${defaultDay}`;
    const buttons = days.map(day => {
      const key = `${weekId}:${day.iso}`;
      const active = key === selectedKey;
      return `<button class="mobileDayButton${active ? ' active' : ''}" type="button" data-agenda-day-target="${escapeHtml(key)}"${active ? ' aria-current="date"' : ''}><strong>${escapeHtml(day.shortLabel)}</strong><span>${escapeHtml(day.prettyDate)}</span></button>`;
    }).join('');
    return `<nav class="mobileDayNavigation" aria-label="Kies een dag">${buttons}</nav>`;
  }
  function renderSectionNavigation(activeSection='weeks', weekTarget='weekPanels', ongoingTarget='longerOffers'){
    return `<nav class="agendaSectionTabs" aria-label="Agendaweergave" role="tablist">
      <a id="agenda-tab-weeks" class="agendaSectionTab${activeSection === 'weeks' ? ' active' : ''}" href="#${weekTarget}" role="tab" aria-controls="${weekTarget}" aria-selected="${activeSection === 'weeks'}" data-agenda-section="weeks"${activeSection === 'weeks' ? ' aria-current="page"' : ''}>Weekagenda</a>
      <a id="agenda-tab-ongoing" class="agendaSectionTab${activeSection === 'ongoing' ? ' active' : ''}" href="#${ongoingTarget}" role="tab" aria-controls="${ongoingTarget}" aria-selected="${activeSection === 'ongoing'}" data-agenda-section="ongoing"${activeSection === 'ongoing' ? ' aria-current="page"' : ''}>Doorlopend aanbod <span class="agendaSectionCount" data-agenda-ongoing-count aria-label="Aantal activiteiten">0</span></a>
    </nav>`;
  }

  function renderBoard({weekId,concrete,days,expandedAgendaDays,todayIso,visibleLimit,itemOccursOnDay,isFlexiblePeriodOffer,showPeriodInAgenda,sortAgendaPeriods,agendaItem,emptyMessage}){
    const entriesByDay = days.map(day => {
      const occurring = concrete.filter(item => itemOccursOnDay(item, day.iso));
      const items = occurring.filter(item => !isFlexiblePeriodOffer(item));
      const periods = sortAgendaPeriods(occurring.filter(item => isFlexiblePeriodOffer(item) && showPeriodInAgenda(item)));
      const entries = [
        ...periods.map(item => ({item, compact:true})),
        ...items.map(item => ({item, compact:false}))
      ];
      const dayKey = `${weekId}:${day.iso}`;
      const expanded = expandedAgendaDays.has(dayKey);
      const visibleEntries = expanded ? entries : entries.slice(0, visibleLimit);
      return {
        day,
        dayKey,
        expanded,
        totalCount:entries.length,
        items,
        periods,
        visibleEntries,
        hiddenCount:Math.max(0, entries.length - visibleEntries.length)
      };
    });
    return entriesByDay.map(({day, dayKey, expanded, totalCount, items, periods, visibleEntries, hiddenCount}) => {
      const isToday = day.iso === todayIso;
      const isPastDay = day.iso < todayIso;
      return renderDay({
        key:escapeHtml(dayKey), label:escapeHtml(day.label), date:escapeHtml(day.prettyDate),
        past:isPastDay, today:isToday, expanded,
        items:visibleEntries.map(entry => agendaItem(entry.item, entry.compact)).join(''),
        more:hiddenCount ? `<button class="agendaMore" type="button" data-expand-agenda-day="${escapeHtml(dayKey)}" aria-expanded="false">+ ${hiddenCount} meer optie${hiddenCount === 1 ? '' : 's'}</button>` : expanded && totalCount > visibleLimit ? `<button class="agendaMore" type="button" data-collapse-agenda-day="${escapeHtml(dayKey)}" aria-expanded="true">Minder tonen</button>` : '',
        empty:!items.length && !periods.length ? `<div class="agendaEmpty">${escapeHtml(emptyMessage)}</div>` : ''
      });
    }).join('');
  }
  function renderOngoingActivity(item,view){
    const {placePills,weekLabel,costLabel,stimulusLabel,icon,description,review='',themeClass='',attributes='',hidden=false}=view;
    const mobileWeekLabel = weekLabel.replace(/(\d)\s*-\s*(\d)/g, '$1–$2');
    const mobileWeekPill = weekLabel
      ? `<span class="ongoingMobileWeekPill" aria-label="Week ${escapeHtml(mobileWeekLabel)}"><strong>Week</strong> ${escapeHtml(mobileWeekLabel)}</span>`
      : '';
    const titleText = item.url
      ? `<a class="ongoingTitleLink" href="${escapeHtml(item.url)}" target="_blank" rel="noopener"><span class="ideaTitleText">${escapeHtml(item.title)}</span></a>`
      : `<span class="ideaTitleText">${escapeHtml(item.title)}</span>`;
    const dateMeta = `<span class="small ongoingDateMeta">${escapeHtml(item.date)} • ${escapeHtml(item.time)}</span>`;
    const title = `<span class="nameWithIcon"><span class="ongoingTitleVisual" aria-hidden="true"><span class="domainIcon">${icon}</span></span><span class="ongoingTitleTextStack">${titleText}${dateMeta}</span></span>`;
    return renderOngoingRow({
      themeClass, attributes, hidden, title,
      review, date:'',
      weeks:escapeHtml(weekLabel), place:`${mobileWeekPill}${placePills}`,
      cost:costLabel, stimulus:stimulusLabel, meta:'',
      description:escapeHtml(description),
      hideWebsite:true
    });
  }
  function renderWeekCount(count){
    const amount = Number(count);
    const label = amount === 1 ? 'activiteit' : 'activiteiten';
    const qualifier = amount === 1 ? '' : '<span class="weekCountWord">verschillende</span>';
    return `<span class="weekCountBadge"><span><strong>${escapeHtml(count)}</strong>${qualifier}<span class="weekCountLabel">${label}</span></span></span>`;
  }
  window.AgendaViewShared = Object.freeze({renderWeekCount,renderBoard,renderWeekNavigation,renderDayNavigation,renderSectionNavigation,renderOngoingActivity,sourceButtonLabel, renderItem, renderDay, renderWeek, renderOngoingRow, renderOngoingTable, renderAgendaRow, renderSourceRow, mergeSourceLinks, buildOngoingOffers, isFlexiblePeriodOffer, sortAgendaItems, compactWeekLabel});
})();
