/* ==========================================================
   BUBBLES RENDERER – Bubble Sort as bubbles floating up to the surface

   Like every renderer it only DRAWS one step. It adds its own CSS, so this one file is
   all the frontend needs for Bubble Sort.

   Step fields it reads:
     data       the numbers (the size of a bubble follows the size of the number)
     ids        ids[position] = which original number sits there, so the same bubble can slide
     comparing  [a, b] positions being compared    -> both bubbles lift up with a lime ring
     swapping   [a, b] positions just swapped      -> amber, they slide past each other
     sorted     positions that are final           -> the bubble rests at the surface
   Legend classes used: cur (ring), swp (amber), srt (green)
   ========================================================== */
window.RENDERERS = window.RENDERERS || {};

(function () {
  const H = 300;                                      // height of the picture in px
  const MIN_SLOT = 36;                                // narrowest column; wider arrays scroll sideways

  const style = document.createElement('style');
  style.textContent = `
    .bb-wrap { position: relative; width: 100%; height: ${H}px; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; scrollbar-color: #3E3F4A transparent; }
    .bb-track { position: relative; height: ${H}px; min-width: 100%; }
    .bb-sea { position: absolute; left: 0; right: 0; top: 52px; bottom: 0; background: linear-gradient(rgba(196, 240, 66, .06), rgba(196, 240, 66, 0) 70%); }
    .bb-water { position: absolute; left: 0; right: 0; top: 52px; border-top: 1.5px dashed rgba(196, 240, 66, .45); }
    .bb-water span { position: absolute; right: 14px; top: 6px; font: 600 .66rem var(--font-mono); letter-spacing: .08em; text-transform: uppercase; color: rgba(196, 240, 66, .7); }
    .bb-bub { position: absolute; left: 0; top: 0; border-radius: 50%; display: grid; place-items: center;
              transition: transform var(--vz-ms, 300ms) cubic-bezier(.3, .7, .3, 1), width var(--vz-ms, 300ms), height var(--vz-ms, 300ms); }
    .bb-bub i { position: absolute; inset: 0; border-radius: 50%; border: 1.5px solid #5A5B68;
                background: radial-gradient(circle at 32% 28%, rgba(255, 255, 255, .26), rgba(255, 255, 255, 0) 38%), #3E3F4A;
                transition: background var(--vz-ms, 300ms), border-color var(--vz-ms, 300ms), box-shadow var(--vz-ms, 300ms); animation: bb-bob 3.4s ease-in-out infinite; }
    .bb-bub b { position: relative; font-family: var(--font-mono); font-weight: 600; color: var(--ink, #F2F2F0); }
    .bb-bub.cmp { z-index: 2; }
    .bb-bub.cmp i { border: 2px solid var(--lime); box-shadow: 0 0 0 5px rgba(196, 240, 66, .16); }
    .bb-bub.swp { z-index: 2; }
    .bb-bub.swp i { background: radial-gradient(circle at 32% 28%, rgba(255, 255, 255, .45), rgba(255, 255, 255, 0) 38%), #F5A524; border-color: #F5A524; box-shadow: 0 0 0 6px rgba(245, 165, 36, .22); }
    .bb-bub.swp b { color: #1D1E24; }
    .bb-bub.done i { background: radial-gradient(circle at 32% 28%, rgba(255, 255, 255, .35), rgba(255, 255, 255, 0) 38%), #6F8F25; border-color: #A8CF3A; }
    @keyframes bb-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    .vz-lg.swp { background: #F5A524; border-color: #F5A524; }
    .vz-lg.srt { background: #6F8F25; border-color: #A8CF3A; }
    @media (prefers-reduced-motion: reduce) { .bb-bub i { animation: none; } }
  `;
  document.head.appendChild(style);

  function build(canvas, n) {
    canvas.innerHTML = '<div class="bb-wrap"><div class="bb-track"><div class="bb-sea"></div><div class="bb-water"><span>Surface</span></div></div></div>';
    const wrap = canvas.firstChild, track = wrap.firstChild;
    wrap.dataset.n = n;
    wrap.__els = [];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'bb-bub';
      el.innerHTML = '<i></i><b></b>';
      track.appendChild(el);
      wrap.__els.push(el);
    }
    if (window.ResizeObserver) new ResizeObserver(() => wrap.__last && draw(wrap, wrap.__last)).observe(wrap);
    return wrap;
  }

  function draw(wrap, step) {
    const data = step.data, n = data.length;
    const ids = step.ids || data.map((_, i) => i);
    const sorted = step.sorted || [], comparing = step.comparing || [], swapping = step.swapping || [];
    const slot = Math.max(MIN_SLOT, (wrap.clientWidth || 600) / n);
    wrap.firstChild.style.width = n * slot + 'px';
    const maxAbs = Math.max(1, ...data.map(Math.abs));
    const cap = Math.max(28, Math.min(88, slot - 8));

    wrap.__els.forEach((el, id) => {
      const pos = ids.indexOf(id);
      if (pos < 0) return;
      const v = data[pos];
      const d = Math.round(26 + (cap - 26) * Math.abs(v) / maxAbs);
      const done = sorted.indexOf(pos) >= 0;
      const isSwap = swapping.indexOf(pos) >= 0, isCmp = comparing.indexOf(pos) >= 0;
      const x = pos * slot + (slot - d) / 2;
      const y = done ? 66 : H * 0.68 - d / 2 - (isCmp || isSwap ? 54 : 0);
      el.style.width = el.style.height = d + 'px';
      el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      el.lastChild.textContent = v;
      el.lastChild.style.fontSize = Math.max(10, Math.min(17, Math.round(d * 0.36))) + 'px';
      el.className = 'bb-bub' + (done ? ' done' : '') + (!done && isSwap ? ' swp' : '') + (!done && isCmp && !isSwap ? ' cmp' : '');
    });

    // keep the action in view when the row scrolls sideways
    const focus = swapping.length ? swapping[0] : (comparing.length ? comparing[0] : -1);
    if (focus >= 0 && wrap.scrollWidth > wrap.clientWidth) {
      wrap.scrollTo({ left: focus * slot - wrap.clientWidth / 2 + slot, behavior: 'smooth' });
    }
  }

  window.RENDERERS.bubbles = {
    render(canvas, step) {
      let wrap = canvas.firstChild;
      if (!wrap || !wrap.classList || !wrap.classList.contains('bb-wrap') || Number(wrap.dataset.n) !== step.data.length) {
        wrap = build(canvas, step.data.length);
      }
      wrap.__last = step;
      draw(wrap, step);
    }
  };
})();