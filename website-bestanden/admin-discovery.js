/* Current discovery panel: chips, multiple categories, location and radius. */
(function(){
  const state = {domains:new Set(),locationType:'all',cost:'all',stimulus:'all',duration:'all',region:null,radius:50};
  let initialized=false, returnFocus=null, locationRequest=0;
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
    document.querySelectorAll('#adminDiscoveryDialog [data-sheet-filter]').forEach(button=>{
      const key=button.dataset.sheetFilter,value=button.dataset.value;
      const selected=key==='domains' ? value==='all'?!state.domains.size:state.domains.has(value) : state[key]===value;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
    });
    document.querySelectorAll('#adminThemeLegend [data-admin-theme-filter]').forEach(button=>{
      const value=button.dataset.adminThemeFilter,selected=value==='all'?!state.domains.size:state.domains.has(value);
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
    });
    $('adminFilterDistanceRange').value=String(SiteSettings.radii.indexOf(state.radius));
    $('adminFilterDistanceValue').textContent=state.radius>=50?'50+ km':state.radius+' km';
    $('adminFilterApplyBtn').textContent=`Toon ${count ?? $('ideaCountValue').textContent} activiteiten`;
    const active=state.domains.size+['locationType','cost','stimulus','duration'].filter(k=>state[k]!=='all').length+(state.radius<50?1:0);
    $('adminFilterToggle').setAttribute('aria-label',active?`Filters (${active} actief)`:'Filters');
    $('adminDiscoverySummary').textContent=active ? `${active} filters actief · ${state.region?.label || AdminSiteSettings.current().region.label}${state.radius<50?' · '+state.radius+' km':''}` : '';
    $('adminDiscoveryReset').hidden=!active;
  }
  function reset(){
    state.domains.clear();Object.assign(state,{locationType:'all',cost:'all',stimulus:'all',duration:'all',radius:50,region:null});
    mixOrder=null;$('ideaSearch').value='';$('adminFilterLocationInput').value=AdminSiteSettings.current().region.label;
    $('adminFilterLocationStatus').textContent='';renderIdeas();
  }
  function close(){
    locationRequest++;
    $('adminDiscoveryDialog').close();$('adminDiscoveryDialog').classList.remove('isOpen');
    $('adminFilterToggle').setAttribute('aria-expanded','false');document.body.classList.remove('adminDiscoveryOpen');returnFocus?.focus();
  }
  function open(){
    returnFocus=document.activeElement;
    $('adminFilterLocationInput').value=(state.region || AdminSiteSettings.current().region).label;
    $('adminFilterLocationStatus').textContent='';
    $('adminDiscoveryDialog').showModal();$('adminDiscoveryDialog').classList.add('isOpen');
    $('adminFilterToggle').setAttribute('aria-expanded','true');document.body.classList.add('adminDiscoveryOpen');
  }
  async function apply(){
    const token=++locationRequest,button=$('adminFilterApplyBtn');button.disabled=true;
    try{
      const value=$('adminFilterLocationInput').value.trim(),region=state.region || AdminSiteSettings.current().region;
      if(value && normalize(value)!==normalize(region.label)){
        $('adminFilterLocationStatus').textContent='Locatie zoeken…';
        const found=await SiteSettings.resolveRegion(value);
        if(token!==locationRequest)return;
        state.region=found;
      }
      if(!value)state.region=null;
      renderIdeas();close();
    }catch(error){if(token===locationRequest)$('adminFilterLocationStatus').textContent=error.message;}
    finally{button.disabled=false;}
  }
  function setup(){
    if(initialized)return;initialized=true;
    const categories=['all',...ADMIN_THEME_LEGEND.map(domainDisplayLabel)];
    $('adminFilterCategoryChips').innerHTML=categories.map(value=>`<button class="ideaFilterChip ${domainThemeClass(value)}" type="button" data-sheet-filter="domains" data-value="${escapeHtml(value)}">${value==='all'?'Alles':escapeHtml(value)}</button>`).join('');
    $('adminFilterToggle').addEventListener('click',open);
    $('adminDiscoveryDialog').addEventListener('cancel',event=>{event.preventDefault();close();});
    $('adminDiscoveryDialog').querySelectorAll('[data-idea-filter-close]').forEach(button=>button.addEventListener('click',close));
    $('adminDiscoveryDialog').addEventListener('click',event=>{
      const button=event.target.closest('[data-sheet-filter]');
      if(button){
        if(button.dataset.sheetFilter==='domains')toggleDomain(button.dataset.value);
        else{state[button.dataset.sheetFilter]=button.dataset.value;renderIdeas();}
      }
      const preset=event.target.closest('[data-location-preset]');
      if(preset)$('adminFilterLocationInput').value=preset.textContent.trim();
    });
    $('adminFilterDistanceRange').addEventListener('input',event=>{state.radius=SiteSettings.radii[Number(event.target.value)];renderIdeas();});
    $('adminFilterClearBtn').addEventListener('click',reset);$('adminDiscoveryReset').addEventListener('click',reset);
    $('adminFilterApplyBtn').addEventListener('click',apply);
    $('adminFilterLocationInput').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();apply();}});
    $('adminFilterMixBtn').addEventListener('click',()=>{mixOrder=new Map(allAdminIdeas().map(item=>[item.key,Math.random()]));renderIdeas();});
  }
  function sort(items){return mixOrder ? [...items].sort((a,b)=>(mixOrder.get(a.key)||0)-(mixOrder.get(b.key)||0)) : sortAdminIdeas(items);}
  window.AdminDiscovery={setup,values,matches,toggleDomain,sync,reset,sort};
})();
