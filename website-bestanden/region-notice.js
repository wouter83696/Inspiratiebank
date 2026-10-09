/* A dismissible regional introduction, remembered only in this browser. */
(()=>{
  const notice=document.getElementById('regionNotice');
  if(!notice||location.pathname.startsWith('/beheer'))return;
  const key='inspiratiebank:region-notice:v1';
  try{if(localStorage.getItem(key)==='dismissed')return;}catch{}
  notice.hidden=false;
  notice.querySelector('button').addEventListener('click',()=>{
    notice.hidden=true;
    try{localStorage.setItem(key,'dismissed');}catch{}
  });
})();
