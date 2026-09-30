/* Canonical UIT-agenda controls and filter sheet for visitors and management. */
(function(){
  const $=selector=>document.querySelector(selector);
  const controls = `      <div class="desktopStickyControls agendaDesktopControls">
      <div class="filterBar">
        <div class="filters agendaSearchFilters more sharedDiscoveryFilters" id="agendaFilters">
          <div class="filterSearch"><input id="agendaSearch" type="search" placeholder="Zoek in activiteiten..."></div>
          <div class="desktopLocationBar" id="agendaDesktopLocation"></div>
          <button class="filterToggle" id="agendaFilterToggle" type="button" aria-label="Filters" aria-expanded="false" aria-haspopup="dialog" aria-controls="agendaFilterSheetLayer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9"></path><path d="M17 7h3"></path><circle cx="15" cy="7" r="2"></circle><path d="M4 17h3"></path><path d="M11 17h9"></path><circle cx="9" cy="17" r="2"></circle></svg>
          </button>
          <select id="agendaWeekFilter" aria-label="Week filteren" data-include-placeholder-option="true"><option value="">Week</option></select>
          <div class="filterOptions">
            <select id="agendaDomain" data-theme-select="true" aria-label="Categorie filteren"><option value="all">Categorie</option></select>
            <select id="agendaDistance" aria-label="Afstand filteren"><option value="all">Afstand</option></select>
            <select id="agendaCost" aria-label="Kosten filteren"><option value="all">Kosten</option></select>
            <button class="filterReset" id="agendaResetBtn" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6 6 18"></path></svg>
              Reset
            </button>
            <span id="agendaSearchStatus" class="agendaSearchStatus"></span>
          </div>
        </div>
      </div>
      <div class="inspirationDesktopFilterRow agendaLegendBar sharedDiscoveryChipRow">
        <div id="agendaThemeLegend"></div>
      </div>
      </div>
`;
  const sheet = `  <div class="ideaFilterSheetLayer" id="agendaFilterSheetLayer" aria-hidden="true">
    <button class="ideaFilterSheetBackdrop" type="button" data-agenda-filter-close aria-label="Filters sluiten"></button>
    <aside class="ideaFilterSheet" role="dialog" aria-modal="true" aria-labelledby="agendaFilterSheetTitle">
      <header class="ideaFilterSheetHeader">
        <h2 id="agendaFilterSheetTitle">Filters</h2>
        <button class="ideaFilterSheetClose" type="button" data-agenda-filter-close aria-label="Filters sluiten"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6 6 18"></path></svg></button>
      </header>
      <div class="ideaFilterSheetBody" id="agendaFilterSheetBody">
        <section class="ideaFilterSection">
          <div class="ideaFilterSectionHead"><h3>Locatie</h3></div>
          <label class="ideaFilterLocationField" for="agendaFilterLocationInput">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 4.5-8 11-8 11S4 14.5 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>
            <input id="agendaFilterLocationInput" type="text" inputmode="text" autocomplete="postal-code" placeholder="Postcode of plaats">
          </label>
          <div class="ideaFilterChips locationPresetChips" aria-label="Kies een stad">
            <button class="ideaFilterChip" type="button" data-location-preset="nijmegen">Nijmegen</button>
            <button class="ideaFilterChip" type="button" data-location-preset="arnhem">Arnhem</button>
          </div>
          <p class="ideaFilterSheetStatus" id="agendaFilterLocationStatus" role="status" aria-live="polite"></p>
        </section>
        <section class="ideaFilterSection">
          <div class="ideaFilterSectionHead"><h3>Afstand</h3><span class="ideaFilterSectionValue" id="agendaFilterDistanceValue">25 km</span></div>
          <input class="ideaFilterRange" id="agendaFilterDistanceRange" type="range" min="0" max="5" step="1" value="4" aria-label="Maximale afstand">
          <div class="ideaFilterRangeLabels" aria-hidden="true"><span>3 km</span><span>5 km</span><span>10 km</span><span>15 km</span><span>25 km</span><span>50+ km</span></div>
        </section>
        <section class="ideaFilterSection">
          <div class="ideaFilterSectionHead"><h3>Week</h3></div>
          <div class="ideaFilterChips" id="agendaFilterWeekChips"></div>
        </section>
        <section class="ideaFilterSection">
          <div class="ideaFilterSectionHead"><h3>Categorieën</h3></div>
          <div class="ideaFilterChips" id="agendaFilterCategoryChips"></div>
        </section>
        <section class="ideaFilterSection">
          <div class="ideaFilterSectionHead"><h3>Prijs</h3></div>
          <div class="ideaFilterChips" id="agendaFilterPriceChips"></div>
        </section>
      </div>
      <footer class="ideaFilterSheetFooter">
        <button class="ideaFilterSheetAction secondary" id="agendaFilterClearBtn" type="button">Wissen</button>
        <button class="ideaFilterSheetAction primary" id="agendaFilterApplyBtn" type="button">Toon activiteiten</button>
      </footer>
    </aside>
  </div>
`;
  function mount(){
    for(const [selector,markup] of [['[data-agenda-controls]',controls],['[data-agenda-sheet]',sheet]]){
      document.querySelectorAll(selector).forEach(node=>{const template=document.createElement('template');template.innerHTML=markup;node.replaceWith(template.content);});
    }
  }
  function buildFilterChips(){
    const groups = [
      ['agendaFilterWeekChips','agendaWeekFilter','Alle weken',false],
      ['agendaFilterCategoryChips','agendaDomain','Alles',true],
      ['agendaFilterPriceChips','agendaCost','Alles',false]
    ];
    groups.forEach(([containerId, selectId, allLabel, themed]) => {
      const container = $('#'+containerId);
      const select = $('#'+selectId);
      if(!container || !select) return;
      container.innerHTML = '';
      [...select.options].forEach((option, index) => {
        const button = document.createElement('button');
        const isAll = option.value === 'all' || (!option.value && index === 0);
        button.className = `ideaFilterChip ${themed && !isAll ? domainThemeClass(option.value) : ''}`.trim();
        button.type = 'button';
        button.dataset.agendaSheetFilter = selectId;
        button.dataset.value = option.value;
        button.innerHTML = themed && !isAll
          ? `<span class="domainIcon" aria-hidden="true">${domainIcon(option.value)}</span><span>${escapeHtml(domainDisplayLabel(option.value))}</span>`
          : escapeHtml(isAll ? allLabel : option.textContent);
        container.appendChild(button);
      });
    });
  }

  function placeSwitcher(panel){
    const controls=panel?.querySelector('.agendaDesktopControls'),switcher=$('#agendaSectionSwitcher'),surface=$('#agendaContentSurface');
    if(!controls || !switcher)return;
    if(matchMedia('(max-width:640px)').matches){if(surface && switcher.parentElement!==surface)surface.prepend(switcher);}
    else if(switcher.parentElement!==controls)controls.append(switcher);
  }
  window.AgendaDiscoveryShared=Object.freeze({placeSwitcher,mount,buildFilterChips});
})();
