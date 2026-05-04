/* Animated gradient mesh — WebGL fragment shader.
   Three drifting color metaballs (forest / terracotta / ochre) over cream base.
   Falls back gracefully if WebGL unavailable or prefers-reduced-motion is set. */
(() => {
  const canvas = document.getElementById('heroMesh');
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', { antialias: true, premultipliedAlpha: false });
  if (!gl) {
    canvas.classList.add('hero-mesh--fallback');
    return;
  }

  const VS = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  // Three soft metaballs whose centers drift on parametric paths.
  // Color blended via inverse-distance weighting, then mixed with cream base.
  const FS = `
    precision highp float;
    uniform vec2  u_res;
    uniform float u_time;

    vec3 cBase   = vec3(0.957, 0.945, 0.925); // #F4F1EC cream
    vec3 cForest = vec3(0.110, 0.200, 0.161); // #1C3329 forest green
    vec3 cTerra  = vec3(0.773, 0.325, 0.227); // #C5533A terracotta
    vec3 cOchre  = vec3(0.910, 0.835, 0.627); // #E8D5A0 ochre

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res.xy;
      uv.x *= u_res.x / u_res.y; // aspect-correct

      float t = u_time * 0.08;

      // Three drifting centers, looping parametric paths.
      vec2 p1 = vec2(0.30 + 0.18 * sin(t * 0.7),       0.40 + 0.14 * cos(t * 0.9));
      vec2 p2 = vec2(0.75 + 0.20 * cos(t * 0.5 + 1.2), 0.65 + 0.18 * sin(t * 0.6 + 0.5));
      vec2 p3 = vec2(0.55 + 0.22 * sin(t * 0.4 + 2.1), 0.25 + 0.20 * cos(t * 0.8 + 1.8));
      p1.x *= u_res.x / u_res.y;
      p2.x *= u_res.x / u_res.y;
      p3.x *= u_res.x / u_res.y;

      float d1 = distance(uv, p1);
      float d2 = distance(uv, p2);
      float d3 = distance(uv, p3);

      // Soft falloff, large radius for overlap.
      float w1 = 1.0 / (d1 * d1 * 18.0 + 0.05);
      float w2 = 1.0 / (d2 * d2 * 18.0 + 0.05);
      float w3 = 1.0 / (d3 * d3 * 18.0 + 0.05);
      float wsum = w1 + w2 + w3;

      vec3 mesh = (cForest * w1 + cTerra * w2 + cOchre * w3) / wsum;

      // Strength of mesh color over cream base (clamp so cream still reads).
      float strength = clamp(wsum * 0.045, 0.0, 0.72);
      vec3 col = mix(cBase, mesh, strength);

      // Subtle film grain
      float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      col += (grain - 0.5) * 0.012;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('Shader compile error:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, VS);
  const fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { canvas.classList.add('hero-mesh--fallback'); return; }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    canvas.classList.add('hero-mesh--fallback');
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes  = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = canvas.clientWidth * dpr;
    const h = canvas.clientHeight * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, w, h);
  }

  let start = performance.now();
  let rafId;

  function frame(now) {
    resize();
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    rafId = requestAnimationFrame(frame);
  }

  // Pause when tab hidden / element off-screen
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !document.hidden) {
      if (!rafId) { start = performance.now() - (start || 0); rafId = requestAnimationFrame(frame); }
    } else if (rafId) {
      cancelAnimationFrame(rafId); rafId = null;
    }
  }, { threshold: 0.01 });
  io.observe(canvas);

  if (reduceMotion) {
    // Render single static frame
    resize();
    gl.uniform1f(uTime, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  } else {
    rafId = requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
})();
