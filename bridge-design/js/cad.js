/*
 * Minimal 2D drafting model shared by the SVG (screen / PDF) and DXF writers.
 * Sheet units are millimetres, origin bottom-left, y up (as in CAD).
 */
(function (g) {
  'use strict';
  const BD = (g.BD = g.BD || {});

  // layer -> [DXF colour index, SVG colour, linetype]
  const LAYERS = {
    OUTLINE: [7, '#111', 'CONTINUOUS'],
    THIN: [8, '#555', 'CONTINUOUS'],
    HIDDEN: [8, '#666', 'DASHED'],
    CENTER: [1, '#d0202a', 'CENTER'],
    DIM: [5, '#1a3fd6', 'CONTINUOUS'],
    DIMTEXT: [6, '#c0169a', 'CONTINUOUS'],
    TEXT: [7, '#111', 'CONTINUOUS'],
    TITLE: [1, '#d0202a', 'CONTINUOUS'],
    LABEL: [5, '#1a3fd6', 'CONTINUOUS'],
    HATCH: [8, '#777', 'CONTINUOUS'],
    REBAR: [7, '#111', 'CONTINUOUS'],
    WATER: [5, '#1a3fd6', 'CONTINUOUS'],
    BORDER: [7, '#111', 'CONTINUOUS'],
  };

  class Dwg {
    constructor(w, h) { this.w = w; this.h = h; this.ents = []; this.seed = 1; }
    rnd() { this.seed = (this.seed * 16807) % 2147483647; return (this.seed - 1) / 2147483646; }
    add(e) { this.ents.push(e); return e; }
    line(x1, y1, x2, y2, layer = 'OUTLINE', o = {}) { return this.add(Object.assign({ t: 'line', x1, y1, x2, y2, layer }, o)); }
    poly(pts, closed = true, layer = 'OUTLINE', o = {}) { return this.add(Object.assign({ t: 'poly', pts, closed, layer }, o)); }
    rect(x, y, w, h, layer = 'OUTLINE', o = {}) { return this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true, layer, o); }
    circle(x, y, r, layer = 'OUTLINE', o = {}) { return this.add(Object.assign({ t: 'circle', x, y, r, layer }, o)); }
    text(x, y, s, h = 2, layer = 'TEXT', o = {}) { return this.add(Object.assign({ t: 'text', x, y, s: String(s), h, layer, anchor: 'start', rot: 0 }, o)); }
    // concrete stipple (dots + small triangles) inside a polygon
    stipple(pts, density = 0.05, kind = 'conc') {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const n = Math.min(900, Math.round((x1 - x0) * (y1 - y0) * density));
      for (let i = 0; i < n; i++) {
        const x = x0 + this.rnd() * (x1 - x0), y = y0 + this.rnd() * (y1 - y0);
        if (!inside(pts, x, y)) continue;
        if (kind === 'conc' && this.rnd() < 0.3) {
          const s = 0.5 + this.rnd() * 0.4, a = this.rnd() * Math.PI;
          const tri = [0, 1, 2].map((k) => [x + s * Math.cos(a + (k * 2 * Math.PI) / 3), y + s * Math.sin(a + (k * 2 * Math.PI) / 3)]);
          if (tri.every((p) => inside(pts, p[0], p[1]))) this.poly(tri, true, 'HATCH', { w: 0.1 });
        } else this.circle(x, y, 0.12, 'HATCH', { fill: true });
      }
    }
    // dimensions: a,b are sheet points; offset direction by 'side'
    dim(ax, ay, bx, by, label, o = {}) {
      const vertical = Math.abs(ax - bx) < 1e-6;
      const L = 'DIM';
      const ah = 1.6, aw = 0.5;
      const arrow = (x, y, dx, dy) => {
        const nx = -dy, ny = dx;
        this.poly([[x, y], [x - dx * ah + nx * aw, y - dy * ah + ny * aw], [x - dx * ah - nx * aw, y - dy * ah - ny * aw]], true, L, { fill: true });
      };
      this.line(ax, ay, bx, by, L, { w: 0.15 });
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const dx = (bx - ax) / len, dy = (by - ay) / len;
      if (len > 4.5) { arrow(bx, by, dx, dy); arrow(ax, ay, -dx, -dy); }
      else { arrow(ax, ay, dx, dy); arrow(bx, by, -dx, -dy); }
      // extension ticks
      const ext = o.ext == null ? 1.5 : o.ext;
      if (vertical) { this.line(ax - ext, ay, ax + ext, ay, L, { w: 0.15 }); this.line(bx - ext, by, bx + ext, by, L, { w: 0.15 }); }
      else { this.line(ax, ay - ext, ax, ay + ext, L, { w: 0.15 }); this.line(bx, by - ext, bx, by + ext, L, { w: 0.15 }); }
      const h = o.h || 1.8;
      if (label === '' || label == null) return;
      if (vertical) this.text(ax - 0.8, (ay + by) / 2, label, h, 'DIMTEXT', { anchor: 'middle', rot: 90 });
      else this.text((ax + bx) / 2, ay + 0.8, label, h, 'DIMTEXT', { anchor: 'middle' });
    }
    leader(x1, y1, x2, y2, label, o = {}) {
      this.line(x1, y1, x2, y2, 'LABEL', { w: 0.15 });
      const tl = o.textLen || label.length * (o.h || 1.8) * 0.62;
      const right = o.right != null ? o.right : x2 >= x1;
      const x3 = right ? x2 + tl : x2 - tl;
      this.line(x2, y2, x3, y2, 'LABEL', { w: 0.15 });
      this.text(right ? x2 + 0.5 : x2 - 0.5, y2 + 0.7, label, o.h || 1.8, 'TEXT', { anchor: right ? 'start' : 'end' });
      // arrow at x1,y1
      const len = Math.hypot(x2 - x1, y2 - y1) || 1, dx = (x1 - x2) / len, dy = (y1 - y2) / len;
      this.poly([[x1, y1], [x1 - dx * 1.4 - dy * 0.4, y1 - dy * 1.4 + dx * 0.4], [x1 - dx * 1.4 + dy * 0.4, y1 - dy * 1.4 - dx * 0.4]], true, 'LABEL', { fill: true });
    }
    title(x, y, s, h = 3.2) {
      this.text(x, y, s, h, 'TITLE', { anchor: 'middle' });
      const w = s.length * h * 0.62;
      this.line(x - w / 2 - 4, y - 2, x + w / 2 + 4, y - 2, 'THIN', { w: 0.2 });
    }
    // table: cols = widths, rows = arrays of strings; header row coloured
    table(x, yTop, cols, rows, o = {}) {
      const rh = o.rh || 5, h = o.h || 1.6;
      const W = cols.reduce((a, b) => a + b, 0);
      let y = yTop;
      rows.forEach((r, i) => {
        const hdr = i === 0 && o.header !== false;
        this.rect(x, y - rh, W, rh, 'THIN', { w: 0.2 });
        let cx = x;
        r.forEach((c, j) => {
          if (j > 0) this.line(cx, y, cx, y - rh, 'THIN', { w: 0.2 });
          const center = hdr || (o.center && o.center.includes(j));
          this.text(center ? cx + cols[j] / 2 : cx + 1, y - rh / 2 - h / 2.6, String(c), h, hdr ? 'LABEL' : 'TEXT', { anchor: center ? 'middle' : 'start' });
          cx += cols[j];
        });
        y -= rh;
      });
      return y;
    }
  }

  function inside(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }

  // A view maps world metres into a sheet viewport: X = ox + x*1000/scale.
  function view(dw, ox, oy, scale) {
    const k = 1000 / scale;
    const X = (x) => ox + x * k, Y = (y) => oy + y * k;
    const P = (pts) => pts.map(([x, y]) => [X(x), Y(y)]);
    return {
      k, X, Y, P, scale,
      line: (x1, y1, x2, y2, l, o) => dw.line(X(x1), Y(y1), X(x2), Y(y2), l, o),
      poly: (pts, c, l, o) => dw.poly(P(pts), c, l, o),
      rect: (x, y, w, h, l, o) => dw.rect(X(x), Y(y), w * k, h * k, l, o),
      circle: (x, y, r, l, o) => dw.circle(X(x), Y(y), r, l, o), // r in sheet mm
      text: (x, y, s, h, l, o) => dw.text(X(x), Y(y), s, h, l, o),
      stipple: (pts, dens, kind) => dw.stipple(P(pts), dens, kind),
      solid: (pts, l = 'OUTLINE', o = {}) => { dw.poly(P(pts), true, l, o); dw.stipple(P(pts), o.density || 0.12, o.kind || 'conc'); },
      dimH: (x1, x2, y, label, off = 0, o) => dw.dim(X(x1), Y(y) + off, X(x2), Y(y) + off, label, o),
      dimV: (y1, y2, x, label, off = 0, o) => dw.dim(X(x) + off, Y(y1), X(x) + off, Y(y2), label, o),
      leader: (x, y, dx, dy, label, o) => dw.leader(X(x), Y(y), X(x) + dx, Y(y) + dy, label, o),
      level: (x, y, label, o = {}) => {
        const sx = X(x), sy = Y(y), right = o.right !== false;
        dw.poly([[sx, sy], [sx - 0.9, sy + 1.5], [sx + 0.9, sy + 1.5]], true, 'DIM', { fill: false, w: 0.15 });
        dw.line(sx, sy, sx + (right ? 1 : -1) * (o.len || 3), sy, 'DIM', { w: 0.15 });
        dw.text(sx + (right ? 1.2 : -1.2), sy + 2, label, o.h || 1.8, 'TEXT', { anchor: right ? 'start' : 'end' });
      },
    };
  }

  // ------------------------------------------------------------- SVG writer
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function toSVG(dw, o = {}) {
    const H = dw.h;
    const out = [];
    out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dw.w} ${dw.h}" ${o.fluid ? '' : `width="${o.width || dw.w + 'mm'}" height="${o.height || dw.h + 'mm'}"`} font-family="Arial, Helvetica, sans-serif">`);
    out.push(`<rect x="0" y="0" width="${dw.w}" height="${dw.h}" fill="#fff"/>`);
    const f = (n) => (Math.round(n * 100) / 100).toString();
    for (const e of dw.ents) {
      const [, col, lt] = LAYERS[e.layer] || LAYERS.OUTLINE;
      const sw = e.w != null ? e.w : e.layer === 'OUTLINE' || e.layer === 'BORDER' ? 0.3 : e.layer === 'REBAR' ? 0.35 : 0.18;
      const dash = lt === 'DASHED' ? ' stroke-dasharray="2 1"' : lt === 'CENTER' ? ' stroke-dasharray="6 1.2 1.2 1.2"' : '';
      if (e.t === 'line') out.push(`<line x1="${f(e.x1)}" y1="${f(H - e.y1)}" x2="${f(e.x2)}" y2="${f(H - e.y2)}" stroke="${col}" stroke-width="${sw}"${dash}/>`);
      else if (e.t === 'poly') {
        const d = e.pts.map((p) => `${f(p[0])},${f(H - p[1])}`).join(' ');
        const fill = e.fill ? col : 'none';
        out.push(`<${e.closed ? 'polygon' : 'polyline'} points="${d}" fill="${fill}" stroke="${col}" stroke-width="${sw}"${dash} stroke-linejoin="round"/>`);
      } else if (e.t === 'circle') out.push(`<circle cx="${f(e.x)}" cy="${f(H - e.y)}" r="${f(e.r)}" fill="${e.fill ? col : 'none'}" stroke="${col}" stroke-width="${e.fill ? 0 : sw}"/>`);
      else if (e.t === 'text') {
        const anchor = e.anchor === 'middle' ? 'middle' : e.anchor === 'end' ? 'end' : 'start';
        const rot = e.rot ? ` transform="rotate(${-e.rot} ${f(e.x)} ${f(H - e.y)})"` : '';
        out.push(`<text x="${f(e.x)}" y="${f(H - e.y)}" font-size="${f(e.h * 1.4)}" fill="${col}" text-anchor="${anchor}"${rot}${e.bold ? ' font-weight="bold"' : ''}>${esc(e.s)}</text>`);
      }
    }
    out.push('</svg>');
    return out.join('\n');
  }

  // ------------------------------------------------------------- DXF writer (R12)
  function toDXF(dw) {
    const o = [];
    const p = (c, v) => o.push(String(c), String(v));
    const n = (v) => (Math.round(v * 10000) / 10000).toString();
    p(0, 'SECTION'); p(2, 'HEADER');
    p(9, '$ACADVER'); p(1, 'AC1009');
    p(9, '$INSUNITS'); p(70, 4);
    p(9, '$EXTMIN'); p(10, 0); p(20, 0);
    p(9, '$EXTMAX'); p(10, dw.w); p(20, dw.h);
    p(9, '$LTSCALE'); p(40, 1);
    p(0, 'ENDSEC');
    p(0, 'SECTION'); p(2, 'TABLES');
    p(0, 'TABLE'); p(2, 'LTYPE'); p(70, 3);
    const lt = (name, desc, pat) => {
      p(0, 'LTYPE'); p(2, name); p(70, 0); p(3, desc); p(72, 65); p(73, pat.length);
      p(40, pat.reduce((a, b) => a + Math.abs(b), 0));
      for (const x of pat) p(49, x);
    };
    lt('CONTINUOUS', 'Solid line', []);
    lt('DASHED', '__ __ __', [2, -1]);
    lt('CENTER', '____ _ ____', [6, -1.2, 1.2, -1.2]);
    p(0, 'ENDTAB');
    p(0, 'TABLE'); p(2, 'LAYER'); p(70, Object.keys(LAYERS).length);
    for (const [name, [col, , ltype]] of Object.entries(LAYERS)) { p(0, 'LAYER'); p(2, name); p(70, 0); p(62, col); p(6, ltype); }
    p(0, 'ENDTAB');
    p(0, 'TABLE'); p(2, 'STYLE'); p(70, 1);
    p(0, 'STYLE'); p(2, 'STANDARD'); p(70, 0); p(40, 0); p(41, 0.8); p(50, 0); p(71, 0); p(42, 2.5); p(3, 'txt'); p(4, '');
    p(0, 'ENDTAB');
    p(0, 'ENDSEC');
    p(0, 'SECTION'); p(2, 'ENTITIES');
    for (const e of dw.ents) {
      if (e.t === 'line') { p(0, 'LINE'); p(8, e.layer); p(10, n(e.x1)); p(20, n(e.y1)); p(30, 0); p(11, n(e.x2)); p(21, n(e.y2)); p(31, 0); }
      else if (e.t === 'poly') {
        if (e.fill && e.closed && e.pts.length <= 4) {
          // filled arrowheads / small solids
          const q = e.pts.length === 3 ? [...e.pts, e.pts[2]] : [e.pts[0], e.pts[1], e.pts[3], e.pts[2]];
          p(0, 'SOLID'); p(8, e.layer);
          q.forEach((pt, i) => { p(10 + i, n(pt[0])); p(20 + i, n(pt[1])); p(30 + i, 0); });
        } else {
          p(0, 'POLYLINE'); p(8, e.layer); p(66, 1); p(10, 0); p(20, 0); p(30, 0); p(70, e.closed ? 1 : 0);
          for (const pt of e.pts) { p(0, 'VERTEX'); p(8, e.layer); p(10, n(pt[0])); p(20, n(pt[1])); p(30, 0); }
          p(0, 'SEQEND'); p(8, e.layer);
        }
      } else if (e.t === 'circle') {
        if (e.fill && e.r < 0.3) { p(0, 'POINT'); p(8, e.layer); p(10, n(e.x)); p(20, n(e.y)); p(30, 0); }
        else {
          p(0, 'CIRCLE'); p(8, e.layer); p(10, n(e.x)); p(20, n(e.y)); p(30, 0); p(40, n(e.r));
          if (e.fill) { p(0, 'CIRCLE'); p(8, e.layer); p(10, n(e.x)); p(20, n(e.y)); p(30, 0); p(40, n(e.r / 2)); }
        }
      } else if (e.t === 'text') {
        const ha = e.anchor === 'middle' ? 1 : e.anchor === 'end' ? 2 : 0;
        p(0, 'TEXT'); p(8, e.layer); p(10, n(e.x)); p(20, n(e.y)); p(30, 0); p(40, n(e.h)); p(1, e.s.replace(/\n/g, ' '));
        if (e.rot) p(50, e.rot);
        p(41, 0.8);
        if (ha) { p(72, ha); p(11, n(e.x)); p(21, n(e.y)); p(31, 0); }
      }
    }
    p(0, 'ENDSEC'); p(0, 'EOF');
    return o.join('\r\n') + '\r\n';
  }

  Object.assign(BD, { Dwg, view, toSVG, toDXF, LAYERS });
})(typeof window !== 'undefined' ? window : globalThis);
