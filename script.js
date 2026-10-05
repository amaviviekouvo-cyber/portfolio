/* =========================================================
   Vivi's Lab : comportements et dessin de la scène pixel art
   =========================================================
   Sommaire
   1. Réglages et utilitaires
   2. Thème jour / nuit
   3. Dessin de la scène (SVG généré, pixel par pixel)
   4. Objets cliquables : infobulles, activation, plante
   5. Panneaux (fenêtres rétro) et focus clavier
   6. Mode scène / version rapide
   7. Menu mobile, compétences, anneau de la photo
   8. Dépôts GitHub
   9. Formulaire de contact
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. Réglages et utilitaires ---------- */
  // TODO : vérifier que c'est bien ton pseudo GitHub (utilisé pour charger les dépôts)
  var GITHUB_USER = 'amaviviekouvo-cyber';
  // Seuls les dépôts portant ce topic GitHub sont affichés
  var REPO_TOPIC = 'portfolio';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var body = document.body;

  /* ---------- 2. Thème jour / nuit (mémorisé) ---------- */
  $('#theme-toggle').addEventListener('click', function () {
    var root = document.documentElement;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* stockage indisponible */ }
  });

  /* ---------- 3. Dessin de la scène ----------
     La scène est une grille de 320 x 180 « pixels » (viewBox du SVG).
     Chaque élément est un rectangle coloré par une classe c-xxx (voir style.css),
     ce qui permet de changer les couleurs, le jour/nuit et l'avatar uniquement en CSS. */

  // R : crée un rectangle pixel (classe de couleur, x, y, largeur, hauteur, classe d'animation, style inline)
  function R(c, x, y, w, h, extra, style) {
    return '<rect class="c-' + c + (extra ? ' ' + extra : '') + '" x="' + x + '" y="' + y +
           '" width="' + w + '" height="' + h + '"' + (style ? ' style="' + style + '"' : '') + '/>';
  }
  // Remplit un groupe SVG existant avec du markup
  function fill(sel, markup) { $(sel).innerHTML = markup; }

  var sceneBuilt = false;

  function buildScene() {
    if (sceneBuilt) return;
    sceneBuilt = true;
    var s, i, x, y;

    /* --- Fond : mur, soubassement, guirlande lumineuse --- */
    s = R('wall', -400, -300, 1120, 430) + R('wall2', -400, 98, 1120, 32) + R('trim', -400, 96, 1120, 2);
    // petits motifs de papier peint
    for (y = 8; y < 92; y += 14) for (x = -10; x < 330; x += 14) s += R('wallp', x + ((y / 14) % 2 ? 7 : 0), y, 1, 1);
    // fil de la guirlande (courbe) puis ampoules chaudes qui scintillent
    s += '<path class="c-wire" d="M-20 4Q160 20 340 4" fill="none" stroke-width=".6"/>';
    for (i = 0; i <= 20; i++) {
      var t = i / 20;
      var bx = Math.round(-20 + 360 * t);
      var by = Math.round(4 * (1 - t) * (1 - t) + 40 * t * (1 - t) + 4 * t * t);
      s += R('warm', bx - 1, by + 1, 3, 3, 'twinkle', '--d:' + ((i * 7) % 5) * 0.45 + 's');
    }
    fill('#bg', s);

    /* --- Fenêtre sur la mer et les collines de Toulon --- */
    s = R('wood', 11, 11, 88, 76);
    s += '<g clip-path="url(#clip-win)">';
    s += R('sky1', 16, 16, 78, 14) + R('sky2', 16, 30, 78, 14) + R('sky3', 16, 44, 78, 20);
    // étoiles et lune (nuit seulement)
    var stars = [[22, 20], [34, 27], [48, 19], [66, 24], [84, 31], [28, 37], [72, 37], [58, 33], [42, 40]];
    s += '<g class="night-only">';
    stars.forEach(function (p, k) { s += R('star', p[0], p[1], 1, 1, 'twinkle', '--d:' + (k * 0.37) + 's'); });
    s += R('moon', 79, 22, 3, 1) + R('moon', 78, 23, 2, 4) + R('moon', 79, 27, 3, 1) + R('moon', 82, 23, 1, 1) + R('moon', 82, 26, 1, 1) + '</g>';
    // soleil et nuages (jour seulement)
    s += '<g class="day-only">' + R('sun', 76, 20, 8, 8) + R('sun', 74, 22, 12, 4) + R('sun', 78, 18, 4, 12) +
         '<g class="cloud">' + R('cloud', 24, 24, 12, 3) + R('cloud', 27, 22, 6, 2) + R('cloud', 50, 32, 10, 3) + R('cloud', 52, 30, 5, 2) + '</g></g>';
    // collines (le Faron et ses voisines) et petit fort
    s += '<polygon class="c-hill1" points="16,62 24,56 34,50 46,44 56,42 66,45 78,50 94,58 94,66 16,66"/>';
    s += R('hill2', 54, 40, 6, 3);
    s += '<polygon class="c-hill2" points="16,66 16,60 26,58 38,62 48,66"/>';
    s += '<polygon class="c-hill2" points="60,66 72,60 84,58 94,60 94,66"/>';
    // lumières de la ville (nuit)
    s += '<g class="night-only">';
    [[20, 61], [24, 62], [30, 60], [35, 63], [66, 63], [72, 61], [80, 59], [87, 61], [90, 60]].forEach(function (p, k) {
      s += R('warm', p[0], p[1], 1, 1, 'twinkle', '--d:' + (k * 0.5) + 's');
    });
    s += '</g>';
    // mer, vagues animées et petit voilier
    s += R('sea', 16, 64, 78, 20);
    var w1 = '', w2 = '', w3 = '';
    for (x = 8; x < 110; x += 12) w1 += R('crest', x, 68, 5, 1);
    for (x = 14; x < 110; x += 14) w2 += R('crest', x, 74, 6, 1);
    for (x = 10; x < 110; x += 10) w3 += R('crest', x, 79, 4, 1);
    s += '<g class="wave" style="--wd:-12px;--wt:4s">' + w1 + '</g>' +
         '<g class="wave" style="--wd:-14px;--wt:6s">' + w2 + '</g>' +
         '<g class="wave" style="--wd:-10px;--wt:3s">' + w3 + '</g>';
    s += R('wood2', 41, 65, 6, 1) + R('paper', 43, 61, 1, 4) + R('paper', 44, 62, 1, 3);
    s += '</g>';
    // croisillons, reflet sur la vitre et rebord
    s += R('wood', 54, 16, 3, 66) + R('wood', 16, 46, 78, 3) + R('shine', 20, 18, 2, 10) + R('shine', 24, 18, 1, 6) + R('wood2', 9, 86, 92, 4);
    fill('#win', s);

    /* --- Avatar : jeune femme en blouse blanche, pull rose, casque audio ---
       Couleurs : cheveux, peau et pull se règlent dans les variables en haut de style.css. */
    s = '';
    s += R('skin', 156, 86, 8, 7);                                                    // cou
    s += R('coat', 140, 94, 40, 28) + R('coatsh', 140, 94, 40, 1);                    // blouse (épaules, manches)
    s += R('sweater', 150, 93, 20, 29);                                               // pull rose
    s += R('sweaterd', 153, 92, 4, 2) + R('sweaterd', 163, 92, 4, 2) + R('sweaterd', 155, 94, 10, 1); // col rond
    s += R('skin', 157, 92, 6, 2);                                                    // décolleté du col
    s += R('coat', 148, 92, 3, 10) + R('coat', 169, 92, 3, 10);                       // revers de la blouse
    s += R('coatsh', 150, 94, 1, 28) + R('coatsh', 169, 94, 1, 28);                   // ombre des revers
    s += R('coatsh', 142, 108, 6, 1) + R('coatsh', 142, 108, 1, 6) + R('pink', 146, 105, 1, 4); // poche + stylo
    s += R('powder', 172, 102, 5, 3) + R('navy', 173, 103, 3, 1);                     // badge
    // Tête (groupe animé : elle se baisse de temps en temps vers la breadboard)
    var head = '';
    head += R('hair', 145, 64, 5, 34) + R('hair', 170, 64, 5, 34);                    // mèches longues
    head += R('hair', 147, 60, 26, 8);                                                // volume des cheveux
    head += R('skin', 150, 66, 20, 20) + R('skin', 152, 86, 16, 1);                   // visage
    head += R('hair', 150, 66, 8, 4) + R('hair', 160, 66, 10, 3);                     // frange
    head += R('hairl', 150, 62, 6, 1) + R('hairl', 146, 70, 1, 12);                   // reflets
    head += R('navy', 146, 57, 28, 3) + R('powder', 152, 58, 16, 1);                  // arceau du casque
    head += R('navy', 144, 60, 3, 12) + R('navy', 173, 60, 3, 12);                    // montants
    head += R('navy', 141, 70, 7, 13) + R('navy', 172, 70, 7, 13);                    // écouteurs
    head += R('powder', 142, 73, 2, 7) + R('powder', 176, 73, 2, 7);                  // détails rose poudré
    head += R('hair', 153, 72, 4, 1) + R('hair', 163, 72, 4, 1);                      // sourcils
    head += '<g class="eyes">' + R('eye', 154, 75, 2, 3) + R('eye', 164, 75, 2, 3) +
            R('white', 154, 75, 1, 1) + R('white', 164, 75, 1, 1) + '</g>';           // yeux (clignent)
    head += R('skinsh', 160, 78, 1, 2);                                               // nez
    head += R('blush', 152, 79, 3, 2) + R('blush', 165, 79, 3, 2);                    // joues
    head += R('mouth', 158, 82, 4, 1) + R('mouth', 157, 81, 1, 1) + R('mouth', 162, 81, 1, 1); // sourire
    s += '<g class="head">' + head + '</g>';
    fill('#avatar-art', s);

    /* --- Paillasse (plan de travail) et tiroirs --- */
    s = R('bench-top', -400, 122, 1120, 12) + R('bench-hi', -400, 122, 1120, 1) +
        R('bench-edge', -400, 134, 1120, 2) + R('bench', -400, 136, 1120, 300);
    [24, 128, 232].forEach(function (dx) {
      s += R('bench2', dx, 146, 84, 26) + R('bench-edge', dx, 146, 84, 1) + R('gold', dx + 34, 156, 16, 2);
    });
    fill('#bench', s);

    /* --- Décor : tasse fumante et lampe qui scintille --- */
    s = R('white', 236, 113, 8, 9) + R('pink', 237, 114, 6, 3) + R('white', 244, 115, 2, 5) + R('white', 245, 116, 1, 3);
    s += R('inkline', 238, 108, 1, 2, 'steam', '--d:0s') + R('inkline', 241, 106, 1, 2, 'steam', '--d:.8s');
    // lampe articulée
    s += R('navy2', 258, 119, 14, 3) + R('navy', 264, 104, 2, 15) + R('navy', 266, 102, 8, 2) + R('navy', 272, 96, 2, 8);
    s += R('pinkd', 268, 92, 16, 5) + R('pink', 270, 90, 12, 2) + R('warm', 272, 97, 8, 2, 'flick');
    fill('#decor', s);

    /* --- Objets cliquables --- */
    // Moniteur cardiaque + ECG rose animé en continu
    s = R('navy2', 112, 118, 8, 4) + R('navy2', 108, 121, 16, 1) + R('navy', 100, 98, 32, 21) + R('screen', 103, 101, 26, 14);
    s += '<path class="ecg-base" pathLength="100" d="M104 109h5l2-4 3 9 3-11 2 6h8"/>' +
         '<path class="ecg-run" pathLength="100" d="M104 109h5l2-4 3 9 3-11 2 6h8"/>';
    s += '<g class="heart-px">' + R('pink', 121, 102, 2, 1) + R('pink', 125, 102, 2, 1) + R('pink', 121, 103, 6, 1) +
         R('pink', 122, 104, 4, 1) + R('pink', 123, 105, 2, 1) + '</g>';
    s += R('teal', 103, 117, 2, 1, 'ledblink') + R('pink', 108, 117, 2, 1, 'ledblink', '--d:.5s');
    $('#hot-monitor .art').innerHTML = s;

    // Tablette avec mini dashboard (courbes IMU et barres)
    s = R('navy', 192, 100, 32, 22) + R('screen', 194, 102, 28, 18) + R('dark', 208, 101, 1, 1);
    var c1 = 'M195 109l3-4 3 6 3-6 3 6 3-5 3 5 3-4 4 4';
    var c2 = 'M195 112l4 1 4-3 4 3 4-2 4 2 4-3 2 2';
    s += '<path class="imu-base pk" pathLength="100" d="' + c1 + '"/><path class="imu-run pk" pathLength="100" d="' + c1 + '"/>';
    s += '<path class="imu-base tl" pathLength="100" d="' + c2 + '"/><path class="imu-run tl" pathLength="100" d="' + c2 + '" style="--t:3.4s"/>';
    for (i = 0; i < 5; i++) s += R('powder', 196 + i * 5, 115, 3, 4, 'bar', '--d:' + (i * 0.25) + 's');
    $('#hot-tablet .art').innerHTML = s;

    // Étagère : cartes électroniques, capteurs, fioles
    s = R('wood', 194, 56, 64, 3) + R('wood2', 200, 59, 2, 5) + R('wood2', 250, 59, 2, 5);
    s += R('wood', 194, 84, 64, 3) + R('wood2', 200, 87, 2, 5) + R('wood2', 250, 87, 2, 5);
    // rang du haut
    s += R('green', 198, 48, 14, 8) + R('dark', 201, 50, 5, 4) + R('pink', 208, 50, 2, 2, 'ledblink') + R('gold', 198, 55, 14, 1);
    s += R('navy', 216, 46, 8, 10) + R('teal', 218, 48, 4, 3) + R('powder', 219, 52, 2, 1) + R('navy', 219, 43, 2, 3);
    s += R('glass', 233, 44, 3, 4) + R('glass', 231, 48, 7, 8) + R('pink', 231, 51, 7, 5);
    s += R('glass', 243, 47, 3, 3) + R('glass', 241, 50, 7, 6) + R('teal', 241, 52, 7, 4);
    // rang du bas
    s += R('green', 198, 74, 16, 10) + R('dark', 201, 76, 6, 4) + R('teal', 210, 76, 2, 2, 'ledblink', '--d:.7s') + R('gold', 198, 83, 16, 1);
    s += R('wood2', 223, 70, 6, 2) + R('glass', 222, 72, 8, 12) + R('powder', 222, 76, 8, 8);
    s += R('navy', 236, 76, 10, 8) + R('pink', 238, 78, 3, 3, 'ledblink', '--d:.3s') + R('teal', 242, 78, 2, 2);
    s += R('glass', 248, 74, 4, 10) + R('pink', 248, 78, 4, 6);
    $('#hot-shelf .art').innerHTML = s;

    // Boîte aux lettres murale avec enveloppe et drapeau
    s = R('wood2', 274, 66, 6, 6);
    s += R('paper', 271, 43, 10, 5) + R('pink', 275, 45, 2, 1);
    s += R('pinkd', 264, 50, 26, 16) + R('pinkd', 266, 47, 22, 3) + R('pinkd', 269, 45, 16, 2);
    s += R('pink', 266, 52, 22, 12) + R('dark', 270, 56, 14, 2) + R('powder', 270, 60, 6, 1);
    s += '<g class="flag">' + R('navy', 290, 44, 2, 12) + R('powder', 292, 44, 5, 4) + '</g>';
    $('#hot-mailbox .art').innerHTML = s;

    // Diplôme encadré
    s = R('gold', 141, 14, 38, 30) + R('wood', 143, 16, 34, 26) + R('paper', 145, 18, 30, 22);
    s += R('inkline', 150, 22, 20, 1) + R('inkline', 152, 25, 16, 1) + R('inkline', 149, 28, 22, 1) + R('inkline', 151, 31, 8, 1);
    s += R('pink', 165, 32, 6, 6) + R('powder', 166, 33, 2, 2) + R('pinkd', 166, 38, 2, 3) + R('pinkd', 169, 38, 2, 3);
    $('#hot-diploma .art').innerHTML = s;

    // Plante : cinq stades de croissance (data-s), affichés selon le nombre de clics
    s = R('terrad', 20, 110, 18, 3) + R('terra', 22, 113, 14, 9) + R('terrad', 22, 120, 14, 2);
    s += '<g class="pl" data-s="0">' + R('leafd', 28, 104, 2, 6) + R('leaf', 25, 104, 3, 2) + R('leaf', 31, 102, 3, 2) + '</g>';
    s += '<g class="pl" data-s="1">' + R('leafd', 28, 96, 2, 8) + R('leaf', 24, 98, 4, 2) + R('leaf', 32, 96, 4, 2) + '</g>';
    s += '<g class="pl" data-s="2">' + R('leafd', 28, 88, 2, 8) + R('leaf', 23, 90, 5, 2) + R('leaf', 32, 88, 5, 2) + R('leaf', 25, 94, 3, 2) + '</g>';
    s += '<g class="pl" data-s="3">' + R('leafd', 28, 80, 2, 8) + R('leaf', 24, 82, 4, 2) + R('leaf', 32, 80, 4, 2) + R('leaf', 27, 78, 4, 2) + '</g>';
    s += '<g class="pl" data-s="4">' + R('pink', 26, 74, 2, 2) + R('pink', 30, 74, 2, 2) + R('pink', 28, 72, 2, 2) + R('pink', 28, 76, 2, 2) + R('warm', 28, 74, 2, 2) + '</g>';
    // décalée vers la droite (translate) pour rester visible au-dessus de la carte d'accroche
    $('#hot-plant .art').innerHTML = '<g transform="translate(44 0)"><g class="plant">' + s + '</g></g>';

    /* --- Breadboard posée devant l'avatar : fils, LED rose qui clignote, microcontrôleur --- */
    s = R('bb', 134, 123, 52, 11) + R('pink', 136, 124, 48, 1) + R('teal', 136, 132, 48, 1);
    for (x = 137; x < 184; x += 3) { s += R('hole', x, 126, 1, 1) + R('hole', x, 128, 1, 1) + R('hole', x, 130, 1, 1); }
    // microcontrôleur (type Nano) branché sur la breadboard
    s += R('teal2', 138, 124, 16, 7) + R('dark', 143, 125, 6, 4) + R('silver', 136, 126, 3, 3) + R('gold', 140, 124, 12, 1) + R('gold', 140, 130, 12, 1) + R('warm', 151, 126, 1, 1, 'ledblink', '--d:.2s');
    // fils colorés
    s += R('teal', 158, 121, 1, 6) + R('teal', 158, 121, 9, 1) + R('teal', 166, 121, 1, 6);
    s += R('warm', 172, 122, 1, 5) + R('warm', 172, 122, 6, 1) + R('warm', 177, 122, 1, 5);
    s += R('violet', 181, 124, 1, 6) + R('violet', 181, 124, 3, 1);
    // LED rose + résistance
    s += R('silver', 169, 127, 1, 3) + R('silver', 171, 127, 1, 3) + R('pink', 168, 123, 5, 4, 'led');
    s += R('terra', 174, 129, 5, 2) + R('dark', 176, 129, 1, 2);
    s += '<circle class="led-glow" cx="170.5" cy="125" r="6" fill="#E8547A"/>';
    fill('#breadboard', s);

    // Mains qui câblent (bougent légèrement quand la tête se baisse)
    s = '<g class="hand hl">' + R('coat', 144, 118, 6, 5) + R('skin', 146, 122, 5, 3) + '</g>' +
        '<g class="hand hr">' + R('coat', 170, 118, 6, 5) + R('skin', 169, 122, 5, 3) + '</g>';
    fill('#hands', s);

    /* --- Lumières : halo de la lampe et cône de lumière --- */
    s = '<polygon class="lamp-cone" points="272,99 284,99 304,126 252,126"/>' +
        '<circle class="lamp-glow" cx="276" cy="99" r="46" fill="url(#g-warm)"/>';
    fill('#light', s);

    // Zones de survol et anneau de focus clavier pour chaque objet cliquable
    $$('.hot').forEach(function (g) {
      var b = g.getAttribute('data-box').split(',');
      g.insertAdjacentHTML('beforeend',
        R('hit', b[0], b[1], b[2], b[3]) +
        '<rect class="ring" x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '"/>');
    });
    drawPlant();
  }

  /* ---------- 4. Objets cliquables ---------- */
  var tip = $('#tip');
  var tipTarget = null;

  // Affiche l'infobulle au-dessus (ou en dessous si pas de place) de l'objet visé
  function showTip(el) {
    tipTarget = el;
    tip.textContent = el.getAttribute('data-tip');
    tip.className = el.hasAttribute('data-bubble') ? 'bubble' : '';
    tip.hidden = false;
    var r = el.getBoundingClientRect();
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(Math.max(r.left + r.width / 2, w / 2 + 8), window.innerWidth - w / 2 - 8);
    var above = r.top - h - 12 > 64;
    tip.classList.toggle('below', !above);
    tip.style.left = left + 'px';
    tip.style.top = (above ? r.top - 10 : r.bottom + 10) + 'px';
  }
  function hideTip() { tip.hidden = true; tipTarget = null; }

  $$('.hot').forEach(function (g) {
    g.addEventListener('mouseenter', function () { showTip(g); });
    g.addEventListener('mouseleave', hideTip);
    g.addEventListener('focus', function () { showTip(g); });
    g.addEventListener('blur', hideTip);
    // Clavier : Entrée ou Espace = clic
    g.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
  });

  // Clic sur un objet : ouvre un panneau, télécharge le CV ou fait pousser la plante
  $$('.hot').forEach(function (g) {
    g.addEventListener('click', function () {
      if (g.id === 'hot-plant') { growPlant(); return; }
      if (g.hasAttribute('data-download')) {
        var a = document.createElement('a');
        a.href = g.getAttribute('data-download');
        a.download = '';
        document.body.appendChild(a); a.click(); a.remove();
        return;
      }
      openPanel(g.getAttribute('data-panel'), g);
    });
  });

  /* Easter egg : la plante pousse à chaque clic, fleurit, puis repart de zéro */
  var plantStage = 0, PLANT_MAX = 4;
  var plantMsg = [
    'Une petite pousse 🌱 (clique !)', 'Elle grandit…', 'De belles feuilles !',
    'Elle va bientôt fleurir…', 'Elle a fleuri 🌸 (encore un clic pour recommencer)'
  ];
  function drawPlant() {
    $$('.pl').forEach(function (g) {
      g.style.display = parseInt(g.getAttribute('data-s'), 10) <= plantStage ? '' : 'none';
    });
    var hot = $('#hot-plant');
    hot.setAttribute('data-tip', plantMsg[plantStage]);
    hot.setAttribute('aria-label', 'Plante en pot : ' + plantMsg[plantStage]);
  }
  function growPlant() {
    plantStage = plantStage >= PLANT_MAX ? 0 : plantStage + 1;
    drawPlant();
    var plant = $('#hot-plant .plant');
    plant.classList.remove('pop'); void plant.getBoundingClientRect(); plant.classList.add('pop');  // petite animation
    $('#live').textContent = plantMsg[plantStage];
    showTip($('#hot-plant'));
  }

  /* ---------- 5. Panneaux (fenêtres rétro) ---------- */
  var backdrop = $('#backdrop');
  var openedPanel = null, opener = null;
  var reportOpen = false;   // vrai quand la fenêtre « Un souci ? » est ouverte (elle passe devant les panneaux)

  function inScene() { return body.classList.contains('mode-scene'); }

  function openPanel(name, from) {
    var p = document.getElementById('panel-' + name);
    if (!p) return;
    if (openedPanel) closePanel(true);
    opener = from || document.activeElement;
    p.classList.add('open');
    backdrop.hidden = false;
    openedPanel = p;
    hideTip();
    $('.panel-close', p).focus();
  }
  function closePanel(silent) {
    if (!openedPanel) return;
    openedPanel.classList.remove('open');
    backdrop.hidden = true;
    openedPanel = null;
    if (!silent && opener && opener.focus) opener.focus();   // le focus revient sur l'objet d'origine
  }

  // Liens et boutons avec data-panel (menu, accroche) : en mode scène on ouvre la fenêtre ; sinon défilement normal
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('a[data-panel]') : null;
    if (el && inScene()) { e.preventDefault(); openPanel(el.getAttribute('data-panel'), el); closeNav(); }
  });
  $$('.panel-close').forEach(function (b) { b.addEventListener('click', function () { closePanel(); }); });
  backdrop.addEventListener('click', function () { closePanel(); });

  document.addEventListener('keydown', function (e) {
    if (!openedPanel || reportOpen) return;
    if (e.key === 'Escape') { closePanel(); return; }
    if (e.key === 'Tab') {       // le focus reste dans la fenêtre ouverte
      var f = $$('a[href], button:not([disabled]), input:not([tabindex="-1"]), textarea, summary, [tabindex="0"]', openedPanel)
        .filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- 6. Mode scène / version rapide ---------- */
  var modeBtn = $('#mode-toggle');
  var pref = null;
  try { pref = localStorage.getItem('mode'); } catch (e) { /* ignoré */ }
  // Petit écran ou fenêtre très basse : la scène est remplacée automatiquement par la version rapide
  var smallMQ = matchMedia('(max-width: 820px), (max-height: 520px)');

  function applyMode() {
    var scene = !smallMQ.matches && pref !== 'quick';
    if (scene) buildScene();
    body.classList.toggle('mode-scene', scene);
    body.classList.toggle('mode-quick', !scene);
    modeBtn.hidden = smallMQ.matches;               // inutile sur mobile : version rapide forcée
    modeBtn.textContent = scene ? 'Version rapide' : 'Retour à la scène';
    modeBtn.setAttribute('aria-pressed', String(!scene));
    if (!scene) { closePanel(true); hideTip(); }
    // Les panneaux sont des boîtes de dialogue en mode scène, de simples sections sinon
    $$('.panel').forEach(function (p) {
      if (scene) { p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('tabindex', '-1'); }
      else { p.removeAttribute('role'); p.removeAttribute('aria-modal'); p.removeAttribute('tabindex'); }
    });
  }
  modeBtn.addEventListener('click', function () {
    pref = body.classList.contains('mode-scene') ? 'quick' : 'scene';
    try { localStorage.setItem('mode', pref); } catch (e) { /* ignoré */ }
    applyMode();
    window.scrollTo(0, 0);
  });
  if (smallMQ.addEventListener) smallMQ.addEventListener('change', applyMode);
  else if (smallMQ.addListener) smallMQ.addListener(applyMode);
  window.addEventListener('resize', function () { if (tipTarget) hideTip(); });
  applyMode();

  /* ---------- 7. Menu mobile, compétences, anneau de la photo ---------- */
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

  // Filtre des compétences, avec cascade d'apparition des badges
  $$('.skill-group ul').forEach(function (ul) {
    $$('li', ul).forEach(function (li, i) { li.style.setProperty('--i', i); });
  });
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
        if (!hide) { g.classList.remove('shown'); void g.offsetWidth; g.classList.add('shown'); }   // relance l'animation
      });
    });
  });
  groups.forEach(function (g) { g.classList.add('shown'); });

  // Anneau « moniteur cardiaque » autour de la photo : un cercle déformé par 3 complexes QRS
  (function buildRing() {
    var base = $('#ring-base'), pulse = $('#ring-pulse');
    var N = 540, R0 = 50, beats = 3, d = '';
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
      var r = R0 + dev((f * beats) % 1);
      var a = f * 2 * Math.PI - Math.PI / 2;
      d += (i ? ' L' : 'M') + (r * Math.cos(a)).toFixed(2) + ' ' + (r * Math.sin(a)).toFixed(2);
    }
    [base, pulse].forEach(function (p) { p.setAttribute('d', d); p.setAttribute('pathLength', '100'); });
  })();

  /* ---------- 8. Dépôts GitHub (topic « portfolio ») ---------- */
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
    var card = el('article', 'card repo');
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

  /* ---------- 9. Formspree : formulaire de contact, signalement, copie des e-mails ---------- */
  // Une seule adresse Formspree pour tout le site (celle du formulaire de contact)
  var FORM_ACTION = $('#contact-form').action;

  // Envoie un formulaire à Formspree. Promesse résolue si tout va bien, rejetée avec un message sinon.
  function sendToFormspree(form) {
    if (FORM_ACTION.indexOf('YOUR_FORM_ID') !== -1) {
      return Promise.reject('Formulaire non configuré : remplace YOUR_FORM_ID dans index.html.');
    }
    return fetch(FORM_ACTION, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (r) {
      if (!r.ok) return Promise.reject('Une erreur est survenue. Réessaie ou écris-moi directement par e-mail.');
    }, function () {
      return Promise.reject('Connexion impossible. Réessaie dans un instant.');
    });
  }

  // Validation simple côté client : champs obligatoires, e-mail et lien (si remplis) valides
  function validate(form) {
    var ok = true;
    $$('input, textarea, select', form).forEach(function (f) {
      if (f.type === 'hidden' || f.name === '_gotcha') return;
      var v = f.value.trim(), bad = false;
      if (f.required && !v) bad = true;
      else if (v && f.type === 'email' && !/^\S+@\S+\.\S+$/.test(v)) bad = true;
      else if (v && f.type === 'url') { var u = safeUrl(v); if (u) f.value = u; else bad = true; }
      f.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    return ok;
  }

  // Affiche le message de succès animé à la place des champs
  function showSuccess(form) {
    var box = $('.success', form);
    form.classList.add('sent');
    box.hidden = false;
    $('h3', box).focus();
  }
  function resetSuccess(form) {
    form.classList.remove('sent');
    $('.success', form).hidden = true;
  }

  // Branche un formulaire : validation, envoi, succès ou message d'erreur
  function wireForm(form, statusEl, beforeSend) {
    function say(msg, type) { statusEl.textContent = msg; statusEl.className = 'form-status ' + type; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) { say('Merci de remplir correctement les champs signalés.', 'err'); return; }
      if (beforeSend) beforeSend();
      var btn = $('button[type="submit"]', form);
      btn.disabled = true;
      say('Envoi en cours…', 'ok');
      sendToFormspree(form).then(function () {
        say('', 'ok');
        form.reset();
        showSuccess(form);
      }, function (msg) { say(msg, 'err'); }).then(function () { btn.disabled = false; });
    });
  }

  // Formulaire de contact : l'objet de l'e-mail reprend le sujet choisi
  var form = $('#contact-form');
  wireForm(form, $('#form-status'), function () {
    $('#mail-subject').value = 'Portfolio : ' + $('#subject').value;
  });
  $('#again').addEventListener('click', function () { resetSuccess(form); $('#name').focus(); });

  // Copie d'une adresse e-mail dans le presse-papiers (avec solution de repli si l'API est indisponible)
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
    return new Promise(function (resolve) {
      var t = document.createElement('textarea');
      t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* ignoré */ }
      t.remove();
      resolve(ok);
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.copy') : null;
    if (!b) return;
    copyText(b.getAttribute('data-copy')).then(function (ok) {
      b.textContent = ok ? 'Copié !' : 'Copie impossible';
      b.classList.add('done');
      $('#live').textContent = ok ? 'Adresse copiée' : "Copie impossible, sélectionne l'adresse à la main";
      clearTimeout(b._t);
      b._t = setTimeout(function () { b.textContent = 'Copier'; b.classList.remove('done'); }, 2000);
    });
  });

  /* Signalement : bouton flottant + fenêtre accessible au clavier */
  var report = $('#report'), reportBtn = $('#report-open'), reportForm = $('#report-form');
  var reportReturn = null;
  reportForm.action = FORM_ACTION;

  function openReport() {
    reportReturn = document.activeElement;
    resetSuccess(reportForm);
    report.hidden = false;
    reportOpen = true;
    hideTip();
    $('#rep-cat').focus();
  }
  function closeReport() {
    report.hidden = true;
    reportOpen = false;
    if (reportReturn && reportReturn.focus) reportReturn.focus();
  }
  reportBtn.addEventListener('click', openReport);
  $('.report-close', report).addEventListener('click', closeReport);
  $('.report-done', report).addEventListener('click', closeReport);
  report.addEventListener('click', function (e) { if (e.target === report) closeReport(); });   // clic sur le fond

  document.addEventListener('keydown', function (e) {
    if (!reportOpen) return;
    if (e.key === 'Escape') { closeReport(); return; }
    if (e.key === 'Tab') {       // le focus reste dans la fenêtre
      var f = $$('a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"]), textarea, select, [tabindex="0"]', report)
        .filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  // Avant l'envoi : renseigne le champ caché avec la page et l'appareil
  wireForm(reportForm, $('#report-status'), function () {
    var touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    $('#rep-context').value =
      'Page : ' + location.href.split('#')[0] +
      ' | Mode : ' + (inScene() ? 'scène' : 'version rapide') +
      ' | Thème : ' + document.documentElement.getAttribute('data-theme') +
      ' | Écran : ' + window.innerWidth + 'x' + window.innerHeight + (touch ? ' (tactile)' : '') +
      ' | Navigateur : ' + navigator.userAgent;
  });

  // Année du pied de page
  $('#year').textContent = new Date().getFullYear();
})();
