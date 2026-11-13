// Procedurální 3D modely produktů. Každý díl je samostatný objekt,
// takže ho lze "odsunout" (exploded view) a popsat.
// Modely jsou ilustrační – konstrukce konkrétního kusu se může mírně lišit.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const C = {
  fabric: 0x5f6368, fabricDark: 0x2c2f33, trim: 0x17181b, orange: 0xff6a13,
  steel: 0xb9bfc7, board: 0xe6e5df, fleece: 0xd8c9b0, black: 0x151618,
  catWhite: 0xf3efe8, catDark: 0x6f6156, fuel: 0xf2a81d,
};

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });

// ---- textura síťoviny --------------------------------------------------
let netCanvas;
function netMaterial(rx, ry) {
  if (!netCanvas) {
    netCanvas = document.createElement('canvas');
    netCanvas.width = netCanvas.height = 32;
    const g = netCanvas.getContext('2d');
    g.strokeStyle = '#fff';
    g.lineWidth = 3.5;
    for (let i = 0; i <= 32; i += 16) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 32); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(32, i); g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(netCanvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    color: 0x22252a, map: t, transparent: true, opacity: 0.8, alphaTest: 0.02,
    depthWrite: false, side: THREE.DoubleSide, roughness: 0.9,
  });
}

function rrPath(Ctor, w, h, r, cx = 0, cy = 0) {
  const p = new Ctor();
  const x = cx - w / 2, y = cy - h / 2;
  r = Math.min(r, w / 2, h / 2);
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y);
  return p;
}

// Textilní panel s okny ze síťoviny (otvor + síťka + lemovka)
function panel(w, h, d, holes, material) {
  const s = rrPath(THREE.Shape, w, h, 0.2);
  holes.forEach((o) => s.holes.push(rrPath(THREE.Path, o.w, o.h, o.r ?? 0.12, o.x ?? 0, o.y ?? 0)));
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 10 });
  g.translate(0, 0, -d / 2);
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(g, material));
  grp.userData.inserts = [];
  holes.forEach((o) => {
    const x = o.x ?? 0, y = o.y ?? 0, r = o.r ?? 0.12;
    const net = new THREE.Mesh(new THREE.ShapeGeometry(rrPath(THREE.Shape, o.w, o.h, r), 10), netMaterial(o.w * 7, o.h * 7));
    net.geometry.translate(x, y, 0);
    grp.add(net);
    grp.userData.inserts.push(net);
    const ts = rrPath(THREE.Shape, o.w + 0.1, o.h + 0.1, r + 0.05, x, y);
    ts.holes.push(rrPath(THREE.Path, o.w - 0.02, o.h - 0.02, r, x, y));
    const tg = new THREE.ExtrudeGeometry(ts, { depth: d + 0.06, bevelEnabled: false, curveSegments: 10 });
    tg.translate(0, 0, -(d + 0.06) / 2);
    grp.add(new THREE.Mesh(tg, std(C.trim, { roughness: 0.6 })));
  });
  return grp;
}

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

function makeRegistry() {
  const root = new THREE.Group();
  const parts = [];
  const add = (obj, explode, name, desc, extra = {}) => {
    root.add(obj);
    parts.push({ obj, explode, name, desc, ...extra });
    return obj;
  };
  return { root, parts, add };
}

