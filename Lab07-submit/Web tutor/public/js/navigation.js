'use strict';
Lab.on('hamburgerBtn','click',()=>{
  const menu=Lab.id('mobileNavDropdown');
  if(menu) Lab.id('hamburgerBtn').setAttribute('aria-expanded', String(menu.classList.toggle('open')));
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape' && Lab.id('mobileNavDropdown')?.classList.contains('open')){
    Lab.id('mobileNavDropdown').classList.remove('open');Lab.id('hamburgerBtn')?.focus();
  }
});
async function logout() {
  await Lab.request('logout','POST',{});location.assign('/index.html');
}
Lab.commands({quayLai:logout,backToLogin:logout});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});

