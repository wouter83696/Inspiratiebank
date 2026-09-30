/* Current discovery panel: chips, multiple categories, location and radius. */
(function(){
  const state = {domains:new Set(),locationType:'all',cost:'all',stimulus:'all',duration:'all',region:null,radius:50};
  let initialized=false, sheetController=null, locationRequest=0;
  let mixOrder=null;
  const $ = id=>document.getElementById(id);
  function values(){return {...state,domain:state.domains.size ? [...state.domains].join(',') : 'all'};}
  function distance(item){
    if(item.distanceBand === 'Op locatie' || item.locationType === 'Binnen' && !item.url) return 0;
    const origin=state.region || AdminSiteSettings.current().region;
    let lat=Number(item.lat),lon=Number(item.lon ?? item.lng);
    if(!item.lat || !(item.lon ?? item.lng)){
      const text=normalize(`${item.address || ''} ${item.place || ''} ${item.title || ''}`);
      const known=PLACE_DISTANCE_COORDS.find(([name])=>text.includes(normalize(name)));
      if(!known) return NaN;
      [,lat,lon]=known;
    }
    const rad=n=>n*Math.PI/180;
    const h=Math.sin(rad(lat-origin.lat)/2)**2+Math.cos(rad(origin.lat))*Math.cos(rad(lat))*Math.sin(rad(lon-origin.lon)/2)**2;
    return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
  }
  function matches(item){
    if(state.domains.size && !state.domains.has(domainDisplayLabel(item.domain))) return false;
    if(state.locationType !== 'all'){
      const home=normalizeIdeaLocation(item.locationType)==='Binnen';
      if(state.locationType==='Binnen' ? !home : home) return false;
    }
    if(!fieldMatches(item,'cost',state.cost) || !fieldMatches(item,'stimulus',state.stimulus)) return false;
    if(state.duration !== 'all'){
      const text=normalize(item.duration),amounts=String(item.duration || '').match(/\d+(?:[.,]\d+)?/g)?.map(n=>Number(n.replace(',','.'))) || [];
      const max=Math.max(...amounts)*(text.includes('uur')?60:1);
      const band=/dag/.test(text)?'long':!amounts.length?'flexible':max<=60?'short':max<=180?'medium':'long';
      if(band!=='flexible' && band!==state.duration) return false;
    }
    const km=distance(item);
    return state.radius>=50 || !Number.isFinite(km) || km<=state.radius;
  }
  function toggleDomain(value){
    if(value==='all') state.domains.clear();
    else if(state.domains.has(value))state.domains.delete(value);else state.domains.add(value);
    renderIdeas();
  }
  function sync(count){
    if(!initialized) return;
    document.querySelectorAll('#ideaFilterSheetLayer [data-sheet-filter]').forEach(button=>{
      const key=filterKey(button.dataset.sheetFilter),value=button.dataset.value;
      const selected=key==='domains' ? value==='all'?!state.domains.size:state.domains.has(value) : state[key]===value;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
    });
    document.querySelectorAll('#inspirationThemeLegend [data-theme-filter]').forEach(button=>{
      const value=button.dataset.themeFilter,selected=value==='all'?!state.domains.size:state.domains.has(value);
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
    });
    $('ideaFilterDistanceRange').value=String(SiteSettings.radii.indexOf(state.radius));
    $('ideaFilterDistanceValue').textContent=state.radius>=50?'50+ km':state.radius+' km';
    $('ideaFilterApplyBtn').textContent=`Toon ${count ?? $('ideaCountValue').textContent} activiteiten`;
    DiscoveryViewShared.activeLocation(state.locationType,state.locationType==='Binnen'?'Thuis':'Op pad');
    const active=state.domains.size+['locationType','cost','stimulus','duration'].filter(k=>state[k]!=='all').length+(state.radius<50?1:0);
    $('filterToggle').setAttribute('aria-label',active?`Filters (${active} actief)`:'Filters');
    document.querySelectorAll('[data-location-settings-label]').forEach(el=>el.textContent=(state.region || AdminSiteSettings.current().region).label);
    document.querySelectorAll('[data-location-radius-label]').forEach(el=>el.textContent=state.radius>=50?'50+ km':state.radius+' km');

  }
  function reset(){
    state.domains.clear();Object.assign(state,{locationType:'all',cost:'all',stimulus:'all',duration:'all',radius:AdminSiteSettings.current().region.radiusKm,region:null});
    mixOrder=null;$('ideaSearch').value='';$('ideaFilterLocationInput').value='';
    $('ideaFilterLocationStatus').textContent='Standaardlocatie: '+AdminSiteSettings.current().region.label;renderIdeas();
  }
  function close(){locationRequest++;sheetController.close();}
  function open(section='top'){
    $('ideaFilterLocationInput').value=state.region?.label || '';
    $('ideaFilterLocationStatus').textContent=state.region ? 'Ingesteld op '+state.region.label : 'Standaardlocatie: '+AdminSiteSettings.current().region.label;
    document.querySelectorAll('#ideaFilterSheetLayer [data-location-preset]').forEach(button=>{const active=normalize(button.textContent.trim())===normalize((state.region || AdminSiteSettings.current().region).label);button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    sheetController.open(section);
  }
  function filterKey(key){return {ideaDomain:'domains',ideaLocation:'locationType',ideaCost:'cost',ideaDuration:'duration',ideaStimulus:'stimulus'}[key] || key;}
  async function apply(){
    const token=++locationRequest,button=$('ideaFilterApplyBtn');button.disabled=true;
    try{
      const value=$('ideaFilterLocationInput').value.trim(),region=state.region || AdminSiteSettings.current().region;
      if(value && normalize(value)!==normalize(region.label)){
        $('ideaFilterLocationStatus').textContent='Locatie zoeken…';
        const found=await SiteSettings.resolveRegion(value);
        if(token!==locationRequest)return;
        state.region=found;
      }
      if(!value)state.region=null;
      renderIdeas();close();
    }catch(error){if(token===locationRequest)$('ideaFilterLocationStatus').textContent=error.message;}
    finally{button.disabled=false;}
  }
  function setup(){
    if(initialized)return;initialized=true;
    sheetController=DiscoveryViewShared.createSheet();
    state.radius=AdminSiteSettings.current().region.radiusKm;
    $('ideaFilterDistanceRange').max=SiteSettings.radii.length-1;
    const categories=ADMIN_THEME_LEGEND.map(value=>({value:domainDisplayLabel(value),label:domainDisplayLabel(value),theme:domainThemeClass(value),icon:domainIcon(value)}));
    $('ideaFilterCategoryChips').innerHTML=DiscoveryViewShared.categoryChips(categories);
    DiscoveryViewShared.setupSearch({items:allAdminIdeas,render:renderIdeas,normalize,label:domainDisplayLabel,theme:domainThemeClass,icon:domainIcon});
    document.querySelectorAll('[data-location-settings-btn]').forEach(button=>button.addEventListener('click',()=>open('location')));
    document.querySelectorAll('[data-filter-settings-btn]').forEach(button=>button.addEventListener('click',()=>open()));
    $('ideaActiveFilterBar').addEventListener('click',()=>{state.locationType='all';renderIdeas();});
    $('filterToggle').addEventListener('click',()=>open());
    $('ideaFilterSheetLayer').querySelectorAll('[data-idea-filter-close]').forEach(button=>button.addEventListener('click',close));
    $('ideaFilterSheetLayer').addEventListener('click',event=>{
      const button=event.target.closest('[data-sheet-filter]');
      if(button){
        if(filterKey(button.dataset.sheetFilter)==='domains')toggleDomain(button.dataset.value);
        else{state[filterKey(button.dataset.sheetFilter)]=button.dataset.value;renderIdeas();}
      }
      const preset=event.target.closest('[data-location-preset]');
      if(preset)$('ideaFilterLocationInput').value=preset.textContent.trim();
    });
    $('ideaFilterDistanceRange').addEventListener('input',event=>{state.radius=SiteSettings.radii[Number(event.target.value)];renderIdeas();});
    $('ideaFilterClearBtn').addEventListener('click',reset);
    $('ideaFilterApplyBtn').addEventListener('click',apply);
    $('ideaFilterLocationInput').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();apply();}});
    $('ideaFilterMixBtn').addEventListener('click',()=>{mixOrder=new Map(allAdminIdeas().map(item=>[item.key,Math.random()]));renderIdeas();});
  }
  function sort(items){return mixOrder ? [...items].sort((a,b)=>(mixOrder.get(a.key)||0)-(mixOrder.get(b.key)||0)) : sortAdminIdeas(items);}
  window.AdminDiscovery={setup,values,matches,toggleDomain,sync,reset,sort};
})();
