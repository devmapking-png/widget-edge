(() => {
    /* =========================================================
     [A] Tiny utils  (KEEP)
    ========================================================= */
    function ready(fn) {
      document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn);
    }
  
    function toUnit(v, u = 'px') {
      return v == null || v === 'auto' ? 'auto' : (typeof v === 'number' ? `${v}${u}` : v);
    }
  
    function el(tag, styles) {
      const n = document.createElement(tag);
      if (styles) Object.assign(n.style, styles);
      return n;
    }
  
    /* Small inline icon set; extend as needed */
    function getIconSvgByName(name) {
      const ICONS = {
        pin: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`,
        sparkles: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M5 8l2-4 2 4 4 2-4 2-2 4-2-4-4-2 4-2zm10-3l1-3 1 3 3 1-3 1-1 3-1-3-3-1 3-1zm1 9l1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/></svg>`,
        info: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11 17h2v-6h-2v6zm0-8h2V7h-2v2zm1-7C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>`,
        bell: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z"/></svg>`
      };
      return ICONS[name] || null;
    }
  
    /* =========================================================
     [B] Floating host (KEEP / REUSABLE)
    ========================================================= */
    function makeFloatingHost(install = {}) {
      const host = el('div', {
        position: 'fixed',
        zIndex: String(install.zIndex ?? 2147483647),
        overflow: 'visible'
      });
      const a = install.anchor || 'bottom-right',
        ox = install.offsetX ?? 20,
        oy = install.offsetY ?? 20;
      if (a.includes('bottom')) host.style.bottom = oy + 'px';
      if (a.includes('top')) host.style.top = oy + 'px';
      if (a.includes('right')) host.style.right = ox + 'px';
      if (a.includes('left')) host.style.left = ox + 'px';
      const root = host.attachShadow ? host.attachShadow({
        mode: 'open'
      }) : host;
      return {
        host,
        root
      };
    }
  
  /* =========================================================
   [C-1] Detailed Banner Content Builder
   - Close button logic is now self-contained here.
  ========================================================= */
  function _buildDetailedContent(panel, banner, closeFn) {
    const content = banner.content || {};
    const ctaCfg = banner.cta || {};
  
    panel.style.background = banner.background?.color || '#fff';
    panel.style.color = banner.text?.color || '#000';
    if (banner.background?.image) { panel.style.backgroundImage = `url("${banner.background.image}")`; panel.style.backgroundSize = 'cover'; panel.style.backgroundPosition = 'center'; panel.style.color = banner.text?.color || '#fff'; }
  
    // This layout's close button is positioned absolutely
    const closeBtn = el('button', { position: 'absolute', right: '15px', top: '16px', border: '0', background: 'transparent', color: banner.closeButtonColor || 'inherit', fontSize: '24px', cursor: 'pointer', lineHeight: '1', zIndex: '100' });
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeFn);
    panel.appendChild(closeBtn);
  
    if (banner.presentedBy) {
      const presentedBar = el('div', { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '8px', fontSize: '12px', color: banner.presentedBy.textColor || '#666', background: banner.presentedBy.bgColor || '#f0f0f0' });
      const pText = el('span'); pText.textContent = banner.presentedBy.text || 'Presented by';
      const pLogo = el('img', { height: '18px' }); pLogo.src = banner.presentedBy.logoUrl;
      presentedBar.appendChild(pText); presentedBar.appendChild(pLogo);
      panel.appendChild(presentedBar);
    }
    const mainContainer = el('div', { display: 'flex', padding: '24px 32px', gap: '24px', className: 'yx-main-container' });
    const leftCol = el('div', { flex: '0 0 30%', display: 'flex', flexDirection: 'column', className: 'yx-left-col' });
    const rightCol = el('div', { flex: '1 1 70%', overflow: 'hidden', className: 'yx-right-col' });
    if (banner.eventLogoUrl) { const eventLogo = el('img', { height: '40px', marginBottom: '16px', alignSelf: 'flex-start' }); eventLogo.src = banner.eventLogoUrl; leftCol.appendChild(eventLogo); }
    if (content.title) { leftCol.appendChild(el('h2', { fontSize: '28px', fontWeight: '800', margin: '0 0 12px', lineHeight: '1.2' })); leftCol.lastChild.textContent = content.title; }
    if (content.description) { leftCol.appendChild(el('p', { fontSize: '16px', margin: '0 0 24px', opacity: '0.8' })); leftCol.lastChild.textContent = content.description; }
    if (ctaCfg.text && ctaCfg.url) { const cta = el('a', { display: 'inline-block', padding: '12px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', background: ctaCfg.bg, color: ctaCfg.color, textAlign: 'center', marginTop: 'auto' }); cta.href = ctaCfg.url; cta.target = '_blank'; cta.rel = 'noopener'; cta.textContent = ctaCfg.text; leftCol.appendChild(cta); }
    const _renderScrollableSection = (items = [], type = 'card') => {
      const container = el('div', { display: 'flex', gap: '12px', overflowX: 'auto', padding: '4px 0 16px', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' });
      items.forEach(item => {
        if (type === 'card' && item.imageUrl) {
          const card = el('a', { display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', textDecoration: 'none', color: '#000', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '160px', minWidth: '160px', scrollSnapAlign: 'start', flexShrink: '0' }); card.href = item.url; card.target = '_blank'; card.rel = 'noopener'; const img = el('img', { width: '100%', height: '80px', objectFit: 'cover', display: 'block' }); img.src = item.imageUrl; card.appendChild(img); const cardContent = el('div', { padding: '8px 12px', flexGrow: '1', display: 'flex', flexDirection: 'column' }); const tag = el('div', { fontSize: '12px', opacity: '0.7', marginBottom: '4px' }); tag.textContent = item.tag; cardContent.appendChild(tag); const title = el('div', { fontWeight: '600', fontSize: '14px', lineHeight: '1.4', height: '39.2px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', webkitLineClamp: '2', webkitBoxOrient: 'vertical' }); title.textContent = item.title; cardContent.appendChild(title); card.appendChild(cardContent); container.appendChild(card);
        } else if (type === 'partner' && item.logoUrl) { const link = el('a', { display: 'inline-block', flexShrink: '0' }); link.href = item.url; link.target = '_blank'; link.rel = 'noopener'; const logo = el('img', { height: '30px', opacity: '0.8' }); logo.src = item.logoUrl; link.appendChild(logo); container.appendChild(link); }
      });
      return container;
    };
    if (content.cards?.length) { rightCol.appendChild(el('h3', { fontSize: '16px', fontWeight: '600', margin: '0 0 12px' })); rightCol.lastChild.textContent = 'Take a look at what you can find'; rightCol.appendChild(_renderScrollableSection(content.cards, 'card')); }
    if (content.partners?.length) { rightCol.appendChild(el('h3', { fontSize: '16px', fontWeight: '600', margin: '24px 0 12px' })); rightCol.lastChild.textContent = 'Our Partners'; rightCol.appendChild(_renderScrollableSection(content.partners, 'partner')); }
    mainContainer.appendChild(leftCol); mainContainer.appendChild(rightCol); panel.appendChild(mainContainer);
  }
  
  /* =========================================================
   [C-2] Classic Banner Content Builder (FINAL)
   - Removes debugging colors.
  ========================================================= */
  function _buildClassicContent(panel, banner, closeFn) {
    const content = banner.content || {};
    const ctaCfg = banner.cta || {};
    panel.style.background = banner.background?.color || '#0f172a';
    panel.style.color = banner.text?.color || '#fff';
    if (banner.background?.image) { panel.style.backgroundImage = `url("${banner.background.image}")`; panel.style.backgroundSize = banner.bgFit || 'cover'; }
  
    const inner = el('div', {
      position: 'relative', display: 'flex',
      alignItems: 'stretch',
      gap: '16px',
      padding: '16px 10px 16px 24px',
      width: '100%', boxSizing: 'border-box'
    });
    inner.classList.add('yx-banner-inner');
  
    // --- Column 1: Title (Vertically Centered) ---
    const titleCol = el('div', { flex: '1 1 30%', display: 'flex', alignItems: 'center' });
    titleCol.classList.add('yx-title-col');
    if (content.title) {
      const titleEl = el('div', { fontWeight: '600', fontSize: '20px', lineHeight: '1.3' });
      titleEl.classList.add('yx-title-text');
      titleEl.textContent = content.title;
      titleCol.appendChild(titleEl);
    }
    inner.appendChild(titleCol);
  
    // --- Column 2: Description (Vertically Centered) ---
    const descCol = el('div', { flex: '1 1 45%', display: 'flex', alignItems: 'center' });
    descCol.classList.add('yx-description-col');
    if (content.description) {
      const descEl = el('div', { fontSize: '15px', opacity: '0.85', lineHeight: '1.4' });
      descEl.textContent = content.description;
      descCol.appendChild(descEl);
    }
    inner.appendChild(descCol);
  
    // --- Column 3: CTA Button (Vertically Centered) ---
    const ctaCol = el('div', { flex: '0 0 auto', display: 'flex', alignItems: 'center' });
    ctaCol.classList.add('yx-cta-col'); // Added class for targeting
    if (ctaCfg.text && ctaCfg.url) {
      const ctaBtn = el('a', { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: ctaCfg.bg || '#c95624', color: ctaCfg.color || '#fff', padding: '12px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', whiteSpace: 'nowrap' });
      ctaBtn.classList.add('yx-cta-btn');
      ctaBtn.href = ctaCfg.url; ctaBtn.target = '_blank'; ctaBtn.rel = 'noopener';
      const pinIconSvg = getIconSvgByName('pin');
      if (pinIconSvg) { const iconSpan = el('span', { display: 'flex', alignItems: 'center' }); iconSpan.innerHTML = pinIconSvg; ctaBtn.appendChild(iconSpan); }
      ctaBtn.appendChild(document.createTextNode(ctaCfg.text));
      ctaCol.appendChild(ctaBtn);
    }
    inner.appendChild(ctaCol);
  
    // --- Column 4: Close Button (Top Aligned) ---
    const closeCol = el('div', { flex: '0 0 auto', display: 'flex', alignItems: 'flex-start', paddingTop: '4px' });
    closeCol.classList.add('yx-close-col'); // Added class for targeting
    const closeBtn = el('button', { border: '0', background: 'transparent', color: banner.closeButtonColor || 'inherit', fontSize: '24px', cursor: 'pointer', lineHeight: '1', padding: '0' });
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeFn);
    closeCol.appendChild(closeBtn);
    inner.appendChild(closeCol);
  
    panel.appendChild(inner);
  }
  
  
  /* =========================================================
   [C-3] Main Banner Function (FINAL MOBILE STYLES)
   - Corrects typo in mobile styles to ensure 10px gap is applied.
  ========================================================= */
  function openFlowingBanner({ anchorEl, banner = {}, onClose, overlayZBase = 2147483647, placementMode = 'side' }) {
    const maxW = banner.size?.maxW ?? '800px';
    const minH = banner.size?.minH ?? 'auto';
    const transformOrigin = placementMode === 'below' ? 'center top' : 'right center';
  
    const panel = el('div', {
      position: 'fixed', width: `min(90vw, ${maxW})`, maxHeight: '90vh', overflowY: 'auto',
      minHeight: toUnit(minH), zIndex: String(overlayZBase + 1),
      borderRadius: toUnit(banner.radius ?? 16), fontFamily: 'system-ui, sans-serif',
      boxSizing: 'border-box', boxShadow: '0 12px 36px rgba(0,0,0,.25)', transform: 'scale(0.95)',
      opacity: '0', transformOrigin: transformOrigin,
      transition: 'transform .2s cubic-bezier(.2,.8,.2,1), opacity .2s cubic-bezier(.2,.8,.2,1)'
    });
    panel.classList.add('yx-panel');
  
    const isMobile = window.screen.width <= 768;
    if (isMobile) { panel.classList.add('yx-mobile'); }
  
    const styles = el('style');
    styles.textContent = `
      /* Classic Banner Mobile Styles */
      .yx-panel.yx-mobile .yx-title-col { flex-basis: 70% !important; }
      .yx-panel.yx-mobile .yx-description-col { display: none !important; }
      .yx-panel.yx-mobile .yx-title-text { font-size: 18px !important; line-height: 1.1 !important; }
      .yx-panel.yx-mobile .yx-banner-inner { gap: 10px !important; padding: 12px 10px 12px 16px !important; }
      .yx-panel.yx-mobile .yx-cta-btn { padding: 8px 12px !important; font-size: 14px !important; min-width: 100px; justify-content: center; }
      .yx-panel.yx-mobile .yx-cta-btn span { display: none !important; }
      
      /* Detailed Banner Mobile Styles */
      .yx-panel.yx-mobile .yx-main-container { flex-direction: column; padding: 16px 24px !important; gap: 16px !important; }
      .yx-panel.yx-mobile .yx-left-col, .yx-panel.yx-mobile .yx-right-col { flex-basis: auto !important; }
      .yx-panel.yx-mobile h2 { font-size: 24px !important; }
    `;
    panel.appendChild(styles);
  
    function close() {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      panel.style.transform = 'scale(0.95)'; panel.style.opacity = '0';
      panel.addEventListener('transitionend', () => { panel.remove(); onClose && onClose(); }, { once: true });
    }
  
    if (banner.layout === 'detailed') {
      const closeBtn = el('button', {
        position: 'absolute', right: '15px', top: '16px', border: '0', background: 'transparent',
        color: banner.closeButtonColor || 'inherit',
        fontSize: '24px', cursor: 'pointer', lineHeight: '1', zIndex: '100'
      });
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', close);
      panel.appendChild(closeBtn);
      _buildDetailedContent(panel, banner);
    } else {
      _buildClassicContent(panel, banner, close);
    }
  
    document.body.appendChild(panel);
  
    function place() { const r = anchorEl.getBoundingClientRect(); const pw = panel.offsetWidth, ph = panel.offsetHeight; const off = banner.offset ?? 10; let top, left; if (placementMode === 'below') { top = r.bottom + off; const align = banner.inlineAlign || 'left'; if (align === 'right') { left = r.right - pw; } else { left = r.left; } } else { top = r.top + (r.height - ph) / 2; left = r.right - pw - off; } top = Math.max(8, Math.min(top, window.innerHeight - ph - 8)); left = Math.max(8, Math.min(left, window.innerWidth - pw - 8)); panel.style.top = Math.round(top) + 'px'; panel.style.left = Math.round(left) + 'px'; }
    place();
    window.addEventListener('scroll', place, { passive: true, capture: true });
    window.addEventListener('resize', place);
  
    requestAnimationFrame(() => { panel.style.transform = 'scale(1)'; panel.style.opacity = '1'; });
    return { close, panel };
  }
  
  
  
  /* =========================================================
   [D] Trigger button (SIMPLIFIED)
   - No longer needs to route between different banner functions.
   - State management for opening/closing remains.
  ========================================================= */
  /* =========================================================
    [START] REVISED Trigger Button
  ========================================================= */
  function renderTrigger(root, cfg, ctx) {
    const t = cfg.trigger || {};
    const isFloating = ctx.installMode === 'floating';
    const btn = el('button');
    btn.setAttribute('aria-label', t.ariaLabel || t.text || 'Open widget');
    btn.style.border = '0'; btn.style.cursor = 'pointer'; btn.style.fontWeight = String(t.weight ?? 600);
    btn.style.background = t.colors?.bg || '#111'; btn.style.color = t.colors?.fg || '#fff';
    btn.style.transition = 'background .2s ease, transform .2s ease, opacity .2s ease';
    btn.style.display = 'inline-flex'; btn.style.justifyContent = 'center'; btn.style.alignItems = 'center';
    btn.style.gap = t.iconOnly ? '0' : '8px'; btn.style.boxShadow = '0 4px 12px rgba(0,0,0,.15)';
  
    if (t.colors?.hover) {
      btn.addEventListener('mouseenter', () => btn.style.background = t.colors.hover);
      btn.addEventListener('mouseleave', () => btn.style.background = t.colors.bg || '#111');
    }
  
    if (isFloating) {
      const W = toUnit(t.size?.w ?? 56); const H = toUnit(t.size?.h ?? 56);
      btn.style.width = W; btn.style.height = H; btn.style.borderRadius = '50%'; btn.style.padding = '0';
    } else {
      const inlineCfg = t.inline || {}; const inlineSize = inlineCfg.size || {};
      btn.style.width = toUnit(inlineSize.w ?? 180); btn.style.height = toUnit(inlineSize.h ?? 44);
      btn.style.fontSize = inlineCfg.fontSize || 'inherit'; btn.style.borderRadius = toUnit(t.radius ?? 12);
      btn.style.padding = '0 16px';
    }
  
    let iconEl;
    if (t.iconSvg) { iconEl = el('span', { width: '20px', height: '20px', display: 'flex', alignItems: 'center' }); iconEl.innerHTML = t.iconSvg; }
    else if (t.iconName) { const svg = getIconSvgByName(t.iconName); if (svg) { iconEl = el('span', { width: '20px', height: '20px', display: 'flex', alignItems: 'center', color: t.iconColor || 'currentColor' }); iconEl.innerHTML = svg; } }
    else if (t.icon) { iconEl = el('span', { color: t.iconColor || 'currentColor', fontSize: '18px', lineHeight: '1' }); iconEl.textContent = t.icon; }
    if (iconEl) btn.appendChild(iconEl);
    if (!t.iconOnly) btn.appendChild(document.createTextNode(t.text || 'Click'));
    root.appendChild(btn);
  
    let activeBanner = null;
    btn.addEventListener('click', () => {
      if (activeBanner) { activeBanner.close(); return; }
      const hostEl = ctx.hostEl; let baseZ = 2147483647;
      if (hostEl) { const z = parseInt(getComputedStyle(hostEl).zIndex || '0', 10); if (Number.isFinite(z)) baseZ = z; }
  
      if (isFloating) {
        btn.style.transform = 'scale(0.9)'; btn.style.opacity = '0'; btn.style.pointerEvents = 'none';
      }
  
      activeBanner = openFlowingBanner({
        anchorEl: isFloating ? hostEl : btn,
        banner: cfg.banner || {},
        overlayZBase: baseZ,
        placementMode: isFloating ? 'side' : 'below',
        onClose: () => {
          if (isFloating) {
            btn.style.transform = 'scale(1)'; btn.style.opacity = '1'; btn.style.pointerEvents = '';
          }
          activeBanner = null;
        }
      });
    });
  }
  /* =========================================================
    [END] REVISED Trigger Button
  ========================================================= */
  
    /* =========================================================
   [E] Mount one script tag (REVISED FOR DUAL MODE)
   - Creates a floating or inline host based on install.mode.
  ========================================================= */
  /* =========================================================
    [START] REVISED Mount Function
  ========================================================= */
  async function mount(scriptTag) {
    const id = scriptTag.dataset.widgetId;
    if (!id) return;
  
    const srcUrl = scriptTag.getAttribute('src');
    const selfOrigin = srcUrl ? new URL(srcUrl, document.baseURI).origin : (location.origin || '');
    const base = scriptTag.dataset.apiBase || selfOrigin;
  
    let payload;
    try {
      const r = await fetch(`${base}/api/widget/${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (!r.ok) { try { console.error('[loader] fetch failed', r.status, await r.text()); } catch {}; return; }
      payload = await r.json();
    } catch (e) { console.error('[loader] network error', e); return; }
  
    const config = payload?.config ?? payload;
    const type = payload?.type ?? config?.type ?? 'composite';
    const installMode = (config?.install?.mode || 'inline');
  
    let host, root;
    // Create the correct host element based on the install mode
    if (installMode === 'floating') {
      ({ host, root } = makeFloatingHost(config.install));
    } else {
      // For inline mode, create a simple div container
      host = document.createElement('div');
      host.style.display = 'inline-block'; // Make it behave well in text flow
      root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    }
  
    scriptTag.parentNode.insertBefore(host, scriptTag.nextSibling);
  
    if (type === 'composite' || type === 'button') {
      // Pass the generic host element to the renderer
      renderTrigger(root, { ...config, _slug: id }, {
        installMode,
        hostEl: host
      });
    }
  
    if (config?.analytics?.url) {
      try { navigator.sendBeacon?.(config.analytics.url, JSON.stringify({ e: 'impression', id })); } catch {}
    }
  }
  /* =========================================================
    [END] REVISED Mount Function
  ========================================================= */
    ready(() => {
      document.querySelectorAll('script[src*="loader.v1.js"][data-widget-id]').forEach(mount);
    });
  
  })();