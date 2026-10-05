/* =========================================================
   Portfolio « Lab Notebook » — comportements
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Réglages à personnaliser ---------- */
  // TODO : vérifier que c'est bien ton pseudo GitHub (utilisé pour charger les dépôts)
  var GITHUB_USER = 'amaviviekouvo-cyber';
  // Seuls les dépôts portant ce topic GitHub sont affichés
  var REPO_TOPIC = 'portfolio';

  // Indique au CSS que JavaScript est actif (pour les animations d'apparition)
  document.documentElement.classList.add('js');

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 0. Préférences : animations réduites / mode léger ---------- */
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Mode léger : petit écran ou écran tactile → moins d'effets coûteux
  var lite = matchMedia('(max-width: 820px), (pointer: coarse)').matches;
  if (lite) document.documentElement.classList.add('lite');

  /* ---------- 1. Thème sombre / clair mémorisé ---------- */
  var root = document.documentElement;
  $('#theme-toggle').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* stockage indisponible */ }
  });

  /* ---------- 2. Menu mobile ---------- */
  var toggle = $('#nav-toggle');
  var nav = $('#nav');
  function closeNav() {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });

  /* ---------- 3. Apparition des éléments au scroll (fade + slide) ---------- */
  // Numérote les badges de compétences pour les faire apparaître en cascade
  $$('.skill-group ul').forEach(function (ul) {
    $$('li', ul).forEach(function (li, i) { li.style.setProperty('--i', i); });
  });

  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var t = e.target;
          t.classList.add('in');
          io.unobserve(t);
          // Retire le décalage une fois l'apparition finie (sinon il ralentirait le survol)
          setTimeout(function () { t.style.transitionDelay = ''; }, 1200);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el, i) {
      // léger décalage entre éléments frères pour un effet « en cascade »
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 4. Lien de navigation actif ---------- */
  var links = $$('.nav a');
  var sections = links.map(function (a) { return $(a.getAttribute('href')); });
  function markCurrent() {
    var y = window.scrollY + window.innerHeight * 0.35;
    var current = -1;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= y) current = i; });
    links.forEach(function (a, i) { a.classList.toggle('is-current', i === current); });
  }

  /* ---------- 5. Courbe ECG dessinée au scroll ----------
     Tracé vertical dans la marge gauche, ponctué de complexes QRS.
     La longueur visible dépend de la progression du scroll. */
  var svg = $('#signal');
  var line = $('#signal-line');
  var ghost = $('#signal-ghost');
  var pathLen = 0;

  function buildSignal() {
    var h = document.documentElement.scrollHeight;
    var small = window.innerWidth < 480;
    var x0 = small ? 14 : 26;          // axe de base de la courbe
    var amp = small ? 9 : 16;          // amplitude des pics
    var beat = 170;                    // hauteur d'un battement (px)

    svg.style.height = h + 'px';
    $('#sig-grad').setAttribute('y2', h);   // le dégradé s'étend sur toute la hauteur de la page
    svg.setAttribute('viewBox', '0 0 ' + window.innerWidth + ' ' + h);

    // Un battement : ligne de base, onde P, complexe QRS, onde T
    var d = 'M' + x0 + ' 0';
    for (var y = 0; y < h; y += beat) {
      d += ' L' + x0 + ' ' + (y + beat * 0.30);
      d += ' Q' + (x0 + amp * 0.4) + ' ' + (y + beat * 0.34) + ' ' + x0 + ' ' + (y + beat * 0.38);   // onde P
      d += ' L' + x0 + ' ' + (y + beat * 0.48);
      d += ' L' + (x0 - amp * 0.4) + ' ' + (y + beat * 0.50);                                         // Q
      d += ' L' + (x0 + amp) + ' ' + (y + beat * 0.56);                                               // R (pic)
      d += ' L' + (x0 - amp * 0.7) + ' ' + (y + beat * 0.62);                                         // S
      d += ' L' + x0 + ' ' + (y + beat * 0.65);
      d += ' Q' + (x0 + amp * 0.6) + ' ' + (y + beat * 0.78) + ' ' + x0 + ' ' + (y + beat * 0.90);   // onde T
      d += ' L' + x0 + ' ' + (y + beat);
    }
    ghost.setAttribute('d', d);
    line.setAttribute('d', d);

    pathLen = line.getTotalLength();
    line.style.strokeDasharray = pathLen;
    updateSignal();
  }

  function updateSignal() {
    var total = document.documentElement.scrollHeight;
    if (reduced) { line.style.strokeDashoffset = 0; return; }   // tracé complet, sans animation
    // On dessine un peu plus loin que le bas de l'écran pour un effet « en direct »
    var ratio = Math.min(1, (window.scrollY + window.innerHeight * 0.8) / total);
    line.style.strokeDashoffset = pathLen * (1 - ratio);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { updateSignal(); markCurrent(); ticking = false; });
  }, { passive: true });

  // Reconstruit le tracé quand la taille de la page change (resize, dépôts chargés, filtre…)
  var rebuildTimer;
  function scheduleBuild() {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(buildSignal, 150);
  }
  if ('ResizeObserver' in window) new ResizeObserver(scheduleBuild).observe(document.body);
  window.addEventListener('resize', scheduleBuild);
  window.addEventListener('load', buildSignal);
  buildSignal();
  markCurrent();

  /* ---------- 6. Anneau « moniteur cardiaque » autour de la photo ----------
     Un cercle dont le rayon est déformé par 3 complexes QRS. */
  (function buildRing() {
    var base = $('#ring-base');
    var pulse = $('#ring-pulse');
    var N = 540, R = 50, beats = 3, d = '';
    // Points clés d'un battement : [position 0..1, déviation radiale]
    var qrs = [[0.10, 0], [0.13, 2.2], [0.16, 0], [0.26, 0], [0.275, -3], [0.31, 11], [0.345, -6], [0.37, 0],
               [0.50, 0], [0.56, 3.5], [0.62, 0]];
    function dev(u) {
      for (var k = 0; k < qrs.length - 1; k++) {
        if (u >= qrs[k][0] && u <= qrs[k + 1][0]) {
          var t = (u - qrs[k][0]) / (qrs[k + 1][0] - qrs[k][0]);
          return qrs[k][1] + (qrs[k + 1][1] - qrs[k][1]) * t;
        }
      }
      return 0;
    }
    for (var i = 0; i <= N; i++) {
      var f = i / N;
      var r = R + dev((f * beats) % 1);
      var a = f * 2 * Math.PI - Math.PI / 2;
      d += (i ? ' L' : 'M') + (r * Math.cos(a)).toFixed(2) + ' ' + (r * Math.sin(a)).toFixed(2);
    }
    [base, pulse].forEach(function (p) {
      p.setAttribute('d', d);
      p.setAttribute('pathLength', '100');   // longueur normalisée pour l'animation CSS
    });
  })();

  /* ---------- 7. Effet machine à écrire sur l'accroche ---------- */
  (function typewriter() {
    var h = $('#headline');
    if (reduced) return;                       // texte complet affiché tel quel
    var full = h.textContent;
    h.setAttribute('aria-label', full);        // lecteurs d'écran : phrase complète d'emblée
    h.style.minHeight = h.offsetHeight + 'px'; // évite que la page saute pendant la frappe

    // Découpe en segments (texte simple / mots surlignés) pour conserver la mise en forme
    var parts = [];
    Array.prototype.forEach.call(h.childNodes, function (n) {
      parts.push({ text: n.textContent, cls: n.nodeType === 1 ? n.className : '' });
    });
    h.textContent = '';
    h.classList.add('caret');

    var nodes = parts.map(function (p) {
      var el = p.cls ? document.createElement('span') : document.createTextNode('');
      if (p.cls) el.className = p.cls;
      // Le curseur reste à la fin : on insère avant lui via le CSS (::after), donc simple append
      h.appendChild(el);
      return el;
    });

    var seg = 0, pos = 0;
    function write(n, txt) { if (n.nodeType === 3) n.nodeValue = txt; else n.textContent = txt; }
    function tick() {
      if (seg >= parts.length) { setTimeout(function () { h.classList.remove('caret'); }, 2500); return; }
      pos++;
      write(nodes[seg], parts[seg].text.slice(0, pos));
      if (pos >= parts[seg].text.length) { seg++; pos = 0; }
      setTimeout(tick, 32 + Math.random() * 30);
    }
    setTimeout(tick, 600);
  })();

  /* ---------- 8. Parallaxe des icônes du hero (suit la souris) ---------- */
  (function parallax() {
    if (reduced || lite) return;
    var hero = $('#hero');
    var items = $$('.fl').map(function (el) { return { el: el, depth: parseFloat(el.dataset.depth) || 20 }; });
    var tx = 0, ty = 0, cx = 0, cy = 0, running = false;

    function frame() {
      // Interpolation douce vers la position cible
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      items.forEach(function (it) {
        it.el.style.transform = 'translate3d(' + (cx * it.depth).toFixed(2) + 'px,' + (cy * it.depth).toFixed(2) + 'px,0)';
      });
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) requestAnimationFrame(frame);
      else running = false;
    }
    function go() { if (!running) { running = true; requestAnimationFrame(frame); } }

    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;    // -1 … 1
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      go();
    });
    hero.addEventListener('mouseleave', function () { tx = 0; ty = 0; go(); });
  })();

  /* ---------- 9. Tilt 3D des cartes (délégation : inclut les dépôts chargés plus tard) ---------- */
  (function tilt() {
    if (reduced || lite) return;
    var last = null;
    function reset(el) {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      el.classList.remove('is-tilting');
    }
    document.addEventListener('mousemove', function (e) {
      var card = e.target.closest ? e.target.closest('.tilt') : null;
      if (last && last !== card) { reset(last); last = null; }
      if (!card) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', ((px - 0.5) * 10).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-(py - 0.5) * 8).toFixed(2) + 'deg');
      card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      card.classList.add('is-tilting');
      last = card;
    });
    document.addEventListener('mouseleave', function () { if (last) { reset(last); last = null; } });
  })();

  /* ---------- 9 bis. Curseur personnalisé (petit point rose, desktop uniquement) ---------- */
  (function cursor() {
    if (reduced || lite) return;
    var dot = document.createElement('div');
    dot.id = 'cursor';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);

    var x = 0, y = 0, dx = 0, dy = 0, running = false;
    function frame() {
      dx += (x - dx) * 0.25;           // suit la souris avec un léger retard
      dy += (y - dy) * 0.25;
      dot.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
      if (Math.abs(x - dx) > 0.1 || Math.abs(y - dy) > 0.1) requestAnimationFrame(frame);
      else running = false;
    }
    document.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      dot.classList.add('on');
      // Le point grossit au-dessus des éléments cliquables
      var hot = e.target.closest && e.target.closest('a, button, [role="button"], input, textarea');
      dot.classList.toggle('big', !!hot);
      if (!running) { running = true; requestAnimationFrame(frame); }
    });
    document.addEventListener('mouseleave', function () { dot.classList.remove('on'); });
  })();

  /* ---------- 10. Filtre des compétences ---------- */
  var chips = $$('.chip');
  var groups = $$('.skill-group');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      groups.forEach(function (g) {
        var hide = f !== 'all' && g.getAttribute('data-cat') !== f;
        g.classList.toggle('is-hidden', hide);
        if (!hide) {
          // Relance l'animation en cascade des badges
          g.classList.add('replay');
          void g.offsetWidth;            // force le recalcul du style
          g.classList.remove('replay');
        }
      });
    });
  });

  /* ---------- 11. Modale « étude de cas » ---------- */
  var lastFocus = null;

  function openModal(m) {
    lastFocus = document.activeElement;
    m.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.modal-close', m).focus();
  }
  function closeModal(m) {
    m.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  $$('[data-modal]').forEach(function (card) {
    var m = document.getElementById(card.getAttribute('data-modal'));
    card.addEventListener('click', function () { openModal(m); });
    card.addEventListener('keydown', function (e) {   // accessibilité clavier
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(m); }
    });
  });
  $$('.modal').forEach(function (m) {
    $('.modal-close', m).addEventListener('click', function () { closeModal(m); });
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(m); }); // clic sur le fond
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') $$('.modal:not([hidden])').forEach(closeModal);
  });

  /* ---------- 12. Dépôts GitHub (topic « portfolio ») ---------- */
  var reposBox = $('#repos');

  // Crée un élément avec classe et texte (textContent : pas d'injection HTML depuis l'API)
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  // N'accepte que des liens http(s) pour le champ « homepage »
  function safeUrl(u) {
    if (!u) return null;
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try { var x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch (e) { return null; }
  }
  function message(text, withRetry) {
    reposBox.setAttribute('aria-busy', 'false');
    reposBox.textContent = '';
    var box = el('div', 'repos-msg');
    box.appendChild(el('p', '', text));
    if (withRetry) {
      var b = el('button', 'btn btn-ghost', 'Réessayer');
      b.type = 'button';
      b.addEventListener('click', loadRepos);
      box.appendChild(b);
    }
    reposBox.appendChild(box);
  }
  function repoCard(r, i) {
    var card = el('article', 'card repo tilt');
    card.style.setProperty('--i', i);
    card.appendChild(el('h3', '', r.name));
    card.appendChild(el('p', '', r.description || 'Pas de description pour le moment.'));

    var meta = el('div', 'repo-meta');
    if (r.language) meta.appendChild(el('span', 'lang', r.language));
    meta.appendChild(el('span', '', '★ ' + r.stargazers_count));
    card.appendChild(meta);

    var actions = el('div', 'repo-links');
    var gh = el('a', '', 'GitHub');
    gh.href = r.html_url; gh.target = '_blank'; gh.rel = 'noopener';
    actions.appendChild(gh);
    var demoUrl = safeUrl(r.homepage);      // lien démo seulement si homepage est rempli
    if (demoUrl) {
      var demo = el('a', '', 'Démo');
      demo.href = demoUrl; demo.target = '_blank'; demo.rel = 'noopener';
      actions.appendChild(demo);
    }
    card.appendChild(actions);
    return card;
  }

  function loadRepos() {
    // État de chargement : squelettes
    reposBox.setAttribute('aria-busy', 'true');
    reposBox.textContent = '';
    for (var k = 0; k < 3; k++) reposBox.appendChild(el('div', 'card skeleton'));

    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timeout = setTimeout(function () { if (ctrl) ctrl.abort(); }, 10000);

    fetch('https://api.github.com/users/' + encodeURIComponent(GITHUB_USER) + '/repos?per_page=100&sort=updated', {
      headers: { 'Accept': 'application/vnd.github+json' },
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);   // ex. quota dépassé (403)
      return res.json();
    }).then(function (all) {
      var list = all.filter(function (r) { return (r.topics || []).indexOf(REPO_TOPIC) !== -1; });
      if (!list.length) {
        message('Aucun dépôt avec le topic « ' + REPO_TOPIC + ' » pour le moment. D\'autres projets arrivent bientôt.', false);
        return;
      }
      reposBox.textContent = '';
      list.forEach(function (r, i) { reposBox.appendChild(repoCard(r, i)); });
      reposBox.setAttribute('aria-busy', 'false');
    }).catch(function () {
      message('Impossible de charger mes projets GitHub pour le moment.', true);
    }).then(function () { clearTimeout(timeout); });
  }
  loadRepos();

  /* ---------- 13. Formulaire de contact (Formspree) ---------- */
  var form = $('#contact-form');
  var status = $('#form-status');

  function say(msg, type) {
    status.textContent = msg;
    status.className = 'form-status ' + type;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Validation simple côté client
    var ok = true;
    $$('input[required], textarea[required]', form).forEach(function (f) {
      var bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { say('Merci de remplir correctement tous les champs.', 'err'); return; }

    // Avertit si l'identifiant Formspree n'a pas encore été remplacé
    if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
      say('Formulaire non configuré : remplace YOUR_FORM_ID dans index.html.', 'err');
      return;
    }

    say('Envoi en cours…', 'ok');
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (r) {
      if (r.ok) { say('Merci ! Ton message a bien été envoyé.', 'ok'); form.reset(); }
      else say('Une erreur est survenue. Réessaie ou contacte-moi via LinkedIn.', 'err');
    }).catch(function () {
      say('Connexion impossible. Réessaie dans un instant.', 'err');
    });
  });

  /* ---------- 14. Année du pied de page ---------- */
  $('#year').textContent = new Date().getFullYear();
})();
