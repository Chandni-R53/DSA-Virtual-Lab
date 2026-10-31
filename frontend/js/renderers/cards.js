/* ==========================================================
   CARDS RENDERER – Insertion Sort as a hand of playing cards

   Step fields it reads:
     data       the numbers
     ids        ids[position] = which original card sits there, so the same card can slide
     key        position of the card held in the hand (-1 = none) -> lifted, tilted, lime, with a gap under it
     comparing  [a, b] positions being compared -> lime ring on the card that is not the key
     swapping   [a, b] positions just swapped    -> the card that slid right gets an amber ring
     sorted     positions already in order       -> green edge on top of the card
   Legend classes used: crd (card), fnd (key), cur (ring), swp (amber ring), srt (in order)
   ========================================================== */
window.RENDERERS = window.RENDERERS || {};

(function () {
  const H = 300, BASE_Y = 150, LIFT = 66, MIN_SLOT = 46;

  const style = document.createElement('style');
  style.textContent = `
    .cd-wrap { position: relative; width: 100%; height: ${H}px; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; scrollbar-color: #3E3F4A transparent; }
    .cd-track { position: relative; height: ${H}px; min-width: 100%; background: radial-gradient(ellipse at 50% 85%, rgba(196, 240, 66, .07), transparent 62%); }
    .cd-card { position: absolute; left: 0; top: 0; border-radius: 9px; background: #ECEAE2; color: #1D1E24; border: 1px solid #B9B6AA;
               box-shadow: 0 6px 14px rgba(0, 0, 0, .35); font-family: var(--font-mono);
               transition: transform var(--vz-ms, 300ms) cubic-bezier(.3, .7, .3, 1), background var(--vz-ms, 300ms), box-shadow var(--vz-ms, 300ms), width var(--vz-ms, 300ms), height var(--vz-ms, 300ms); }
    .cd-card em { position: absolute; font-style: normal; font-weight: 600; font-size: .72rem; }
    .cd-card em.tl { left: 6px; top: 4px; } .cd-card em.br { right: 6px; bottom: 4px; transform: rotate(180deg); }
    .cd-card b { position: absolute; inset: 0; display: grid; place-items: center; font-weight: 600; }
    .cd-card.ok { border-top: 4px solid #6F8F25; }
    .cd-card.cmp { box-shadow: 0 0 0 3px var(--lime), 0 6px 14px rgba(0, 0, 0, .35); }
    .cd-card.slid { box-shadow: 0 0 0 3px #F5A524, 0 6px 14px rgba(0, 0, 0, .35); }
    .cd-card.key { background: var(--lime); border-color: var(--lime); z-index: 3; }
    .cd-card.key.up { box-shadow: 0 18px 26px rgba(0, 0, 0, .5); }
    .cd-hole { position: absolute; left: 0; top: 0; border: 2px dashed var(--lime); border-radius: 9px; transition: transform var(--vz-ms, 300ms) cubic-bezier(.3, .7, .3, 1), opacity .2s, width var(--vz-ms, 300ms), height var(--vz-ms, 300ms); }
    .vz-lg.crd { background: #ECEAE2; border-color: #B9B6AA; }
    .vz-lg.hol { background: transparent; border: 1.5px dashed var(--lime); }
    .vz-lg.swp { background: transparent; border-color: #F5A524; }
    .vz-lg.srt { background: #ECEAE2; border-color: #B9B6AA; border-top: 4px solid #6F8F25; }
  `;
  document.head.appendChild(style);

  function build(canvas, n) {
    canvas.innerHTML = '<div class="cd-wrap"><div class="cd-track"><div class="cd-hole"></div></div></div>';
    const wrap = canvas.firstChild, track = wrap.firstChild;
    wrap.dataset.n = n;
    wrap.__hole = track.firstChild;
    wrap.__els = [];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'cd-card';
      c.innerHTML = '<em class="tl"></em><b></b><em class="br"></em>';
      track.appendChild(c);
      wrap.__els.push(c);
    }
    if (window.ResizeObserver) new ResizeObserver(() => wrap.__last && draw(wrap, wrap.__last)).observe(wrap);
    return wrap;
  }

  function draw(wrap, step) {
    const data = step.data, n = data.length;
    const ids = step.ids || data.map((_, i) => i);
    const sorted = step.sorted || [], comparing = step.comparing || [], swapping = step.swapping || [];
    const key = step.key == null ? -1 : step.key;
    const slot = Math.max(MIN_SLOT, (wrap.clientWidth || 600) / n);
    const cw = Math.round(Math.max(34, Math.min(76, slot - 12))), ch = Math.round(cw * 1.4);
    wrap.firstChild.style.width = n * slot + 'px';

    const hole = wrap.__hole;
    hole.style.width = cw + 'px'; hole.style.height = ch + 'px';
    hole.style.transform = 'translate(' + (Math.max(key, 0) * slot + (slot - cw) / 2) + 'px,' + BASE_Y + 'px)';
    hole.style.opacity = key >= 0 ? 0.85 : 0;

    wrap.__els.forEach((el, id) => {
      const pos = ids.indexOf(id);
      if (pos < 0) return;
      const isKey = pos === key;
      const x = pos * slot + (slot - cw) / 2, y = isKey ? BASE_Y - LIFT : BASE_Y;
      el.style.width = cw + 'px'; el.style.height = ch + 'px';
      el.style.transform = 'translate(' + x + 'px,' + y + 'px)' + (isKey ? ' rotate(-5deg)' : '');
      const v = data[pos];
      el.children[0].textContent = v; el.children[2].textContent = v;
      el.children[1].textContent = v;
      el.children[1].style.fontSize = (cw < 48 ? 1.05 : 1.6) + 'rem';
      el.className = 'cd-card' + (isKey ? ' key up' : '') +
        (!isKey && comparing.indexOf(pos) >= 0 ? ' cmp' : '') +
        (!isKey && swapping.indexOf(pos) >= 0 ? ' slid' : '') +
        (!isKey && sorted.indexOf(pos) >= 0 ? ' ok' : '');
    });

    const focus = key >= 0 ? key : (comparing.length ? comparing[0] : -1);
    if (focus >= 0 && wrap.scrollWidth > wrap.clientWidth) {
      wrap.scrollTo({ left: focus * slot - wrap.clientWidth / 2 + slot, behavior: 'smooth' });
    }
  }

  window.RENDERERS.cards = {
    render(canvas, step) {
      let wrap = canvas.firstChild;
      if (!wrap || !wrap.classList || !wrap.classList.contains('cd-wrap') || Number(wrap.dataset.n) !== step.data.length) {
        wrap = build(canvas, step.data.length);
      }
      wrap.__last = step;
      draw(wrap, step);
    }
  };
})();