/* Offer installation through the browser's own install prompt. */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
window.addEventListener('beforeinstallprompt', event => {
  const button=document.querySelector('[data-install-app],#pwaInstallBtn');
  if (!button) return;
  event.preventDefault();button.hidden=false;
  button.onclick=async()=>{await event.prompt();await event.userChoice;button.hidden=true;};
});
