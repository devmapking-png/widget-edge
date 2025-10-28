// public/loader.v1.js
(()=>{function ready(f){document.readyState!=='loading'?f():document.addEventListener('DOMContentLoaded',f);}
function addStyle(root, css){ if(!css) return; const s=document.createElement('style'); s.textContent=css; root.appendChild(s); }
function render(root, type, cfg){
  if(type==='banner'){
    const box=document.createElement('div');
    box.style.cssText=`background:${cfg.colors?.bg||'#111'};color:${cfg.colors?.fg||'#fff'};padding:12px;border-radius:10px;text-align:center`;
    box.textContent=cfg.text||'Banner';
    if(cfg.clickUrl){ box.style.cursor='pointer'; box.onclick=()=>window.open(cfg.clickUrl,'_blank','noopener'); }
    root.appendChild(box); return;
  }
  // default: button
  const btn=document.createElement('button');
  btn.textContent=cfg.text||'Click';
  btn.style.cssText=`background:${cfg.colors?.bg||'#111'};color:${cfg.colors?.fg||'#fff'};width:${cfg.size?.w||200}px;height:${cfg.size?.h||48}px;border:0;border-radius:8px;cursor:pointer`;
  btn.onclick=()=>{ if(cfg.clickUrl) window.open(cfg.clickUrl,'_blank','noopener'); };
  root.appendChild(btn);
}
async function mount(s){
  const id=s.dataset.widgetId; if(!id) return;
  const base=s.dataset.apiBase || location.origin; // allow override if needed
  const r=await fetch(`${base}/api/widget/${encodeURIComponent(id)}`, { cache:'no-store' });
  if(!r.ok) return;
  const { type, config } = await r.json();

  const host=document.createElement('div');
  const root=host.attachShadow?host.attachShadow({mode:'open'}):host;
  addStyle(root, config?.style);
  render(root, type, config||{});
  s.parentNode.insertBefore(host, s.nextSibling);

  if(config?.analytics?.url){ try{ navigator.sendBeacon?.(config.analytics.url, JSON.stringify({e:'impression', id})) }catch{} }
}
ready(()=>document.querySelectorAll('script[src*="loader.v1.js"][data-widget-id]').forEach(mount));})();
