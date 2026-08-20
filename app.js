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

  /* ------------------------------------------------------------
     DRAWN ICONS — hand-built line art, no emoji. Stroke inherits
     currentColor so they read in espresso on light chips and warm
     cream on the dark price stage. Reused by the menu + R14 page.
     ------------------------------------------------------------ */
  const SVG = p => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const DRAW = {
    coffee: SVG('<path d="M11 21h20v8a9 9 0 0 1-9 9h-2a9 9 0 0 1-9-9V21Z"/><path d="M31 23h4a5 5 0 0 1 0 10h-4"/><path d="M9 42h26"/><path d="M17 9c-1.6 2 1.6 3 0 5M24 9c-1.6 2 1.6 3 0 5"/>'),
    tea:    SVG('<path d="M12 22h18v7a9 9 0 0 1-9 9 9 9 0 0 1-9-9V22Z"/><path d="M30 24h4a4.5 4.5 0 0 1 0 9h-4"/><path d="M10 42h22"/><path d="M21 22l1-5 4-2"/><path d="M22 12c3 1 4 3 4 5"/>'),
    croissant: SVG('<path d="M9 33C6 22 15 12 27 12c6 0 10 4 10 8 0 3-2 5-5 5-6 0-9 3-9 8 0 3-2 5-5 5-4 0-7-2-9-5Z"/><path d="M17 21l2 4M23 17l2 4M30 17l1 4"/>'),
    sandwich: SVG('<path d="M8 19 24 11l16 8-16 6Z"/><path d="M8 25l16 8 16-8"/><path d="M8 19v6M40 19v6"/><path d="M14 21l3 1M22 20l3 1"/>'),
    doughnut: SVG('<circle cx="24" cy="24" r="13.5"/><circle cx="24" cy="24" r="5"/><path d="M15 17l1.4 2M21 13l.8 2.2M30 13l-.8 2.2M35 19l-2 1M33 30l-2-1M17 32l1-2"/>'),
    cold:   SVG('<path d="M15 19h18l-2 21a2.5 2.5 0 0 1-2.5 2.3H19.5A2.5 2.5 0 0 1 17 40L15 19Z"/><path d="M13 19h22"/><path d="M27 7l-2.5 12M27 7h4"/>'),
    mug:    SVG('<rect x="11" y="19" width="19" height="19" rx="3"/><path d="M30 23h4a5 5 0 0 1 0 10h-4"/><path d="M17 9c-1.6 2 1.6 3 0 5M24 9c-1.6 2 1.6 3 0 5"/>'),
    beans:  SVG('<g transform="rotate(-22 18 25)"><ellipse cx="18" cy="25" rx="7.5" ry="11"/><path d="M18 14.5c-3 6-3 15 0 21"/></g><g transform="rotate(20 32 26)"><ellipse cx="32" cy="26" rx="6.5" ry="9.5"/><path d="M32 17c-2.6 5-2.6 13 0 18"/></g>')
  };
  /* map a menu item to its drawing (by name, then category) */
  function menuIcon(m){
    const byName = {
      'Freshly Brewed Coffee':'coffee','Individual Teas':'tea','Pastries & More':'croissant',
      'Sandwiches':'sandwich','Sweet Treats & More':'doughnut','Doughnuts':'doughnut',
      'Cold Drinks & Juices':'cold','Hot Chocolate':'mug'
    };
    const byCat = { coffee:'coffee', baked:'croissant', savoury:'sandwich', sweet:'doughnut', cold:'cold' };
    return DRAW[byName[m.name]] || DRAW[byCat[m.cat]] || DRAW.coffee;
  }

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

    const priceRow = it => {
      const name = typeof it === 'string' ? it : it.name;
      const note = (typeof it === 'object' && it.note) ? ` <em>${it.note}</em>` : '';
      return `<div class="menu-item"><span class="mi-name">${name}${note}</span><span class="mi-pr">${PRICE}</span></div>`;
    };

    list.innerHTML = MENU_D.map((c, i) => `
      <details class="menu-cat"${i === 0 ? ' open' : ''}>
        <summary class="menu-cat-head" data-cursor="view">
          <span class="menu-thumb" aria-hidden="true">${DRAW[c.icon] || DRAW.coffee}</span>
          <span class="menu-cat-title">${c.title}</span>
          <span class="menu-cat-count">${c.items.length} items</span>
          <span class="menu-chev" aria-hidden="true"></span>
        </summary>
        <div class="menu-cat-body">
          ${c.items.map(priceRow).join('')}
        </div>
      </details>`).join('');
  })();

  /* ==========================================================
     R14 PAGE DRAWINGS — populate the illustration layer
     ========================================================== */
  (function buildPriceDrawings() {
    const wrap = document.getElementById('priceDraw');
    if (!wrap) return;
    const order = ['coffee','croissant','beans','doughnut','cold','mug','tea','beans'];
    wrap.innerHTML = order.map((k, i) =>
      `<span class="dw d${i + 1}">${DRAW[k]}</span>`).join('');
  })();

  /* ==========================================================
     BUILD LOCATIONS — nearest-first engine + full drawer
     Scales to the full 75+ national footprint automatically:
     add stores (with lat/lng) to LOCATIONS in data.js.
     ========================================================== */
  (function buildLocations() {
    const grid    = document.getElementById('locGrid');     // nearest-3 result grid
    const status  = document.getElementById('locStatus');
    const locate  = document.getElementById('locLocate');
    const browse  = document.getElementById('locBrowse');
    const drawer  = document.getElementById('locDrawer');
    const scrim   = document.getElementById('locDrawerScrim');
    const closeB  = document.getElementById('locDrawerClose');
    const search  = document.getElementById('locSearch');
    const listEl  = document.getElementById('locList');
    const chipsEl = document.getElementById('locChips');
    if (!grid || !LOC_D.length) return;

    const mapsUrl = l => 'https://www.google.com/maps/search/?api=1&query=' +
                    encodeURIComponent('Xpresso Cafe ' + l.address);

    /* Haversine distance in km */
    function distKm(aLat, aLng, bLat, bLng) {
      const R = 6371, toR = d => d * Math.PI / 180;
      const dLat = toR(bLat - aLat), dLng = toR(bLng - aLng);
      const x = Math.sin(dLat/2)**2 +
                Math.cos(toR(aLat)) * Math.cos(toR(bLat)) * Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }

    /* ---- nearest-3 result cards ---- */
    function nearCard(l) {
      const d = l._dist != null ? `<span class="dist">${l._dist.toFixed(1)} km</span>` : '';
      return `
      <article class="loc-card">
        ${d}
        <div>
          <p class="eyebrow" style="font-size:10px">${l.tag} &middot; ${l.city}</p>
          <h3 style="margin-top:8px">${l.name}</h3>
        </div>
        <p class="addr">${l.address}</p>
        <div class="loc-hours">
          ${l.hours.map(h => `<div><span>${h[0]}</span><b>${h[1]}</b></div>`).join('')}
        </div>
        <div class="loc-actions">
          <a class="loc-btn solid" href="${mapsUrl(l)}" target="_blank" rel="noopener" data-cursor="go">Get directions</a>
          ${l.phone ? `<a class="loc-btn" href="tel:${l.phone.replace(/\s/g,'')}" data-cursor="call">${l.phone}</a>` : ''}
        </div>
      </article>`;
    }

    function paintNear(rows) {
      grid.innerHTML = rows.map(nearCard).join('');
      if (window.gsap && !REDUCED) {
        gsap.fromTo(grid.querySelectorAll('.loc-card'),
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: .5, ease: 'power3.out', stagger: .06, overwrite: true });
      }
    }

    /* default view before geolocation: the flagship + two mall anchors */
    paintNear(LOC_D.slice(0, 3));

    /* ---- geolocation: surface the 3 nearest ---- */
    if (locate) {
      locate.addEventListener('click', () => {
        if (!navigator.geolocation) {
          status.textContent = 'Location isn\'t available on this device — browse the full list instead.';
          return;
        }
        locate.classList.add('busy');
        status.textContent = 'Finding your nearest Xpressos…';
        navigator.geolocation.getCurrentPosition(pos => {
          const { latitude, longitude } = pos.coords;
          const ranked = LOC_D
            .filter(l => typeof l.lat === 'number' && typeof l.lng === 'number')
            .map(l => ({ ...l, _dist: distKm(latitude, longitude, l.lat, l.lng) }))
            .sort((a, b) => a._dist - b._dist);
          const top = ranked.slice(0, 3);
          locate.classList.remove('busy');
          if (!top.length) { status.textContent = 'No mapped stores yet — browse the full list.'; return; }
          status.textContent = `Your ${top.length} nearest — closest is ${top[0].name}, ${top[0]._dist.toFixed(1)} km away.`;
          paintNear(top);
        }, () => {
          locate.classList.remove('busy');
          status.textContent = 'Couldn\'t get your location. Search the full list instead.';
          openDrawer();
        }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
      });
    }

    /* ---- full drawer: search + province filter across all stores ---- */
    let activeProvince = 'All';
    const provinces = ['All', ...Array.from(new Set(LOC_D.map(l => l.province)))];

    function renderChips() {
      chipsEl.innerHTML = provinces.map(p =>
        `<button class="loc-chip${p === activeProvince ? ' on' : ''}" data-prov="${p}">${p}</button>`).join('');
      chipsEl.querySelectorAll('.loc-chip').forEach(c =>
        c.addEventListener('click', () => { activeProvince = c.dataset.prov; renderChips(); paintList(search.value); }));
    }

    function paintList(q) {
      const term = (q || '').trim().toLowerCase();
      const rows = LOC_D.filter(l => {
        const provOk = activeProvince === 'All' || l.province === activeProvince;
        const hay = `${l.name} ${l.address} ${l.city} ${l.province} ${l.tag}`.toLowerCase();
        return provOk && (!term || hay.includes(term));
      });
      listEl.innerHTML = rows.length ? rows.map(l => `
        <div class="loc-line">
          <div>
            <h4>${l.name}</h4>
            <p class="meta">${l.tag} &middot; ${l.city}, ${l.province}<br>${l.address}</p>
          </div>
          <a class="go" href="${mapsUrl(l)}" target="_blank" rel="noopener" data-cursor="go">Directions &rarr;</a>
        </div>`).join('')
        : `<div class="loc-empty" style="padding:40px 0">No Xpresso matches that yet. We're popping up fast —
             <a href="mailto:info@xpressocafe.co.za" style="color:var(--volt);font-weight:700">tell us where you want one</a>.</div>`;
    }

    function openDrawer() { drawer.classList.add('open'); document.body.style.overflow = 'hidden'; renderChips(); paintList(''); setTimeout(() => search && search.focus(), 400); }
    function closeDrawer() { drawer.classList.remove('open'); document.body.style.overflow = ''; }

    if (browse)  browse.addEventListener('click', openDrawer);
    if (closeB)  closeB.addEventListener('click', closeDrawer);
    if (scrim)   scrim.addEventListener('click', closeDrawer);
    addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });
    if (search) {
      let t;
      search.addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => paintList(e.target.value), 120); });
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

  /* ==========================================================
     IMAGERY — real photography wired from images.js
     ========================================================== */
  (function buildImagery(){
    if (typeof IMAGES === 'undefined') return;

    const set = (id, key) => {
      const el = document.getElementById(id);
      const im = IMAGES[key];
      if (!el || !im) return;
      el.src = im.src;
      el.alt = im.alt;
    };

    set('bannerBg', 'counter');
    set('bannerProductImg', 'threeCups');
    /* customer photo wall */
    const wall = document.getElementById('photoWall');
    if (wall && typeof WALL !== 'undefined') {
      wall.innerHTML = WALL.map(w => {
        const im = IMAGES[w.k];
        if (!im) return '';
        return `<div class="img-slot ${w.cls}">
          <img src="${im.src}" alt="${im.alt}" loading="lazy" decoding="async">
        </div>`;
      }).join('');
    }

    /* marquee — duplicated once so the -50% loop is seamless */
    const mq = document.getElementById('marqueeTrack');
    if (mq) {
      const words = ['Everything R14','Freshly brewed','Cape Town','Coffee for everyone',
                     'Pastries &amp; more','Sweet treats','Since the first cup'];
      const run = words.map(w => `<span>${w}</span><i></i>`).join('');
      mq.innerHTML = run + run;
    }

    /* scattered beans */
    document.querySelectorAll('.scatter').forEach(sc => {
      const n = MOBILE ? 5 : 9;
      let html = '';
      for (let i = 0; i < n; i++) {
        const s  = 16 + Math.random() * 30;
        const x  = Math.random() * 100;
        const y  = Math.random() * 100;
        const r  = -50 + Math.random() * 100;
        const o  = 0.28 + Math.random() * 0.4;
        html += `<b style="--s:${s.toFixed(0)}px;--r:${r.toFixed(0)}deg;--o:${o.toFixed(2)};left:${x.toFixed(1)}%;top:${y.toFixed(1)}%"></b>`;
      }
      sc.innerHTML = html;
    });
  })();

  /* year */
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* Sync every static "R14" in the HTML to the single source of truth in
     data.js, so changing XPRESSO_PRICE actually changes the price
     everywhere — including the huge price-moment numeral — instead of
     relying on find-and-replace across the markup staying in sync by hand. */
  document.querySelectorAll('[data-price]').forEach(el => { el.textContent = PRICE; });

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
        .fromTo('#priceDraw .dw',
                { scale: .6, opacity: 0, rotate: 0 },
                { scale: 1, opacity: .92, duration: .5, stagger: .06, ease: 'back.out(1.6)' }, '-=.3')
        .fromTo('#priceWhy',
                { y: 24, opacity: 0 },
                { y: 0, opacity: 1, ease: 'power3.out' }, '-=.15')
        .to(huge, { scale: 1.12, ease: 'none' }, '+=.15');
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
