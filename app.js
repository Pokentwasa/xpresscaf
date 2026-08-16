/* ============================================================
   XPRESSO — EXPERIENCE ENGINE
   Three.js bean world + GSAP scroll choreography
   ============================================================ */
import * as THREE from 'three';

(function () {
  'use strict';

  /* data.js + gsap load as deferred classic scripts; this module runs after
     them, so read them off window/global lexical scope. */
  const MENU_D  = (typeof MENU !== 'undefined') ? MENU : [];
  const LOC_D   = (typeof LOCATIONS !== 'undefined') ? LOCATIONS : [];
  const VOICE_D = (typeof VOICES !== 'undefined') ? VOICES : [];
  const PRICE   = (typeof XPRESSO_PRICE !== 'undefined') ? XPRESSO_PRICE : 'R10';
  const ENVS    = (typeof ENVIRONMENTS !== 'undefined') ? ENVIRONMENTS : null;

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOUCH   = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const MOBILE  = window.innerWidth < 768;

  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const lerp  = (a, b, t) => a + (b - a) * t;

  /* ==========================================================
     COFFEE BEAN GEOMETRY
     An ellipsoid with a real crease running its length.
     Built procedurally so there's no model to download.
     ========================================================== */
  function beanGeometry(detail) {
    const g = new THREE.SphereGeometry(1, detail || 34, (detail || 34) * 0.7);
    const p = g.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);

      // ellipsoid — long on x, flatter on z
      v.x *= 1.0;
      v.y *= 0.70;
      v.z *= 0.58;

      // the crease: a valley along the x axis, on both flat faces
      const groove = Math.exp(-(v.y * v.y) / 0.045);
      v.z *= (1 - 0.78 * groove);

      // tuck the crease inward so it reads as a fold, not a dent
      v.y += Math.sign(v.y || 1) * groove * 0.03;

      // soften the ends
      const taper = 1 - 0.10 * Math.pow(Math.abs(v.x), 3);
      v.y *= taper; v.z *= taper;

      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }

  function beanMaterial(color) {
    return new THREE.MeshStandardMaterial({
      color: color || 0x4a2e1e,
      roughness: 0.62,
      metalness: 0.06
    });
  }

  /* ==========================================================
     PRELOADER — its own tiny scene
     ========================================================== */
  const preloader = document.getElementById('preloader');
  const preBar    = document.getElementById('preBar');
  const prePct    = document.getElementById('prePct');
  let   preDone   = false;

  (function preScene() {
    const cv = document.getElementById('preCanvas');
    if (!cv) return;
    let r;
    try {
      r = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    } catch (e) { return; }
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.setSize(180, 180, false);

    const sc = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
    cam.position.z = 5;

    const bean = new THREE.Mesh(beanGeometry(30), beanMaterial(0x6f4726));
    bean.scale.setScalar(1.55);
    sc.add(bean);

    sc.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xfff1e0, 2.4);
    key.position.set(3, 4, 5); sc.add(key);
    const rim = new THREE.DirectionalLight(0xff4d19, 1.5);
    rim.position.set(-4, -2, -3); sc.add(rim);

    (function loop() {
      if (preDone) { r.dispose(); return; }
      bean.rotation.y += 0.028;
      bean.rotation.x = Math.sin(Date.now() * 0.0013) * 0.28;
      r.render(sc, cam);
      requestAnimationFrame(loop);
    })();
  })();

  /* progress → reveal */
  let prog = 0;
  const preTick = setInterval(() => {
    prog += (100 - prog) * 0.09 + 0.4;
    if (prog > 99.4) prog = 99.4;
    if (preBar) preBar.style.width = prog + '%';
    if (prePct) prePct.textContent = Math.round(prog) + '%';
  }, 40);

  function finishPreloader() {
    if (preDone) return;
    preDone = true;
    clearInterval(preTick);
    if (preBar) preBar.style.width = '100%';
    if (prePct) prePct.textContent = '100%';

    const letters = document.querySelectorAll('.pre-word span');
    if (window.gsap && !REDUCED) {
      gsap.to(letters, { y: 0, duration: .62, ease: 'power3.out', stagger: .035 });
      gsap.to(preloader, {
        opacity: 0, duration: .7, delay: .78, ease: 'power2.inOut',
        onComplete: () => { preloader.remove(); document.body.classList.add('ready'); startHero(); }
      });
    } else {
      letters.forEach(l => l.style.transform = 'translateY(0)');
      setTimeout(() => {
        if (preloader) preloader.remove();
        document.body.classList.add('ready');
        startHero();
      }, 300);
    }
  }

  window.addEventListener('load', finishPreloader);
  // never trap the visitor behind a stalled asset
  setTimeout(finishPreloader, 3600);

  /* ==========================================================
     MAIN 3D SCENE — hero bean + falling beans
     ========================================================== */
  let scene, camera, renderer, heroBean, fallers, fallData = [];
  let scrollY = 0, scrollVel = 0, lastScroll = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function init3D() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return false;

    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !MOBILE });
    } catch (e) { return false; }

    renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
    renderer.setSize(innerWidth, innerHeight, false);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 120);
    camera.position.z = 12;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xfff0dd, 2.6);
    key.position.set(5, 6, 8); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffb98a, 0.9);
    fill.position.set(-6, 1, 4); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff4d19, 1.6);
    rim.position.set(-4, -5, -6); scene.add(rim);

    /* hero bean — the character */
    const hg = beanGeometry(MOBILE ? 26 : 40);
    heroBean = new THREE.Mesh(hg, beanMaterial(0x51321f));
    heroBean.scale.setScalar(MOBILE ? 2.0 : 2.7);
    heroBean.position.set(MOBILE ? 0 : 3.6, MOBILE ? 1.6 : 0.4, 0);
    scene.add(heroBean);

    /* falling beans — instanced, elegant not flooding */
    const COUNT = MOBILE ? 16 : 34;
    const fg = beanGeometry(MOBILE ? 12 : 18);
    fallers = new THREE.InstancedMesh(fg, beanMaterial(0x3d2416), COUNT);
    fallers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(fallers);

    for (let i = 0; i < COUNT; i++) {
      fallData.push(newFaller(true));
    }
    return true;
  }

  function newFaller(initial) {
    return {
      x: (Math.random() - 0.5) * 26,
      y: initial ? (Math.random() * 24 - 8) : 14 + Math.random() * 6,
      z: (Math.random() - 0.5) * 8 - 2,
      s: 0.16 + Math.random() * 0.30,
      vy: 0.016 + Math.random() * 0.042,
      rx: Math.random() * Math.PI, ry: Math.random() * Math.PI, rz: Math.random() * Math.PI,
      drx: (Math.random() - 0.5) * 0.026,
      dry: (Math.random() - 0.5) * 0.026,
      drz: (Math.random() - 0.5) * 0.020,
      sway: Math.random() * Math.PI * 2,
      swaySpd: 0.004 + Math.random() * 0.010
    };
  }

  const dummy = new THREE.Object3D();

  function render3D() {
    if (!renderer) return;

    // smooth the pointer
    pointer.x = lerp(pointer.x, pointer.tx, 0.055);
    pointer.y = lerp(pointer.y, pointer.ty, 0.055);

    const velBoost = clamp(Math.abs(scrollVel) / 26, 0, 3.4);

    if (heroBean) {
      heroBean.rotation.y += 0.0042 + scrollVel * 0.00028;
      heroBean.rotation.x = lerp(heroBean.rotation.x, pointer.y * 0.42 + scrollY * 0.00042, 0.06);
      heroBean.rotation.z = lerp(heroBean.rotation.z, pointer.x * -0.28, 0.06);
      // the bean travels down the page as you scroll
      heroBean.position.y = (MOBILE ? 1.6 : 0.4) - scrollY * 0.0034;
      heroBean.position.x = (MOBILE ? 0 : 3.6) + pointer.x * 0.5;
    }

    if (fallers && dummy) {
      for (let i = 0; i < fallData.length; i++) {
        const f = fallData[i];
        f.y -= f.vy * (1 + velBoost * 0.85);
        f.sway += f.swaySpd;
        f.rx += f.drx * (1 + velBoost * 0.4);
        f.ry += f.dry * (1 + velBoost * 0.4);
        f.rz += f.drz;

        if (f.y < -13) Object.assign(f, newFaller(false));

        const px = f.x + Math.sin(f.sway) * 0.7 + pointer.x * (1.4 * f.s);
        const py = f.y + pointer.y * (0.7 * f.s);

        dummy.position.set(px, py, f.z);
        dummy.rotation.set(f.rx, f.ry, f.rz);
        dummy.scale.setScalar(f.s);
        dummy.updateMatrix();
        fallers.setMatrixAt(i, dummy.matrix);
      }
      fallers.instanceMatrix.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  function loop() {
    scrollVel = lerp(scrollVel, 0, 0.08);
    render3D();
    requestAnimationFrame(loop);
  }

  const has3D = init3D();
  if (has3D && !REDUCED) loop();
  else if (has3D) render3D();

  addEventListener('resize', () => {
    if (!renderer) return;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  }, { passive: true });

  addEventListener('mousemove', (e) => {
    pointer.tx = (e.clientX / innerWidth) * 2 - 1;
    pointer.ty = -((e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });

  addEventListener('scroll', () => {
    const y = scrollY = window.scrollY;
    scrollVel = y - lastScroll;
    lastScroll = y;
  }, { passive: true });

  /* ==========================================================
     CURSOR
     ========================================================== */
  if (!TOUCH && !REDUCED) {
    const cur = document.getElementById('cursor');
    const lab = document.getElementById('cursorLabel');
    let cx = 0, cy = 0, tx = 0, ty = 0;

    addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function cLoop() {
      cx = lerp(cx, tx, 0.22); cy = lerp(cy, ty, 0.22);
      if (cur) cur.style.transform = `translate(${cx}px,${cy}px)`;
      if (lab) lab.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(cLoop);
    })();

    const interactive = 'a,button,[data-cursor],.menu-row,.ev-card,.loc-card';
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest(interactive);
      if (!t || !cur) return;
      const word = t.dataset.cursor || '';
      cur.classList.add('is-big');
      if (word && lab) { lab.textContent = word; lab.classList.add('on'); }
    });
    document.addEventListener('mouseout', (e) => {
      if (!e.target.closest(interactive) || !cur) return;
      cur.classList.remove('is-big');
      if (lab) lab.classList.remove('on');
    });
  }

  /* ==========================================================
     NAV — hide on scroll down, return on scroll up
     ========================================================== */
  (function navBehaviour() {
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('mobileMenu');
    if (!nav) return;
    let last = 0;

    addEventListener('scroll', () => {
      const y = window.scrollY;
      nav.classList.toggle('solid', y > 40);
      if (menu && menu.classList.contains('open')) return;
      nav.classList.toggle('hide', y > last && y > 260);
      last = y;
    }, { passive: true });

    if (toggle && menu) {
      const links = menu.querySelectorAll('a');
      links.forEach((a, i) => a.style.transitionDelay = (0.05 + i * 0.045) + 's');

      toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        toggle.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.style.overflow = open ? 'hidden' : '';
        nav.classList.remove('hide');
      });
      links.forEach(a => a.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }));
    }
  })();

  /* smooth anchors */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ==========================================================
     BUILD MENU
     ========================================================== */
  (function buildMenu() {
    const list = document.getElementById('menuList');
    if (!list) return;

    function paint(cat) {
      const items = cat === 'all' ? MENU_D : MENU_D.filter(m => m.cat === cat);
      list.innerHTML = items.map((m, i) => `
        <article class="menu-row" data-cursor="view" data-glyph="${m.glyph}" data-name="${m.name}">
          <span class="num">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="nm">${m.name}<span class="ds">${m.desc}</span></h3>
          <span class="pr">${PRICE}</span>
        </article>`).join('');

      if (window.gsap && !REDUCED) {
        gsap.fromTo(list.querySelectorAll('.menu-row'),
          { y: 26, opacity: 0 },
          { y: 0, opacity: 1, duration: .55, ease: 'power3.out', stagger: .045, overwrite: true });
      }
    }

    paint('all');

    document.querySelectorAll('.menu-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.menu-tab').forEach(t => {
          t.classList.remove('on'); t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('on'); tab.setAttribute('aria-selected', 'true');
        paint(tab.dataset.cat);
      });
    });

    /* floating tile that follows the cursor */
    const float = document.getElementById('menuFloat');
    if (float && !TOUCH && !REDUCED) {
      const glyph = float.querySelector('.glyph');
      const label = float.querySelector('.lb');
      let fx = 0, fy = 0, ftx = 0, fty = 0, on = false;

      list.addEventListener('mouseover', e => {
        const row = e.target.closest('.menu-row');
        if (!row) return;
        glyph.textContent = row.dataset.glyph || '☕';
        label.textContent = row.dataset.name || '';
        float.classList.add('on'); on = true;
      });
      list.addEventListener('mouseout', e => {
        if (!e.target.closest('.menu-row')) return;
        float.classList.remove('on'); on = false;
      });
      addEventListener('mousemove', e => { ftx = e.clientX; fty = e.clientY; }, { passive: true });

      (function fLoop() {
        fx = lerp(fx, ftx, 0.12); fy = lerp(fy, fty, 0.12);
        const rot = clamp((ftx - fx) * 0.16, -12, 12);
        float.style.transform =
          `translate(${fx}px,${fy}px) translate(-50%,-50%) rotate(${rot}deg) scale(${on ? 1 : .9})`;
        requestAnimationFrame(fLoop);
      })();
    }
  })();

  /* ==========================================================
     BUILD LOCATIONS
     ========================================================== */
  (function buildLocations() {
    const grid = document.getElementById('locGrid');
    const search = document.getElementById('locSearch');
    if (!grid) return;

    function card(l) {
      const maps = 'https://www.google.com/maps/search/?api=1&query=' +
                   encodeURIComponent('Xpresso Cafe ' + l.address);
      return `
      <article class="loc-card">
        <div>
          <p class="eyebrow" style="color:var(--volt);font-size:10px">${l.tag} · ${l.city}</p>
          <h3 style="margin-top:8px">${l.name}</h3>
        </div>
        <p class="addr">${l.address}</p>
        <div class="loc-hours">
          ${l.hours.map(h => `<div><span>${h[0]}</span><b>${h[1]}</b></div>`).join('')}
        </div>
        <div class="loc-actions">
          <a class="loc-btn solid" href="${maps}" target="_blank" rel="noopener" data-cursor="go">Get directions</a>
          ${l.phone ? `<a class="loc-btn" href="tel:${l.phone.replace(/\s/g,'')}" data-cursor="call">${l.phone}</a>` : ''}
        </div>
      </article>`;
    }

    function paint(q) {
      const term = (q || '').trim().toLowerCase();
      const rows = !term ? LOC_D : LOC_D.filter(l =>
        (l.name + ' ' + l.address + ' ' + l.city + ' ' + l.province + ' ' + l.tag)
          .toLowerCase().includes(term));

      grid.innerHTML = rows.length
        ? rows.map(card).join('')
        : `<div class="loc-empty">No Xpresso found for “${q}”. We're popping up everywhere fast —
             <a href="mailto:info@xpressocafe.co.za" style="color:var(--volt);font-weight:700">tell us where you want one</a>.</div>`;

      if (window.gsap && !REDUCED) {
        gsap.fromTo(grid.querySelectorAll('.loc-card'),
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: .5, ease: 'power3.out', stagger: .04, overwrite: true });
      }
    }

    paint('');
    if (search) {
      let t;
      search.addEventListener('input', e => {
        clearTimeout(t);
        t = setTimeout(() => paint(e.target.value), 130);
      });
    }
  })();

  /* ==========================================================
     BUILD VOICES
     ========================================================== */
  (function buildVoices() {
    const track = document.getElementById('voiceTrack');
    if (!track) return;
    track.innerHTML = VOICE_D.map(v =>
      `<blockquote class="voice"><p>“${v.q}”</p><cite class="src">${v.s}</cite></blockquote>`).join('');
  })();

  /* year */
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ==========================================================
     GSAP CHOREOGRAPHY
     ========================================================== */
  function startHero() {
    if (!window.gsap) return;

    const heroWords = document.querySelectorAll('.hero-title .mask > span');
    if (REDUCED) {
      gsap.set(heroWords, { y: 0 });
      gsap.set('.hero-sub, .hero-top', { opacity: 1 });
      return;
    }
    gsap.set(heroWords, { y: '110%' });
    gsap.timeline()
      .to(heroWords, { y: '0%', duration: .95, ease: 'power4.out', stagger: .085 })
      .from('.hero-top', { opacity: 0, y: 14, duration: .6, ease: 'power2.out' }, '-=.6')
      .from('.hero-sub', { opacity: 0, y: 26, duration: .7, ease: 'power3.out' }, '-=.45')
      .from('.scroll-cue', { opacity: 0, duration: .5 }, '-=.3');
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    /* ---- environment transitions ---- */
    if (ENVS) {
      document.querySelectorAll('[data-env]').forEach(sec => {
        const env = ENVS[sec.dataset.env];
        if (!env) return;
        ScrollTrigger.create({
          trigger: sec,
          start: 'top 55%',
          end: 'bottom 45%',
          onToggle: self => {
            if (!self.isActive) return;
            gsap.to(document.body, {
              backgroundColor: env.bg, color: env.fg,
              duration: REDUCED ? 0 : .9, ease: 'power2.inOut', overwrite: 'auto'
            });
          }
        });
      });
    }

    if (!REDUCED) {
      /* ---- generic masked line reveals ---- */
      gsap.utils.toArray('.sec .mask > span, .footer-big').forEach(el => {
        gsap.from(el, {
          yPercent: 108, duration: .95, ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 88%' }
        });
      });

      gsap.utils.toArray('[data-reveal]').forEach(el => {
        gsap.from(el, {
          y: 26, opacity: 0, duration: .8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%' }
        });
      });

      /* ---- THE PRICE MOMENT ---- */
      const huge = document.getElementById('priceHuge');
      if (huge) {
        gsap.timeline({
          scrollTrigger: {
            trigger: '#price', start: 'top top', end: '+=110%',
            scrub: 1, pin: true, anticipatePin: 1
          }
        })
        .fromTo(huge, { scale: .34, rotate: -16, opacity: 0 },
                      { scale: 1, rotate: 0, opacity: 1, ease: 'power3.out' })
        .fromTo('#priceWord', { yPercent: 120, opacity: 0 },
                              { yPercent: 0, opacity: 1, ease: 'power3.out' }, '-=.35')
        .fromTo('#priceOrbit span',
                { y: 34, opacity: 0, scale: .8 },
                { y: 0, opacity: 1, scale: 1, stagger: .07, ease: 'back.out(1.7)' }, '-=.2')
        .to(huge, { scale: 1.16, ease: 'none' }, '+=.15');
      }

      /* ---- voices horizontal drift ---- */
      const track = document.getElementById('voiceTrack');
      if (track && track.children.length) {
        gsap.to(track, {
          x: () => -(track.scrollWidth - innerWidth + 40),
          ease: 'none',
          scrollTrigger: {
            trigger: '.voices', start: 'top 70%', end: 'bottom top',
            scrub: 1.1, invalidateOnRefresh: true
          }
        });
      }

      /* ---- events + split cards ---- */
      gsap.utils.toArray('.ev-card').forEach((c, i) => {
        gsap.from(c, {
          y: 46, opacity: 0, duration: .7, ease: 'power3.out', delay: i * .06,
          scrollTrigger: { trigger: '.ev-grid', start: 'top 84%' }
        });
      });
      gsap.utils.toArray('.split > div').forEach((c, i) => {
        gsap.from(c, {
          y: 54, opacity: 0, duration: .8, ease: 'power3.out', delay: i * .12,
          scrollTrigger: { trigger: '.split', start: 'top 82%' }
        });
      });

      /* ---- magnetic buttons ---- */
      if (!TOUCH) {
        document.querySelectorAll('.btn, .nav-cta').forEach(btn => {
          btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            gsap.to(btn, {
              x: (e.clientX - r.left - r.width / 2) * .28,
              y: (e.clientY - r.top - r.height / 2) * .38,
              duration: .5, ease: 'power3.out'
            });
          });
          btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.4)' });
          });
        });
      }
    }

    addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