// ======================================================================
//  BATOH PRO KOČKU
// ======================================================================
function buildBackpack() {
  const { root, parts, add } = makeRegistry();
  const W = 3.0, H = 4.0, D = 2.2, T = 0.14;
  const fabric = () => std(C.fabric, { roughness: 0.95 });

  // --- horní panel + rukojeť
  const top = new THREE.Group();
  top.position.y = H / 2;
  const tp = panel(W, D, T, [{ w: 1.7, h: 0.9, y: -0.3, r: 0.3 }], fabric());
  tp.rotation.x = -Math.PI / 2;
  top.add(tp);
  const gripMat = std(C.black, { roughness: 0.5 });
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.1, 24), gripMat);
  grip.rotation.z = Math.PI / 2; grip.position.set(0, 0.42, -0.6);
  top.add(grip);
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.42, 0.12, 2, 0.04), gripMat);
    post.position.set(sx * 0.62, 0.22, -0.6);
    top.add(post);
  }
  add(top, [0, 1.8, 0], 'Horní panel s rukojetí',
    'Horní okno ze síťoviny pro přívod vzduchu a pevná rukojeť. Batoh můžete nést i v ruce jako přepravku.');

  // --- přední panel s průhledem
  const front = panel(W, H, T, [{ w: 2.0, h: 1.35, y: 0.95, r: 0.55 }], fabric());
  front.position.z = D / 2;
  const reflect = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.09, 0.03),
    std(0xe2e6ea, { metalness: 0.7, roughness: 0.2, emissive: 0x2b2e31 }));
  reflect.position.set(0, 0.05, T / 2 + 0.015);
  front.add(reflect);
  add(front, [0, 0, 1.9], 'Přední panel s průhledem',
    'Kulaté okno nahoře: kočka vidí ven a vy vidíte na ni. Reflexní pruh vás udělá viditelnými ve tmě, když nesvítí pouliční osvětlení.');

  // --- přední kapsa
  const pocket = panel(2.3, 1.5, 0.3, [{ w: 1.8, h: 1.0, y: -0.06, r: 0.25 }], fabric());
  pocket.position.set(0, -0.95, D / 2 + T / 2 + 0.16);
  const pull = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.2, 0.05, 2, 0.02), std(C.orange));
  pull.position.set(0.25, 0.62, 0.17);
  pocket.add(pull);
  add(pocket, [0, -0.2, 3.1], 'Přední kapsa na zip',
    'Síťovaná kapsa: očkovací průkaz, pamlsky, sáček s krmivem, náhradní podložka. Všechno pro kočku na jednom místě.');

  // --- pravá bočnice s kapsou
  const right = panel(D, H, T, [{ w: 1.45, h: 2.5, y: 0.35, r: 0.35 }], fabric());
  right.rotation.y = Math.PI / 2; right.position.x = W / 2;
  const bottle = new THREE.Mesh(new RoundedBoxGeometry(1.4, 1.1, 0.34, 3, 0.1), fabric());
  bottle.position.set(0, -1.3, T / 2 + 0.17);
  right.add(bottle);
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.08, 0.36), std(C.trim));
  band.position.set(0, -0.78, T / 2 + 0.17);
  right.add(band);
  add(right, [1.9, 0, 0], 'Pravá bočnice s kapsou',
    'Větrací okno a boční kapsa se stahovací gumou na láhev vody nebo skládací misku.');

  // --- levá bočnice se zipem
  const left = panel(D, H, T, [{ w: 1.45, h: 2.5, y: 0.35, r: 0.35 }], fabric());
  left.rotation.y = -Math.PI / 2; left.position.x = -W / 2;
  add(left, [-1.7, 0, 0], 'Levá bočnice se zipem',
    'Síťované okno pro větrání. Po rozepnutí zipu se celá bočnice otevře do rozšiřitelného dílu.');

  // --- rozšiřitelný díl
  const exp = new THREE.Group();
  exp.position.x = -W / 2 - T / 2 - 0.02;
  const inner = new THREE.Group();
  exp.add(inner);
  const L = 2.0, eh = H - 0.6, ed = D - 0.3;
  const netF = new THREE.Mesh(new THREE.PlaneGeometry(L, eh), netMaterial(L * 7, eh * 7));
  netF.position.set(-L / 2, 0, ed / 2); inner.add(netF);
  const netB = netF.clone(); netB.position.z = -ed / 2; inner.add(netB);
  const netE = new THREE.Mesh(new THREE.PlaneGeometry(ed, eh), netMaterial(ed * 7, eh * 7));
  netE.rotation.y = Math.PI / 2; netE.position.set(-L, 0, 0); inner.add(netE);
  const netT = new THREE.Mesh(new THREE.PlaneGeometry(L, ed), netMaterial(L * 7, ed * 7));
  netT.rotation.x = -Math.PI / 2; netT.position.set(-L / 2, eh / 2, 0); inner.add(netT);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(L, 0.08, ed), fabric());
  floor.position.set(-L / 2, -eh / 2, 0); inner.add(floor);
  const edge = std(C.trim, { roughness: 0.6 });
  for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(L, 0.06, 0.06), edge);
    e.position.set(-L / 2, sy * eh / 2, sz * ed / 2); inner.add(e);
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.06, eh, 0.06), edge);
    v.position.set(-L, 0, sz * ed / 2); if (sy > 0) inner.add(v);
    const hz = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, ed), edge);
    hz.position.set(-L, sy * eh / 2, 0); if (sz > 0) inner.add(hz);
  }
  add(exp, [-1.9, 0, 0], 'Rozšiřitelný díl',
    'Složený leží naplocho u bočnice. Po rozepnutí vznikne dvojnásobný prostor – kočka si lehne a natáhne se při dlouhé cestě nebo noci v úkrytu.',
    { labelAt: V(-W / 2 - 1.1, eh / 2 + 0.2, 0) });

  // --- zádový panel
  const back = new THREE.Group();
  const bp = panel(W, H, T, [], fabric());
  bp.position.z = -D / 2; back.add(bp);
  for (const sx of [-1, 1]) {
    const pad = new THREE.Mesh(new RoundedBoxGeometry(0.75, 2.7, 0.18, 3, 0.08), std(C.fabricDark, { roughness: 1 }));
    pad.position.set(sx * 0.75, 0.2, -D / 2 - 0.15); back.add(pad);
  }
  add(back, [0, 0, -1.7], 'Zádový panel',
    'Pevná zadní stěna s prodyšnými polštářky. Váha kočky se rozloží po zádech, ne na ramena.');

  // --- popruhy
  const straps = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(-0.2, -0.045); sh.lineTo(0.2, -0.045); sh.lineTo(0.2, 0.045); sh.lineTo(-0.2, 0.045); sh.closePath();
  for (const sx of [-1, 1]) {
    const curve = new THREE.QuadraticBezierCurve3(V(sx * 0.75, 1.75, -D / 2 - 0.25), V(sx * 0.75, 0.2, -D / 2 - 1.3), V(sx * 0.75, -1.7, -D / 2 - 0.25));
    const g = new THREE.ExtrudeGeometry(sh, { steps: 48, bevelEnabled: false, extrudePath: curve });
    straps.add(new THREE.Mesh(g, std(C.fabricDark, { roughness: 1 })));
    const buckle = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.18, 0.08, 2, 0.03), std(C.black));
    const p = curve.getPoint(0.82);
    buckle.position.copy(p); buckle.lookAt(p.clone().add(curve.getTangent(0.82)));
    buckle.rotateX(Math.PI / 2);
    straps.add(buckle);
  }
  add(straps, [0, 0, -2.6], 'Polstrované popruhy',
    'Nastavitelné ramenní popruhy. Obě ruce máte volné – na děti, zavazadla, baterku.');

  // --- výztužný rám
  const frame = new THREE.Group();
  const fm = std(0x55595f, { metalness: 0.7, roughness: 0.35 });
  const hx = W / 2 - 0.1, hy = H / 2 - 0.1, hz = D / 2 - 0.1, r = 0.03;
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    const vy = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2 * hy, 8), fm); vy.position.set(a * hx, 0, b * hz); frame.add(vy);
    const vx = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2 * hx, 8), fm); vx.rotation.z = Math.PI / 2; vx.position.set(0, a * hy, b * hz); frame.add(vx);
    const vz = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2 * hz, 8), fm); vz.rotation.x = Math.PI / 2; vz.position.set(a * hx, b * hy, 0); frame.add(vz);
  }
  add(frame, [0, 0, 0], 'Výztužný rám',
    'Pruty ve švech drží tvar batohu. Stěny se neprohnou dovnitř a kočka se nemačká ani při chůzi v davu.',
    { labelAt: V(hx, hy, hz) });

  // --- bezpečnostní vodítko
  const leash = new THREE.Group();
  const lc = new THREE.CatmullRomCurve3([V(0, H / 2 - 0.1, -0.4), V(0.05, H / 2 - 0.45, -0.3), V(0.15, H / 2 - 0.8, -0.15)]);
  leash.add(new THREE.Mesh(new THREE.TubeGeometry(lc, 20, 0.03, 8), std(C.orange)));
  const clip = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 8, 20), std(C.steel, { metalness: 0.9, roughness: 0.3 }));
  clip.position.copy(lc.getPoint(1)).add(V(0, -0.07, 0));
  leash.add(clip);
  add(leash, [0, 0.9, 0.3], 'Bezpečnostní vodítko',
    'Krátké vodítko uvnitř se připne k obojku nebo postroji. Když batoh otevřete, kočka nevyskočí a neuteče.');

  // --- podložka, výztuha, dno
  const pad = new THREE.Mesh(new RoundedBoxGeometry(W - 0.35, 0.14, D - 0.35, 3, 0.06), std(C.fleece, { roughness: 1 }));
  pad.position.y = -H / 2 + 0.24;
  add(pad, [0, -0.95, 0], 'Odnímatelná podložka',
    'Měkká vyjímatelná podložka. Když kočka cestu ve stresu nezvládne, vytáhnete ji a vyperete.');

  const board = new THREE.Mesh(new THREE.BoxGeometry(W - 0.25, 0.06, D - 0.25), std(C.board, { roughness: 0.5 }));
  board.position.y = -H / 2 + 0.12;
  add(board, [0, -1.75, 0], 'Pevná výztuha dna',
    'Plastová deska drží dno rovné. Kočka stojí jistě a batoh se neprověsí ani s těžším zvířetem.');

  const bottom = new THREE.Group();
  bottom.position.y = -H / 2;
  const bt = panel(W, D, T, [], std(C.fabricDark, { roughness: 0.9 }));
  bt.rotation.x = Math.PI / 2; bottom.add(bt);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 16), std(C.black));
    foot.position.set(sx * 1.2, -0.12, sz * 0.75); bottom.add(foot);
  }
  add(bottom, [0, -2.6, 0], 'Dno s nožkami',
    'Odolné spodní dno s plastovými nožkami. Batoh postavíte i na mokrou nebo špinavou zem.');

  // --- kočka (jen pro ukázku funkce)
  const cat = new THREE.Group();
  const cw = std(C.catWhite, { roughness: 1 }), cd = std(C.catDark, { roughness: 1 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), cw); body.scale.set(0.78, 0.5, 0.45); cat.add(body);
  const head = new THREE.Group(); head.position.set(-0.75, 0.42, 0); cat.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.36, 28, 20), cw); head.add(skull);
  const mask = new THREE.Mesh(new THREE.SphereGeometry(0.33, 24, 16, 0, Math.PI * 2, 0, 1.0), cd);
  mask.position.set(0.04, 0.04, 0); mask.rotation.z = 0.5; head.add(mask);
  for (const sz of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 16), cd);
    ear.position.set(0.02, 0.33, sz * 0.18); ear.rotation.x = sz * -0.3; head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), std(0x4aa3ff, { roughness: 0.2, emissive: 0x0b2a55 }));
    eye.position.set(-0.3, 0.06, sz * 0.13); head.add(eye);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), std(0xe39aa0)); nose.position.set(-0.36, -0.06, 0); head.add(nose);
  for (const [lx, lz] of [[-0.45, 0.2], [-0.45, -0.2], [0.45, 0.2], [0.45, -0.2]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.35, 10), cw); leg.position.set(lx, -0.4, lz); cat.add(leg);
  }
  const tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0.7, 0, 0), V(1.0, 0.2, 0.15), V(1.05, 0.55, 0.3)]), 16, 0.07, 8), cd);
  cat.add(tail);
  const catBase = V(0.25, -H / 2 + 0.31 + 0.55, 0);
  cat.position.copy(catBase);
  root.add(cat);

  let expState = 0.05, heading = 0;
  function update({ explode, work, time, dt }) {
    const target = Math.max(explode > 0.4 ? 1 : 0, work > 0.05 ? 1 : 0);
    expState = damp(expState, Math.max(0.05, target), 3, dt);
    inner.scale.x = expState;
    left.userData.inserts.forEach((m) => { m.visible = !(work > 0.3 && expState > 0.5); });
    cat.visible = explode < 0.35;
    const phase = Math.sin(time * 0.8);
    const walk = 0.5 - 0.5 * Math.cos(time * 0.8); // 0..1
    const k = work * Math.min(1, expState * 1.2);
    cat.position.x = catBase.x - 1.7 * walk * k;
    cat.position.y = catBase.y + Math.abs(Math.sin(time * 6)) * 0.03 * k;
    heading = damp(heading, phase > 0 || k < 0.1 ? 0 : Math.PI, 4, dt);
    cat.rotation.y = heading;
  }

  return { root, parts, update };
}

