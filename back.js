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
 [C] Banner Renderer (REVISED FOR INLINE PLACEMENT)
 - Accepts a 'placementMode' to position the banner beside or below the button.
 - Aligns to the left/right of the button in 'below' mode.
========================================================= */
/* =========================================================
  [START] REVISED Banner Renderer
========================================================= */
function openFlowingBanner({
  anchorEl,
  banner = {},
  onClose,
  overlayZBase = 2147483647,
  placementMode = 'side' // NEW: 'side' for floating, 'below' for inline
}) {
  const content = banner.content || {};
  const ctaCfg = banner.cta || {};
  const maxW = banner.size?.maxW ?? '600px';
  const minH = banner.size?.minH ?? 'auto';

  // NEW: Set transform-origin based on placement mode for better animations
  const transformOrigin = placementMode === 'below' ? 'center top' : 'right center';

  const panel = el('div', {
    position: 'fixed',
    width: `min(92vw, ${maxW})`,
    minHeight: toUnit(minH),
    zIndex: String(overlayZBase + 1),
    background: banner.background?.color || '#0f172a',
    color: banner.text?.color || '#fff',
    borderRadius: toUnit(banner.radius ?? 12),
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    boxSizing: 'border-box',
    boxShadow: '0 12px 36px rgba(0,0,0,.25)',
    transform: 'scale(0.95)',
    opacity: '0',
    transformOrigin: transformOrigin, // MODIFIED
    transition: 'transform .2s cubic-bezier(.2,.8,.2,1), opacity .2s cubic-bezier(.2,.8,.2,1)',
    overflow: 'hidden'
  });

  if (banner.background?.image) {
    panel.style.backgroundImage = `url("${banner.background.image}")`;
    panel.style.backgroundSize = banner.bgFit || 'cover';
    panel.style.backgroundPosition = banner.bgPosition || 'center';
    panel.style.backgroundRepeat = 'no-repeat';
  }

  const inner = el('div', {
    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '24px', padding: '16px 24px', width: '100%', boxSizing: 'border-box'
  });
  inner.classList.add('yx-banner-inner');
  panel.appendChild(inner);

  if (content.title) {
    const titleEl = el('div', { fontWeight: '600', fontSize: '20px', lineHeight: '1.3', flex: '1 1 30%' });
    titleEl.classList.add('yx-title');
    titleEl.textContent = content.title;
    inner.appendChild(titleEl);
  }
  if (content.description) {
    const descEl = el('div', { fontSize: '15px', opacity: '0.85', lineHeight: '1.4', flex: '1 1 45%' });
    descEl.classList.add('yx-description');
    descEl.textContent = content.description;
    inner.appendChild(descEl);
  }
  if (ctaCfg.text && ctaCfg.url) {
    const ctaBtn = el('a', {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: ctaCfg.bg || '#c95624',
      color: ctaCfg.color || '#fff', padding: '12px 18px', borderRadius: '10px', textDecoration: 'none',
      fontWeight: '600', whiteSpace: 'nowrap', flex: '0 0 auto'
    });
    ctaBtn.classList.add('yx-cta');
    ctaBtn.href = ctaCfg.url;
    ctaBtn.target = '_blank';
    ctaBtn.rel = 'noopener';
    const pinIconSvg = getIconSvgByName('pin');
    if (pinIconSvg) {
      const iconSpan = el('span', { display: 'flex', alignItems: 'center' });
      iconSpan.innerHTML = pinIconSvg;
      ctaBtn.appendChild(iconSpan);
    }
    ctaBtn.appendChild(document.createTextNode(ctaCfg.text));
    inner.appendChild(ctaBtn);
  }

  const closeBtn = el('button', {
    position: 'absolute', right: '8px', top: '6px', border: '0', background: 'transparent',
    color: 'inherit', fontSize: '20px', cursor: 'pointer', lineHeight: '1'
  });
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '×';
  panel.appendChild(closeBtn);

  const styles = el('style');
  styles.textContent = `@media (max-width: 768px) { .yx-description { display: none !important; } .yx-title { font-size: 16px !important; } .yx-banner-inner { padding: 12px 16px !important; } }`;
  panel.appendChild(styles);
  document.body.appendChild(panel);

  // --- Positioning Logic ---
  function place() {
    const r = anchorEl.getBoundingClientRect();
    const pw = panel.offsetWidth, ph = panel.offsetHeight;
    const off = banner.offset ?? 10;
    let top, left;

    // NEW: Placement mode logic
    if (placementMode === 'below') {
      top = r.bottom + off;
      const align = banner.inlineAlign || 'left'; // Default to left alignment
      if (align === 'right') {
        left = r.right - pw; // Align panel right edge to button right edge
      } else {
        left = r.left; // Align panel left edge to button left edge
      }
    } else { // Default 'side' placement
      top = r.top + (r.height - ph) / 2;
      left = r.right - pw - off;
    }

    top = Math.max(8, Math.min(top, window.innerHeight - ph - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
    panel.style.top = Math.round(top) + 'px';
    panel.style.left = Math.round(left) + 'px';
  }

  place();
  window.addEventListener('scroll', place, { passive: true, capture: true });
  window.addEventListener('resize', place);

  requestAnimationFrame(() => {
    panel.style.transform = 'scale(1)';
    panel.style.opacity = '1';
  });

  function close() {
    window.removeEventListener('scroll', place, true);
    window.removeEventListener('resize', place);
    panel.style.transform = 'scale(0.95)';
    panel.style.opacity = '0';
    panel.addEventListener('transitionend', () => {
      panel.remove();
      onClose && onClose();
    }, { once: true });
  }
  closeBtn.addEventListener('click', close);

  return { close, panel };
}
/* =========================================================
  [END] REVISED Banner Renderer
========================================================= */

/* =========================================================
 [D] Trigger button (REVISED FOR STATE MANAGEMENT)
 - Prevents multiple banners from opening.
 - Allows the button to close an already open banner.
========================================================= */
/* =========================================================
  [START] REVISED Trigger Button
========================================================= */
function renderTrigger(root, cfg, ctx) {
  const t = cfg.trigger || {};
  const isFloating = ctx.installMode === 'floating';
  const btn = el('button');
  btn.setAttribute('aria-label', t.ariaLabel || t.text || 'Open widget');
  btn.style.border = '0';
  btn.style.cursor = 'pointer';
  btn.style.fontWeight = String(t.weight ?? 600);
  btn.style.background = t.colors?.bg || '#111';
  btn.style.color = t.colors?.fg || '#fff';
  btn.style.transition = 'background .2s ease, transform .2s ease, opacity .2s ease';
  btn.style.display = 'inline-flex';
  btn.style.justifyContent = 'center';
  btn.style.alignItems = 'center';
  btn.style.gap = t.iconOnly ? '0' : '8px';
  btn.style.boxShadow = '0 4px 12px rgba(0,0,0,.15)';

  if (t.colors?.hover) {
    btn.addEventListener('mouseenter', () => btn.style.background = t.colors.hover);
    btn.addEventListener('mouseleave', () => btn.style.background = t.colors.bg || '#111');
  }

  if (isFloating) {
    const W = toUnit(t.size?.w ?? 56);
    const H = toUnit(t.size?.h ?? 56);
    btn.style.width = W;
    btn.style.height = H;
    btn.style.borderRadius = '50%';
    btn.style.padding = '0';
  } else {
    const inlineCfg = t.inline || {};
    const inlineSize = inlineCfg.size || {};
    btn.style.width = toUnit(inlineSize.w ?? 180);
    btn.style.height = toUnit(inlineSize.h ?? 44);
    btn.style.fontSize = inlineCfg.fontSize || 'inherit';
    btn.style.borderRadius = toUnit(t.radius ?? 12);
    btn.style.padding = '0 16px';
  }

  let iconEl;
  if (t.iconSvg) {
    iconEl = el('span', { width: '20px', height: '20px', display: 'flex', alignItems: 'center' });
    iconEl.innerHTML = t.iconSvg;
  } else if (t.iconName) {
    const svg = getIconSvgByName(t.iconName);
    if (svg) { iconEl = el('span', { width: '20px', height: '20px', display: 'flex', alignItems: 'center', color: t.iconColor || 'currentColor' }); iconEl.innerHTML = svg; }
  } else if (t.icon) {
    iconEl = el('span', { color: t.iconColor || 'currentColor', fontSize: '18px', lineHeight: '1' });
    iconEl.textContent = t.icon;
  }
  if (iconEl) btn.appendChild(iconEl);

  if (!t.iconOnly) btn.appendChild(document.createTextNode(t.text || 'Click'));

  root.appendChild(btn);

  // --- NEW: State Management ---
  let activeBanner = null;

  btn.addEventListener('click', () => {
    // If a banner is already open, close it and stop.
    if (activeBanner) {
      activeBanner.close();
      // The onClose callback will set activeBanner to null
      return;
    }

    const hostEl = ctx.hostEl;
    let baseZ = 2147483647;
    if (hostEl) {
      const z = parseInt(getComputedStyle(hostEl).zIndex || '0', 10);
      if (Number.isFinite(z)) baseZ = z;
    }

    if (isFloating) {
      btn.style.transform = 'scale(0.9)';
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
    }

    // Store the returned banner object in our state variable
    activeBanner = openFlowingBanner({
      anchorEl: isFloating ? hostEl : btn,
      banner: cfg.banner || {},
      overlayZBase: baseZ,
      placementMode: isFloating ? 'side' : 'below',
      onClose: () => {
        if (isFloating) {
          btn.style.transform = 'scale(1)';
          btn.style.opacity = '1';
          btn.style.pointerEvents = '';
        }
        // CRITICAL: Reset the state when the banner is closed
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