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
function placePanelRelative(panel, anchorRect, placement, offset=10) {
  // panel is position:fixed, so use viewport coords from getBoundingClientRect()
  const { width: pw, height: ph } = panel.getBoundingClientRect(); // after content is set
  let top = 0, left = 0;

  if (placement === 'top') {
    top = anchorRect.top - ph - offset;
    left = anchorRect.left + (anchorRect.width - pw)/2;
  } else if (placement === 'bottom') {
    top = anchorRect.bottom + offset;
    left = anchorRect.left + (anchorRect.width - pw)/2;
  } else if (placement === 'left') {
    top = anchorRect.top + (anchorRect.height - ph)/2;
    left = anchorRect.left - pw - offset;
  } else { // right
    top = anchorRect.top + (anchorRect.height - ph)/2;
    left = anchorRect.right + offset;
  }

  // keep on-screen (basic clamping)
  top = Math.max(8, Math.min(top, window.innerHeight - ph - 8));
  left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));

  panel.style.top = `${Math.round(top)}px`;
  panel.style.left = `${Math.round(left)}px`;
}

function renderBannerOverlay(cfg, opts={}) {
  const portal = getPortal();
  const wrap = document.createElement('div');
  wrap.style.position='fixed';
  wrap.style.inset='0';
  wrap.style.pointerEvents='auto';

  // panel container (fixed so we can place via viewport coords)
  const panel=document.createElement('div');
  panel.style.position='fixed';
  panel.style.maxWidth = cfg.size?.maxW || 'min(92vw, 560px)';
  if (cfg.size?.w && cfg.size.w !== 'auto') panel.style.width = typeof cfg.size.w==='number'? cfg.size.w+'px' : cfg.size.w;
  if (cfg.size?.h && cfg.size.h !== 'auto') panel.style.height = typeof cfg.size.h==='number'? cfg.size.h+'px' : cfg.size.h;
  panel.style.borderRadius = (cfg.radius ?? 12) + 'px';
  panel.style.boxShadow = cfg.shadow===false ? 'none' : '0 10px 30px rgba(0,0,0,.25)';
  panel.style.padding = (cfg.padding ?? 16) + 'px';
  panel.style.display='grid';
  panel.style.gap='12px';
  panel.style.color = (cfg.text?.color) || '#fff';
  panel.style.overflow='hidden';

  // background: color + image + overlay
  const bgColor = cfg.background?.color || '#111';
  panel.style.backgroundColor = bgColor;
  if (cfg.background?.image) {
    panel.style.backgroundImage = `url("${cfg.background.image}")`;
    panel.style.backgroundSize = cfg.bgFit || 'cover';
    panel.style.backgroundPosition = cfg.bgPosition || 'center';
    panel.style.backgroundRepeat = 'no-repeat';
  }
  if (cfg.bgOverlay) {
    const overlay = document.createElement('div');
    overlay.style.position='absolute'; overlay.style.inset='0';
    overlay.style.background = cfg.bgOverlay;
    // stack context for overlay
    panel.style.position='fixed';
    panel.appendChild(overlay);
  }

  // content wrapper (above overlay)
  const contentWrap = document.createElement('div');
  contentWrap.style.position='relative';
  contentWrap.style.zIndex='1';
  contentWrap.style.display='grid';
  contentWrap.style.gap='10px';
  contentWrap.style.textAlign = (cfg.text?.align || 'left');

  // text html
  const text = document.createElement('div');
  text.innerHTML = (cfg.text?.html) || '';
  contentWrap.appendChild(text);

  // CTA button (absolute positioned inside panel if positional)
  if (cfg.cta?.text && cfg.cta?.url) {
    const cta = document.createElement('a');
    cta.textContent = cfg.cta.text;
    cta.href = cfg.cta.url; cta.target='_blank'; cta.rel='noopener';
    cta.style.display='inline-block';
    cta.style.padding='10px 14px';
    cta.style.borderRadius='10px';
    cta.style.background='rgba(255,255,255,.14)';
    cta.style.color='currentColor';
    cta.style.fontWeight='600';
    if (!cfg.cta.position || cfg.cta.position === 'inline') {
      // keep inline flow
      contentWrap.appendChild(cta);
    } else {
      // position absolutely inside the panel
      cta.style.position='absolute';
      const pad = 14;
      const pos = cfg.cta.position;
      if (pos.includes('bottom')) cta.style.bottom = pad+'px';
      if (pos.includes('top'))    cta.style.top    = pad+'px';
      if (pos.includes('left'))   cta.style.left   = pad+'px';
      if (pos.includes('right'))  cta.style.right  = pad+'px';
      if (pos === 'center') {
        cta.style.top='50%'; cta.style.left='50%';
        cta.style.transform='translate(-50%, -50%)';
      }
      panel.appendChild(cta);
    }
  }

  // close button
  const close=document.createElement('button');
  close.setAttribute('aria-label','Close');
  close.textContent='×';
  close.style.position='absolute';
  close.style.right='8px'; close.style.top='4px';
  close.style.border='0'; close.style.background='transparent';
  close.style.color='currentColor'; close.style.fontSize='20px'; close.style.cursor='pointer';

  // layer order
  panel.appendChild(close);
  panel.appendChild(contentWrap);
  wrap.appendChild(panel);
  portal.appendChild(wrap);

  // interactions
  function closeAll(){ wrap.remove(); window.removeEventListener('resize', onLayout); window.removeEventListener('scroll', onLayout, true); document.removeEventListener('keydown', onKey); }
  function onKey(e){ if(e.key==='Escape') closeAll(); }
  document.addEventListener('keydown', onKey);

  // placement
  const placement = cfg.placement || 'bottom';
  const offset = cfg.offset ?? 10;
  function onLayout(){
    if (opts.anchorRect) {
      panel.style.top='0px'; panel.style.left='0px'; // reset before measuring
      // allow the browser to layout then measure
      requestAnimationFrame(()=>{
        placePanelRelative(panel, opts.anchorRect(), placement, offset);
      });
    }
  }

  // animate + first layout
  applyAnimation(panel, cfg.animation || (placement==='bottom' ? 'slide-up':'fade'));
  onLayout();
  window.addEventListener('resize', onLayout);
  window.addEventListener('scroll', onLayout, true);

  close.addEventListener('click', closeAll);
  return { destroy: closeAll };
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
    const key = `yx_seen_${cfg._slug}`;
    if(cfg.rules?.showOncePerSession && sessionStorage.getItem(key)) return;
  
    const rectNow = () => btn.getBoundingClientRect(); // live rect for scroll/resize
    if ((cfg.banner?.mode || 'relative') === 'relative') {
      renderBannerOverlay(cfg.banner || {}, { anchorRect: rectNow });
    } else {
      // fallback to your previous floating placement
      renderBannerOverlay(cfg.banner || {});
    }
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

