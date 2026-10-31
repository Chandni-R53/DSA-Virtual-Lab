/* ==========================================================
   TILES RENDERER – Selection Sort as tiles, a scanner light and a sorted shelf

   Step fields it reads:
     data       the numbers
     ids        ids[position] = which original tile sits there, so the same tile can slide
     current    position being scanned        -> the scanner light sits above it
     min        position of the smallest so far -> solid lime tile with a MIN flag
     swapping   [i, m] positions just swapped  -> the tile now at i is amber ("just moved")
     sorted     positions that are final       -> those tiles sit on the shelf below
   Legend classes used: cur (ring), fnd (lime), swp (amber), srt (shelf green)
   ========================================================== */
window.RENDERERS = window.RENDERERS || {};

(function () {
  const H = 300, UP_Y = 58, DOWN_Y = 212, MIN_SLOT = 44;

  const style = document.createElement('style');
  style.textContent = `
    .tl-wrap { position: relative; width: 100%; height: ${H}px; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; scrollbar-color: #3E3F4A transparent; }
    .tl-track { position: relative; height: ${H}px; min-width: 100%; }
    .tl-label { position: absolute; left: 14px; font: 600 .66rem var(--font-mono); letter-spacing: .08em; text-transform: uppercase; color: #75757A; }
    .tl-shelf { position: absolute; left: 0; right: 0; height: 10px; background: linear-gradient(#2E2F37, #25262C); border-top: 1px solid #5A5B68; }
    .tl-slot { position: absolute; left: 0; top: 0; border: 1.5px dashed #4B4C57; border-radius: 12px; }
    .tl-tile { position: absolute; left: 0; top: 0; display: grid; place-items: center; border-radius: 12px; background: #3E3F4A; border: 1.5px solid #5A5B68;
               font-family: var(--font-mono); font-weight: 600; color: var(--ink, #F2F2F0);
               transition: transform var(--vz-ms, 300ms) cubic-bezier(.3, .7, .3, 1), background var(--vz-ms, 300ms), border-color var(--vz-ms, 300ms), box-shadow var(--vz-ms, 300ms), color var(--vz-ms, 300ms), width var(--vz-ms, 300ms), height var(--vz-ms, 300ms); }
    .tl-tile.scan { border: 2px solid var(--lime); box-shadow: 0 0 0 4px rgba(196, 240, 66, .16); }
    .tl-tile.min { background: var(--lime); border-color: var(--lime); color: #18181D; }
    .tl-tile.min::after { content: 'MIN'; position: absolute; top: -19px; font: 600 .6rem var(--font-mono); letter-spacing: .1em; color: var(--lime); }
    .tl-tile.down { background: #55672B; border-color: #7A9A3A; }
    .tl-tile.moved { background: #F5A524; border-color: #F5A524; color: #18181D; }
    .tl-beam { position: absolute; left: 0; top: 0; pointer-events: none; border-radius: 14px 14px 0 0; border-bottom: 2px solid var(--lime);
               background: linear-gradient(rgba(196, 240, 66, 0), rgba(196, 240, 66, .2));
               transition: transform calc(var(--vz-ms, 300ms) * .8) ease, opacity .25s, width var(--vz-ms, 300ms); }
    .vz-lg.swp { background: #F5A524; border-color: #F5A524; }
    .vz-lg.srt { background: #55672B; border-color: #7A9A3A; }
  `;
  document.head.appendChild(style);

  function build(canvas, n) {
    canvas.innerHTML = '<div class="tl-wrap"><div class="tl-track">' +
      '<span class="tl-label" style="top:14px">Unsorted</span><span class="tl-label" style="top:' + (DOWN_Y - 34) + 'px">Sorted shelf</span>' +
      '<div class="tl-shelf"></div><div class="tl-beam"></div></div></div>';
    const wrap = canvas.firstChild, track = wrap.firstChild;
    wrap.dataset.n = n;
    wrap.__shelf = track.querySelector('.tl-shelf');
    wrap.__beam = track.querySelector('.tl-beam');
    wrap.__slots = [];
    wrap.__els = [];
    for (let i = 0; i < n; i++) { const s = document.createElement('div'); s.className = 'tl-slot'; track.appendChild(s); wrap.__slots.push(s); }
    for (let i = 0; i < n; i++) { const t = document.createElement('div'); t.className = 'tl-tile'; track.appendChild(t); wrap.__els.push(t); }
    if (window.ResizeObserver) new ResizeObserver(() => wrap.__last && draw(wrap, wrap.__last)).observe(wrap);
    return wrap;
  }

  function draw(wrap, step) {
    const data = step.data, n = data.length;
    const ids = step.ids || data.map((_, i) => i);
    const sorted = step.sorted || [], swapping = step.swapping || [];
    const slot = Math.max(MIN_SLOT, (wrap.clientWidth || 600) / n);
    const sz = Math.round(Math.max(32, Math.min(64, slot - 12)));
    const fs = sz < 44 ? '.8rem' : '1.15rem';
    wrap.firstChild.style.width = n * slot + 'px';
    wrap.__shelf.style.top = (DOWN_Y + sz + 2) + 'px';
    const movedId = swapping.length ? ids[swapping[0]] : -1;

    wrap.__slots.forEach((s, i) => {
      s.style.width = s.style.height = sz + 'px';
      s.style.transform = 'translate(' + (i * slot + (slot - sz) / 2) + 'px,' + DOWN_Y + 'px)';
    });
    wrap.__els.forEach((el, id) => {
      const pos = ids.indexOf(id);
      if (pos < 0) return;
      const down = sorted.indexOf(pos) >= 0;
      el.style.width = el.style.height = sz + 'px';
      el.style.fontSize = fs;
      el.style.transform = 'translate(' + (pos * slot + (slot - sz) / 2) + 'px,' + (down ? DOWN_Y : UP_Y) + 'px)';
      el.textContent = data[pos];
      el.className = 'tl-tile' + (down ? ' down' : '') + (id === movedId ? ' moved' : '') +
        (!down && pos === step.min ? ' min' : '') + (pos === step.current ? ' scan' : '');
    });

    const beam = wrap.__beam;
    beam.style.width = (sz + 14) + 'px';
    beam.style.height = (UP_Y + sz + 8) + 'px';
    beam.style.transform = 'translate(' + (Math.max(step.current, 0) * slot + (slot - sz) / 2 - 7) + 'px,0)';
    beam.style.opacity = step.current >= 0 ? 1 : 0;

    const focus = step.current >= 0 ? step.current : (swapping.length ? swapping[0] : -1);
    if (focus >= 0 && wrap.scrollWidth > wrap.clientWidth) {
      wrap.scrollTo({ left: focus * slot - wrap.clientWidth / 2 + slot, behavior: 'smooth' });
    }
  }

  window.RENDERERS.tiles = {
    render(canvas, step) {
      let wrap = canvas.firstChild;
      if (!wrap || !wrap.classList || !wrap.classList.contains('tl-wrap') || Number(wrap.dataset.n) !== step.data.length) {
        wrap = build(canvas, step.data.length);
      }
      wrap.__last = step;
      draw(wrap, step);
    }
  };
})();