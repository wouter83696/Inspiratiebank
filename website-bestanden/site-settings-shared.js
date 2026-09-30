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
  function normalize(value={}){
    value = value && typeof value === 'object' ? value : {};
    const region = value.region || {};
    const valid = typeof region.lat === 'number' && typeof region.lon === 'number'
      && Number.isFinite(region.lat) && Number.isFinite(region.lon)
      && Math.abs(region.lat) <= 90 && Math.abs(region.lon) <= 180
      && typeof region.label === 'string' && region.label.trim();
    return {
      headerImage:imageUrl(value.headerImage),
      agendaRadiusKm:radii.includes(value.agendaRadiusKm) ? value.agendaRadiusKm : 25,
      headerPosition:Number.isFinite(value.headerPosition) ? Math.max(0,Math.min(100,value.headerPosition)) : 30,
      region:valid ? {label:region.label.trim().slice(0,120),lat:region.lat,lon:region.lon,radiusKm:radii.includes(region.radiusKm) ? region.radiusKm : 10} : {...fallbackRegion}
    };
  }
  function applyHeader(value, root=document){
    const settings = normalize(value);
    root.querySelectorAll('.tabHero').forEach(hero => {
      if(settings.headerImage){
        hero.style.setProperty('--hero-bg-image', `url(${JSON.stringify(settings.headerImage)})`);
        hero.style.setProperty('background-position', `center ${settings.headerPosition}%`, 'important');
      }else{
        hero.style.removeProperty('--hero-bg-image');
        hero.style.removeProperty('background-position');
      }
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
  window.SiteSettings = Object.freeze({normalize, imageUrl, applyHeader, resolveRegion, radii});
})();
