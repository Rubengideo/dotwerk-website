/* @ds-bundle: {"format":4,"namespace":"Modulair","components":[{"name":"Dot"},{"name":"DotStatus"},{"name":"DotStack"},{"name":"Button"},{"name":"IconButton"},{"name":"Icon"},{"name":"Badge"},{"name":"Tag"},{"name":"Avatar"},{"name":"Card"},{"name":"Input"},{"name":"Switch"},{"name":"Checkbox"},{"name":"Tabs"},{"name":"ProgressBar"},{"name":"Banner"},{"name":"Message"},{"name":"TypingIndicator"},{"name":"Composer"},{"name":"ApprovalCard"},{"name":"ActivityFeed"},{"name":"TeamRoster"},{"name":"TaskCard"},{"name":"Dialog"},{"name":"EmptyState"}]} */
(function () {
  "use strict";
  var React = window.React;
  var h = React.createElement;
  var useRef = React.useRef, useEffect = React.useEffect, useState = React.useState;

  function cx() { var out = []; for (var i = 0; i < arguments.length; i++) { if (arguments[i]) out.push(arguments[i]); } return out.join(" "); }
  function omit(o, keys) { var r = {}; for (var k in o) { if (keys.indexOf(k) < 0) r[k] = o[k]; } return r; }

  /* ================= Dot-motor (canvas) ================= */
  var DOT_STATES = ["idle", "listen", "think", "work", "wait", "done", "blocked"];
  var DOT_STATE_LABELS = { idle: "Rust", listen: "Luistert", think: "Denkt na", work: "Bezig", wait: "Wacht op jou", done: "Klaar", blocked: "Vastgelopen" };
  var DOT_SHAPES = ["circle", "pebble", "squircle", "capsule", "drop"];
  var DOT_COLORS = ["cobalt", "tomato", "sun", "leaf", "plum", "rose", "teal", "sky"];
  var DOT_ACCESSORIES = ["none", "glasses", "bow", "beret", "monocle"];
  var FALLBACK = { cobalt: "#2F6BFF", tomato: "#FF5A36", sun: "#FFC22E", leaf: "#1FB070", plum: "#8B5CF6", rose: "#FF7EB6", teal: "#18B8B0", sky: "#5AB8FF", face: "#111318" };
  var FEEL = { k: 200, d: 16, breath: 0.022, period: 3.2, hop: -170, blink: 0.13, sacc: [0.7, 2.2], wob: 0.5 };
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var pointer = { x: 0, y: 0, t: -1e9 };
  window.addEventListener("pointermove", function (e) { pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = performance.now(); }, { passive: true });

  function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
  function noise(x) { var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rgbOf(c) { c = String(c).trim().replace("#", ""); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]; return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function mix(c, to, a) { var v = rgbOf(c); return "rgb(" + v.map(function (x) { return Math.round(x + (to - x) * a); }).join(",") + ")"; }
  function rgba(c, a) { var v = rgbOf(c); return "rgba(" + v[0] + "," + v[1] + "," + v[2] + "," + a + ")"; }
  function resolveColor(el, name) {
    if (!name) name = "cobalt";
    if (name.charAt(0) === "#") return name;
    var v = getComputedStyle(el).getPropertyValue("--dot-" + name).trim();
    return /^#[0-9a-f]{3,8}$/i.test(v) ? v : (FALLBACK[name] || FALLBACK.cobalt);
  }

  function Spring(v, k, d) { this.v = v; this.t = v; this.vel = 0; this.k = k; this.d = d; }
  Spring.prototype.step = function (dt) { var a = this.k * (this.t - this.v) - this.d * this.vel; this.vel += a * dt; this.v += this.vel * dt; };

  var SHAPE_PATHS = {
    pebble: "M0 -46c27 0 48 19 48 46s-19 44-48 44-48-17-48-44 21-46 48-46z",
    drop: "M0 -52c18 22 46 40 46 62 0 22-20 36-46 36s-46-14-46-36c0-22 28-40 46-62z"
  };
  function shapePath(shape) {
    if (SHAPE_PATHS[shape]) return new Path2D(SHAPE_PATHS[shape]);
    var p = new Path2D();
    if (shape === "squircle") { if (p.roundRect) p.roundRect(-46, -46, 92, 92, 30); else p.rect(-46, -46, 92, 92); return p; }
    if (shape === "capsule") { if (p.roundRect) p.roundRect(-38, -54, 76, 100, 38); else p.rect(-38, -54, 76, 100); return p; }
    p.arc(0, 0, 46, 0, Math.PI * 2); return p;
  }

  // Elke Dot tekent direct en bij elke tik. Geen IntersectionObserver-poort: sommige viewers melden
  // frames als onzichtbaar of geven geen requestAnimationFrame, dan valt de klok terug op setInterval.
  var engines = new Set(), last = 0, clock = 0, lastTick = 0, rafOn = false, timerOn = false;
  function tick(now) {
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now; lastTick = now;
    if (!REDUCE) clock += dt;
    engines.forEach(function (e) { try { e.update(dt, clock); e.draw(); } catch (err) { /* een kapotte Dot stopt de rest niet */ } });
  }
  function raf(now) { tick(now || performance.now()); if (engines.size) requestAnimationFrame(raf); else rafOn = false; }
  function ensureLoop() {
    if (!rafOn && window.requestAnimationFrame) { rafOn = true; last = performance.now(); requestAnimationFrame(raf); }
    if (!timerOn) { timerOn = true; setInterval(function () { var n = performance.now(); if (engines.size && n - lastTick > 120) tick(n); }, 33); }
  }

  function DotEngine(canvas, opts) {
    this.cv = canvas; this.g = canvas.getContext("2d");
    var k = FEEL.k, d = FEEL.d;
    this.s = { sq: new Spring(1, k * 1.5, d * 0.7), tilt: new Spring(0, k * 0.5, d * 0.9), lx: new Spring(0, k * 0.9, d * 1.2), ly: new Spring(0, k * 0.9, d * 1.2),
      eye: new Spring(1, k, d), happy: new Spring(0, 90, 14), flat: new Spring(0, 90, 14), ring: new Spring(0, 40, 12), orbit: new Spring(0, 40, 12),
      think: new Spring(0, 50, 12), badge: new Spring(0, 60, 10), desat: new Spring(0, 20, 9), droop: new Spring(0, 60, 12) };
    this.jy = 0; this.jv = 0; this.state = "idle"; this.st = 0; this.t = 0; this.seed = Math.random() * 1000; this.amp = 0;
    this.blinkAt = 1 + Math.random() * 2; this.blinkStart = -9; this.sacc = { x: 0, y: 0, next: 0 }; this.shake = 0; this.parts = []; this.nextHop = 0.4; this.giggle = 0;
    this.set(opts);
    canvas.__moDot = this; engines.add(this);
    this.update(0.016, clock); this.draw(); ensureLoop();
  }
  DotEngine.prototype.set = function (o) {
    this.size = o.size; this.shape = o.shape || "circle"; this.path = shapePath(this.shape);
    this.color = resolveColor(this.cv, o.color); this.face = resolveColor(this.cv, "face") || FALLBACK.face;
    this.acc = o.accessory || "none"; this.follow = o.followPointer !== false;
    this.sparkles = o.size >= 40;
    var px = Math.round(o.size * DPR);
    if (this.cv.width !== px) { this.cv.width = px; this.cv.height = px; }
    this.cv.style.width = this.cv.style.height = o.size + "px";
    this.setState(o.state || "idle");
  };
  DotEngine.prototype.destroy = function () { engines.delete(this); };
  DotEngine.prototype.setState = function (s) {
    if (DOT_STATES.indexOf(s) < 0) s = "idle";
    if (s === this.state) return; this.state = s; this.st = 0;
    if (s === "done") { this.s.sq.vel -= 5; this.jv = FEEL.hop * 0.6; this.burst(this.sparkles ? 16 : 0); }
    if (s === "blocked") this.shake = 1;
    if (s === "wait") this.nextHop = 0.15;
    if (s === "listen") this.s.sq.vel += 2.5;
    if (s === "think") this.s.tilt.vel += 0.6;
  };
  DotEngine.prototype.boop = function () { this.s.sq.vel -= 6; if (this.jy >= 0) this.jv = FEEL.hop * 0.75; this.giggle = 0.9; this.burst(this.sparkles ? 10 : 0); };
  DotEngine.prototype.burst = function (n) {
    var pal = [FALLBACK.cobalt, FALLBACK.tomato, FALLBACK.sun, FALLBACK.leaf, FALLBACK.plum];
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = 60 + Math.random() * 110;
      this.parts.push({ x: 80 + (Math.random() - 0.5) * 30, y: 60, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, c: pal[i % pal.length] });
    }
  };
  DotEngine.prototype.update = function (dt, t) {
    this.t = t; this.st += dt; var s = this.s, st = this.state, f = FEEL;
    if (t > this.sacc.next) { this.sacc.x = (Math.random() - 0.5) * 1.1; this.sacc.y = (Math.random() - 0.5) * 0.7; this.sacc.next = t + f.sacc[0] + Math.random() * (f.sacc[1] - f.sacc[0]); }
    var lx = this.sacc.x, ly = this.sacc.y;
    if (this.follow && performance.now() - pointer.t < 4000) {
      var b = this.cv.getBoundingClientRect();
      lx = clamp((pointer.x - (b.left + b.width / 2)) / 260, -1, 1); ly = clamp((pointer.y - (b.top + b.height / 2)) / 200, -1, 1);
    }
    var eye = 1, happy = 0, flat = 0, ring = 0, orbit = 0, think = 0, badge = 0, desat = 0, droop = 0, voice = 0;
    var tilt = Math.sin(t * 0.7 + this.seed) * 0.03 * f.wob;
    if (st === "listen") { eye = 1.2; ring = 1; lx *= 0.4; ly = ly * 0.4 + 0.05; voice = Math.pow(noise(t * 6 + this.seed), 2) * (noise(t * 1.3 + 40) > 0.35 ? 1 : 0.15); tilt += Math.sin(t * 1.1) * 0.02; }
    if (st === "think") { lx = 0.75 + Math.sin(t * 0.9) * 0.12; ly = -0.85; think = 1; tilt = 0.035 + Math.sin(t * 0.8) * 0.02; eye = 0.9; }
    if (st === "work") { orbit = 1; lx = Math.sin(t * 3.2) * 0.7; ly = 0.55; eye = 0.95; }
    if (st === "wait") { badge = 1; eye = 1.12; lx *= 0.5; ly = ly * 0.5 - 0.1; if (this.st > this.nextHop && this.jy >= 0) { this.jv = f.hop; s.sq.vel += 3; this.nextHop = this.st + 1.5 + Math.random() * 0.6; } }
    if (st === "done") { happy = 1; ly = -0.25; lx *= 0.3; if (this.st > 1.2 && this.st > this.nextHop && this.jy >= 0) { this.jv = f.hop * 0.45; this.nextHop = this.st + 2.4; } }
    if (st === "blocked") { flat = 1; desat = 1; lx = Math.sin(t * 0.4) * 0.2; ly = 0.75; droop = 1; tilt = -0.03; }
    this.amp += (voice - this.amp) * Math.min(1, dt * 14);
    if (this.giggle > 0) { this.giggle -= dt; happy = 1; }
    s.eye.t = eye; s.happy.t = happy; s.flat.t = flat; s.ring.t = ring; s.orbit.t = orbit; s.think.t = think; s.badge.t = badge; s.desat.t = desat; s.droop.t = droop; s.lx.t = lx; s.ly.t = ly; s.tilt.t = tilt;
    var breath = REDUCE ? 0 : Math.sin(t * Math.PI * 2 / f.period + this.seed) * f.breath;
    var stretch = this.jy < 0 ? clamp(-this.jv * 0.0007, -0.1, 0.14) : 0;
    s.sq.t = 1 + breath + stretch + this.amp * 0.05 - droop * 0.04 + (st === "work" ? Math.abs(Math.sin(t * 9)) * 0.03 : 0);
    for (var key in s) s[key].step(dt);
    if (this.jy < 0 || this.jv < 0) { this.jv += 1500 * dt; this.jy += this.jv * dt; if (this.jy >= 0) { this.jy = 0; if (this.jv > 60) s.sq.vel -= this.jv * 0.018; this.jv = 0; } }
    if (t > this.blinkAt) { this.blinkStart = t; this.blinkAt = t + (Math.random() < 0.2 ? 0.28 : 2 + Math.random() * 4.5); }
    this.shake = Math.max(0, this.shake - dt * 1.8);
    for (var i = this.parts.length - 1; i >= 0; i--) { var p = this.parts[i]; p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt * 1.1; if (p.life <= 0) this.parts.splice(i, 1); }
  };
  DotEngine.prototype.blinkVal = function () { var d = this.t - this.blinkStart, L = FEEL.blink; if (d < 0 || d > L) return 0; return Math.sin(d / L * Math.PI); };
  DotEngine.prototype.draw = function () {
    var g = this.g, s = this.s, t = this.t, col = this.color, sc = this.size * DPR / 160, ink = this.face;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cv.width, this.cv.height); g.setTransform(sc, 0, 0, sc, 0, 0);
    var sy = s.sq.v, sx = 1 + (1 - sy) * 0.85, jy = this.jy, shx = Math.sin(t * 46) * this.shake * 5;
    var bob = this.state === "work" ? -Math.abs(Math.sin(t * 9)) * 2.2 : 0, cy = 88 + jy + bob;
    var useFilter = "filter" in g && s.desat.v > 0.02;
    if (useFilter) g.filter = "saturate(" + (1 - s.desat.v * 0.8).toFixed(2) + ")";
    var lift = clamp(-jy / 80, 0, 1);
    var sh = g.createRadialGradient(80, 139, 2, 80, 139, 42);
    sh.addColorStop(0, "rgba(17,19,24," + (0.22 * (1 - lift * 0.6)) + ")"); sh.addColorStop(1, "rgba(17,19,24,0)");
    g.fillStyle = sh; g.beginPath(); g.ellipse(80, 139, 40 * (1 - lift * 0.35) * sx, 6 * (1 - lift * 0.3), 0, 0, 6.283); g.fill();
    this.drawRing(g, cy); this.drawOrbit(g, cy, false);
    g.save();
    g.translate(80 + shx, 134 + jy + bob); g.rotate(s.tilt.v + Math.sin(t * 40) * this.shake * 0.05); g.scale(sx, sy); g.translate(0, -46);
    var gr = g.createRadialGradient(-18, -24, 4, -4, -4, 70);
    gr.addColorStop(0, mix(col, 255, 0.28)); gr.addColorStop(0.55, col); gr.addColorStop(1, mix(col, 0, 0.25));
    g.fillStyle = gr; g.fill(this.path);
    g.save(); g.clip(this.path);
    var rim = g.createLinearGradient(0, 20, 0, 50); rim.addColorStop(0, "rgba(255,255,255,0)"); rim.addColorStop(1, "rgba(255,255,255,.18)"); g.fillStyle = rim; g.fill(this.path);
    g.translate(-17, -25); g.rotate(-0.55);
    var sp = g.createRadialGradient(0, 0, 0, 0, 0, 16); sp.addColorStop(0, "rgba(255,255,255,.75)"); sp.addColorStop(0.5, "rgba(255,255,255,.22)"); sp.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = sp; g.beginPath(); g.ellipse(0, 0, 18, 9, 0, 0, 6.283); g.fill();
    g.restore();
    var fx = s.lx.v * 6, fy = s.ly.v * 4.5 + s.droop.v * 3;
    g.save(); g.translate(fx, fy); this.drawFace(g, ink); g.restore();
    this.drawAccessory(g, fx, fy, ink);
    g.restore();
    this.drawOrbit(g, cy, true); this.drawThink(g, cy, ink); this.drawBadge(g, cy); this.drawParts(g);
    if (useFilter) g.filter = "none";
  };
  DotEngine.prototype.drawFace = function (g, ink) {
    var s = this.s, open = (1 - this.blinkVal()) * (1 - s.happy.v) * (1 - s.flat.v), es = s.eye.v, px = s.lx.v * 1.8, py = s.ly.v * 1.6;
    if (open > 0.02) {
      [-14, 14].forEach(function (x) {
        var rx = 6.4 * es, ry = Math.max(0.3, 6.8 * es * open);
        g.fillStyle = ink; g.beginPath(); g.ellipse(x + px, -4 + py, rx, ry, 0, 0, 6.283); g.fill();
        if (open > 0.4) { g.fillStyle = "rgba(255,255,255,.95)"; g.beginPath(); g.arc(x + px + 2, -4 + py - ry * 0.38, 1.9, 0, 6.283); g.fill(); }
      });
    }
    g.lineCap = "round"; g.lineJoin = "round";
    if (s.happy.v > 0.05) { g.save(); g.globalAlpha = s.happy.v; g.strokeStyle = ink; g.lineWidth = 4; g.beginPath(); g.moveTo(-21, -1); g.quadraticCurveTo(-14, -11, -7, -1); g.moveTo(7, -1); g.quadraticCurveTo(14, -11, 21, -1); g.stroke(); g.restore(); }
    if (s.flat.v > 0.05) { g.save(); g.globalAlpha = s.flat.v; g.strokeStyle = ink; g.lineWidth = 3.6; g.beginPath(); g.moveTo(-20, -2); g.lineTo(-8, -1); g.moveTo(8, -1); g.lineTo(20, -2); g.stroke(); g.restore(); }
  };
  DotEngine.prototype.drawAccessory = function (g, fx, fy, ink) {
    var a = this.acc; g.lineCap = "round";
    if (a === "glasses") { g.save(); g.translate(fx, fy); g.strokeStyle = ink; g.lineWidth = 3.2; g.beginPath(); g.arc(-14, -4, 11.5, 0, 6.283); g.moveTo(25.5, -4); g.arc(14, -4, 11.5, 0, 6.283); g.moveTo(-2.5, -5); g.lineTo(2.5, -5); g.stroke();
      g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.4; g.beginPath(); g.arc(-14, -4, 8, -2.6, -1.9); g.stroke(); g.beginPath(); g.arc(14, -4, 8, -2.6, -1.9); g.stroke(); g.restore(); }
    if (a === "monocle") { g.save(); g.translate(fx, fy); g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.arc(14, -4, 11.5, 0, 6.283); g.stroke(); g.lineWidth = 1.3; g.beginPath(); g.moveTo(24, 3); g.quadraticCurveTo(30 + Math.sin(this.t * 2) * 2, 22, 22, 38); g.stroke(); g.restore(); }
    if (a === "beret") { var bp = new Path2D("M-32 -38c4-14 26-20 44-16 14 3 22 10 20 16-20 4-44 4-64 0z"); g.fillStyle = ink; g.fill(bp); g.fillStyle = "rgba(255,255,255,.18)"; g.beginPath(); g.ellipse(-8, -50, 10, 2.5, -0.2, 0, 6.283); g.fill(); g.fillStyle = ink; g.beginPath(); g.arc(2, -56, 3, 0, 6.283); g.fill(); }
    if (a === "bow") { var w = Math.sin(this.t * 3) * 1.5; g.fillStyle = FALLBACK.tomato; g.strokeStyle = ink; g.lineWidth = 2; g.lineJoin = "round"; g.beginPath(); g.moveTo(0, 40); g.lineTo(-14, 32 + w); g.lineTo(-14, 48 - w); g.closePath(); g.moveTo(0, 40); g.lineTo(14, 32 - w); g.lineTo(14, 48 + w); g.closePath(); g.fill(); g.stroke(); g.fillStyle = ink; g.beginPath(); g.arc(0, 40, 3.6, 0, 6.283); g.fill(); }
  };
  DotEngine.prototype.drawRing = function (g, cy) {
    var v = this.s.ring.v; if (v < 0.02) return; var t = this.t, amp = this.amp;
    g.save(); g.beginPath();
    for (var i = 0; i <= 96; i++) { var th = i / 96 * 6.283; var r = 60 + (amp * 6 + 1.2) * Math.sin(4 * th + t * 3) + amp * 3.5 * Math.sin(7 * th - t * 5) + Math.sin(t * 2); var x = 80 + Math.cos(th) * r, y = cy + Math.sin(th) * r * 0.98; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.closePath(); g.strokeStyle = rgba(this.color, 0.55 * v); g.lineWidth = 3; g.stroke(); g.restore();
  };
  DotEngine.prototype.drawOrbit = function (g, cy, front) {
    var v = this.s.orbit.v; if (v < 0.02) return; var t = this.t;
    g.save(); g.globalAlpha = v;
    if (!front) { g.strokeStyle = "rgba(127,135,150,.25)"; g.lineWidth = 1.2; g.setLineDash([3, 5]); g.beginPath(); g.ellipse(80, cy - 6, 66, 18, 0, 0, 6.283); g.stroke(); g.setLineDash([]); }
    var ph = t * 2.4, sn = Math.sin(ph);
    if ((sn > 0) === front) {
      var x = 80 + Math.cos(ph) * 66, y = cy - 6 + sn * 18, r = 6.5 * (0.8 + 0.25 * (sn * 0.5 + 0.5)), c = this.color === FALLBACK.tomato ? FALLBACK.sun : FALLBACK.tomato;
      var gr = g.createRadialGradient(x - r * 0.4, y - r * 0.4, 0.5, x, y, r); gr.addColorStop(0, mix(c, 255, 0.6)); gr.addColorStop(1, c); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
    }
    g.restore();
  };
  DotEngine.prototype.drawThink = function (g, cy, ink) {
    var v = this.s.think.v; if (v < 0.02) return; var t = this.t;
    g.save(); g.globalAlpha = v;
    for (var i = 0; i < 3; i++) { var x = 110 + i * 13, y = cy - 58 - i * 7 - Math.max(0, Math.sin(t * 5 - i * 0.9)) * 5, r = 4.6 + i * 0.4;
      var gr = g.createRadialGradient(x - 1.5, y - 1.5, 0.5, x, y, r); gr.addColorStop(0, "#5A606E"); gr.addColorStop(1, ink); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); }
    g.restore();
  };
  DotEngine.prototype.drawBadge = function (g, cy) {
    var v = this.s.badge.v; if (v < 0.02) return; var t = this.t, c = FALLBACK.sun, x = 124, y = cy - 40 + this.jy * 0.15, ph = (t * 1.1) % 1;
    g.save(); g.globalAlpha = v;
    g.strokeStyle = rgba(c, (1 - ph) * 0.7); g.lineWidth = 2; g.beginPath(); g.arc(x, y, 9 + ph * 12, 0, 6.283); g.stroke();
    g.fillStyle = c; g.beginPath(); g.arc(x, y, 8 * (1 + 0.08 * Math.sin(t * 6)), 0, 6.283); g.fill();
    g.lineWidth = 2.5; g.strokeStyle = this.face; g.stroke();
    g.fillStyle = this.face; g.fillRect(x - 1.2, y - 4.5, 2.4, 5); g.beginPath(); g.arc(x, y + 3.2, 1.3, 0, 6.283); g.fill();
    g.restore();
  };
  DotEngine.prototype.drawParts = function (g) {
    this.parts.forEach(function (p) { g.save(); g.globalAlpha = clamp(p.life, 0, 1); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.c; g.fillRect(-3, -1.6, 6, 3.2); g.restore(); });
  };

  /* ================= Icon ================= */
  var ICONS = {
    send: "M5 12h13M13 6l6 6-6 6",
    mic: "M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v3",
    plus: "M12 5v14M5 12h14",
    check: "M5 12.5l4.5 4.5L19 7.5",
    x: "M6 6l12 12M18 6L6 18",
    more: "M6 12h.01M12 12h.01M18 12h.01",
    search: "M11 5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM20 20l-4.2-4.2",
    clock: "M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 8v4l3 2",
    lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
    paperclip: "M15.5 7.5l-6.8 6.8a2 2 0 0 0 2.8 2.8l7-7a4 4 0 0 0-5.7-5.7l-7 7a6 6 0 0 0 8.5 8.5l6.2-6.2",
    arrowRight: "M5 12h14M13 6l6 6-6 6",
    bolt: "M13 3L5 14h6l-1 7 8-11h-6z",
    info: "M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 11v5M12 8h.01",
    alert: "M12 4l9 16H3zM12 10v4M12 17h.01",
    calendar: "M5 6h14v14H5zM5 10h14M9 4v4M15 4v4",
    mail: "M4 6h16v12H4zM4 7l8 6 8-6",
    card: "M3 7h18v11H3zM3 11h18M7 15h3",
    pause: "M9 6v12M15 6v12",
    play: "M8 5l11 7-11 7z",
    at: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1",
    sparkDot: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"
  };
  function Icon(p) {
    var size = p.size || 20;
    return h("svg", { className: cx("mo-icon", p.className), width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": p.label ? undefined : true, role: p.label ? "img" : undefined, "aria-label": p.label, style: p.style },
      h("path", { d: ICONS[p.name] || ICONS.sparkDot, strokeWidth: p.strokeWidth }));
  }

  /* ================= Dot ================= */
  function Dot(p) {
    var ref = useRef(null), eng = useRef(null);
    var size = p.size || 64;
    var opts = { size: size, shape: p.shape, color: p.color, accessory: p.accessory, state: p.state, followPointer: p.followPointer };
    useEffect(function () {
      eng.current = new DotEngine(ref.current, opts);
      return function () { if (eng.current) eng.current.destroy(); };
    }, []);
    useEffect(function () { if (eng.current) eng.current.set(opts); }, [size, p.shape, p.color, p.accessory, p.state, p.followPointer]);
    var label = (p.name ? p.name + ", " : "Dot, ") + (DOT_STATE_LABELS[p.state || "idle"] || "").toLowerCase();
    var interactive = p.interactive !== false;
    return h("span", { className: cx("mo-dot", interactive && "mo-dot--interactive", p.className), style: p.style },
      h("canvas", { ref: ref, role: "img", "aria-label": label, onPointerDown: interactive ? function () { if (eng.current) eng.current.boop(); if (p.onBoop) p.onBoop(); } : undefined }));
  }

  function DotStatus(p) {
    var st = p.state || "idle";
    var mark = st === "think" ? h("span", { className: "mo-status__mark", "aria-hidden": true }, h("i"), h("i"), h("i")) : h("span", { className: "mo-status__mark", "aria-hidden": true });
    return h("span", { className: cx("mo-status", "mo-status--" + st, p.className), role: "status" }, mark, p.label || DOT_STATE_LABELS[st]);
  }

  function DotStack(p) {
    var dots = p.dots || [], max = p.max || 4, size = p.size || 28, shown = dots.slice(0, max), rest = dots.length - shown.length;
    return h("span", { className: "mo-dotstack", "aria-label": dots.length + " Dots" },
      shown.map(function (d, i) { return h(Dot, { key: i, size: size, shape: d.shape, color: d.color, accessory: d.accessory, state: d.state, name: d.name, interactive: false }); }),
      rest > 0 ? h("span", { className: "mo-dotstack__more", style: { width: size, height: size } }, "+" + rest) : null);
  }

  /* ================= Basis ================= */
  function Button(p) {
    var rest = omit(p, ["variant", "size", "icon", "iconRight", "loading", "block", "className", "children", "type"]);
    var isz = p.size === "sm" ? 16 : p.size === "lg" ? 22 : 18;
    return h("button", Object.assign({ type: p.type || "button", className: cx("mo-btn", "mo-btn--" + (p.variant || "primary"), p.size && p.size !== "md" && "mo-btn--" + p.size, p.block && "mo-btn--block", p.className), disabled: p.disabled || p.loading, "aria-busy": p.loading || undefined }, rest),
      p.loading ? h("span", { className: "mo-btn__spin", "aria-hidden": true }) : p.icon ? h(Icon, { name: p.icon, size: isz }) : null,
      p.children,
      p.iconRight ? h(Icon, { name: p.iconRight, size: isz }) : null);
  }
  function IconButton(p) {
    var rest = omit(p, ["icon", "label", "variant", "size", "round", "className"]);
    return h("button", Object.assign({ type: "button", "aria-label": p.label, title: p.label, className: cx("mo-iconbtn", p.variant === "primary" && "mo-iconbtn--primary", p.size === "sm" && "mo-iconbtn--sm", p.round && "mo-iconbtn--round", p.className) }, rest),
      h(Icon, { name: p.icon, size: p.size === "sm" ? 16 : 20 }));
  }
  function Badge(p) { return h("span", { className: cx("mo-badge", p.tone && p.tone !== "neutral" && "mo-badge--" + p.tone, p.className) }, p.icon ? h(Icon, { name: p.icon, size: 14 }) : null, p.children); }
  function Tag(p) {
    var lead = p.dot ? h(Dot, { size: 20, color: p.dot.color, shape: p.dot.shape, accessory: p.dot.accessory, state: p.dot.state, interactive: false, followPointer: false }) : null;
    return h("span", { className: cx("mo-tag", p.mention && "mo-tag--mention", !lead && "mo-tag--plain", p.className) }, lead, p.mention ? "@" : null, p.children,
      p.onRemove ? h("button", { type: "button", className: "mo-tag__x", "aria-label": "Verwijder", onClick: p.onRemove }, h(Icon, { name: "x", size: 12 })) : null);
  }
  function Avatar(p) {
    var size = p.size || 32, initials = (p.name || "?").split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join("").toUpperCase();
    return h("span", { className: "mo-avatar", style: { width: size, height: size, fontSize: Math.round(size * 0.4) }, title: p.name }, p.src ? h("img", { src: p.src, alt: p.name || "" }) : initials);
  }
  function Card(p) {
    var rest = omit(p, ["flat", "padded", "interactive", "className", "children", "as"]);
    return h(p.as || "div", Object.assign({ className: cx("mo-card", p.flat && "mo-card--flat", p.padded && "mo-card--padded", p.interactive && "mo-card--interactive", p.className), tabIndex: p.interactive ? 0 : undefined }, rest), p.children);
  }

  var uid = 0;
  function useId(given) { var r = useRef(null); if (!r.current) r.current = given || "mo-" + (++uid); return r.current; }
  function Input(p) {
    var id = useId(p.id), hintId = id + "-hint", errId = id + "-err";
    var rest = omit(p, ["label", "hint", "error", "multiline", "id", "className"]);
    var desc = cx(p.hint && hintId, p.error && errId) || undefined;
    return h("div", { className: cx("mo-field", p.className) },
      p.label ? h("label", { className: "mo-field__label", htmlFor: id }, p.label) : null,
      h(p.multiline ? "textarea" : "input", Object.assign({ id: id, className: "mo-input", "aria-invalid": p.error ? "true" : undefined, "aria-describedby": desc }, rest)),
      p.error ? h("span", { id: errId, className: "mo-field__error" }, h(Icon, { name: "alert", size: 14 }), p.error) : p.hint ? h("span", { id: hintId, className: "mo-field__hint" }, p.hint) : null);
  }
  function Switch(p) {
    var st = useState(!!p.defaultChecked), on = p.checked != null ? p.checked : st[0];
    return h("label", { className: cx("mo-switch", p.disabled && "mo-switch--disabled") },
      h("input", { type: "checkbox", role: "switch", checked: on, disabled: p.disabled, onChange: function (e) { st[1](e.target.checked); if (p.onChange) p.onChange(e.target.checked); } }),
      h("span", { className: "mo-switch__track", "aria-hidden": true }, h("span", { className: "mo-switch__thumb" })), p.label);
  }
  function Checkbox(p) {
    var st = useState(!!p.defaultChecked), on = p.checked != null ? p.checked : st[0];
    return h("label", { className: cx("mo-check", p.disabled && "mo-check--disabled") },
      h("input", { type: "checkbox", checked: on, disabled: p.disabled, onChange: function (e) { st[1](e.target.checked); if (p.onChange) p.onChange(e.target.checked); } }),
      h("span", { className: "mo-check__box", "aria-hidden": true }, h(Icon, { name: "check", size: 14, strokeWidth: 2.6 })), p.label);
  }
  function Tabs(p) {
    var tabs = p.tabs || [], st = useState(p.defaultValue || (tabs[0] && tabs[0].id)), val = p.value != null ? p.value : st[0];
    function pick(id) { st[1](id); if (p.onChange) p.onChange(id); }
    function onKey(e) { var i = tabs.findIndex(function (t) { return t.id === val; }); if (e.key === "ArrowRight") pick(tabs[(i + 1) % tabs.length].id); if (e.key === "ArrowLeft") pick(tabs[(i - 1 + tabs.length) % tabs.length].id); }
    return h("div", { className: "mo-tabs", role: "tablist", "aria-label": p.label, onKeyDown: onKey },
      tabs.map(function (t) { var sel = t.id === val; return h("button", { key: t.id, type: "button", role: "tab", "aria-selected": sel, tabIndex: sel ? 0 : -1, className: "mo-tab", onClick: function () { pick(t.id); } }, t.label, t.count != null ? h("span", { className: "mo-tab__count" }, t.count) : null); }));
  }
  function ProgressBar(p) {
    var max = p.max || 100, pct = clamp((p.value || 0) / max * 100, 0, 100);
    return h("div", { className: cx("mo-progress", p.tone && "mo-progress--" + p.tone) },
      p.label ? h("div", { className: "mo-progress__top" }, h("span", null, p.label), h("b", null, p.valueLabel || Math.round(pct) + "%")) : null,
      h("div", { className: "mo-progress__track", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": max, "aria-valuenow": p.value || 0, "aria-label": p.label }, h("div", { className: "mo-progress__bar", style: { width: pct + "%" } })));
  }
  var TONE_ICON = { info: "info", success: "check", warning: "clock", danger: "alert", neutral: "info" };
  function Banner(p) {
    var tone = p.tone || "info";
    return h("div", { className: cx("mo-banner", "mo-banner--" + tone), role: tone === "danger" ? "alert" : "status" },
      h(Icon, { name: p.icon || TONE_ICON[tone], className: "mo-banner__icon" }),
      h("div", { className: "mo-banner__body" }, p.title ? h("span", { className: "mo-banner__title" }, p.title) : null, p.children),
      p.action ? h("div", { className: "mo-banner__action" }, p.action) : null);
  }

  /* ================= Agent-patronen ================= */
  function TypingIndicator(p) { return h("span", { className: "mo-typing", role: "status", "aria-label": (p.name || "Dot") + " typt" }, h("i"), h("i"), h("i")); }
  function Message(p) {
    var user = p.from === "user", d = p.dot || {};
    var who = user ? h(Avatar, { name: p.name || "Jij", size: 28 }) : h(Dot, { size: 28, shape: d.shape, color: d.color, accessory: d.accessory, state: p.typing ? "think" : (d.state || "idle"), name: p.name });
    return h("div", { className: cx("mo-msg", user && "mo-msg--user") }, who,
      h("div", { className: "mo-msg__body" },
        (p.name || p.time) ? h("div", { className: "mo-msg__meta" }, p.name ? h("b", null, p.name) : null, p.time ? h("span", null, p.time) : null) : null,
        h("div", { className: "mo-msg__bubble" }, p.typing ? h(TypingIndicator, { name: p.name }) : p.children)));
  }
  function Composer(p) {
    var st = useState(p.defaultValue || ""), val = p.value != null ? p.value : st[0];
    function set(v) { st[1](v); if (p.onChange) p.onChange(v); }
    function send() { if (!val.trim()) return; if (p.onSend) p.onSend(val); set(""); }
    return h("div", { className: "mo-composer" },
      p.mentions && p.mentions.length ? h("div", { className: "mo-composer__chips" }, p.mentions.map(function (m, i) { return h(Tag, { key: i, mention: true, dot: m.dot }, m.name); })) : null,
      h("textarea", { className: "mo-composer__field", rows: 2, placeholder: p.placeholder || "Vraag je Dots iets of typ @ om er een te noemen", value: val, "aria-label": p.label || "Bericht", disabled: p.disabled,
        onChange: function (e) { set(e.target.value); }, onKeyDown: function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } } }),
      h("div", { className: "mo-composer__bar" },
        h(IconButton, { icon: "paperclip", label: "Bestand toevoegen", size: "sm" }),
        h(IconButton, { icon: "at", label: "Dot noemen", size: "sm" }),
        h("span", { className: "mo-spacer" }),
        h(IconButton, { icon: "mic", label: "Spreken", size: "sm" }),
        h(IconButton, { icon: "send", label: "Versturen", variant: "primary", size: "sm", round: true, disabled: !val.trim() || p.disabled, onClick: send })));
  }
  function ApprovalCard(p) {
    var st = useState(p.status || "pending"), status = p.status && p.status !== "pending" ? p.status : st[0], d = p.dot || {};
    var dotState = status === "approved" ? "done" : status === "rejected" ? "blocked" : "wait";
    return h("div", { className: "mo-approval", role: "group", "aria-label": p.title },
      h("div", { className: "mo-approval__head" },
        h(Dot, { size: 40, shape: d.shape, color: d.color, accessory: d.accessory, state: dotState, name: p.dotName }),
        h("div", { className: "mo-approval__who" }, h("b", null, p.title), h("span", null, p.dotName ? p.dotName + " vraagt je goedkeuring" : "Vraagt je goedkeuring")),
        status === "pending" ? h(DotStatus, { state: "wait" }) : null),
      p.detail ? h("div", { className: "mo-approval__detail" }, p.detail) : null,
      p.amount ? h("div", { className: "mo-approval__amount" }, p.amount) : null,
      p.rows && p.rows.length ? h("dl", { className: "mo-approval__rows" }, p.rows.map(function (r, i) { return h("div", { key: i }, h("dt", null, r[0]), h("dd", null, r[1])); })) : null,
      status === "pending" ? h("div", { className: "mo-approval__actions" },
        h(Button, { variant: "secondary", onClick: function () { st[1]("rejected"); if (p.onReject) p.onReject(); } }, p.rejectLabel || "Weigeren"),
        h(Button, { variant: "primary", icon: "check", onClick: function () { st[1]("approved"); if (p.onApprove) p.onApprove(); } }, p.approveLabel || "Goedkeuren"))
        : h("div", { className: cx("mo-approval__result", "mo-approval__result--" + status) }, h(Icon, { name: status === "approved" ? "check" : "x" }), status === "approved" ? "Goedgekeurd. " + (p.dotName || "De Dot") + " gaat verder." : "Geweigerd. Er is niets uitgevoerd."));
  }
  function ActivityFeed(p) {
    return h("ol", { className: "mo-feed" }, (p.items || []).map(function (it, i) {
      var d = it.dot || {};
      return h("li", { key: i, className: "mo-feed__item" },
        h("span", { className: "mo-feed__time" }, it.time),
        h(Dot, { size: 28, shape: d.shape, color: d.color, accessory: d.accessory, state: it.state === "work" || it.state === "wait" ? it.state : "idle", interactive: false, followPointer: false }),
        h("span", { className: "mo-feed__text" }, it.who ? h("b", null, it.who + " ") : null, it.text, it.code ? h(React.Fragment, null, " ", h("code", null, it.code)) : null),
        it.state ? h(DotStatus, { state: it.state }) : h("span"));
    }));
  }
  function TeamRoster(p) {
    return h("ul", { className: "mo-roster" }, (p.members || []).map(function (m, i) {
      var d = m.dot || {};
      return h("li", { key: i, className: "mo-roster__row" },
        h(Dot, { size: 40, shape: d.shape, color: d.color, accessory: d.accessory, state: m.state || "idle", name: m.name }),
        h("span", { style: { minWidth: 0 } }, h("span", { className: "mo-roster__name" }, m.name), h("span", { className: "mo-roster__role" }, m.role)),
        h(DotStatus, { state: m.state || "idle", label: m.statusLabel }));
    }));
  }
  function TaskCard(p) {
    var steps = p.steps || [], done = steps.filter(function (s) { return s.done; }).length, d = p.dot || {};
    var activeIdx = steps.findIndex(function (s) { return !s.done; });
    var state = p.state || (done === steps.length && steps.length ? "done" : "work");
    return h(Card, { className: "mo-task" },
      h("div", { className: "mo-task__head" },
        h(Dot, { size: 40, shape: d.shape, color: d.color, accessory: d.accessory, state: state, name: p.dotName }),
        h("div", { style: { flex: 1, minWidth: 0, display: "grid", gap: 2 } },
          h("h3", { className: "mo-task__title" }, p.title),
          h("div", { className: "mo-task__meta" }, p.dotName ? h("span", null, p.dotName) : null, p.due ? h(React.Fragment, null, h(Icon, { name: "clock", size: 14 }), h("span", null, p.due)) : null)),
        h(DotStatus, { state: state })),
      h(ProgressBar, { value: done, max: steps.length || 1, label: "Stappen", valueLabel: done + " van " + steps.length, tone: state === "done" ? "success" : undefined }),
      h("ul", { className: "mo-task__steps" }, steps.map(function (s, i) {
        var active = i === activeIdx && state !== "blocked";
        return h("li", { key: i, className: cx("mo-task__step", s.done && "mo-task__step--done", active && "mo-task__step--active") },
          h("span", { className: "mo-task__tick", "aria-hidden": true }, s.done ? h(Icon, { name: "check", size: 12, strokeWidth: 3 }) : null), s.label);
      })));
  }
  function Dialog(p) {
    if (p.open === false) return null; var d = p.dot;
    return h("div", { className: cx("mo-dialog-backdrop", p.inline && "mo-dialog-backdrop--inline"), onClick: function (e) { if (e.target === e.currentTarget && p.onClose) p.onClose(); } },
      h("div", { className: "mo-dialog", role: "dialog", "aria-modal": !p.inline, "aria-label": p.title },
        h("div", { className: "mo-dialog__head" }, d ? h(Dot, { size: 40, shape: d.shape, color: d.color, accessory: d.accessory, state: d.state || "wait" }) : null, h("h2", { className: "mo-dialog__title" }, p.title)),
        h("div", { className: "mo-dialog__body" }, p.children),
        p.actions ? h("div", { className: "mo-dialog__actions" }, p.actions) : null));
  }
  function EmptyState(p) {
    var d = p.dot || {};
    return h("div", { className: "mo-empty" },
      h(Dot, { size: p.size || 96, shape: d.shape, color: d.color, accessory: d.accessory, state: d.state || "idle" }),
      h("h3", { className: "mo-empty__title" }, p.title),
      p.body ? h("p", { className: "mo-empty__body" }, p.body) : null,
      p.action || null);
  }

  window.Modulair = {
    Dot: Dot, DotStatus: DotStatus, DotStack: DotStack, Button: Button, IconButton: IconButton, Icon: Icon, Badge: Badge, Tag: Tag, Avatar: Avatar, Card: Card,
    Input: Input, Switch: Switch, Checkbox: Checkbox, Tabs: Tabs, ProgressBar: ProgressBar, Banner: Banner, Message: Message, TypingIndicator: TypingIndicator,
    Composer: Composer, ApprovalCard: ApprovalCard, ActivityFeed: ActivityFeed, TeamRoster: TeamRoster, TaskCard: TaskCard, Dialog: Dialog, EmptyState: EmptyState,
    DOT_STATES: DOT_STATES, DOT_STATE_LABELS: DOT_STATE_LABELS, DOT_SHAPES: DOT_SHAPES, DOT_COLORS: DOT_COLORS, DOT_ACCESSORIES: DOT_ACCESSORIES, ICONS: Object.keys(ICONS)
  };
})();
