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
  const id = s.dataset.widgetId; if(!id) return;

  // derive base from the loader's own src URL (works on file:// too)
  const srcUrl = s.getAttribute('src');
  const selfOrigin = srcUrl ? new URL(srcUrl, document.baseURI).origin : (location.origin || '');
  const base = s.dataset.apiBase || selfOrigin;

  const r = await fetch(`${base}/api/widget/${encodeURIComponent(id)}`, { cache:'no-store' });
  if(!r.ok){
    try { console.error('[widget loader] fetch failed', r.status, await r.text()); } catch {}
    return;
  }
  const { type, config } = await r.json();

  // host & shadow root
  const host = document.createElement('div');
  const root = host.attachShadow ? host.attachShadow({mode:'open'}) : host;
  addStyle(root, config?.style);

  // 🔽 DISPATCH by type
  const t = type || config?.type || 'button';
  if (t === 'composite') {
    const cfg = { ...config, _slug: id }; // pass slug for session key
    renderCompositeInline(root, cfg);
  } else if (t === 'banner') {
    // show a floating banner immediately
    renderBannerOverlay(config.banner || config || {});
  } else {
    // default inline button
    render(root, 'button', config || {});
  }

  s.parentNode.insertBefore(host, s.nextSibling);

  if(config?.analytics?.url){
    try{ navigator.sendBeacon?.(config.analytics.url, JSON.stringify({ e:'impression', id })) }catch{}
  }
}

// helpers for CSS units
function toUnit(v, fallback = 'px'){ return (v==null||v==='auto') ? 'auto' : (typeof v==='number'? `${v}${fallback}` : v); }

// create a global shadow portal once
function getPortal(){
  const id='yx-widget-portal';
  let host=document.getElementById(id);
  if(!host){
    host=document.createElement('div');
    host.id=id;
    host.style.position='fixed';
    host.style.top='0'; host.style.left='0';
    host.style.width='100%'; host.style.height='100%';
    host.style.pointerEvents='none';  // let content decide
    host.style.zIndex='2147483647';   // max
    document.body.appendChild(host);
    host._shadow = host.attachShadow ? host.attachShadow({mode:'open'}) : host;
  }
  return host._shadow || host; // shadow root
}

// minimal animations
function applyAnimation(el, name){
  if(name==='fade'){ el.animate([{opacity:0},{opacity:1}],{duration:160, easing:'ease-out'}); }
  if(name==='zoom'){ el.animate([{transform:'scale(.95)', opacity:0},{transform:'scale(1)',opacity:1}],{duration:160, easing:'ease-out'}); }
  if(name==='slide-up'){ el.animate([{transform:'translateY(12px)', opacity:0},{transform:'translateY(0)',opacity:1}],{duration:180, easing:'ease-out'}); }
}

