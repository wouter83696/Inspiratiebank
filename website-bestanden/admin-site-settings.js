(function(){
  let draft = SiteSettings.normalize();
  let regionInputValue = '';
  let uploadPending = false;
  let generation = 0;
  const $ = id => document.getElementById(id);
  const status = (message, warn=false) => {
    $('siteSettingsStatus').textContent = message;
    $('siteSettingsStatus').classList.toggle('warn',warn);
  };
  function current(){return SiteSettings.normalize(centralStorage?.siteSettings);}
  function preview(){
    const image = $('siteHeaderPreview');
    image.src = draft.headerImage || '../website-bestanden/hero-achtergronden/inspiratiebank-header.png';
    image.style.objectPosition = `center ${draft.headerPosition}%`;
    $('siteHeaderPositionValue').textContent = `${draft.headerPosition}%`;
    $('siteHeaderUrl').value = draft.headerImage.startsWith('data:') ? '' : draft.headerImage;
    $('siteHeaderFileLabel').textContent = draft.headerImage.startsWith('data:') ? 'Eigen afbeelding geselecteerd' : draft.headerImage ? 'Afbeelding via webadres' : 'Standaardafbeelding';
    $('siteRegionPreview').textContent = `Standaard: ${draft.region.label} · ${draft.region.radiusKm === 50 ? '50+ km' : draft.region.radiusKm+' km'}`;
  }
  function load(){
    generation++;
    draft = current();
    regionInputValue = draft.region.label;
    $('siteRegionInput').value = regionInputValue;
    $('siteRegionRadius').value = String(draft.region.radiusKm);
    $('siteHeaderPosition').value = String(draft.headerPosition);
    $('siteHeaderFile').value = '';
    $('siteHeaderUrl').setCustomValidity('');
    preview(); status('');
    SiteSettings.applyHeader(draft);
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
      const data = canvas.toDataURL('image/webp',.84);
      if(!SiteSettings.imageUrl(data)) throw new Error('Deze afbeelding is te groot. Kies een kleinere afbeelding.');
      if(token !== generation) return;
      draft.headerImage = data; preview(); status('Voorbeeld bijgewerkt. Sla op om de header voor bezoekers te wijzigen.');
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
      if(draft.headerImage){
        const check = new Image();
        check.src = draft.headerImage;
        try{await check.decode();}catch{throw new Error('De headerafbeelding kan niet worden geladen. Kies een ander bestand of webadres.');}
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
      load(); status('Opgeslagen. De header en standaardregio gelden nu voor bezoekers.');
    }catch(error){status(error.message,true);}
    finally{button.disabled=false;}
  }
  function setup(){
    $('siteSettingsForm').addEventListener('submit',save);
    $('siteSettingsCancel').addEventListener('click',load);
    $('siteHeaderFile').addEventListener('change',event=>upload(event.target.files[0]));
    $('siteHeaderUrl').addEventListener('change',event=>{
      const raw=event.target.value.trim(),url=SiteSettings.imageUrl(raw);
      if(raw && !url){status('Gebruik een geldig HTTPS-webadres voor de afbeelding.',true);event.target.setCustomValidity('Gebruik een HTTPS-webadres.');return;}
      event.target.setCustomValidity(''); generation++;draft.headerImage=url;preview();status('Voorbeeld bijgewerkt. Sla op om de wijziging te publiceren.');
    });
    $('siteHeaderUrl').addEventListener('input',event=>event.target.setCustomValidity(''));
    $('siteHeaderReset').addEventListener('click',()=>{generation++;draft.headerImage='';draft.headerPosition=30;$('siteHeaderUrl').setCustomValidity('');$('siteHeaderPosition').value='30';preview();status('Standaardheader gekozen. Sla op om deze te gebruiken.');});
    $('siteHeaderPosition').addEventListener('input',event=>{draft.headerPosition=Number(event.target.value);preview();});
    $('siteRegionRadius').addEventListener('change',event=>{draft.region.radiusKm=Number(event.target.value);preview();});
    $('siteHeaderPreview').addEventListener('error',()=>status('De afbeelding kan niet worden geladen. Controleer het webadres of kies een bestand.',true));
  }
  window.AdminSiteSettings = {setup,load,current};
})();
