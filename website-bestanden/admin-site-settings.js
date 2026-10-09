(function(){
  let draft = SiteSettings.normalize();
  let regionInputValue = '';
  let uploadPending = false;
  let generation = 0;
  let profileId='';
  const active=()=>draft.regionalHeaders.find(x=>x.id===profileId)||draft;
  const textFields={siteInspirationTitle:'inspirationTitle',siteInspirationSubtitle:'inspirationSubtitle',siteAgendaTitle:'agendaTitle',siteAgendaSubtitle:'agendaSubtitle'};
  function fillHeader(){$('siteHeaderUrl').setCustomValidity('');const h=active();for(const [id,key] of Object.entries(textFields))$(id).value=h[key];$('siteHeaderPosition').value=String(h.headerPosition);$('siteHeaderPlaces').value=(h.places||[]).join(', ');$('siteHeaderPlacesLabel').hidden=!profileId;$('siteHeaderRemoveProfile').hidden=!profileId;$('siteHeaderFile').value='';preview();}
  function profiles(){const select=$('siteHeaderProfile');select.replaceChildren(new Option('Standaardheader',''),...draft.regionalHeaders.map(h=>new Option(h.label,h.id)));select.value=profileId;}
  const $ = id => document.getElementById(id);
  const status = (message, warn=false) => {
    $('siteSettingsStatus').textContent = message;
    $('siteSettingsStatus').classList.toggle('warn',warn);
  };
  function current(){return SiteSettings.normalize(centralStorage?.siteSettings);}
  function preview(){
    const h=active();
    const image = $('siteHeaderPreview');
    const agenda=$('siteHeaderPage').value==='agenda';
    $('siteHeaderPreviewTitle').textContent=h[agenda?'agendaTitle':'inspirationTitle'];
    $('siteHeaderPreviewSubtitle').textContent=h[agenda?'agendaSubtitle':'inspirationSubtitle'];
    image.src = active().headerImage || '../website-bestanden/hero-achtergronden/inspiratiebank-header.95a249c4e684.webp';
    image.style.objectPosition = `center ${active().headerPosition}%`;
    $('siteHeaderPositionValue').textContent = `${active().headerPosition}%`;
    $('siteHeaderUrl').value = active().headerImage.startsWith('data:') ? '' : active().headerImage;
    $('siteHeaderFileLabel').textContent = active().headerImage.startsWith('data:') ? 'Eigen afbeelding geselecteerd' : active().headerImage ? 'Afbeelding via webadres' : 'Standaardafbeelding';
    $('siteRegionPreview').textContent = `Standaard: ${draft.region.label} · ${draft.region.radiusKm === 50 ? '50+ km' : draft.region.radiusKm+' km'}`;
  }
  function load(){
    generation++;
    draft = current();
    if(!draft.regionalHeaders.some(h=>h.id===profileId))profileId='';
    profiles();fillHeader();
    regionInputValue = draft.region.label;
    $('siteRegionInput').value = regionInputValue;
    $('siteRegionRadius').value = String(draft.region.radiusKm);
    $('siteAgendaRadius').value = String(draft.agendaRadiusKm);
    $('sitePhotoTiles').value = draft.tileStyle;
    $('siteFeaturedAutoplay').checked = draft.featuredAutoplay;
    $('siteFeaturedInterval').value = String(draft.featuredIntervalSeconds);
    $('siteHeaderPosition').value = String(active().headerPosition);
    $('siteHeaderFile').value = '';
    $('siteHeaderUrl').setCustomValidity('');
    preview(); status('');
    SiteSettings.applyHeader(draft);
    window.AdminPolish?.captureSettings();
  }
  async function upload(file){
    if(!file) return;
    if(!/^image\/(jpeg|png|webp)$/.test(file.type)){status('Kies een JPG-, PNG- of WebP-afbeelding.',true);return;}
    if(file.size > 15000000){status('Kies een afbeelding kleiner dan 15 MB.',true);return;}
    const token = ++generation;
    uploadPending = true; $('siteSettingsSave').disabled = true;
    status('Afbeelding voorbereiden…');
    let bitmap;
    try{
      bitmap = await createImageBitmap(file);
      const scale = Math.min(1,1920/bitmap.width,1080/bitmap.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1,Math.round(bitmap.width*scale)); canvas.height = Math.max(1,Math.round(bitmap.height*scale));
      canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
      const blob = await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.84));
      const data = blob && window.ImageOptimizer ? await ImageOptimizer.readFile(blob) : canvas.toDataURL('image/webp',.84);
      if(!SiteSettings.imageUrl(data)) throw new Error('Deze afbeelding is te groot. Kies een kleinere afbeelding.');
      if(token !== generation) return;
      active().headerImage = data; preview(); status('Voorbeeld bijgewerkt. Sla op om de header voor bezoekers te wijzigen.');
    }catch(error){if(token === generation) status(error.message || 'De afbeelding kon niet worden gelezen.',true);}
    finally{bitmap?.close();uploadPending=false;$('siteSettingsSave').disabled=false;}
  }
  async function save(event){
    event.preventDefault();
    if(uploadPending) return;
    const button = $('siteSettingsSave'); button.disabled = true;
    status('Instellingen opslaan…');
    try{
      if(!centralStorageActive()) throw new Error('De online opslag is niet bereikbaar. Je wijzigingen zijn nog niet opgeslagen. Probeer het opnieuw.');
      for(const h of [draft,...draft.regionalHeaders]){
        if(!h.headerImage)continue;
        const check = new Image();
        check.src = h.headerImage;
        try{await check.decode();}catch{throw new Error('De headerafbeelding kan niet worden geladen. Kies een ander bestand of webadres.');}
      }
      if(!draft.inspirationTitle.trim()||!draft.agendaTitle.trim())throw new Error('Vul beide titels in voor de standaardheader.');
      const places=new Set();
      for(const h of draft.regionalHeaders){
        if(!h.places.length)throw new Error(`Vul de plaatsen in voor ${h.label}.`);
        for(const place of h.places){if(places.has(place))throw new Error(`De plaats ${place} staat bij meer dan één header.`);places.add(place);}
        if(!h.inspirationTitle.trim()||!h.agendaTitle.trim())throw new Error(`Vul beide titels in voor ${h.label}.`);
      }
      const input = $('siteRegionInput').value.trim();
      const region = input !== regionInputValue ? await SiteSettings.resolveRegion(input) : draft.region;
      const next = SiteSettings.normalize({...draft,region:{...region,radiusKm:Number($('siteRegionRadius').value)}});
      // Refresh first so saving settings does not replace changes made elsewhere.
      if(!await loadCentralStorage()) throw new Error('De actuele instellingen konden niet worden geladen. Probeer het opnieuw.');
      const previous = centralStorage.siteSettings;
      centralStorage.siteSettings = next;
      if(!await saveCentralStorage()){
        centralStorage.siteSettings = previous;
        throw new Error(storageErrorMessage('Opslaan is niet gelukt. Probeer het opnieuw.'));
      }
      load(); status('Opgeslagen. De instellingen gelden nu voor bezoekers.');
    }catch(error){status(error.message,true);}
    finally{button.disabled=false;}
  }
  function setup(){
    $('siteSettingsForm').addEventListener('submit',save);
    $('sitePhotoTiles').addEventListener('change',e=>{draft.tileStyle=e.target.value;draft.photoTiles=e.target.value!=='classic';});
    $('siteFeaturedAutoplay').addEventListener('change',e=>{draft.featuredAutoplay=e.target.checked;});
    $('siteFeaturedInterval').addEventListener('change',e=>{draft.featuredIntervalSeconds=Number(e.target.value);});
    for(const [id,key] of Object.entries(textFields))$(id).addEventListener('input',e=>{active()[key]=e.target.value;preview();});
    $('siteHeaderPage').addEventListener('change',preview);
    $('siteHeaderProfile').addEventListener('change',e=>{generation++;profileId=e.target.value;fillHeader();status('');});
    $('siteHeaderPlaces').addEventListener('input',e=>{active().places=[...new Set(e.target.value.split(',').map(SiteSettings.placeKey).filter(Boolean))];});
    $('siteHeaderAddProfile').addEventListener('click',()=>{
      const label=$('siteHeaderNewName').value.trim();if(!label){status('Vul eerst een stad of gebied in.',true);return;}
      if(draft.regionalHeaders.length>=30){status('Er kunnen maximaal 30 regionale headers worden opgeslagen.',true);return;}
      generation++;profileId=crypto.randomUUID();
      const {regionalHeaders,region,agendaRadiusKm,...base}=draft;
      draft.regionalHeaders.push({...base,id:profileId,label,places:[SiteSettings.placeKey(label)]});
      profiles();fillHeader();$('siteHeaderNewName').value='';status('Kies een afbeelding en pas de teksten aan. Sla daarna de instellingen op.');
    });
    $('siteHeaderRemoveProfile').addEventListener('click',()=>{generation++;draft.regionalHeaders=draft.regionalHeaders.filter(h=>h.id!==profileId);profileId='';profiles();fillHeader();status('Regionale header verwijderd uit het voorbeeld. Sla op om dit te publiceren.');});
    $('siteSettingsCancel').addEventListener('click',load);
    $('siteHeaderFile').addEventListener('change',event=>upload(event.target.files[0]));
    $('siteHeaderUrl').addEventListener('change',event=>{
      const raw=event.target.value.trim(),url=SiteSettings.imageUrl(raw);
      if(raw && !url){status('Gebruik een geldig HTTPS-webadres voor de afbeelding.',true);event.target.setCustomValidity('Gebruik een HTTPS-webadres.');return;}
      event.target.setCustomValidity(''); generation++;active().headerImage=url;preview();status('Voorbeeld bijgewerkt. Sla op om de wijziging te publiceren.');
    });
    $('siteHeaderUrl').addEventListener('input',event=>event.target.setCustomValidity(''));
    $('siteHeaderReset').addEventListener('click',()=>{generation++;active().headerImage='';active().headerPosition=30;$('siteHeaderUrl').setCustomValidity('');$('siteHeaderPosition').value='30';preview();status('Standaardheader gekozen. Sla op om deze te gebruiken.');});
    $('siteHeaderPosition').addEventListener('input',event=>{active().headerPosition=Number(event.target.value);preview();});
    $('siteRegionRadius').addEventListener('change',event=>{draft.region.radiusKm=Number(event.target.value);preview();});
    $('siteAgendaRadius').addEventListener('change',event=>{draft.agendaRadiusKm=Number(event.target.value);preview();});
    $('siteHeaderPreview').addEventListener('error',()=>status('De afbeelding kan niet worden geladen. Controleer het webadres of kies een bestand.',true));
  }
  function hasUnsaved(){return uploadPending || JSON.stringify(draft)!==JSON.stringify(current()) || $('siteRegionInput').value.trim()!==draft.region.label || $('siteHeaderUrl').validity.customError;}
  window.AdminSiteSettings = {setup,load,current,hasUnsaved};
})();
