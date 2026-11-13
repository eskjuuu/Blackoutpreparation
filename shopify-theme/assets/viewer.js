import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MODELS } from './models.js';

const MODES = {
  assembled: { explode: 0, work: 0 },
  exploded: { explode: 1, work: 0 },
  working: { explode: 0, work: 1 },
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountViewer(host, key) {
  const def = MODELS[key];
  const uid = `${key}-${Math.random().toString(36).slice(2, 7)}`;
  host.classList.add('viewer');
  host.innerHTML = `
    <div class="viewer__stage">
      <p class="viewer__hint">Táhnutím otočíte · kolečkem nebo dvěma prsty přiblížíte</p>
      <p class="viewer__badge">Ilustrační 3D model</p>
    </div>
    <div class="viewer__controls">
      <div class="seg" role="group" aria-label="Režim zobrazení">
        <button type="button" data-mode="assembled">Složeno</button>
        <button type="button" data-mode="exploded">Rozložit</button>
        <button type="button" data-mode="working">Jak funguje</button>
      </div>
      <label class="viewer__slider" for="explode-${uid}">
        <span>Rozložení</span>
        <input id="explode-${uid}" type="range" min="0" max="100" value="0">
      </label>
    </div>
    <p class="viewer__caption" aria-live="polite"></p>
    <ol class="viewer__parts"></ol>`;

  const stage = host.querySelector('.viewer__stage');
  const caption = host.querySelector('.viewer__caption');
  const list = host.querySelector('.viewer__parts');
  const slider = host.querySelector('input[type=range]');
  const buttons = [...host.querySelectorAll('[data-mode]')];

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    stage.insertAdjacentHTML('beforeend', '<p class="viewer__error">Váš prohlížeč nepodporuje 3D (WebGL). Zkuste jiný prohlížeč nebo zapněte hardwarovou akceleraci.</p>');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  stage.prepend(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'viewer__labels';
  stage.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xfff1e0, 1.4);
  sun.position.set(6, 10, 8);
  scene.add(sun, new THREE.HemisphereLight(0xdde6ff, 0x1a1410, 0.5));

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  camera.position.fromArray(def.camera.position);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.fromArray(def.camera.target);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 30;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.7;
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  const model = def.build();
  scene.add(model.root);
  model.root.updateMatrixWorld(true);

  const parts = model.parts;
  const box = new THREE.Box3();
  parts.forEach((p, i) => {
    p.obj.userData.partIndex = i;
    p.base = p.obj.position.clone();
    p.mats = [];
    p.obj.traverse((o) => {
      if (o.isMesh && o.material && !o.material.userData.noHighlight) {
        o.material.userData.baseEmissive ??= o.material.emissive?.getHex?.() ?? 0;
        o.material.userData.baseEI ??= o.material.emissiveIntensity ?? 1;
        p.mats.push(o.material);
      }
    });
    const el = document.createElement('div');
    el.className = 'part-label';
    el.innerHTML = `<i></i><span class="part-label__pill"><b>${i + 1}</b><span>${p.name}</span></span>`;
    const lbl = new CSS2DObject(el);
    // pozice popisku ve světových souřadnicích → převod do souřadnic dílu
    if (p.labelAt) lbl.position.copy(p.labelAt);
    else { box.setFromObject(p.obj); box.getCenter(lbl.position); }
    p.obj.worldToLocal(lbl.position);
    p.obj.add(lbl);
    p.labelEl = el;
    el.addEventListener('click', () => select(i));

    const li = document.createElement('li');
    li.innerHTML = `<button type="button"><b>${i + 1}</b>${p.name}</button>`;
    li.firstChild.addEventListener('click', () => select(i));
    li.firstChild.addEventListener('mouseenter', () => highlight(i, true));
    li.firstChild.addEventListener('mouseleave', () => highlight(i, false));
    list.appendChild(li);
    p.li = li;
  });

  let selected = -1;
  function paint(p, on) {
    p.mats.forEach((m) => {
      if (!m.emissive) return;
      m.emissive.setHex(on ? 0xff5a00 : m.userData.baseEmissive);
      m.emissiveIntensity = on ? 0.55 : m.userData.baseEI;
    });
  }
  function highlight(i, on) { if (i !== selected) paint(parts[i], on); }
  function select(i) {
    if (selected >= 0) { paint(parts[selected], false); parts[selected].li.classList.remove('is-active'); parts[selected].labelEl.classList.remove('is-active'); }
    selected = i === selected ? -1 : i;
    if (selected >= 0) {
      const p = parts[selected];
      paint(p, true);
      p.li.classList.add('is-active');
      p.labelEl.classList.add('is-active');
      caption.innerHTML = `<strong>${selected + 1}. ${p.name}.</strong> ${p.desc}`;
    } else {
      caption.textContent = def.captions[mode];
    }
  }

  // ---- režimy
  let mode = 'assembled';
  let explode = 0, explodeTarget = 0, work = 0, workTarget = 0;
  function setMode(m) {
    mode = m;
    explodeTarget = MODES[m].explode;
    workTarget = MODES[m].work;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    host.dataset.mode = m;
    if (selected >= 0) select(selected); // zruší výběr a ukáže popis režimu
    else caption.textContent = def.captions[m];
  }
  buttons.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  slider.addEventListener('input', () => {
    explodeTarget = slider.value / 100;
    workTarget = 0;
    mode = explodeTarget > 0.5 ? 'exploded' : 'assembled';
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    host.dataset.mode = mode;
  });
  setMode('assembled');

  // ---- klik na díl ve 3D
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    for (const hit of ray.intersectObjects(model.root.children, true)) {
      if (!hit.object.visible) continue;
      let o = hit.object;
      while (o && o.userData.partIndex === undefined) o = o.parent;
      if (o) { select(o.userData.partIndex); return; }
    }
  });

  // ---- velikost a kamera
  const dir = new THREE.Vector3();
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const a = camera.aspect;
    const dist = def.distance * (a < 1.25 ? Math.pow(1.25 / a, 0.8) : 1);
    dir.subVectors(camera.position, controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, dist);
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  // ---- smyčka (běží jen když je viewer vidět)
  const clock = new THREE.Clock();
  let elapsed = 0, firstView = true;
  const n = parts.length, stagger = 0.4;
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;
    explode = damp(explode, explodeTarget, reduceMotion ? 20 : 2.6, dt);
    work = damp(work, workTarget, 3, dt);
    if (Math.abs(explode - explodeTarget) < 0.001) explode = explodeTarget;
    parts.forEach((p, i) => {
      const start = (i / n) * stagger;
      const k = ease(clamp((explode - start) / (1 - stagger), 0, 1));
      p.obj.position.set(p.base.x + p.explode[0] * k, p.base.y + p.explode[1] * k, p.base.z + p.explode[2] * k);
      p.labelEl.style.opacity = String(clamp((k - 0.6) / 0.35, 0, 1));
      p.labelEl.style.pointerEvents = k > 0.8 ? 'auto' : 'none';
    });
    model.update({ explode, work, time: elapsed, dt });
    if (document.activeElement !== slider) slider.value = String(Math.round(explode * 100));
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      clock.getDelta();
      renderer.setAnimationLoop(frame);
      if (firstView) {
        firstView = false;
        setTimeout(() => { if (mode === 'assembled' && explodeTarget === 0) setMode('exploded'); }, 900);
      }
    } else {
      renderer.setAnimationLoop(null);
    }
  }, { threshold: 0.15 }).observe(stage);
  frame();

  const api = { setMode, camera, controls };
  (window.__viewers ||= {})[key] = api;
  return api;
}
