/* ==========================================================
   MERGE TREE RENDERER – Merge Sort as a tree of boxes

   Step fields it reads:
     nodes   every box of the tree: { lo, hi, depth, vis, mode, cells }
               vis    the box is shown (after its parent was split)
               mode   "raw" | "merging" | "done"
               cells  [{ v: number | null, f: [flags] }]
                      flags: empty (dashed slot), just (taken now, lime), head (front number, ring),
                             taken (faded), fin (a merged, sorted group)
   Legend classes used: cur (ring), fnd (lime), tkn (faded), srt (merged green)
   ========================================================== */
window.RENDERERS = window.RENDERERS || {};

(function () {
  const BH = 42, GAP_Y = 26, TOP = 12, PAD = 12, MIN_SLOT = 34;

  const style = document.createElement('style');
  style.textContent = `
    .mg-wrap { position: relative; width: 100%; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; scrollbar-color: #3E3F4A transparent; }
    .mg-track { position: relative; min-width: 100%; }
    .mg-node { position: absolute; left: 0; top: 0; display: flex; gap: 3px; padding: 3px; border-radius: 10px; background: #23242B; border: 1.5px solid #3A3B45;
               opacity: 0; transition: opacity var(--vz-ms, 300ms), transform var(--vz-ms, 300ms), border-color var(--vz-ms, 300ms), background var(--vz-ms, 300ms); }
    .mg-node.vis { opacity: 1; }
    .mg-node.merging { border-color: var(--lime); background: #272A1E; }
    .mg-node.done { border-color: #7A9A3A; }
    .mg-cell { flex: 1 1 0; min-width: 0; display: grid; place-items: center; border-radius: 7px; background: #3E3F4A; border: 1.5px solid transparent;
               font-family: var(--font-mono); font-weight: 600; color: var(--ink, #F2F2F0); transition: background .3s, color .3s, border-color .3s, opacity .3s; }
    .mg-cell.empty { background: transparent; border: 1.5px dashed #4B4C57; color: transparent; }
    .mg-cell.taken { opacity: .32; }
    .mg-cell.head { border-color: var(--lime); }
    .mg-cell.just { background: var(--lime); color: #18181D; opacity: 1; }
    .mg-cell.fin { background: #55672B; }
    .vz-lg.tkn { background: #3E3F4A; border-color: #5A5B68; opacity: .4; }
    .vz-lg.srt { background: #55672B; border-color: #7A9A3A; }
  `;
  document.head.appendChild(style);

  function build(canvas, step) {
    canvas.innerHTML = '<div class="mg-wrap"><div class="mg-track"></div></div>';
    const wrap = canvas.firstChild, track = wrap.firstChild;
    wrap.dataset.n = step.data.length;
    wrap.__els = step.nodes.map(() => { const d = document.createElement('div'); d.className = 'mg-node'; track.appendChild(d); return d; });
    wrap.__levels = Math.max(...step.nodes.map((nd) => nd.depth)) + 1;
    const h = TOP * 2 + wrap.__levels * BH + (wrap.__levels - 1) * GAP_Y;
    wrap.style.height = track.style.height = h + 'px';
    if (window.ResizeObserver) new ResizeObserver(() => wrap.__last && draw(wrap, wrap.__last)).observe(wrap);
    return wrap;
  }

  function draw(wrap, step) {
    const n = step.data.length;
    const slot = Math.max(MIN_SLOT, ((wrap.clientWidth || 600) - 2 * PAD) / n);
    wrap.firstChild.style.width = (n * slot + 2 * PAD) + 'px';
    const fs = slot < 40 ? '.7rem' : (slot < 52 ? '.82rem' : '.95rem');

    step.nodes.forEach((nd, i) => {
      const el = wrap.__els[i];
      const w = (nd.hi - nd.lo + 1) * slot - 8;
      const cx = PAD + (nd.lo + nd.hi + 1) / 2 * slot;
      const y = TOP + nd.depth * (BH + GAP_Y);
      el.innerHTML = nd.cells.map((c) => '<div class="mg-cell' + (c.f.length ? ' ' + c.f.join(' ') : '') + '">' + (c.v == null ? '' : c.v) + '</div>').join('');
      el.className = 'mg-node' + (nd.vis ? ' vis' : '') + (nd.mode === 'merging' ? ' merging' : '') + (nd.mode === 'done' && nd.hi > nd.lo ? ' done' : '');
      el.style.width = w + 'px'; el.style.height = BH + 'px'; el.style.fontSize = fs;
      el.style.transform = 'translate(' + (cx - w / 2) + 'px,' + (y + (nd.vis ? 0 : -10)) + 'px)';
    });

    // keep the box being merged in view when the tree is wider than the screen
    const head = step.nodes.find((nd) => nd.cells.some((c) => c.f.indexOf('head') >= 0)) || step.nodes.find((nd) => nd.mode === 'merging');
    if (head && wrap.scrollWidth > wrap.clientWidth) {
      wrap.scrollTo({ left: PAD + (head.lo + head.hi + 1) / 2 * slot - wrap.clientWidth / 2, behavior: 'smooth' });
    }
  }

  window.RENDERERS.mergetree = {
    render(canvas, step) {
      let wrap = canvas.firstChild;
      if (!wrap || !wrap.classList || !wrap.classList.contains('mg-wrap') || Number(wrap.dataset.n) !== step.data.length) {
        wrap = build(canvas, step);
      }
      wrap.__last = step;
      draw(wrap, step);
    }
  };
})();