// ======================================================================
//  BATERIOVÁ PUMPA NA PALIVO
// ======================================================================
function buildPump() {
  const { root, parts, add } = makeRegistry();
  const xray = [];
  const xm = (color, o = {}) => {
    const m = std(color, { transparent: true, ...o });
    m.userData.baseOpacity = 1;
    xray.push(m);
    return m;
  };
  const steel = () => std(C.steel, { metalness: 0.9, roughness: 0.3 });

  // víčko
  const cap = new THREE.Group();
  const capBody = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.34, 0.18, 40), std(C.black, { roughness: 0.45 }));
  capBody.position.y = 2.2; cap.add(capBody);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.03, 10, 24), std(C.black, { roughness: 0.45 }));
  loop.position.y = 2.38; cap.add(loop);
  add(cap, [0, 1.7, 0], 'Šroubovací víčko', 'Uzavírá bateriovou komoru a těsní ji proti vlhku. Oko nahoře slouží k pověšení pumpy.');

  // tělo / bateriová komora
  const handle = new THREE.Group();
  const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.3, 1.85, 40, 1, true), xm(C.black, { roughness: 0.4, side: THREE.DoubleSide }));
  hb.position.y = 1.2; handle.add(hb);
  for (const y of [0.42, 1.98]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.315, 0.03, 10, 40), xm(C.orange));
    ring.rotation.x = Math.PI / 2; ring.position.y = y; handle.add(ring);
  }
  const hbBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 40), xm(C.black));
  hbBottom.position.y = 0.28; handle.add(hbBottom);
  add(handle, [0, 0.85, 0], 'Rukojeť a bateriová komora', 'Pevné tělo, které držíte v ruce. Uvnitř jsou baterie a motor, mimo dosah paliva.');

  // baterie
  const battery = (y) => {
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.6, 32), std(0x1d1e20, { metalness: 0.3, roughness: 0.4 }));
    b.position.y = y; g.add(b);
    const label = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.168, 0.32, 32), std(0xe0a21a, { metalness: 0.4, roughness: 0.35 }));
    label.position.y = y + 0.1; g.add(label);
    const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16), steel());
    nub.position.y = y + 0.325; g.add(nub);
    return g;
  };
  add(battery(1.67), [-1.4, 1.2, 0], 'Baterie D – 2. článek', 'Články jsou zapojené za sebou (2 × 1,5 V = 3 V). Mějte doma náhradní sadu – baterie vydrží roky ve skříni.');
  add(battery(1.02), [-1.4, 0.4, 0], 'Baterie D – 1. článek', 'Pumpa jede na 2 velké baterie typu D (nejsou součástí balení). Nepotřebuje zásuvku ani agregát, takže funguje i při blackoutu.');

  // spínač
  const sw = new THREE.Group();
  const swBody = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.36, 0.18, 2, 0.03), std(C.orange, { roughness: 0.5 }));
  swBody.position.set(0.33, 1.6, 0); sw.add(swBody);
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x1a2a1a, emissive: 0x39ff6a, emissiveIntensity: 0 });
  ledMat.userData.noHighlight = true;
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), ledMat);
  led.position.set(0.385, 1.73, 0); sw.add(led);
  add(sw, [0.9, 0.9, 0.5], 'Spínač jedním dotykem', 'Zapnout, přečerpat, vypnout. Ovládáte jednou rukou, druhou držíte trysku.');

  // motor
  const motor = new THREE.Group();
  const mb = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.36, 32), steel());
  mb.position.y = 0.52; motor.add(mb);
  const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.1, 32), std(0xb87333, { metalness: 0.9, roughness: 0.35 }));
  coil.position.y = 0.52; motor.add(coil);
  add(motor, [1.4, 0.4, 0], 'Elektromotor 3 V', 'Malý stejnosměrný motor napájený z baterií. Roztáčí hřídel, která vede trubicí až dolů k oběžnému kolu.');

  // výtlačné hrdlo
  const head = new THREE.Group();
  const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.42, 32), xm(C.orange, { roughness: 0.5 }));
  hd.position.y = 0.04; head.add(hd);
  const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.42, 20), xm(C.orange, { roughness: 0.5 }));
  outlet.rotation.z = Math.PI / 2; outlet.position.set(0.32, -0.02, 0); head.add(outlet);
  add(head, [0.5, 0, 1.0], 'Výtlačné hrdlo', 'Sem palivo vystoupá trubicí a odbočí do hadice.');

  // hadice
  const hosePts = [V(0.5, -0.02, 0), V(1.1, 0.25, 0.1), V(1.9, -0.3, 0.25), V(2.35, -1.6, 0.35), V(2.4, -2.55, 0.35)];
  const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hosePts), 80, 0.075, 14), xm(C.black, { roughness: 0.55 }));
  add(hose, [1.3, -0.2, 0.6], 'Palivová hadice', 'Pružná hadice odolná palivu. Kanystr necháte stát na zemi a tankujete do výš položeného hrdla.');

  // tryska
  const nozzle = new THREE.Group();
  const nb = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.65, 24), xm(C.black, { roughness: 0.5 }));
  nb.position.set(2.4, -2.85, 0.35); nozzle.add(nb);
  const lever = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.5, 0.12, 2, 0.03), xm(C.orange));
  lever.position.set(2.55, -2.82, 0.35); lever.rotation.z = -0.15; nozzle.add(lever);
  const spoutCurve = new THREE.CatmullRomCurve3([V(2.4, -3.15, 0.35), V(2.45, -3.5, 0.35), V(2.62, -3.85, 0.35), V(2.72, -4.05, 0.35)]);
  nozzle.add(new THREE.Mesh(new THREE.TubeGeometry(spoutCurve, 30, 0.055, 12), xm(C.orange, { roughness: 0.45 })));
  add(nozzle, [2.0, -0.4, 0.9], 'Pistolová tryska s regulací', 'Páčkou dávkujete průtok, takže nepřelijete. V balení jsou 2 trysky.');

  // adaptér na kanystr
  const adapter = new THREE.Group();
  [[0.42, -1.3], [0.34, -1.18], [0.26, -1.06]].forEach(([r, y]) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.02, r, 0.12, 32), std(C.orange, { roughness: 0.5 }));
    c.position.y = y; adapter.add(c);
  });
  add(adapter, [-1.4, -0.2, 0.3], 'Stupňovitý adaptér', 'Kužel utěsní hrdla kanystrů různých průměrů a drží pumpu svisle. V balení jsou 2.');

  // hřídel
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 4.05, 10), steel());
  shaft.position.y = -1.75;
  add(shaft, [-0.85, 0, 0], 'Hnací hřídel', 'Tenká ocelová hřídel přenáší otáčky motoru dolů k oběžnému kolu.');

  // oběžné kolo
  const impeller = new THREE.Group();
  impeller.position.y = -3.85;
  impeller.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16), std(C.orange)));
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.02), std(C.orange, { roughness: 0.45 }));
    const piv = new THREE.Group(); piv.rotation.y = (i * Math.PI) / 2;
    blade.position.x = 0.1; blade.rotation.x = 0.5; piv.add(blade); impeller.add(piv);
  }
  add(impeller, [0, -1.1, 0], 'Oběžné kolo', 'Rychle se točící lopatky na dně trubice tlačí kapalinu vzhůru. Žádné nasávání pusou, žádné spoléhání na spád.');

  // sítko
  const filter = new THREE.Group();
  const fnet = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 24, 1, true), netMaterial(6, 2));
  fnet.position.y = -4.15; filter.add(fnet);
  const fring = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 24), std(C.black));
  fring.position.y = -4.3; filter.add(fring);
  add(filter, [0, -1.9, 0], 'Sací sítko', 'Zachytí rez a nečistoty z kanystru, aby se nedostaly do motoru auta nebo agregátu.');

  // sací trubice
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 4.3, 32, 1, true), xm(C.black, { roughness: 0.45, side: THREE.DoubleSide }));
  tube.position.y = -1.95;
  add(tube, [0, 0, 0], 'Sací trubice', 'Pevná trubice, kterou ponoříte do kanystru nebo sudu. Vede v ní hřídel i proudící palivo.', { labelAt: V(0.13, -2.4, 0) });

  // ---- scéna "Jak to funguje": kanystr, kbelík, proud paliva
  const scene = new THREE.Group();
  root.add(scene);
  const ghost = (color, opacity) => {
    const m = new THREE.MeshStandardMaterial({ color, transparent: true, opacity, depthWrite: false, roughness: 0.3, side: THREE.DoubleSide });
    m.userData.baseOpacity = opacity; return m;
  };
  const sceneMats = [];
  const can = new THREE.Mesh(new RoundedBoxGeometry(1.9, 2.8, 1.3, 4, 0.14), ghost(0xc0281e, 0.22));
  can.position.y = -3.0; scene.add(can); sceneMats.push(can.material);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.3, 24, 1, true), ghost(0xc0281e, 0.4));
  neck.position.y = -1.48; scene.add(neck); sceneMats.push(neck.material);
  const canFuelGeo = new THREE.BoxGeometry(1.75, 1, 1.15); canFuelGeo.translate(0, 0.5, 0);
  const canFuel = new THREE.Mesh(canFuelGeo, ghost(C.fuel, 0.45));
  canFuel.position.y = -4.32; scene.add(canFuel); sceneMats.push(canFuel.material);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.55, 1.0, 32, 1, true), ghost(0x9fb3c8, 0.3));
  bucket.position.set(2.85, -4.95, 0.35); scene.add(bucket); sceneMats.push(bucket.material);
  const bFuelGeo = new THREE.CylinderGeometry(0.6, 0.55, 1, 32); bFuelGeo.translate(0, 0.5, 0);
  const bFuel = new THREE.Mesh(bFuelGeo, ghost(C.fuel, 0.55));
  bFuel.position.set(2.85, -5.42, 0.35); scene.add(bFuel); sceneMats.push(bFuel.material);

  const flow = new THREE.CatmullRomCurve3([
    V(0, -4.2, 0), V(0, -3.4, 0), V(0, -2.4, 0), V(0, -1.4, 0), V(0, -0.4, 0), V(0.05, -0.05, 0), V(0.3, -0.02, 0),
    ...hosePts, V(2.4, -3.15, 0.35), V(2.45, -3.5, 0.35), V(2.62, -3.85, 0.35), V(2.72, -4.05, 0.35), V(2.8, -4.45, 0.35), V(2.82, -5.0, 0.35),
  ], false, 'centripetal');
  const N = 110;
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6),
    new THREE.MeshStandardMaterial({ color: C.fuel, emissive: 0x7a3c00, roughness: 0.2 }), N);
  scene.add(drops);
  const dummy = new THREE.Object3D();
  const tmp = new THREE.Vector3();

  function update({ explode, work, time, dt }) {
    const xr = work * (1 - explode);
    xray.forEach((m) => {
      m.opacity = 1 - 0.78 * xr;
      m.depthWrite = xr < 0.5;
    });
    scene.visible = xr > 0.02;
    sceneMats.forEach((m) => { m.opacity = m.userData.baseOpacity * xr; });
    impeller.rotation.y += dt * 28 * work;
    shaft.rotation.y += dt * 28 * work;
    ledMat.emissiveIntensity = work * 2.2;
    const phase = (time * 0.07) % 1;
    canFuel.scale.y = 2.45 * (0.92 - 0.65 * phase);
    bFuel.scale.y = 0.05 + 0.85 * phase;
    for (let i = 0; i < N; i++) {
      const u = (i / N + time * 0.16) % 1;
      flow.getPointAt(u, tmp);
      dummy.position.copy(tmp);
      dummy.scale.setScalar(xr * (0.75 + 0.35 * Math.sin(i * 12.9)));
      dummy.updateMatrix();
      drops.setMatrixAt(i, dummy.matrix);
    }
    drops.instanceMatrix.needsUpdate = true;
  }

  // pumpa je štíhlá – pro čitelnost ji ve 3D rozšíříme do stran
  root.scale.set(1.5, 1, 1.5);
  return { root, parts, update };
}

