// Register the offline shell without coupling browser lifecycle to the UI controllers.

export function registerServiceWorker(){
  if(!('serviceWorker' in navigator))return;
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'})
    .catch(e=>console.info('Offline-Installation nicht verfügbar:',e.message)));
}
