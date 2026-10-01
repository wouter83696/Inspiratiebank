/* Public site defaults, shared by the visitor page and authenticated management. */
(function(){
  const fallbackRegion = {label:'Nijmegen', lat:51.8240, lon:5.8040, radiusKm:10};
  const radii = [3,5,10,15,25,50];
  function imageUrl(value){
    const text = typeof value === 'string' ? value.trim() : '';
    if(!text || text.length > 1800000) return '';
    if(/^data:image\/(?:jpeg|png|webp);base64,[a-z\d+/=]+$/i.test(text)) return text;
    try{
      const url = new URL(text);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    }catch{return '';}
  }
  const defaultText = {inspirationTitle:'Ontdek iets nieuws',inspirationSubtitle:'Vind én deel inspiratie',agendaTitle:'UIT-agenda',agendaSubtitle:'Bekijk wat er te doen is'};
  const cleanText=(value,fallback,max=160)=>typeof value==='string'?value.trim().slice(0,max):fallback;
  const placeKey=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('nl');
  function header(value={},fallback=defaultText){
    return {headerImage:imageUrl(value.headerImage),headerPosition:Number.isFinite(value.headerPosition)?Math.max(0,Math.min(100,value.headerPosition)):30,
      ...Object.fromEntries(Object.keys(defaultText).map(key=>[key,cleanText(value[key],fallback[key],key.endsWith('Title')?100:200)]))};
  }
  function normalize(value={}){
    value = value && typeof value === 'object' ? value : {};
    const region = value.region || {};
    const valid = typeof region.lat === 'number' && typeof region.lon === 'number'
      && Number.isFinite(region.lat) && Number.isFinite(region.lon)
      && Math.abs(region.lat) <= 90 && Math.abs(region.lon) <= 180
      && typeof region.label === 'string' && region.label.trim();
    return {
      ...header(value),
      regionalHeaders:Array.isArray(value.regionalHeaders)?value.regionalHeaders.filter(x=>x&&typeof x==='object'&&typeof x.id==='string'&&x.id&&typeof x.label==='string'&&x.label.trim()).slice(0,30).map(x=>({id:x.id.slice(0,80),label:x.label.trim().slice(0,120),places:[...new Set((Array.isArray(x.places)?x.places:[]).filter(p=>typeof p==='string').map(placeKey).filter(Boolean))].slice(0,50),...header(x,header(value))})):[],
      agendaRadiusKm:radii.includes(value.agendaRadiusKm) ? value.agendaRadiusKm : 25,
      headerPosition:Number.isFinite(value.headerPosition) ? Math.max(0,Math.min(100,value.headerPosition)) : 30,
      region:valid ? {label:region.label.trim().slice(0,120),lat:region.lat,lon:region.lon,radiusKm:radii.includes(region.radiusKm) ? region.radiusKm : 10} : {...fallbackRegion}
    };
  }
  function forLocation(value,location){
    const settings=normalize(value),key=placeKey(location?.place||location?.label||settings.region.label);
    return settings.regionalHeaders.find(x=>x.places.includes(key))||settings;
  }
  function applyHeader(value, root=document, location){
    const settings=forLocation(value,location);
    root.querySelectorAll('.tabHero').forEach(hero=>{
      if(hero.classList.contains('siteHeaderPreview'))return;
      if(settings.headerImage){
        hero.style.setProperty('--hero-bg-image',`url(${JSON.stringify(settings.headerImage)})`);
        hero.style.setProperty('background-position',`center ${settings.headerPosition}%`,'important');
      }else{hero.style.removeProperty('--hero-bg-image');hero.style.removeProperty('background-position');}
      const agenda=hero.classList.contains('agendaHero'),title=hero.querySelector('.tabHeroTitle'),subtitle=hero.querySelector('.tabHeroLine');
      if(title)title.textContent=title.dataset.headerTitle || settings[agenda?'agendaTitle':'inspirationTitle'];
      if(subtitle)subtitle.textContent=subtitle.dataset.headerSubtitle || settings[agenda?'agendaSubtitle':'inspirationSubtitle'];
    });
  }
  async function resolveRegion(value){
    const query = String(value || '').trim();
    if(query.length < 2) throw new Error('Vul een plaats of volledige postcode in.');
    const postcode = /^\d{4}\s?[a-z]{2}$/i.test(query);
    const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(query)}&fq=type:${postcode ? 'postcode' : 'woonplaats'}&rows=1`;
    const response = await fetch(url, {headers:{Accept:'application/json'}});
    if(!response.ok) throw new Error('De locatie kon niet worden opgezocht. Probeer het opnieuw.');
    const doc = (await response.json())?.response?.docs?.[0];
    const point = String(doc?.centroide_ll || '').match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/i);
    if(!point) throw new Error('Geen locatie gevonden. Controleer de plaats of postcode.');
    return {label:doc.woonplaatsnaam || doc.weergavenaam || query,lat:Number(point[2]),lon:Number(point[1])};
  }
  window.SiteSettings = Object.freeze({normalize, imageUrl, applyHeader, resolveRegion, radii, defaultText, forLocation, placeKey});
})();
