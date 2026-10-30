/* ==========================================================
   MAIN – connects everything. Shared by ALL algorithms (never changes).

   The algorithms live in the PYTHON backend. This file:
   1) reads ?topic=...&sub=... from the URL (set by the Virtual Lab cards)
   2) asks Python for that algorithm's info      GET  /algorithms/<id>
   3) asks Python to run it on the user's input  POST /algorithms/<id>/run
   4) gives the returned steps to the Player, which walks through them;
      the Renderer draws each step.

   THE CONTRACT with the backend:

   GET  /algorithms/<id>  ->
     { id, title, category, renderer, description,
       focus:      {label, input},                  the "Looking for 9" chip
       legend:     [{cls, label}],
       inputs:     [{id, label, type: 'list' | 'number', placeholder, hint, max_length?}],
       defaults:   {...values for every input},
       pseudocode: [{t, indent}],
       complexity: {time: {...}, space: {...}} }

   POST /algorithms/<id>/run   body: {...input values}  ->  { steps: [...], complexity }
   GET  /algorithms/<id>/random                         ->  {...input values}

   Each step: { data, current, checked, found, missing, line, message,
                vars: [{k, v, hl}], result: null | {type, text} }
   ========================================================== */

// Where the Python server lives. Change this ONE line when you deploy.
const API_BASE = 'http://localhost:8000/api';

// The five speed stops (time between steps). Left = slowest.
const SPEEDS = [
  { label: 'Very slow', ms: 3000 },
  { label: 'Slow',      ms: 2000 },
  { label: 'Normal',    ms: 1300 },
  { label: 'Fast',      ms: 800 },
  { label: 'Turbo',     ms: 450 }
];
const DEFAULT_SPEED = 1;   // "Slow"

