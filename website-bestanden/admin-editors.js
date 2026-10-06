/* Shared side-panel behaviour for adding and editing inspiration and agenda items. */
(function(){
  const $=id=>document.getElementById(id);
  const idea=$('adminIdeaEditPanel'), agenda=$('agendaEditModal');
  const layer=AdminVisual.layer;layer.append(idea);
  idea.classList.add('adminEditorCard','adminPublicSurface','ideaSubmitSheet');agenda.classList.add('adminEditorLayer');
  agenda.querySelector('.confirmModalCard').classList.add('adminEditorCard');
  const title=idea.querySelector('h3');title.id='adminEditorTitle';
  function closeButton(parent,action){const button=document.createElement('button');button.type='button';button.className='adminEditorClose';button.textContent='×';button.setAttribute('aria-label','Formulier sluiten');button.addEventListener('click',action);parent.append(button);}
  closeButton(idea.querySelector('.panelHead'),()=>$('adminIdeaEditCancelBtn').click());
  closeButton(agenda.querySelector('.confirmModalTop'),()=>requestAgendaClose());
  layer.addEventListener('click',e=>{if(e.target===layer){if(!idea.hidden)$('adminIdeaEditCancelBtn').click();else AdminVisual.close();}});
  let ideaFocus=null,agendaFocus=null,agendaDraft='',closing=false;
  const snapshot=()=>JSON.stringify([...$('agendaEditForm').elements].filter(e=>e.tagName!=='BUTTON').map(e=>[e.id,e.type==='checkbox'?e.checked:e.value]));
  function sync(){
    const detail=Boolean(selectedAdminIdeaKey);
    layer.hidden=idea.hidden&&!detail;
    AdminVisual.preview.hidden=!idea.hidden;
    const modal=!idea.hidden||!agenda.hidden||(!layer.hidden&&matchMedia('(max-width:1100px)').matches);
    const open=modal;
    layer.setAttribute('role',modal?'dialog':'region');
    layer.setAttribute('aria-label',!idea.hidden?'Activiteit bewerken':'Activiteitsdetails');
    if(modal)layer.setAttribute('aria-modal','true');else layer.removeAttribute('aria-modal');
    layer.classList.toggle('isEditing',!idea.hidden);
    layer.classList.toggle('isModal',modal);
    document.body.classList.toggle('adminDetailDocked',!layer.hidden&&!modal);
    document.body.classList.toggle('adminEditorOpen',open);
    $('adminApp').inert=open;
    if(idea.hidden&&ideaFocus){if(detail){AdminVisual.refresh();AdminVisual.preview.querySelector('.adminEditorClose').focus({preventScroll:true});}else if(ideaFocus.isConnected)ideaFocus.focus({preventScroll:true});ideaFocus=null;}
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
    const panel=!layer.hidden&&layer.classList.contains('isModal')?layer:!agenda.hidden?agenda:null;if(!panel)return;
    const fields=[...panel.querySelectorAll('button,input,textarea,select,a[href],[tabindex="0"]')].filter(x=>!x.disabled&&x.getClientRects().length);
    const first=fields[0],last=fields.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  },true);
  window.addEventListener('resize',sync);
  window.AdminEditors={
    openIdea(isNew){ideaFocus=document.activeElement;title.textContent=isNew?'Activiteit toevoegen':'Activiteit wijzigen';sync();idea.scrollTop=0;},
    openAgenda(){agendaFocus=document.activeElement;agendaDraft=snapshot();sync();agenda.querySelector('.adminEditorCard').scrollTop=0;},
    sync,requestAgendaClose
  };
})();
