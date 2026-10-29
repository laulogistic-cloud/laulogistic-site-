/*! site-motion.js — couche mouvement commune aux sites du dossier deploy/
 *
 *  Dépendances, servies en local depuis motion/vendor/ (aucun appel réseau) :
 *    gsap 3.15 · ScrollTrigger 3.15 · SplitText 3.15 (greensock, licence « no charge »)
 *    lenis 1.3 (darkroom.engineering, MIT)
 *
 *  CONTRAT D'USAGE — on ne câble rien d'autre que ces attributs :
 *    data-motion="hero"       conteneur : ses enfants directs entrent en cascade au chargement
 *    data-motion="section"    <section> : ses enfants directs entrent à l'apparition
 *    data-motion="stagger"    conteneur : ses enfants directs entrent en cascade à l'apparition
 *    data-motion="reveal"     élément seul : entre à l'apparition
 *    data-motion="title"      titre : révélation mot à mot (SplitText), une fois, au chargement
 *    data-motion="parallax"   visuel de fond : dérive verticale légère pendant le scroll
 *                             (option data-motion-parallax="6" = amplitude en %)
 *    data-motion="magnet"     bouton : suit légèrement le curseur (pointeur fin uniquement)
 *    data-motion="none"       exclusion explicite d'un enfant de conteneur animé
 *
 *  RÈGLES TENUES
 *    - Aucun état initial en CSS : les états de départ sont posés par JS uniquement.
 *      Sans JS, sans bibliothèque, ou en `prefers-reduced-motion: reduce`, la page
 *      s'affiche entièrement, sans animation et sans scroll lissé.
 *    - Seules `transform` et `opacity` sont animées (cf. docs/PERFORMANCE_UI_SITES_2026-10-16.md).
 *    - Lenis désactive le `scroll-behavior: smooth` natif des pages (html.lenis-on).
 *    - Une seule animation par élément : un enfant marqué data-motion n'est jamais
 *      repris par la cascade de son conteneur.
 *
 *  API PUBLIQUE (facultative, pour les scripts de page) :
 *    window.SITE_MOTION.scrollToEl(el)   descendre vers un élément (offset en-tête compris)
 *    window.SITE_MOTION.scrollToTop()    revenir en haut (changement d'onglet, etc.)
 *    window.SITE_MOTION.refresh()        recalculer les déclencheurs après un changement de page
 */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var gsap = window.gsap;

  /* Sans mouvement autorisé ou sans GSAP : on ne touche à rien. */
  if (!gsap || (reduceQuery && reduceQuery.matches)) return;

  var ScrollTrigger = window.ScrollTrigger;
  var SplitText = window.SplitText;
  if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (SplitText) gsap.registerPlugin(SplitText);

  /* Impression : les fiches du site sortent en A4. Un bloc armé mais pas encore
     déclenché ne doit jamais sortir blanc sur le papier. */
  var printGuard = document.createElement('style');
  printGuard.textContent =
    '@media print{[data-motion]{opacity:1!important;transform:none!important}}';
  document.head.appendChild(printGuard);

  var EASE = 'power3.out';
  var DUR = 0.7;
  var STAGGER = 0.06;
  var RISE = 22;

  /* ──────────────────────────────────────────────────────────────
     1. Lenis — scroll lissé, une seule instance
     ────────────────────────────────────────────────────────────── */
  var lenis = null;

  if (window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.05,
      autoRaf: false,          /* une seule boucle : celle de gsap.ticker ci-dessous */
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.6
    });

    html.classList.add('lenis-on');
    var override = document.createElement('style');
    override.textContent =
      'html.lenis-on{scroll-behavior:auto}' +
      'html.lenis-on body{overscroll-behavior-y:none}';
    document.head.appendChild(override);

    if (ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* Hauteur de l'en-tête collant, pour ne pas poser un titre sous la barre. */
  function headerHeight() {
    var candidates = document.querySelectorAll('nav, .nav, header .nav');
    for (var i = 0; i < candidates.length; i++) {
      var pos = window.getComputedStyle(candidates[i]).position;
      if (pos === 'fixed' || pos === 'sticky') return candidates[i].offsetHeight || 0;
    }
    return 0;
  }

  function offsetFor() {
    return -(headerHeight() + 10);
  }

  function scrollToEl(el) {
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { offset: offsetFor(), duration: 1.1 });
    } else {
      var y = el.getBoundingClientRect().top + window.pageYOffset + offsetFor();
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  function scrollToTop() {
    if (lenis) lenis.scrollTo(0, { duration: 0.9 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* Liens internes : le scroll passe par Lenis (sinon le natif se bat avec lui). */
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;

    var hash = link.getAttribute('href');
    if (!hash || hash === '#' || link.hasAttribute('data-motion-native')) return;

    var el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!el) return;

    event.preventDefault();
    scrollToEl(el);
    if (history.pushState) history.pushState(null, '', hash);
  });

  /* ──────────────────────────────────────────────────────────────
     2. Outils de cascade
     ────────────────────────────────────────────────────────────── */
  function childrenOf(container) {
    return Array.prototype.filter.call(container.children, function (child) {
      return child.nodeType === 1 &&
        !/^(SCRIPT|STYLE|TEMPLATE|LINK)$/.test(child.tagName) &&
        child.getAttribute('data-motion') !== 'none' &&
        !child.hasAttribute('data-motion');
    });
  }

  function cascade(container, delay) {
    var kids = childrenOf(container);
    if (!kids.length) return null;

    gsap.set(kids, { opacity: 0, y: RISE });

    var tl = gsap.timeline({ paused: true, delay: delay || 0 });
    tl.to(kids, {
      opacity: 1,
      y: 0,
      duration: DUR,
      ease: EASE,
      stagger: STAGGER,
      clearProps: 'opacity,transform'
    });
    return tl;
  }

  var observer = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var tl = entry.target.__motionTimeline;
          if (tl) tl.play();
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 })
    : null;

  function watch(container, delay) {
    var tl = cascade(container, delay);
    if (!tl) return;
    if (!observer) { tl.play(); return; }
    container.__motionTimeline = tl;
    observer.observe(container);
  }

  /* Filet de sécurité : si un déclencheur n'a jamais été vu (navigateur atypique,
     conteneur masqué puis réaffiché autrement), on ne laisse pas de texte invisible. */
  window.setTimeout(function () {
    gsap.utils.toArray('[data-motion="section"],[data-motion="stagger"],[data-motion="reveal"]')
      .forEach(function (el) {
        if (el.__motionTimeline && el.__motionTimeline.progress() === 0) {
          var box = el.getBoundingClientRect();
          if (box.top < window.innerHeight && box.bottom > 0) el.__motionTimeline.play();
        }
      });
  }, 4000);

  /* ──────────────────────────────────────────────────────────────
     3. Parallaxe
     ────────────────────────────────────────────────────────────── */
  function setParallax() {
    if (!ScrollTrigger) return;
    gsap.utils.toArray('[data-motion="parallax"]').forEach(function (el) {
      var amount = parseFloat(el.getAttribute('data-motion-parallax')) || 6;
      gsap.fromTo(el,
        { yPercent: -amount, scale: 1.12 },
        {
          yPercent: amount,
          scale: 1.12,
          ease: 'none',
          scrollTrigger: {
            trigger: el.parentElement || el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6
          }
        });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     4. Bouton magnétique (pointeurs fins seulement)
     ────────────────────────────────────────────────────────────── */
  function setMagnets() {
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    gsap.utils.toArray('[data-motion="magnet"]').forEach(function (el) {
      var toX = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
      var toY = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });

      el.addEventListener('mousemove', function (event) {
        var box = el.getBoundingClientRect();
        toX(gsap.utils.clamp(-9, 9, (event.clientX - (box.left + box.width / 2)) * 0.22));
        toY(gsap.utils.clamp(-7, 7, (event.clientY - (box.top + box.height / 2)) * 0.22));
      });

      el.addEventListener('mouseleave', function () { toX(0); toY(0); });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     5. Titre mot à mot (équivalent SplitText des galeries React)
     ────────────────────────────────────────────────────────────── */
  function setTitles() {
    if (!SplitText) return;

    var titles = gsap.utils.toArray('[data-motion="title"]');
    if (!titles.length) return;

    /* Masque de ligne : nécessaire pour que les mots montent sans déborder du titre.
       Injecté ici et non dans les CSS de page : sans SplitText, il n'existe pas. */
    var mask = document.createElement('style');
    mask.textContent =
      '[data-motion="title"] .motion-line{display:block;overflow:hidden;padding-bottom:.04em}';
    document.head.appendChild(mask);

    titles.forEach(function (el) {
      var split;
      try {
        split = new SplitText(el, { type: 'lines,words', linesClass: 'motion-line' });
      } catch (e) { return; }

      gsap.set(el, { opacity: 1 });
      gsap.from(split.words, {
        yPercent: 110,
        opacity: 0,
        duration: 0.85,
        ease: EASE,
        stagger: 0.035,
        onComplete: function () { split.revert(); }
      });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     6. Mise en route
     ────────────────────────────────────────────────────────────── */
  function init() {
    var heroes = gsap.utils.toArray('[data-motion="hero"]');

    /* Héros : au chargement, une fois les polices prêtes (sinon les lignes bougent). */
    heroes.forEach(function (hero) {
      gsap.set(hero, { opacity: 1 });
      var tl = cascade(hero);
      if (tl) tl.play();
    });

    gsap.utils.toArray('[data-motion="section"]').forEach(function (section) {
      watch(section);
    });

    gsap.utils.toArray('[data-motion="stagger"]').forEach(function (box) {
      watch(box, 0.06);
    });

    gsap.utils.toArray('[data-motion="reveal"]').forEach(function (el) {
      gsap.set(el, { opacity: 0, y: RISE });
      el.__motionTimeline = gsap.timeline({ paused: true }).to(el, {
        opacity: 1, y: 0, duration: DUR, ease: EASE, clearProps: 'opacity,transform'
      });
      if (!observer) { el.__motionTimeline.play(); return; }
      observer.observe(el);
    });

    setTitles();
    setParallax();
    setMagnets();

    if (ScrollTrigger) ScrollTrigger.refresh();
  }

  function boot() {
    var fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : null;
    if (fonts && fonts.then) fonts.then(init).catch(init);
    else init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.addEventListener('load', function () {
    if (ScrollTrigger) ScrollTrigger.refresh();
    if (lenis) lenis.resize();
  });

  window.SITE_MOTION = {
    lenis: lenis,
    scrollToEl: scrollToEl,
    scrollToTop: scrollToTop,
    refresh: function () {
      if (ScrollTrigger) ScrollTrigger.refresh();
      if (lenis) lenis.resize();
    }
  };
})();
