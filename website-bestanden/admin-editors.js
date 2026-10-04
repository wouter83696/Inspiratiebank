/* Shared side-panel behaviour for adding and editing inspiration and agenda items. */
(function(){
  const $=id=>document.getElementById(id);
  const idea=$('adminIdeaEditPanel'), agenda=$('agendaEditModal');
  const layer=document.createElement('div');
  layer.className='adminEditorLayer';layer.hidden=true;
  layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-labelledby','adminEditorTitle');
  document.body.append(layer);layer.append(idea);
  idea.classList.add('adminEditorCard');agenda.classList.add('adminEditorLayer');
  agenda.querySelector('.confirmModalCard').classList.add('adminEditorCard');
  const title=idea.querySelector('h3');title.id='adminEditorTitle';
  function closeButton(parent,action){const button=document.createElement('button');button.type='button';button.className='adminEditorClose';button.textContent='×';button.setAttribute('aria-label','Formulier sluiten');button.addEventListener('click',action);parent.append(button);}
  closeButton(idea.querySelector('.panelHead'),()=>$('adminIdeaEditCancelBtn').click());
  closeButton(agenda.querySelector('.confirmModalTop'),()=>requestAgendaClose());
  layer.addEventListener('click',e=>{if(e.target===layer)$('adminIdeaEditCancelBtn').click();});
  let ideaFocus=null,agendaFocus=null,agendaDraft='',closing=false;
  const snapshot=()=>JSON.stringify([...$('agendaEditForm').elements].filter(e=>e.tagName!=='BUTTON').map(e=>[e.id,e.type==='checkbox'?e.checked:e.value]));
  function sync(){
    layer.hidden=idea.hidden;
    const open=!idea.hidden||!agenda.hidden;
    document.body.classList.toggle('adminEditorOpen',open);
    $('adminApp').inert=open;
    if(idea.hidden&&ideaFocus){if(ideaFocus.isConnected)ideaFocus.focus({preventScroll:true});ideaFocus=null;}
    if(agenda.hidden&&agendaFocus){if(agendaFocus.isConnected)agendaFocus.focus({preventScroll:true});agendaFocus=null;}
  }
  async function requestAgendaClose(){
    if(closing)return;closing=true;
    try{
      if(snapshot()!==agendaDraft&&!await confirmDialog('Je hebt wijzigingen die nog niet zijn opgeslagen. Wil je deze weggooien?',{title:'Wijzigingen bewaren?',confirmText:'Wijzigingen weggooien',cancelText:'Verder bewerken'}))return;
      closeAgendaEdit();
    }finally{closing=false;}
  }
  window.addEventListener('beforeunload',event=>{if(!agenda.hidden&&snapshot()!==agendaDraft){event.preventDefault();event.returnValue='';}});
  new MutationObserver(sync).observe(idea,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(sync).observe(agenda,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('keydown',e=>{
    if(e.key!=='Tab'||!$('confirmModal').hidden)return;
    const panel=!layer.hidden?layer:!agenda.hidden?agenda:null;if(!panel)return;
    const fields=[...panel.querySelectorAll('button,input,textarea,select,a[href],[tabindex="0"]')].filter(x=>!x.disabled&&x.getClientRects().length);
    const first=fields[0],last=fields.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  },true);
  window.AdminEditors={
    openIdea(isNew){ideaFocus=document.activeElement;title.textContent=isNew?'Activiteit toevoegen':'Activiteit wijzigen';sync();idea.scrollTop=0;},
    openAgenda(){agendaFocus=document.activeElement;agendaDraft=snapshot();sync();agenda.querySelector('.adminEditorCard').scrollTop=0;},
    requestAgendaClose
  };
})();