function renderBannerOverlay(cfg){
  const portal = getPortal();

  // backplate root that can hold backdrop + panel
  const wrap = document.createElement('div');
  wrap.style.position='fixed';
  wrap.style.inset='0';
  wrap.style.pointerEvents='auto';

  // backdrop (optional)
  let backdrop=null;
  if(cfg.backdrop || cfg.kind==='modal'){
    backdrop=document.createElement('div');
    backdrop.style.position='absolute';
    backdrop.style.inset='0';
    backdrop.style.background='rgba(0,0,0,.45)';
    backdrop.style.backdropFilter='blur(2px)';
    wrap.appendChild(backdrop);
  }

  // panel container
  const panel=document.createElement('div');
  const W=toUnit(cfg.size?.w,'px');
  const H=toUnit(cfg.size?.h,'px');
  panel.style.position='absolute';
  panel.style.width= W==='auto' ? 'auto' : W;
  if(H!=='auto') panel.style.height=H;
  panel.style.maxWidth = cfg.size?.maxW || 'min(92vw, 560px)';
  panel.style.background = cfg.colors?.bg || '#111';
  panel.style.color = cfg.colors?.fg || '#fff';
  panel.style.borderRadius = (cfg.radius ?? 12) + 'px';
  panel.style.boxShadow = cfg.shadow===false ? 'none' : '0 10px 30px rgba(0,0,0,.25)';
  panel.style.padding = (cfg.padding ?? 16) + 'px';

  // position
  const pos = (cfg.position || (cfg.kind==='modal'?'center':'bottom-right'));
  const edge = 20;
  if(pos==='center'){
    panel.style.top='50%'; panel.style.left='50%';
    panel.style.transform='translate(-50%, -50%)';
  } else {
    if(pos.includes('bottom')) panel.style.bottom=edge+'px';
    if(pos.includes('top')) panel.style.top=edge+'px';
    if(pos.includes('right')) panel.style.right=edge+'px';
    if(pos.includes('left')) panel.style.left=edge+'px';
  }

  // close btn
  const close=document.createElement('button');
  close.setAttribute('aria-label','Close');
  close.textContent='×';
  close.style.position='absolute';
  close.style.right='8px'; close.style.top='4px';
  close.style.border='0'; close.style.background='transparent';
  close.style.color='currentColor'; close.style.fontSize='20px'; close.style.cursor='pointer';
  panel.appendChild(close);

  // CONTENT by template
  const inner=document.createElement('div');
  inner.style.display='grid';
  inner.style.gap='12px';
  // simple templates
  if(cfg.template==='image-left' && cfg.imageUrl){
    inner.style.gridTemplateColumns='96px 1fr';
    const img=document.createElement('img');
    img.src=cfg.imageUrl; img.alt=''; img.style.width='96px'; img.style.height='96px'; img.style.objectFit='cover'; img.style.borderRadius='8px';
    inner.appendChild(img);
  }
  // content HTML
  const content=document.createElement('div');
  content.innerHTML = cfg.contentHtml || '<b>Banner</b>';
  inner.appendChild(content);

  // CTA
  if(cfg.cta?.text && cfg.cta?.url){
    const a=document.createElement('a');
    a.textContent = cfg.cta.text;
    a.href = cfg.cta.url; a.target='_blank'; a.rel='noopener';
    a.style.display='inline-block';
    a.style.padding='10px 14px';
    a.style.borderRadius='10px';
    a.style.background='rgba(255,255,255,.12)';
    a.style.color='currentColor';
    a.style.textDecoration='none';
    a.style.fontWeight='600';
    inner.appendChild(a);
  }

  panel.appendChild(inner);
  wrap.appendChild(panel);
  portal.appendChild(wrap);

  // interactions
  function closeAll(){
    wrap.remove();
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e){ if(e.key==='Escape') closeAll(); }

  close.addEventListener('click', closeAll);
  if(backdrop){ backdrop.addEventListener('click', closeAll); }
  document.addEventListener('keydown', onKey);

  applyAnimation(panel, cfg.animation || (pos==='center' ? 'zoom' : 'slide-up'));
}

function renderCompositeInline(root, cfg){
  // trigger button
  const t = cfg.trigger || {};
  const btn = document.createElement('button');
  btn.textContent = t.text || 'Open';
  const W = toUnit(t.size?.w,'px'), H = toUnit(t.size?.h,'px');
  btn.style.cssText = `
    background:${t.colors?.bg||'#111'};
    color:${t.colors?.fg||'#fff'};
    width:${W==='auto'?'auto':W};
    height:${H==='auto'?'auto':H};
    border:0;border-radius:${(t.radius??10)}px;cursor:pointer;
    font-weight:${t.weight??600}; padding:0 16px;
  `;
  btn.addEventListener('click', ()=>{
    // frequency rules
    const key = `yx_seen_${cfg._slug}`;
    if(cfg.rules?.showOncePerSession && sessionStorage.getItem(key)) return;
    renderBannerOverlay(cfg.banner || {});
    sessionStorage.setItem(key,'1');
  });
  root.appendChild(btn);

  // auto-open
  if(cfg.rules?.autoOpen){
    const wait = Math.max(0, cfg.rules?.delayMs||0);
    setTimeout(()=>btn.click(), wait);
  }
}

ready(()=>document.querySelectorAll('script[src*="loader.v1.js"][data-widget-id]').forEach(mount));})();

