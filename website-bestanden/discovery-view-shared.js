/* Canonical discovery UI. Both public and management pages mount these exact
   controls and sheet. Host adapters provide data and management capabilities. */
(function(){
  const controls = `      <div class="desktopStickyControls">
      <div class="filterBar">
        <div class="filters more sharedDiscoveryFilters" id="ideaFilters">
          <div class="filterSearch"><input id="ideaSearch" type="search" placeholder="Zoek inspiratie..." autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="ideaSearchSuggestions"><div class="ideaSearchSuggestions" id="ideaSearchSuggestions" role="listbox" aria-label="Zoeksuggesties"></div></div>
          <div class="desktopLocationBar" id="inspirationDesktopLocation"></div>
          <button class="filterToggle" id="filterToggle" type="button" aria-label="Filters" aria-expanded="false" aria-haspopup="dialog" aria-controls="ideaFilterSheetLayer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9"></path><path d="M17 7h3"></path><circle cx="15" cy="7" r="2"></circle><path d="M4 17h3"></path><path d="M11 17h9"></path><circle cx="9" cy="17" r="2"></circle></svg>
          </button>
          <div class="viewBar mobileViewBar">
            <div class="viewSwitch" aria-label="Weergave inspiratiebank">
              <button class="viewBtn active" type="button" data-view-group="ideas" data-view="tiles" aria-label="Tegelweergave" title="Tegelweergave">
                <span class="viewIcon" aria-hidden="true"><svg viewBox="0 0 20 20"><rect x="3" y="3" width="5" height="5" rx="1"></rect><rect x="12" y="3" width="5" height="5" rx="1"></rect><rect x="3" y="12" width="5" height="5" rx="1"></rect><rect x="12" y="12" width="5" height="5" rx="1"></rect></svg></span>
              </button>
              <button class="viewBtn" type="button" data-view-group="ideas" data-view="map" aria-label="Kaartweergave" title="Kaartweergave">
                <span class="viewIcon" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M2.5 5.5 7 3.5l6 2 4.5-2v11L13 16.5l-6-2-4.5 2Z"></path><path d="M7 3.5v11"></path><path d="M13 5.5v11"></path></svg></span>
              </button>
            </div>
          </div>
          <div class="filterOptions">
            <select id="ideaDomain"><option value="all">Categorie</option></select>
            <select id="ideaLocation"><option value="all">Locatie</option></select>
            <select id="ideaDistance"><option value="all">Afstand</option></select>
            <select id="ideaCost"><option value="all">Kosten</option></select>
            <select id="ideaStimulus"><option value="all">Prikkelbelasting</option></select>
            <select id="ideaDuration"><option value="all">Duur</option></select>
            <button class="filterShuffle" id="mixIdeasBtn" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3Z"></path><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"></path></svg>
              <span>Mix aanbod</span>
            </button>
            <button class="filterReset" id="resetBtn" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6 6 18"></path></svg>
              <span>Filters wissen</span>
            </button>
          </div>
        </div>
      </div>
      <div class="inspirationDesktopFilterRow sharedDiscoveryChipRow">
        <div id="inspirationThemeLegend"></div>
        <div class="viewBar desktopViewBar">
          <div class="viewSwitch" aria-label="Weergave inspiratiebank desktop">
            <button class="viewBtn active" type="button" data-view-group="ideas" data-view="tiles" aria-label="Tegelweergave" title="Tegelweergave">
              <span class="viewIcon" aria-hidden="true"><svg viewBox="0 0 20 20"><rect x="3" y="3" width="5" height="5" rx="1"></rect><rect x="12" y="3" width="5" height="5" rx="1"></rect><rect x="3" y="12" width="5" height="5" rx="1"></rect><rect x="12" y="12" width="5" height="5" rx="1"></rect></svg></span>
            </button>
            <button class="viewBtn" type="button" data-view-group="ideas" data-view="list" aria-label="Lijstweergave" title="Lijstweergave">
              <span class="viewIcon" aria-hidden="true"><svg viewBox="0 0 20 20"><circle cx="4" cy="5" r="1"></circle><circle cx="4" cy="10" r="1"></circle><circle cx="4" cy="15" r="1"></circle><path d="M8 5h9"></path><path d="M8 10h9"></path><path d="M8 15h9"></path></svg></span>
            </button>
            <button class="viewBtn" type="button" data-view-group="ideas" data-view="map" aria-label="Kaartweergave" title="Kaartweergave">
              <span class="viewIcon" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M2.5 5.5 7 3.5l6 2 4.5-2v11L13 16.5l-6-2-4.5 2Z"></path><path d="M7 3.5v11"></path><path d="M13 5.5v11"></path></svg></span>
            </button>
          </div>
        </div>
      </div>
      </div>
      <div class="ideaActiveFilterBar" id="ideaActiveFilterBar" hidden aria-label="Actieve filters"></div>
`;
  const sheet = `  <div class="ideaFilterSheetLayer" id="ideaFilterSheetLayer" aria-hidden="true">
    <button class="ideaFilterSheetBackdrop" type="button" data-idea-filter-close aria-label="Filters sluiten"></button>
    <aside class="ideaFilterSheet" role="dialog" aria-modal="true" aria-labelledby="ideaFilterSheetTitle">
      <header class="ideaFilterSheetHeader">
        <h2 id="ideaFilterSheetTitle">Filters</h2>
        <button class="ideaFilterSheetClose" type="button" data-idea-filter-close aria-label="Filters sluiten"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6 6 18"></path></svg></button>
      </header>
      <div class="ideaFilterSheetBody" id="ideaFilterSheetBody">
        <section class="ideaFilterSection" id="ideaFilterLocationSection">
          <div class="ideaFilterSectionHead"><h3>Locatie</h3></div>
          <label class="ideaFilterLocationField" for="ideaFilterLocationInput">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 4.5-8 11-8 11S4 14.5 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>
            <input id="ideaFilterLocationInput" type="text" inputmode="text" autocomplete="postal-code" placeholder="Postcode of plaats">
          </label>
          <div class="ideaFilterChips locationPresetChips" aria-label="Kies een stad">
            <button class="ideaFilterChip" type="button" data-location-preset="nijmegen">Nijmegen</button>
            <button class="ideaFilterChip" type="button" data-location-preset="arnhem">Arnhem</button>
          </div>
          <p class="ideaFilterSheetStatus" id="ideaFilterLocationStatus" role="status" aria-live="polite"></p>
        </section>
        <section class="ideaFilterSection" id="ideaFilterDistanceSection">
          <div class="ideaFilterSectionHead"><h3>Afstand</h3><span class="ideaFilterSectionValue" id="ideaFilterDistanceValue">10 km</span></div>
          <input class="ideaFilterRange" id="ideaFilterDistanceRange" type="range" min="0" max="5" step="1" value="2" aria-label="Maximale afstand">
          <div class="ideaFilterRangeLabels" aria-hidden="true"><span>3 km</span><span>5 km</span><span>10 km</span><span>15 km</span><span>25 km</span><span>50+ km</span></div>
        </section>
        <section class="ideaFilterSection">
          <div class="ideaFilterSectionHead"><h3>Waar</h3></div>
          <div class="ideaFilterChips" id="ideaFilterPlaceChips">
            <button class="ideaFilterChip" type="button" data-sheet-filter="ideaLocation" data-value="all">Alle</button>
            <button class="ideaFilterChip" type="button" data-sheet-filter="ideaLocation" data-value="Binnen"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 9.2 10 4l6 5.2"></path><path d="M5.8 8.4V16h8.4V8.4"></path><path d="M8.4 16v-4.2h3.2V16"></path></svg><span>Thuis</span></button>
            <button class="ideaFilterChip" type="button" data-sheet-filter="ideaLocation" data-value="Op pad">Op pad</button>
          </div>
        </section>
        <section class="ideaFilterSection">
          <div class="ideaFilterSectionHead"><h3>Categorieën</h3></div>
          <p class="ideaFilterCategoryHint" id="ideaFilterCategoryHint">Kies één of meer categorieën. Klik nogmaals om uit te zetten.</p>
          <div class="ideaFilterChips" id="ideaFilterCategoryChips" aria-describedby="ideaFilterCategoryHint"></div>
        </section>
        <section class="ideaFilterSection">
          <div class="ideaFilterSectionHead"><h3>Prijs</h3></div>
          <div class="ideaFilterChips" id="ideaFilterPriceChips">
            <button class="ideaFilterChip" type="button" data-sheet-filter="ideaCost" data-value="all">Alles</button>
            <button class="ideaFilterChip costFree" type="button" data-sheet-filter="ideaCost" data-value="Gratis">Gratis</button>
            <button class="ideaFilterChip costLow" type="button" data-sheet-filter="ideaCost" data-value="€">€</button>
            <button class="ideaFilterChip costMid" type="button" data-sheet-filter="ideaCost" data-value="€€">€€</button>
            <button class="ideaFilterChip costHigh" type="button" data-sheet-filter="ideaCost" data-value="€€€">€€€</button>
          </div>
        </section>
        <section class="ideaFilterSection">
          <div class="ideaFilterSectionHead"><h3>Duur</h3></div>
          <div class="ideaFilterChips" id="ideaFilterDurationChips">
            <button class="ideaFilterChip" type="button" data-sheet-filter="ideaDuration" data-value="all">Alle</button>
            <button class="ideaFilterChip" type="button" data-sheet-filter="ideaDuration" data-value="short">Tot 1 uur</button>
            <button class="ideaFilterChip" type="button" data-sheet-filter="ideaDuration" data-value="medium">1–3 uur</button>
            <button class="ideaFilterChip" type="button" data-sheet-filter="ideaDuration" data-value="long">Langer</button>
          </div>
        </section>
        <section class="ideaFilterSection">
          <div class="ideaFilterSectionHead"><h3>Prikkelbelasting</h3></div>
          <div class="ideaFilterChips">
            <button class="ideaFilterChip" type="button" data-sheet-filter="ideaStimulus" data-value="all">Alle</button>
            <button class="ideaFilterChip" type="button" data-sheet-filter="ideaStimulus" data-value="Laag">Laag</button>
            <button class="ideaFilterChip" type="button" data-sheet-filter="ideaStimulus" data-value="Middel">Middel</button>
            <button class="ideaFilterChip" type="button" data-sheet-filter="ideaStimulus" data-value="Hoog">Hoog</button>
          </div>
        </section>
        <section class="ideaFilterSection">
          <button class="ideaFilterMix ideaFilterSheetAction secondary" id="ideaFilterMixBtn" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3Z"></path><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"></path></svg><span>Mix het aanbod</span></button>
        </section>
      </div>
      <footer class="ideaFilterSheetFooter">
        <button class="ideaFilterSheetAction secondary" id="ideaFilterClearBtn" type="button">Wissen</button>
        <button class="ideaFilterSheetAction primary" id="ideaFilterApplyBtn" type="button">Toon activiteiten</button>
      </footer>
    </aside>
  </div>
`;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  function mount({admin=false}={}){
    document.querySelectorAll('[data-discovery-controls]').forEach(node => {
      const template=document.createElement('template'); template.innerHTML=controls;
      if(admin){
        const list=template.content.querySelector('[data-view="list"]');
        template.content.querySelector('.mobileViewBar [data-view="map"]').replaceWith(list.cloneNode(true));
        template.content.querySelectorAll('[data-view="map"]').forEach(button=>button.remove());
        template.content.querySelectorAll('[data-view]').forEach(button=>button.dataset.adminView=button.dataset.view);
      }
      if(!admin)template.content.querySelectorAll('[data-view="list"]').forEach(button=>button.remove());
      node.replaceWith(template.content);
    });
    document.querySelectorAll('[data-discovery-sheet]').forEach(node=>{const template=document.createElement('template');template.innerHTML=sheet;node.replaceWith(template.content);});
  }
  function locationLegendButton({filterIcon=false}={}){
    const chevron = `<svg class="locationChevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>`;
    const locationButton = `<button class="agendaLegendItem locationLegendItem" data-location-settings-btn type="button" title="Locatie en afstand wijzigen"><span class="locationIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 10c0 4.5-8 11-8 11S4 14.5 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg></span><span data-location-settings-label>Nijmegen</span> <span class="locationRadius" data-location-radius-label>10 km</span>${chevron}</button>`;
    if(!filterIcon) return locationButton;
    const filterButton = `<button class="locationInlineFilterButton" data-filter-settings-btn type="button" title="Filters wijzigen" aria-label="Filters wijzigen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9"></path><path d="M17 7h3"></path><circle cx="15" cy="7" r="2"></circle><path d="M4 17h3"></path><path d="M11 17h9"></path><circle cx="9" cy="17" r="2"></circle></svg></button>`;
    return `<span class="locationControlGroup">${locationButton}${filterButton}</span>`;
  }

  function categoryChips(categories){
    return '<button class="ideaFilterChip" type="button" data-sheet-filter="ideaDomain" data-value="all">Alles</button>'+categories.map(c=>`<button class="ideaFilterChip ${escapeHtml(c.theme)}" type="button" data-sheet-filter="ideaDomain" data-value="${escapeHtml(c.value)}"><span class="domainIcon" aria-hidden="true">${c.icon}</span><span>${escapeHtml(c.label)}</span></button>`).join('');
  }
  function legend(categories){
    return `<div class="agendaThemeLegend" aria-label="Legenda themakleuren">${locationLegendButton()}<button class="agendaLegendItem themeDefault active" type="button" data-theme-filter="all" aria-pressed="true">Alles</button>${categories.map(c=>`<button class="agendaLegendItem ${escapeHtml(c.theme)}" type="button" data-theme-filter="${escapeHtml(c.value)}" aria-pressed="false"><span class="domainIcon" aria-hidden="true">${c.icon}</span>${escapeHtml(c.label)}</button>`).join('')}</div>`;
  }
  function activeLocation(value,label){
    const bar=document.getElementById('ideaActiveFilterBar');
    bar.hidden=value==='all';
    bar.innerHTML=value==='all'?'':`<button class="ideaActiveFilterChip" type="button" aria-label="Filter ${escapeHtml(label)} verwijderen"><span>${escapeHtml(label)}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 6l8 8M14 6l-8 8"></path></svg></button>`;
  }
  function filterDropdown(layer,filter,{attribute='data-sheet-filter',onChange,keepButtons=false}={}){
    const buttons=[...layer.querySelectorAll(`[${attribute}="${filter}"]`)];if(!buttons.length)return;
    const section=buttons[0].closest('section'),heading=section.querySelector('h3');
    const prompts={ideaLocation:'Kies een locatie',ideaCost:'Kies een prijs',ideaDuration:'Kies een duur',ideaStimulus:'Kies een prikkelbelasting',agendaCost:'Kies een prijs'};
    const select=document.createElement('select');select.className='sharedFilterSelect';select.dataset.sharedFilter=filter;select.setAttribute('aria-label',heading.textContent);
    buttons.forEach(button=>{const option=document.createElement('option');option.value=button.dataset.value;option.textContent=option.value==='all'?(prompts[filter]||'Kies een optie'):button.textContent.trim();select.append(option);});
    if(keepButtons){buttons[0].parentElement.hidden=true;section.append(select);}else section.replaceChildren(heading,select);
    select.dataset.includePlaceholderOption='true';enhanceCustomSelect(select);
    select.closest('.customSelect').querySelector('.customSelectButton').setAttribute('aria-label',heading.textContent);
    select.addEventListener('change',()=>onChange(select.value));return select;
  }
  function syncDropdowns(){
    document.querySelectorAll('[data-shared-filter]').forEach(select=>{const control=document.getElementById(select.dataset.sharedFilter);if(control){select.value=control.value;syncCustomSelect(select);}});
  }
  function createSheet({prefix='idea'}={}){
    let returnFocus=null,timer;
    const layer=document.getElementById(prefix+'FilterSheetLayer');
    const panel=layer.querySelector('.ideaFilterSheet');
    const trigger=document.getElementById(prefix==='idea'?'filterToggle':'agendaFilterToggle');
    function close(){
      if(!layer.classList.contains('isOpen'))return;
      clearTimeout(timer);layer.classList.remove('isOpen');layer.setAttribute('aria-hidden','true');document.body.classList.remove('ideaFilterSheetOpen');trigger?.setAttribute('aria-expanded','false');returnFocus?.focus({preventScroll:true});returnFocus=null;
    }
    function open(section='top'){
      returnFocus=document.activeElement;layer.classList.add('isOpen');layer.setAttribute('aria-hidden','false');document.body.classList.add('ideaFilterSheetOpen');trigger?.setAttribute('aria-expanded','true');
      clearTimeout(timer);timer=setTimeout(()=>{document.getElementById(prefix+'FilterSheetBody').scrollTop=0;(section==='location'?document.getElementById(prefix+'FilterLocationInput'):layer.querySelector('.ideaFilterSheetClose')).focus({preventScroll:true});},180);
    }
    layer.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();close();}
      if(event.key!=='Tab')return;
      const nodes=[...panel.querySelectorAll('button,input,select,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    });
    return {open,close};
  }
  function setupSearch({items,render,normalize,label,theme,icon}){
    const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
    const allInspirationItems=items,renderIdeas=render,domainDisplayLabel=label,domainThemeClass=theme,domainIcon=icon;
  let ideaSearchSuggestionIndex = -1;
  function closeIdeaSearchSuggestions(){
    const input = $('#ideaSearch');
    const list = $('#ideaSearchSuggestions');
    if(!input || !list) return;
    ideaSearchSuggestionIndex = -1;
    list.classList.remove('open');
    list.innerHTML = '';
    input.setAttribute('aria-expanded','false');
    input.removeAttribute('aria-activedescendant');
  }
  function ideaSearchSuggestionsFor(query=''){
    const needle = normalize(query.trim());
    if(!needle) return [];
    const seen = new Set();
    return allInspirationItems().map(item => {
      const title = String(item.title || '').trim();
      const titleKey = normalize(title);
      const domain = domainDisplayLabel(item.domain);
      const haystack = `${titleKey} ${normalize(domain)} ${normalize(item.place || item.location || '')}`;
      if(!title || !haystack.includes(needle)) return null;
      const score = titleKey.startsWith(needle) ? 0 : titleKey.split(/\s+/).some(word => word.startsWith(needle)) ? 1 : titleKey.includes(needle) ? 2 : 3;
      return {item,title,domain,score};
    }).filter(suggestion => {
      if(!suggestion) return false;
      const key = normalize(suggestion.title);
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a,b) => a.score - b.score || a.title.localeCompare(b.title,'nl')).slice(0,6);
  }
  function setIdeaSearchSuggestionActive(index){
    const input = $('#ideaSearch');
    const options = $$('#ideaSearchSuggestions .ideaSearchSuggestion');
    if(!input || !options.length) return;
    ideaSearchSuggestionIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => {
      const active = optionIndex === ideaSearchSuggestionIndex;
      option.classList.toggle('active', active);
      option.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const activeOption = options[ideaSearchSuggestionIndex];
    input.setAttribute('aria-activedescendant', activeOption.id);
    activeOption.scrollIntoView({block:'nearest'});
  }
  function chooseIdeaSearchSuggestion(title=''){
    const input = $('#ideaSearch');
    if(!input || !title) return;
    input.value = title;
    closeIdeaSearchSuggestions();
    renderIdeas();
    input.focus();
  }
  function renderIdeaSearchSuggestions(){
    const input = $('#ideaSearch');
    const list = $('#ideaSearchSuggestions');
    if(!input || !list) return;
    const suggestions = ideaSearchSuggestionsFor(input.value);
    ideaSearchSuggestionIndex = -1;
    if(!suggestions.length){
      closeIdeaSearchSuggestions();
      return;
    }
    list.innerHTML = suggestions.map((suggestion,index) => `<button class="ideaSearchSuggestion ${domainThemeClass(suggestion.item.domain)}" id="ideaSearchSuggestion-${index}" type="button" role="option" aria-selected="false" data-search-suggestion="${escapeHtml(suggestion.title)}"><span class="ideaSearchSuggestionIcon" aria-hidden="true">${domainIcon(suggestion.item.domain)}</span><span class="ideaSearchSuggestionText"><strong>${escapeHtml(suggestion.title)}</strong><small>${escapeHtml(suggestion.domain)}</small></span></button>`).join('');
    list.classList.add('open');
    input.setAttribute('aria-expanded','true');
  }
  function setup(){
    const input = $('#ideaSearch');
    const list = $('#ideaSearchSuggestions');
    if(!input || !list) return;
    input.addEventListener('input', renderIdeaSearchSuggestions);
    input.addEventListener('focus', renderIdeaSearchSuggestions);
    input.addEventListener('keydown', event => {
      const options = $$('#ideaSearchSuggestions .ideaSearchSuggestion');
      if(event.key === 'ArrowDown' && options.length){ event.preventDefault(); setIdeaSearchSuggestionActive(ideaSearchSuggestionIndex + 1); }
      else if(event.key === 'ArrowUp' && options.length){ event.preventDefault(); setIdeaSearchSuggestionActive(ideaSearchSuggestionIndex - 1); }
      else if(event.key === 'Enter' && ideaSearchSuggestionIndex >= 0){ event.preventDefault(); chooseIdeaSearchSuggestion(options[ideaSearchSuggestionIndex]?.dataset.searchSuggestion || ''); }
      else if(event.key === 'Escape'){ closeIdeaSearchSuggestions(); }
    });
    list.addEventListener('mousedown', event => event.preventDefault());
    list.addEventListener('click', event => {
      const option = event.target.closest('[data-search-suggestion]');
      if(option) chooseIdeaSearchSuggestion(option.dataset.searchSuggestion || '');
    });
    document.addEventListener('click', event => {
      if(!event.target.closest('#ideaFilters .filterSearch')) closeIdeaSearchSuggestions();
    });
  }

    setup();return {close:closeIdeaSearchSuggestions};
  }
  window.DiscoveryViewShared=Object.freeze({mount,locationLegendButton,categoryChips,legend,activeLocation,filterDropdown,syncDropdowns,createSheet,setupSearch});
})();
