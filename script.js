/* =========================================================
   Portfolio « Lab Notebook » — comportements
   ========================================================= */
(function () {
  'use strict';

  // Indique au CSS que JavaScript est actif (pour les animations d'apparition)
  document.documentElement.classList.add('js');

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

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

  /* ---------- 3. Apparition des éléments au scroll ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
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

  /* ---------- 5. Courbe de signal ECG/IMU dessinée au scroll ----------
     Un tracé vertical dans la marge gauche, ponctué de complexes QRS.
     Sa longueur visible dépend de la progression du scroll. */
  var svg = $('#signal');
  var line = $('#signal-line');
  var ghost = $('#signal-ghost');
  var pathLen = 0;

  function buildSignal() {
    var h = document.documentElement.scrollHeight;
    var x0 = window.innerWidth < 480 ? 14 : 26;     // axe de base de la courbe
    var amp = window.innerWidth < 480 ? 9 : 16;     // amplitude des pics
    var beat = 170;                                  // hauteur d'un battement (px)

    svg.style.height = h + 'px';
    svg.setAttribute('viewBox', '0 0 ' + window.innerWidth + ' ' + h);

    // Génération : segment plat, onde P, pic QRS, onde T, par battement
    var d = 'M' + x0 + ' 0';
    for (var y = 0; y < h; y += beat) {
      d += ' L' + x0 + ' ' + (y + beat * 0.30);                         // ligne de base
      d += ' Q' + (x0 + amp * 0.4) + ' ' + (y + beat * 0.34) + ' ' + x0 + ' ' + (y + beat * 0.38); // onde P
      d += ' L' + x0 + ' ' + (y + beat * 0.48);
      d += ' L' + (x0 - amp * 0.4) + ' ' + (y + beat * 0.50);           // Q
      d += ' L' + (x0 + amp) + ' ' + (y + beat * 0.56);                 // R (pic)
      d += ' L' + (x0 - amp * 0.7) + ' ' + (y + beat * 0.62);           // S
      d += ' L' + x0 + ' ' + (y + beat * 0.65);
      d += ' Q' + (x0 + amp * 0.6) + ' ' + (y + beat * 0.78) + ' ' + x0 + ' ' + (y + beat * 0.90); // onde T
      d += ' L' + x0 + ' ' + (y + beat);
    }
    ghost.setAttribute('d', d);
    line.setAttribute('d', d);

    pathLen = line.getTotalLength();
    line.style.strokeDasharray = pathLen;
    updateSignal();
  }

  function updateSignal() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
    // On dessine un peu plus loin que le bas de l'écran pour un effet « en direct »
    var reach = (window.scrollY + window.innerHeight * 0.8) / document.documentElement.scrollHeight;
    var ratio = Math.min(1, Math.max(p * 0.2, reach));
    line.style.strokeDashoffset = pathLen * (1 - ratio);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { updateSignal(); markCurrent(); ticking = false; });
  }, { passive: true });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildSignal, 150);
  });
  window.addEventListener('load', buildSignal);   // hauteur finale connue après chargement
  buildSignal();
  markCurrent();

  /* ---------- 6. Filtre des compétences ---------- */
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
        g.classList.toggle('is-hidden', f !== 'all' && g.getAttribute('data-cat') !== f);
      });
      setTimeout(buildSignal, 50);   // la hauteur de page a changé
    });
  });

  /* ---------- 7. Modales « étude de cas » ---------- */
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

  /* ---------- 8. Formulaire de contact (Formspree) ---------- */
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
      say("Formulaire non configuré : remplace YOUR_FORM_ID dans index.html.", 'err');
      return;
    }

    say('Envoi en cours…', 'ok');
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (r) {
      if (r.ok) { say('Merci ! Ton message a bien été envoyé.', 'ok'); form.reset(); }
      else say("Une erreur est survenue. Réessaie ou contacte-moi via LinkedIn.", 'err');
    }).catch(function () {
      say('Connexion impossible. Réessaie dans un instant.', 'err');
    });
  });

  /* ---------- 9. Année du pied de page ---------- */
  $('#year').textContent = new Date().getFullYear();
})();
