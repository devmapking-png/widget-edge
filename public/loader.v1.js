// public/loader.v1.js
(() => {

  // -------------------------------
  // tiny utils
  // -------------------------------
  function ready(f){ document.readyState!=='loading' ? f() : document.addEventListener('DOMContentLoaded', f); }
  function addStyle(root, css){ if(!css) return; const s=document.createElement('style'); s.textContent=css; root.appendChild(s); }
  function toUnit(v, fallback='px'){ return (v==null || v==='auto') ? 'auto' : (typeof v==='number' ? `${v}${fallback}` : v); }
  
  // -------------------------------
  // base renderers (simple inline)
  // -------------------------------
  function render(root, type, cfg){
    if(type==='banner'){
      const box=document.createElement('div');
      box.style.cssText = `background:${cfg.colors?.bg||'#111'};color:${cfg.colors?.fg||'#fff'};padding:12px;border-radius:10px;text-align:center`;
      box.textContent = cfg.text || 'Banner';
      if(cfg.clickUrl){ box.style.cursor='pointer'; box.onclick=()=>window.open(cfg.clickUrl,'_blank','noopener'); }
      root.appendChild(box);
      return;
    }
    // default: button
    const btn=document.createElement('button');
    btn.textContent = cfg.text || 'Click';
    btn.style.cssText = `background:${cfg.colors?.bg||'#111'};color:${cfg.colors?.fg||'#fff'};width:${cfg.size?.w||200}px;height:${cfg.size?.h||48}px;border:0;border-radius:8px;cursor:pointer`;
    btn.onclick = ()=>{ if(cfg.clickUrl) window.open(cfg.clickUrl,'_blank','noopener'); };
    root.appendChild(btn);
  }
  
  // -------------------------------
  // portal & animation helpers
  // -------------------------------
  function getPortal(){
    const id='yx-widget-portal';
    let host=document.getElementById(id);
    if(!host){
      host=document.createElement('div');
      host.id=id;
      host.style.position='fixed';
      host.style.top='0'; host.style.left='0';
      host.style.width='100%'; host.style.height='100%';
      host.style.pointerEvents='auto';          // ✅ allow clicks
      host.style.zIndex='2147483647';
      document.body.appendChild(host);
      host._shadow = host.attachShadow ? host.attachShadow({mode:'open'}) : host;
    }
    return host._shadow || host; // shadow root
  }
  
  function applyAnimation(el, name){
    if(name==='fade'){ el.animate([{opacity:0},{opacity:1}],{duration:160, easing:'ease-out'}); }
    if(name==='zoom'){ el.animate([{transform:'scale(.95)', opacity:0},{transform:'scale(1)',opacity:1}],{duration:160, easing:'ease-out'}); }
    if(name==='slide-up'){ el.animate([{transform:'translateY(12px)', opacity:0},{transform:'translateY(0)',opacity:1}],{duration:180, easing:'ease-out'}); }
  }
  
  function placePanelRelative(panel, anchorRect, placement, offset=10){
    const { width: pw, height: ph } = panel.getBoundingClientRect(); // after content is set
    let top=0, left=0;
  
    if(placement==='top'){
      top = anchorRect.top - ph - offset;
      left = anchorRect.left + (anchorRect.width - pw)/2;
    } else if(placement==='bottom'){
      top = anchorRect.bottom + offset;
      left = anchorRect.left + (anchorRect.width - pw)/2;
    } else if(placement==='left'){
      top = anchorRect.top + (anchorRect.height - ph)/2;
      left = anchorRect.left - pw - offset;
    } else {
      top = anchorRect.top + (anchorRect.height - ph)/2;
      left = anchorRect.right + offset;
    }
  
    top  = Math.max(8, Math.min(top,  window.innerHeight - ph - 8));
    left = Math.max(8, Math.min(left, window.innerWidth  - pw - 8));
  
    panel.style.top  = `${Math.round(top)}px`;
    panel.style.left = `${Math.round(left)}px`;
  }
  
  // -------------------------------
  // overlay banner (relative or floating)
  // -------------------------------
  function renderBannerOverlay(cfg, opts={}){
    const portal = getPortal();
  
    const wrap = document.createElement('div');
    wrap.style.position='fixed';
    wrap.style.inset='0';
    wrap.style.pointerEvents='auto';
  
    const panel = document.createElement('div');
    panel.style.position='fixed';
    panel.style.maxWidth = cfg.size?.maxW || 'min(92vw, 560px)';
    if (cfg.size?.w && cfg.size.w !== 'auto') panel.style.width  = typeof cfg.size.w==='number' ? cfg.size.w+'px' : cfg.size.w;
    if (cfg.size?.h && cfg.size.h !== 'auto') panel.style.height = typeof cfg.size.h==='number' ? cfg.size.h+'px' : cfg.size.h;
    panel.style.borderRadius = (cfg.radius ?? 12) + 'px';
    panel.style.boxShadow    = cfg.shadow===false ? 'none' : '0 10px 30px rgba(0,0,0,.25)';
    panel.style.padding      = (cfg.padding ?? 16) + 'px';
    panel.style.display='grid';
    panel.style.gap='12px';
    panel.style.color = (cfg.text?.color) || '#fff';
    panel.style.overflow='hidden';
  
    // background
    const bgColor = cfg.background?.color || '#111';
    panel.style.backgroundColor = bgColor;
    if (cfg.background?.image){
      panel.style.backgroundImage  = `url("${cfg.background.image}")`;
      panel.style.backgroundSize   = cfg.bgFit || 'cover';
      panel.style.backgroundPosition = cfg.bgPosition || 'center';
      panel.style.backgroundRepeat = 'no-repeat';
    }
    if (cfg.bgOverlay){
      const overlay = document.createElement('div');
      overlay.style.position='absolute'; overlay.style.inset='0';
      overlay.style.background = cfg.bgOverlay;
      panel.appendChild(overlay);
    }
  
    // content wrapper (above overlay)
    const contentWrap = document.createElement('div');
    contentWrap.style.position='relative';
    contentWrap.style.zIndex='1';
    contentWrap.style.display='grid';
    contentWrap.style.gap='10px';
    contentWrap.style.textAlign = (cfg.text?.align || 'left');
  
    // content html
    const text = document.createElement('div');
    text.innerHTML = (cfg.text?.html) || '';
    contentWrap.appendChild(text);
  
    // CTA
    if (cfg.cta?.text && cfg.cta?.url){
      const cta = document.createElement('a');
      cta.textContent = cfg.cta.text;
      cta.href = cfg.cta.url; cta.target='_blank'; cta.rel='noopener';
      cta.style.display='inline-block';
      cta.style.padding='10px 14px';
      cta.style.borderRadius='10px';
      cta.style.background='rgba(255,255,255,.14)';
      cta.style.color='currentColor';
      cta.style.fontWeight='600';
      if (cfg.cta?.bg)    cta.style.background = cfg.cta.bg;
      if (cfg.cta?.color) cta.style.color      = cfg.cta.color;
  
      if (!cfg.cta.position || cfg.cta.position==='inline'){
        contentWrap.appendChild(cta);
      } else {
        cta.style.position='absolute';
        const pad = 14;
        const pos = cfg.cta.position;
        if (pos.includes('bottom')) cta.style.bottom = pad+'px';
        if (pos.includes('top'))    cta.style.top    = pad+'px';
        if (pos.includes('left'))   cta.style.left   = pad+'px';
        if (pos.includes('right'))  cta.style.right  = pad+'px';
        if (pos === 'center'){ cta.style.top='50%'; cta.style.left='50%'; cta.style.transform='translate(-50%,-50%)'; }
        panel.appendChild(cta);
      }
    }
  
    // close
    const close = document.createElement('button');
    close.setAttribute('aria-label','Close');
    close.textContent='×';
    close.style.position='absolute';
    close.style.right='8px'; close.style.top='4px';
    close.style.border='0'; close.style.background='transparent';
    close.style.color='currentColor'; close.style.fontSize='20px'; close.style.cursor='pointer';
  
    panel.appendChild(close);
    panel.appendChild(contentWrap);
    wrap.appendChild(panel);
    portal.appendChild(wrap);
  
    function closeAll(){
      wrap.remove();
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout, true);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e){ if(e.key==='Escape') closeAll(); }
    document.addEventListener('keydown', onKey);
  
    const placement = cfg.placement || 'bottom';
    const offset = cfg.offset ?? 10;
  
    function onLayout(){
      if (opts.anchorRect){
        panel.style.top='0px'; panel.style.left='0px';
        requestAnimationFrame(()=> placePanelRelative(panel, opts.anchorRect(), placement, offset));
      }
    }
  
    applyAnimation(panel, cfg.animation || (placement==='bottom' ? 'slide-up' : 'fade'));
    onLayout();
    window.addEventListener('resize', onLayout);
    window.addEventListener('scroll', onLayout, true);
  
    close.addEventListener('click', closeAll);
    return { destroy: closeAll };
  }
  
  // -------------------------------
  /* composite = trigger button that opens banner */
  // -------------------------------
  function renderCompositeInline(root, cfg){
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
    if (t.icon){
      const i=document.createElement('span');
      i.textContent='★';
      i.style.marginRight='8px';
      i.style.color=t.iconColor||'currentColor';
      btn.prepend(i);
    }
  
    btn.addEventListener('click', ()=>{
      const key = `yx_seen_${cfg._slug}`;
      if(cfg.rules?.showOncePerSession && sessionStorage.getItem(key)) return;
  
      const rectNow = () => btn.getBoundingClientRect();
      if ((cfg.banner?.mode || 'relative') === 'relative'){
        renderBannerOverlay(cfg.banner || {}, { anchorRect: rectNow });
      } else {
        renderBannerOverlay(cfg.banner || {});
      }
      sessionStorage.setItem(key,'1');
    });
  
    root.appendChild(btn);
  
    if(cfg.rules?.autoOpen){
      const wait = Math.max(0, cfg.rules?.delayMs||0);
      setTimeout(()=>btn.click(), wait);
    }
  }
  
  // -------------------------------
  // main mount per <script data-widget-id>
  // -------------------------------
  async function mount(s){
    const id = s.dataset.widgetId; if(!id) return;
  
    // derive base from the loader's own src URL
    const srcUrl = s.getAttribute('src');
    const selfOrigin = srcUrl ? new URL(srcUrl, document.baseURI).origin : (location.origin || '');
    const base = s.dataset.apiBase || selfOrigin;
  
    const r = await fetch(`${base}/api/widget/${encodeURIComponent(id)}`, { cache:'no-store' });
    if(!r.ok){
      try { console.error('[widget loader] fetch failed', r.status, await r.text()); } catch {}
      return;
    }
    const { type, config } = await r.json();
  
    // choose host/root
    const installMode = (config?.install?.mode || 'inline');
    const host = document.createElement('div');
    if (installMode === 'floating'){
      host.style.position='fixed';
      const anchor = config.install.anchor || 'bottom-right';
      const ox = config.install.offsetX ?? 20;
      const oy = config.install.offsetY ?? 20;
      host.style.zIndex = String(config.install.zIndex ?? 2147483647);
      if (anchor.includes('bottom')) host.style.bottom = oy+'px';
      if (anchor.includes('top'))    host.style.top    = oy+'px';
      if (anchor.includes('right'))  host.style.right  = ox+'px';
      if (anchor.includes('left'))   host.style.left   = ox+'px';
    }
    const root = host.attachShadow ? host.attachShadow({mode:'open'}) : host;
  
    // insert once, then render
    s.parentNode.insertBefore(host, s.nextSibling);
    addStyle(root, config?.style);
  
    const t = (config && config.type) ? config.type : (type || 'button');
    if (t === 'composite'){
      renderCompositeInline(root, { ...config, _slug: id });
    } else if (t === 'banner'){
      renderBannerOverlay(config.banner || config || {});
    } else {
      render(root, 'button', config || {});
    }
  
    if(config?.analytics?.url){
      try{ navigator.sendBeacon?.(config.analytics.url, JSON.stringify({ e:'impression', id })) }catch{}
    }
  }
  
  // -------------------------------
  ready(()=> document.querySelectorAll('script[src*="loader.v1.js"][data-widget-id]').forEach(mount));
  // -------------------------------
  
  })();
  