export const MODELS = {
  backpack: {
    build: buildBackpack,
    camera: { position: [8.5, 5.2, 11.5], target: [-1.0, -0.3, 0] },
    distance: 14.8,
    captions: {
      assembled: 'Složený batoh. Kočka sedí na měkké podložce a dýchá přes síťovaná okna ze čtyř stran.',
      exploded: 'Rozložený batoh: 13 dílů. Klepněte na díl v modelu nebo v seznamu a uvidíte, k čemu slouží.',
      working: 'Rozepnete levou bočnici a vysunete síťovaný díl. Prostor se zdvojnásobí a kočka se může volně přesunout a lehnout si.',
    },
  },
  pump: {
    build: buildPump,
    camera: { position: [8.0, 1.8, 17.5], target: [2.1, -1.1, 0] },
    distance: 18.5,
    captions: {
      assembled: 'Pumpa nasazená v kanystru. Trubice dole, rukojeť s bateriemi nahoře, hadice s tryskou do nádrže.',
      exploded: 'Rozložená pumpa: 14 dílů. Klepněte na díl v modelu nebo v seznamu a uvidíte, k čemu slouží.',
      working: 'Baterie roztočí motor, hřídel přenese otáčky na oběžné kolo dole v trubici a to tlačí palivo vzhůru, hadicí až do trysky. Kryt je pro názornost průhledný.',
    },
  },
};
