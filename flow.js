/* FLOW — full-page WebGL background.
   Flowing aurora curtains in brand hues over a clean near-black field.
   Soft diagonal ribbons of forest -> terracotta -> ochre drift and breathe;
   one continuous field behind every section ties the page together.
   - Scroll drifts the aurora (u_scroll) so the flow travels with you.
   - Pointer adds a soft ember bloom (u_pointer, desktop only).
   - Renders near full resolution and stays crisp (no heavy CSS blur).
   - Never initializes under prefers-reduced-motion (CSS also hides it).
   - Pauses when the tab is hidden. */
(() => {
  const canvas = document.getElementById('flow');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) { canvas.style.display = 'none'; return; } // body gradient remains

  const VS = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const FS = `
    precision highp float;
    uniform vec2  u_res;
    uniform float u_time;
    uniform float u_scroll;  // 0..1 page progress
    uniform vec2  u_pointer; // 0..1, y-up

    // Brand hues, dark scale
    vec3 cDeep   = vec3(0.039, 0.078, 0.063); // #0A1410
    vec3 cForest = vec3(0.110, 0.200, 0.161); // #1C3329
    vec3 cMid    = vec3(0.180, 0.322, 0.263); // #2E5243
    vec3 cTerra  = vec3(0.765, 0.322, 0.224); // #C35239
    vec3 cOchre  = vec3(0.910, 0.835, 0.627); // #E8D5A0

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.55;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = p * 1.92 + vec2(1.7, -1.2);
        a *= 0.5;
      }
      return v;
    }

    // One flowing aurora curtain. Returns 0..1 intensity along a soft band
    // whose centre undulates with low-frequency noise and drifts over time.
    float curtain(vec2 p, float yCenter, float width, float wobble, float seed) {
      float wave = fbm(vec2(p.x * 1.1 + seed, seed * 0.5 + p.y * 0.4)) - 0.5;
      float y = yCenter + wave * wobble;
      float d = abs(p.y - y);
      float band = smoothstep(width, 0.0, d);
      // Vertical streaks inside the curtain for that aurora shimmer.
      float streak = 0.6 + 0.4 * fbm(vec2(p.x * 4.0 + seed * 2.0, p.y * 1.2));
      return band * streak;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res.xy;
      float aspect = u_res.x / u_res.y;
      vec2 p = vec2(uv.x * aspect, uv.y);

      float t = u_time * 0.05;
      // Whole field drifts diagonally and travels as you scroll.
      vec2 flow = vec2(t * 0.35, t * 0.12 + u_scroll * 1.6);
      vec2 pf = p + flow;

      // Clean near-black base with the faintest forest lift mid-height,
      // so curtains read as light on a night sky (not mud on green).
      vec3 col = mix(cDeep, cForest, smoothstep(0.95, 0.25, abs(uv.y - 0.5)) * 0.22);

      // Three stacked curtains, brand gradient across them. Kept narrow and
      // separated so terracotta never muddies into the forest base.
      float c1 = curtain(pf, 0.30, 0.26, 0.34, 11.3);  // low forest curtain
      float c2 = curtain(pf, 0.55, 0.20, 0.40, 41.7);  // terracotta curtain
      float c3 = curtain(pf, 0.74, 0.15, 0.32, 73.1);  // high ochre filament

      col += cMid   * c1 * 0.36;
      col += cTerra * c2 * 0.34;
      col += cOchre * c3 * 0.22;

      // Pointer ember bloom — additive, soft.
      vec2 pt = vec2(u_pointer.x * aspect, u_pointer.y);
      float pd = distance(p, pt);
      col += cTerra * 0.06 * exp(-pd * 3.0);
      col += cOchre * 0.02 * exp(-pd * 5.0);

      // Gentle vignette keeps corners quiet so content reads.
      float vig = smoothstep(1.35, 0.45, distance(uv, vec2(0.5)));
      col *= mix(0.82, 1.04, vig);

      // Dither to kill banding on the smooth ramps.
      float dither = (hash(gl_FragCoord.xy) - 0.5) * 0.012;
      col += dither;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('Flow shader compile error:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, VS);
  const fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { canvas.style.display = 'none'; return; }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = 'none'; return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes     = gl.getUniformLocation(prog, 'u_res');
  const uTime    = gl.getUniformLocation(prog, 'u_time');
  const uScroll  = gl.getUniformLocation(prog, 'u_scroll');
  const uPointer = gl.getUniformLocation(prog, 'u_pointer');

  // Render near full resolution so the aurora stays crisp; cap DPR for GPU.
  const RES_SCALE = Math.min(window.devicePixelRatio || 1, 1.5);
  function resize() {
    const w = Math.max(1, Math.round(canvas.clientWidth * RES_SCALE));
    const h = Math.max(1, Math.round(canvas.clientHeight * RES_SCALE));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, w, h);
  }

  // Lerped scroll + pointer so motion glides.
  let scrollTarget = 0, scrollNow = 0;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTarget = max > 0 ? scrollY / max : 0;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  let px = 0.5, py = 0.6, pxNow = 0.5, pyNow = 0.6;
  if (matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', (e) => {
      px = e.clientX / innerWidth;
      py = 1.0 - e.clientY / innerHeight;
    }, { passive: true });
  }

  const epoch = performance.now();
  let rafId = null;

  function frame(now) {
    resize();
    scrollNow += (scrollTarget - scrollNow) * 0.06;
    pxNow += (px - pxNow) * 0.05;
    pyNow += (py - pyNow) * 0.05;
    gl.uniform1f(uTime, (now - epoch) / 1000);
    gl.uniform1f(uScroll, scrollNow);
    gl.uniform2f(uPointer, pxNow, pyNow);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    rafId = requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    } else if (!rafId) {
      rafId = requestAnimationFrame(frame);
    }
  });

  rafId = requestAnimationFrame(frame);
  addEventListener('resize', resize);
})();
