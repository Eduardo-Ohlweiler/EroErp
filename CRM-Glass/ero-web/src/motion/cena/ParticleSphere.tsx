import { useEffect, useRef } from 'react';
import { useReduce } from '../../shared/aparencia/AparenciaProvider';
import { cn } from '../../shared/util/utils';

function hexToRgb(hex: string) {
  const h = hex.replace('#', '').trim();
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
}

/** Esfera de partículas que gira devagar e segue o mouse. Para com a aba oculta. */
export function ParticleSphere({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReduce();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const N = 1500;
    const pts: number[][] = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      const j = 0.82 + Math.random() * 0.32;
      pts.push([Math.cos(th) * r * j, y * j, Math.sin(th) * r * j, Math.random()]);
    }
    for (let i = 0; i < 260; i++) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      const rr = 1.25 + Math.random() * 0.9;
      pts.push([Math.sin(b) * Math.cos(a) * rr, Math.cos(b) * rr, Math.sin(b) * Math.sin(a) * rr, Math.random()]);
    }

    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let fg = '255,255,255';
    let accent = '139,92,246';
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      fg = hexToRgb(cs.getPropertyValue('--fg') || '#ffffff');
      accent = hexToRgb(cs.getPropertyValue('--accent') || '#8b5cf6');
    };
    readColors();

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove);

    let t = 0;
    let raf = 0;
    let frame = 0;
    const draw = () => {
      if (frame++ % 60 === 0) readColors();
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.36 * (1 + Math.sin(t * 0.8) * 0.015);
      const cx = w / 2;
      const cy = h / 2;
      const ry = t * 0.12 + mouse.x * 0.5;
      const rx = 0.35 + mouse.y * 0.3;
      const sy = Math.sin(ry);
      const cyy = Math.cos(ry);
      const sx = Math.sin(rx);
      const cxx = Math.cos(rx);
      for (const p of pts) {
        let x = p[0] * cyy - p[2] * sy;
        let z = p[0] * sy + p[2] * cyy;
        const y = p[1] * cxx - z * sx;
        z = p[1] * sx + z * cxx;
        const s = 2.4 / (2.4 + z);
        x = cx + x * R * s;
        const py = cy + y * R * s;
        const twinkle = 0.65 + 0.35 * Math.sin(t * 2 + p[3] * 20);
        const alpha = (0.18 + 0.82 * (1 - (z + 1.2) / 2.4)) * twinkle;
        const size = 0.7 + s * 0.9;
        ctx.fillStyle = `rgba(${p[3] < 0.14 ? accent : fg},${Math.max(0.05, Math.min(1, alpha))})`;
        ctx.fillRect(x, py, size, size);
      }
      t += 1 / 60;
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    const loop = () => {
      if (document.hidden) {
        raf = requestAnimationFrame(loop);
        return;
      }
      draw();
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduce]);

  return <canvas ref={ref} className={cn('block w-full h-full', className)} aria-hidden />;
}