(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------- Talking to the server ---------- */
  // Returns the JSON reply, or throws {offline:true} / {status, detail}
  async function api(path, options) {
    let res;
    try {
      res = await fetch(API_BASE + path, options);
    } catch (err) {
      throw { offline: true };                       // server not running / blocked
    }
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).detail; } catch (err) { /* no JSON body */ }
      throw { status: res.status, detail: typeof detail === 'string' ? detail : '' };
    }
    return res.json();
  }

  const sub = new URLSearchParams(location.search).get('sub') || '';

  function showSoon() {
    $('vzSoon').hidden = false;
    $('vzSoonTitle').textContent = sub ? sub.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Visualizer';
  }
  function showOffline() {
    $('vzOffline').hidden = false;
    $('vzOfflineMsg').textContent = 'Start the Python server (run: uvicorn backend.main:app --reload, from the project folder), then try again.';
  }

  // Load the drawing style an algorithm asks for (js/renderers/<name>.js) the first time it is needed.
  function loadRenderer(name) {
    if (window.RENDERERS && window.RENDERERS[name]) return Promise.resolve();
    return new Promise((resolve, reject) => {
      if (!/^[a-z0-9-]+$/.test(name)) return reject(new Error('bad renderer name'));
      const tag = document.createElement('script');
      tag.src = `js/renderers/${name}.js`;
      tag.onload = () => (window.RENDERERS && window.RENDERERS[name] ? resolve() : reject(new Error('renderer missing')));
      tag.onerror = () => reject(new Error('renderer file not found'));
      document.head.appendChild(tag);
    });
  }

  async function init() {
    if (!sub) return showSoon();
    let algo;
    try {
      algo = await api('/algorithms/' + encodeURIComponent(sub));
    } catch (err) {
      return err.status === 404 ? showSoon() : showOffline();   // 404 = not built yet
    }
    try {
      await loadRenderer(algo.renderer);
    } catch (err) {
      return showSoon();                                          // its drawing style is not built yet
    }
    start(algo);
  }

  function start(algo) {
    $('vzLab').hidden = false;

    /* ---------- Heading, pseudocode, legend ---------- */
    document.title = algo.title + ' — DSA Virtual Lab';
    $('vzCategory').textContent = algo.category;
    $('vzTitle').textContent = algo.title;
    $('vzDesc').textContent = algo.description;

    $('vzCode').innerHTML = algo.pseudocode.map((l, i) =>
      `<li data-line="${i}" style="padding-left:${12 + l.indent * 20}px"><span class="n">${i + 1}</span><code>${esc(l.t)}</code></li>`).join('');

    $('vzLegend').innerHTML = algo.legend.map((l) =>
      `<li><i class="vz-lg ${esc(l.cls)}"></i>${esc(l.label)}</li>`).join('');

    /* ---------- Complexity panel (sent by Python, re-drawn on every Run) ---------- */
    function renderComplexity(c) {
      if (!c) return;
      const t = c.time, s = c.space;
      $('vzTime').innerHTML =
        `<h2 class="vz-eyebrow">Time complexity</h2>
         <p class="vz-cx-intro">${esc(t.intro).replace('{n}', '<b>' + t.n + '</b>')}</p>
         <div class="vz-cx-list">${t.cases.map((k) => `
           <div class="vz-cx-row">
             <div><div class="vz-cx-name">${esc(k.name)}</div><div class="vz-cx-big">${esc(k.big)}</div></div>
             <div class="vz-cx-bar">
               <div class="vz-cx-track"><div class="vz-cx-fill ${k.tone === 'low' ? 'low' : k.tone === 'mid' ? 'mid' : ''}" style="width:${Math.round(k.fraction * 100)}%"></div></div>
               <span class="vz-cx-checks">${esc(k.checks)}</span>
             </div>
             <div class="vz-cx-note">${esc(k.note)}</div>
           </div>`).join('')}
         </div>
         <p class="vz-cx-sum">${esc(t.summary).replace('{big}', '<span class="vz-big">' + esc(t.summary_big) + '</span>')}</p>`;
      $('vzSpace').innerHTML =
        `<h2 class="vz-eyebrow">Space complexity</h2>
         <div class="vz-sp">
           <span class="vz-sp-big">${esc(s.big)}</span>
           <p class="vz-sp-text">${esc(s.text).replace('{i}', '<b>i</b>')}</p>
         </div>`;
    }
    renderComplexity(algo.complexity);

    /* ---------- Input form (built from algo.inputs) ---------- */
    const PENCIL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
    $('vzFields').innerHTML = algo.inputs.map((f) => `
      <label class="vz-field vz-field-${f.type}">
        <span>${esc(f.label)}</span>
        <span class="vz-inwrap">${PENCIL}<input type="text" id="in_${f.id}" inputmode="${f.type === 'number' ? 'numeric' : 'text'}" placeholder="${esc(f.placeholder || '')}" spellcheck="false" autocomplete="off"></span>
        ${f.hint ? `<small>${esc(f.hint)}</small>` : ''}
      </label>`).join('');

    function fillForm(values) {
      algo.inputs.forEach((f) => {
        $('in_' + f.id).value = f.type === 'list' ? values[f.id].join(', ') : values[f.id];
      });
    }

    // Read + quick-check the form. (The server checks again – never trust the browser alone.)
    // Only plain whole numbers are accepted (so "0x10", "1e2" or "2.0" are rejected, not silently converted).
    const WHOLE = /^-?\d+$/;
    function readForm() {
      const values = {};
      for (const f of algo.inputs) {
        const raw = $('in_' + f.id).value.trim();
        if (f.type === 'list') {
          const max = f.max_length || 30;
          const parts = raw.split(/[,\s]+/).filter(Boolean);
          if (parts.length === 0) return { error: 'Please enter at least one number in the array.' };
          if (parts.some((x) => !WHOLE.test(x))) return { error: 'The array can only contain whole numbers, separated by commas.' };
          const nums = parts.map(Number);
          if (nums.some((n) => Math.abs(n) > 999)) return { error: 'Please keep each number between -999 and 999.' };
          if (nums.length > max) return { error: `Please use at most ${max} numbers.` };
          values[f.id] = nums;
        } else {
          if (!WHOLE.test(raw) || Math.abs(Number(raw)) > 999) return { error: `Please enter a whole number from -999 to 999 as the ${f.label.toLowerCase()}.` };
          values[f.id] = Number(raw);
        }
      }
      return { values };
    }

    /* ---------- Messages ---------- */
    let error = '';                                   // shown instead of the step text until the next successful run
    function showError(msg) {
      player.pause();                                 // stop any animation so the message is not wiped by the next step
      error = msg;
      $('vzMsg').classList.add('is-bad');
      $('vzMsgText').textContent = msg;
      $('vzResult').style.visibility = 'hidden';      // the line stays reserved, so nothing below it jumps
    }
    function explain(err) {
      if (err.offline) return "Can't reach the Python server. Is it running?";
      return err.detail || 'The server could not run this input.';
    }

    /* ---------- The "Looking for 9" chip ---------- */
    let lastValues = algo.defaults;
    function renderFocus() {
      const f = algo.focus;
      $('vzFocus').innerHTML = f ? `${esc(f.label)} <b>${esc(lastValues[f.input])}</b>` : '';
    }

    /* ---------- Player + drawing ---------- */
    const renderer = window.RENDERERS[algo.renderer];

    const player = new Player((index, step, total) => {
      error = '';                                     // any step change clears an old error message
      renderer.render($('vzCanvas'), step);

      $('vzMsgText').textContent = step.message;
      $('vzMsg').classList.toggle('is-bad', !!(step.result && step.result.type === 'missing'));
      $('vzResult').style.visibility = step.result ? 'visible' : 'hidden';   // reserved space: no layout jump
      if (step.result) {
        $('vzResultText').textContent = step.result.text;
        $('vzResultIcon').innerHTML = step.result.type === 'found' ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M18 6L6 18M6 6l12 12"/>';
      }

      // pseudocode line
      document.querySelectorAll('#vzCode li').forEach((li) =>
        li.classList.toggle('is-active', Number(li.dataset.line) === step.line));

      // live values strip
      $('vzVars').innerHTML = (step.vars || []).map((v) =>
        `<div class="vz-var"><span class="k">${esc(v.k)}</span><span class="v${v.hl ? ' hl' : ''}">${esc(v.v)}</span></div>`).join('');

      // progress + buttons
      $('vzStepLabel').textContent = `Step ${index + 1} / ${total}`;
      $('vzProgress').max = total - 1;
      $('vzProgress').value = index;
      $('vzPrev').disabled = index === 0;
      $('vzNext').disabled = index === total - 1;
    });

    player.onPlayState = (playing) => {
      $('vzPlayText').textContent = playing ? 'Pause' : 'Play';
      $('vzPlay').setAttribute('aria-label', playing ? 'Pause' : 'Play');
      $('vzPlayIcon').innerHTML = playing ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>' : '<path d="M7 4v16l13-8z"/>';
    };

    /* ---------- Speed: five named stops ---------- */
    let speed = DEFAULT_SPEED;
    function applySpeed() {
      const ms = SPEEDS[speed].ms;
      player.setDelay(ms);
      // colour changes finish before the next step starts
      document.querySelector('.vz-stage').style.setProperty('--vz-ms', Math.min(350, Math.round(ms * 0.6)) + 'ms');
      document.querySelectorAll('#vzSpeeds .vz-sp-stop').forEach((b, i) => {
        b.classList.toggle('is-on', i === speed);
        b.setAttribute('aria-pressed', i === speed ? 'true' : 'false');
      });
    }
    $('vzSpeeds').innerHTML = SPEEDS.map((s, i) => `<button type="button" class="vz-sp-stop" data-i="${i}"><i></i>${s.label}</button>`).join('');
    $('vzSpeeds').addEventListener('click', (e) => {
      const b = e.target.closest('.vz-sp-stop');
      if (b) { speed = Number(b.dataset.i); applySpeed(); }
    });

    /* ---------- Send the input to Python, then play the steps ---------- */
    let latestRequest = 0;
    async function run(values, autoplay) {
      const mine = ++latestRequest;                   // ignore slow, out-of-date replies
      try {
        const reply = await api(`/algorithms/${encodeURIComponent(algo.id)}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        if (mine !== latestRequest) return;
        lastValues = values;
        renderFocus();
        renderComplexity(reply.complexity);
        player.setSteps(reply.steps);
        if (autoplay) player.play();                  // Run starts the animation by itself
      } catch (err) {
        if (mine === latestRequest) showError(explain(err));
      }
    }

    async function randomInput() {
      try {
        const values = await api(`/algorithms/${encodeURIComponent(algo.id)}/random`);
        fillForm(values);
        run(values, true);
      } catch (err) {
        showError(explain(err));
      }
    }

    /* ---------- Events ---------- */
    const ready = (fn) => () => { if (player.steps.length) fn(); };   // ignore clicks before steps arrive

    $('vzForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const r = readForm();
      if (r.error) return showError(r.error);
      run(r.values, true);
    });
    $('vzRandom').addEventListener('click', randomInput);

    $('vzPlay').addEventListener('click', ready(() => player.toggle()));
    $('vzNext').addEventListener('click', ready(() => player.next()));
    $('vzPrev').addEventListener('click', ready(() => player.prev()));
    $('vzReset').addEventListener('click', ready(() => player.reset()));
    $('vzProgress').addEventListener('input', ready(() => { player.pause(); player.goTo(Number($('vzProgress').value)); }));

    // Keyboard shortcuts (ignored while typing or while a slider has focus)
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || !player.steps.length) return;
      if (e.code === 'Space') {
        if (tag === 'button' || tag === 'a') return;  // a focused button already reacts to Space itself
        e.preventDefault(); player.toggle();
      }
      else if (e.key === 'ArrowRight') player.next();
      else if (e.key === 'ArrowLeft') player.prev();
    });

    /* ---------- Start (shows the first step, paused) ---------- */
    fillForm(algo.defaults);
    renderFocus();
    applySpeed();
    run(algo.defaults, false);
  }

  init();
})();