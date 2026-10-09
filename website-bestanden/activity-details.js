/* Shared, factual activity information and public links. No inferred review dates. */
(function(root){
  const text=value=>typeof value==='string'||typeof value==='number'?String(value).trim():'';
  const esc=value=>text(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=value=>text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const slug=value=>normalize(value).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  function identity(item,kind='inspiration'){
    // Generated base/index IDs are not durable when the source list is reordered.
    const id=text(item.publicId||item.id);
    const stable=id&&!/^(base-\d+|auto-)/.test(id)?`id:${id}`:kind==='agenda'
      ?[item.title,item.date||item.dateLabel,item.where||item.place,item.url||item.sourceUrl].map(normalize).join('|')
      :[item.title,item.domain].map(normalize).join('|');
    let hash=2166136261;for(const c of stable){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}
    return `${kind==='agenda'?'a':'i'}-${(hash>>>0).toString(36)}`;
  }
  function activityPath(item,kind='inspiration'){
    const params=new URLSearchParams({activiteit:`${slug(item.title)||'activiteit'}--${identity(item,kind)}`});
    return `/${kind==='agenda'?'uit-agenda/':''}?${params}`;
  }
  function route(search){
    const params=new URLSearchParams(search);const value=params.get('activiteit')||'';
    return {activity:/--([ia]-[a-z0-9]+)$/.exec(value)?.[1]||'',invalidActivity:!!value&&!/--([ia]-[a-z0-9]+)$/.test(value),place:params.get('plaats')||''};
  }
  function placePath(place,kind='inspiration'){return `/${kind==='agenda'?'uit-agenda/':''}?${new URLSearchParams({plaats:slug(place)})}`;}
  function date(value){
    if(!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(text(value)))return '';
    const d=new Date(value);if(!Number.isFinite(d.getTime())||d.getTime()>Date.now())return '';
    return d.toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Amsterdam'});
  }
  function facts(item){
    return [['Duur',item.duration],['Groepsgrootte',item.group],['Prijsindicatie',item.cost],['Openingstijden',item.openingHours],['Leeftijd',item.ageRange],['Toegankelijkheid',item.accessibility]]
      .filter(([,value])=>text(value)&&!/^all$/i.test(text(value)));
  }
  function practical(item){
    const rows=facts(item).map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('');
    const note=text(item.note||item.notes);return `${rows?`<dl class="activityFacts">${rows}</dl>`:''}${note?`<p>${esc(note)}</p>`:''}`;
  }
  function verification(item){
    const checked=date(item.informationCheckedAt),address=date(item.addressCheckedAt);
    return `<div class="activityVerification">${checked?`<p>Activiteitinformatie gecontroleerd op ${esc(checked)}.</p>`:address?`<p>Adres gecontroleerd op ${esc(address)}.</p>`:'<p>Nog geen inhoudelijke controledatum beschikbaar.</p>'}${item.url?'<p>Controleer actuele prijzen en openingstijden bij de aanbieder.</p>':''}</div>`;
  }
  let places=[];
  function configurePlaces(names){places=names.map(name=>({name,slug:slug(name)}));}
  function itemPlace(item){
    if(/^(thuis|online)$/i.test(text(item.locationType)))return null;
    const haystack=` ${normalize([item.place,item.location,item.address,item.where].filter(Boolean).join(' ')).replace(/[^a-z0-9 ]/g,' ')} `;
    return [...places].sort((a,b)=>b.name.length-a.name.length).find(p=>haystack.includes(` ${normalize(p.name)} `))||null;
  }
  function links(item,kind){
    const path=activityPath(item,kind),place=itemPlace(item);
    return `<div class="activityPublicLinks"><span class="activityShare"><a class="activityShareIcon" href="${esc(path)}" data-copy-activity-link aria-label="Link naar activiteit kopiëren" title="Link kopiëren"><svg class="activityLinkSymbol" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7 .54l3-3a5 5 0 0 0-7.07-7.07L11.21 5.17"/><path d="M14 11a5 5 0 0 0-7-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.7"/></svg><svg class="activityCopiedSymbol" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></a><span role="status" class="activityLinkStatus"></span></span>${place?`<a href="${esc(placePath(place.name,kind))}">Meer in en rond ${esc(place.name)}</a>`:''}</div>`;
  }
  function mountShare(header,body){
    header.querySelector('.activityShare')?.remove();
    const share=body.querySelector('.activityShare');if(!share)return;
    const container=share.parentElement;
    header.insertBefore(share,header.querySelector('button'));
    if(!container.children.length)container.remove();
  }
  const api={mountShare,identity,activityPath,placePath,route,slug,date,facts,practical,verification,links,configurePlaces,itemPlace};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.ActivityDetails=api;
    document.addEventListener('click',async event=>{
      const link=event.target.closest('[data-copy-activity-link]');if(!link||event.button>0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();const status=link.parentElement.querySelector('[role="status"]');
      try{await navigator.clipboard.writeText(link.href);status.classList.remove('hasFallback');status.textContent='Link gekopieerd';link.classList.add('isCopied');link.title='Link gekopieerd';clearTimeout(link._copyTimer);link._copyTimer=setTimeout(()=>{link.classList.remove('isCopied');link.title='Link kopiëren';status.textContent='';},2200);}
      catch{status.classList.add('hasFallback');status.replaceChildren();const fallback=document.createElement('a');fallback.href=link.href;fallback.textContent='Open de activiteitlink';status.append(fallback);}
    });
  }
})(typeof window==='object'?window:globalThis);
