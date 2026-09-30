/* Management adapter for the canonical public UIT-agenda components. */
(function(){
 const $=id=>document.getElementById(id);
 const state={section:'weeks',expanded:new Set(),day:'',region:null,radius:25,initialized:false,request:0};
 let sheet;
 const currentRegion=()=>state.region || AdminSiteSettings.current().region;
 const categories=()=>ADMIN_THEME_LEGEND.map(value=>({value:domainDisplayLabel(value),label:domainDisplayLabel(value),theme:domainThemeClass(value),icon:domainIcon(value)}));
 function setFilter(id,value){const select=$(id);select.value=value;syncCustomSelect(select);renderAgendaReview();}
 function sync(){
   if(!state.initialized)return;
   const filters=agendaAdminFilters();
   $('agendaThemeLegend').querySelectorAll('[data-theme-filter]').forEach(button=>{
     const active=domainDisplayLabel(button.dataset.themeFilter)===domainDisplayLabel(filters.domain);
     button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
   });
   $('agendaFilterSheetLayer').querySelectorAll('[data-agenda-sheet-filter]').forEach(button=>{
     const active=$(button.dataset.agendaSheetFilter)?.value===button.dataset.value;
     button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
   });
   $('agendaReviewPanel').querySelectorAll('[data-location-settings-label]').forEach(el=>el.textContent=currentRegion().label);
   $('agendaReviewPanel').querySelectorAll('[data-location-radius-label]').forEach(el=>el.textContent=state.radius>=50?'50+ km':state.radius+' km');
   $('agendaFilterDistanceRange').value=String(SiteSettings.radii.indexOf(state.radius));
   $('agendaFilterDistanceValue').textContent=state.radius>=50?'50+ km':state.radius+' km';
 }
 function syncLocation(){
   $('agendaFilterLocationInput').value=state.region?.label || '';
   $('agendaFilterLocationStatus').textContent=(state.region?'Ingesteld op ':'Standaardlocatie: ')+currentRegion().label;
   $('agendaFilterSheetLayer').querySelectorAll('[data-location-preset]').forEach(button=>{
     const active=normalize(button.textContent.trim())===normalize(currentRegion().label);
     button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
   });
 }
 function open(section='top'){
   AgendaDiscoveryShared.buildFilterChips();sync();syncLocation();sheet.open(section);
 }
 async function applyLocation({close=true}={}){
   const request=++state.request,button=$('agendaFilterApplyBtn');button.disabled=true;
   try{
     const query=$('agendaFilterLocationInput').value.trim();
     if(query && normalize(query)!==normalize(currentRegion().label)){
       $('agendaFilterLocationStatus').textContent='Locatie zoeken…';
       const region=await SiteSettings.resolveRegion(query);if(request!==state.request)return;state.region=region;
     }
     if(!query)state.region=null;
     renderAgendaReview();syncLocation();if(close)sheet.close();
   }catch(error){$('agendaFilterLocationStatus').textContent=error.message;}finally{button.disabled=false;}
 }
 function reset(){
   state.region=null;state.radius=AdminSiteSettings.current().agendaRadiusKm;
   $('agendaSearch').value='';
   for(const id of ['agendaDomain','agendaDistance','agendaCost']){$(id).value='all';syncCustomSelect($(id));}
   $('agendaWeekFilter').value='all';syncCustomSelect($('agendaWeekFilter'));
   renderAgendaReview();syncLocation();
 }
 function matchesRadius(item){
   if(state.radius>=50)return true;
   const km=AdminDiscovery.distance(item,currentRegion());return !Number.isFinite(km) || km<=state.radius;
 }
 function parkWeekFilter(){
   const control=$('agendaWeekFilter')?.closest('.customSelect') || $('agendaWeekFilter');
   if(!control)return;
   let parking=$('adminAgendaWeekParking');
   if(!parking){parking=document.createElement('span');parking.id='adminAgendaWeekParking';parking.hidden=true;$('agendaReviewPanel').append(parking);}
   parking.append(control);
 }
 function renderWeeks(items,states){
   const choice=$('agendaWeekFilter').value;
   const weeks=choice==='all'?ADMIN_WEEKS:ADMIN_WEEKS.filter(week=>week.id===choice);
   const today=formatIsoDate(new Date());
   return weeks.map((week,index)=>{
     const days=weekDays(week.id).map(day=>({...day,shortLabel:day.label.slice(0,2),prettyDate:formatCompactAgendaDate(parseIsoDate(day.iso))}));
     const concrete=sortAgendaAdminItems(items.filter(item=>itemWeekIds(item).includes(week.id)));
     const count=visibleAgendaAdminWeekCount(week.id,concrete);
     return AgendaViewShared.renderWeek({
       id:'admin-'+week.id,week:escapeHtml(week.week),title:escapeHtml(`${formatCompactAgendaDate(parseIsoDate(week.startIso))} t/m ${formatCompactAgendaDate(addDays(parseIsoDate(week.startIso),6))}`),
       expanded:days.some(day=>state.expanded.has(`${week.id}:${day.iso}`)),showWeekFilter:index===0,
       freshness:agendaAdminFreshnessBadge(),
       count:AgendaViewShared.renderWeekCount(count),
       navigation:AgendaViewShared.renderWeekNavigation(ADMIN_WEEKS,week.id),
       dayNavigation:AgendaViewShared.renderDayNavigation(week.id,days,state.day,today),boardAttribute:` data-week-board="${week.id}"`,
       days:AgendaViewShared.renderBoard({weekId:week.id,days,concrete,expandedAgendaDays:state.expanded,todayIso:today,visibleLimit:matchMedia('(min-width:981px)').matches?3:4,
         itemOccursOnDay:(item,iso)=>agendaAdminItemOccursOnDay(item,days.find(day=>day.iso===iso),week.id),
         isFlexiblePeriodOffer:isAgendaFlexiblePeriod,showPeriodInAgenda:showAgendaPeriodInWeek,
         sortAgendaPeriods:entries=>[...entries].sort((a,b)=>Number(isAgendaMultiDayFestival(b))-Number(isAgendaMultiDayFestival(a)) || a.title.localeCompare(b.title,'nl')),
         agendaItem:(item,compact)=>renderAgendaAdminCard(item,states.get(item.id),compact),emptyMessage:'Geen items'})
     });
   }).join('');
 }
 function section(next){
   state.section=next==='ongoing'?'ongoing':'weeks';
   $('agendaReviewPanel').dataset.agendaSection=state.section;
   $('agendaReviewList').hidden=state.section!=='weeks';$('ongoingAdminSection').hidden=state.section!=='ongoing';
   $('agendaSectionSwitcher').querySelectorAll('[data-agenda-section]').forEach(button=>{
     const active=button.dataset.agendaSection===state.section;
     button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
     if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
   });
   requestAnimationFrame(()=>{
     const tabs=$('agendaSectionSwitcher').querySelector('.agendaSectionTabs'),active=tabs?.querySelector('.active');
     if(active){tabs.style.setProperty('--agenda-tab-indicator-x',active.offsetLeft+'px');tabs.style.setProperty('--agenda-tab-indicator-width',active.offsetWidth+'px');tabs.dataset.indicatorReady='true';}
   });
 }
 function afterRender(ongoingCount,count){
   $('agendaSectionSwitcher').innerHTML=AgendaViewShared.renderSectionNavigation(state.section,'agendaReviewList','ongoingAdminSection');
   const control=$('agendaWeekFilter').closest('.customSelect') || $('agendaWeekFilter');
   $('agendaWeekFilterSlot')?.append(control);syncCustomSelect($('agendaWeekFilter'));
   $('agendaSectionSwitcher').querySelector('[data-agenda-ongoing-count]').textContent=ongoingCount;
   $('agendaFilterApplyBtn').textContent=`Toon ${count} ${count===1?'activiteit':'activiteiten'}`;
   AgendaDiscoveryShared.placeSwitcher($('agendaReviewPanel'));section(state.section);sync();
 }
 function navigate(target=''){
   const sources=target==='sourceOwnPanel',rules=target==='agendaRulesPanel';
   $('sourceOwnPanel').closest('.sourceGrid').hidden=!sources;$('agendaRulesPanel').hidden=!rules;$('agendaReviewPanel').hidden=sources||rules;
   if(!sources&&!rules)section(target==='ongoingAdminSection'?'ongoing':'weeks');
 }
 function setup(){
   $('agendaDesktopLocation').innerHTML=DiscoveryViewShared.locationLegendButton({filterIcon:true});
   AgendaDiscoveryShared.buildFilterChips();
   if(state.initialized){sync();return;}
   state.initialized=true;state.radius=AdminSiteSettings.current().agendaRadiusKm;
   sheet=DiscoveryViewShared.createSheet({prefix:'agenda'});
   $('agendaFilterToggle').addEventListener('click',()=>open());
   $('agendaReviewPanel').addEventListener('click',event=>{
     if(event.target.closest('[data-filter-settings-btn]'))open();
     if(event.target.closest('[data-location-settings-btn]'))open('location');
     const theme=event.target.closest('#agendaThemeLegend [data-theme-filter]');
     if(theme)setFilter('agendaDomain',$('agendaDomain').value===theme.dataset.themeFilter?'all':theme.dataset.themeFilter);
     const tab=event.target.closest('[data-agenda-section][role="tab"]');if(tab){event.preventDefault();section(tab.dataset.agendaSection);}
     const jump=event.target.closest('[data-week-jump]');if(jump?.dataset.weekJump)setFilter('agendaWeekFilter',jump.dataset.weekJump);
     const expand=event.target.closest('[data-expand-agenda-day]'),collapse=event.target.closest('[data-collapse-agenda-day]');
     if(expand||collapse){const key=expand?.dataset.expandAgendaDay || collapse.dataset.collapseAgendaDay;if(expand)state.expanded.add(key);else state.expanded.delete(key);renderAgendaReview();}
     const day=event.target.closest('[data-agenda-day-target]');
     if(day){state.day=day.dataset.agendaDayTarget;document.querySelectorAll('[data-agenda-day-target]').forEach(button=>{button.classList.toggle('active',button===day);if(button===day)button.setAttribute('aria-current','date');else button.removeAttribute('aria-current');});
       const target=[...$('agendaReviewList').querySelectorAll('[data-agenda-day]')].find(el=>el.dataset.agendaDay===state.day);
       target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});target?.focus({preventScroll:true});}
   });
   $('agendaSectionSwitcher').addEventListener('keydown',event=>{
     if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
     event.preventDefault();section(event.key==='ArrowLeft'||event.key==='Home'?'weeks':'ongoing');$('agendaSectionSwitcher').querySelector('.active')?.focus();
   });
   $('agendaFilterSheetLayer').addEventListener('click',event=>{
     if(event.target.closest('[data-agenda-filter-close]')){state.request++;sheet.close();}
     const chip=event.target.closest('[data-agenda-sheet-filter]');if(chip)setFilter(chip.dataset.agendaSheetFilter,chip.dataset.value);
     const preset=event.target.closest('[data-location-preset]');if(preset){$('agendaFilterLocationInput').value=preset.textContent.trim();applyLocation({close:false});}
   });
   $('agendaFilterDistanceRange').addEventListener('input',event=>{state.radius=SiteSettings.radii[+event.target.value];renderAgendaReview();});
   $('agendaFilterClearBtn').addEventListener('click',reset);$('agendaResetBtn').addEventListener('click',reset);
   $('agendaFilterApplyBtn').addEventListener('click',()=>applyLocation());
   $('agendaFilterLocationInput').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();applyLocation();}});
   window.addEventListener('resize',()=>{AgendaDiscoveryShared.placeSwitcher($('agendaReviewPanel'));section(state.section);});sync();
 }
 window.AdminAgenda=Object.freeze({setup,sync,matchesRadius,parkWeekFilter,renderWeeks,afterRender,navigate});
})();
