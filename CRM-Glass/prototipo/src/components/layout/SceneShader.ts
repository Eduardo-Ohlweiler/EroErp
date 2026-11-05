import type { Cena } from './cenas';

/**
 * Renderizador WebGL 2 do fundo de cena: uma foto de noite e uma de dia, alinhadas, misturadas
 * em espaço linear como luz de verdade (cada luminária acesa soma a sua parte), com céu, luzes
 * da cidade, luz quente do amanhecer, bloom, exposição, gradação, vinheta e grão.
 * Não sabe nada de tempo: desenha o quadro que receber (o roteiro está em SceneBackground.tsx).
 */

export const MAX_LUZES = 24;

export type Quadro = {
  /** 0 = noite, 1 = dia (gradação geral) */
  p: number;
  /** céu/exterior clareado (0–1) */
  ceu: number;
  /** intensidade da luz quente (0–1) */
  aurora: number;
  /** fração das luzes da cidade acesas (0–1) */
  cidade: number;
  /** quanto cada luminária está acesa (0–1), na ordem de `cena.luzes` */
  luzes: Float32Array;
  /** multiplicador de exposição (1 = neutro) */
  exposicao: number;
  /** aproximação de câmera (1 = enquadramento normal) */
  zoom: number;
  /** desfoque, em níveis de mipmap */
  foco: number;
  /** deslocamento lento da câmera em repouso, em fração da foto */
  deriva: [number, number];
  /** segundos, para a água */
  tempo: number;
  /** semente do grão: muda só durante a troca (em repouso o grão fica parado e a GPU descansa) */
  semente: number;
};

export type Ajustes = {
  grao: number;
  vinheta: number;
  agua: { amplitude: number; frequencia: number; velocidade: number };
  estrelas: { densidade: number; brilho: number; cintilar: number };
  neblina: number;
};

export type Cores = {
  gradeNoite: [number, number, number];
  gradeDia: [number, number, number];
  aurora: [number, number, number];
  bloom: [number, number, number];
  bloomCidade: [number, number, number];
};

const VERT = `#version 300 es
in vec2 a;
out vec2 v;
void main() {
  v = a * 0.5 + 0.5;
  gl_Position = vec4(a, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v;
out vec4 saida;

uniform sampler2D uDia;
uniform sampler2D uNoite;
uniform sampler2D uMasc;
uniform vec2 uTela;
uniform float uImg;
uniform vec3 uLuz[${MAX_LUZES}];
uniform float uOn[${MAX_LUZES}];
uniform int uN;
uniform float uP, uCeu, uAurora, uCidade, uExpo, uZoom, uFoco, uTempo, uSemente, uGrao, uVinheta;
// >= 0: todas as luminárias no mesmo estado (repouso); dispensa o laço por pixel
uniform float uLiFixo;
uniform vec2 uDeriva;
uniform vec3 uAgua;
// Cena externa (cidade): G da máscara é o céu; uHorizonte = linha d'água em fração da altura.
uniform float uExterior, uHorizonte;
uniform vec3 uEstrelas;
uniform float uNeblina;
uniform vec3 uGradeNoite, uGradeDia, uCorAurora, uBloom, uBloomCidade;

vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
vec3 srgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
// Hash estável para coordenadas grandes (sem o padrão de listras do fract(sin(...)) em float de 32 bits).
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
// Ruído de valor suave (para a água não ondular em padrão regular).
float ruido(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

// Compressão suave dos realces: nada estoura em branco chapado.
vec3 joelho(vec3 c) {
  vec3 k = vec3(0.8);
  vec3 e = max(c - k, 0.0);
  return min(c, k) + e / (1.0 + e / (1.0 - k));
}

void main() {
  // Cobrir a tela mantendo a proporção da foto (y para baixo, como nas coordenadas da cena).
  vec2 uv = vec2(v.x, 1.0 - v.y);
  float ta = uTela.x / uTela.y;
  if (ta > uImg) uv.y = (uv.y - 0.5) * uImg / ta + 0.5;
  else uv.x = (uv.x - 0.5) * ta / uImg + 0.5;
  uv = (uv - 0.5) / uZoom + 0.5 + uDeriva;

  // Água: ondula o reflexo (alfa da máscara guarda 1 - água/2). Duas frequências cruzadas, e ondas
  // maiores perto da câmera (perspectiva): o reflexo tremula em faixas horizontais, como na água real.
  vec2 uvSeco = uv;
  float agua = clamp((1.0 - textureLod(uMasc, uv, 0.0).a) * 2.0, 0.0, 1.0);
  if (agua > 0.0) {
    // Ondinhas finas: faixas horizontais irregulares (ruído alongado em x), duas escalas, andando devagar.
    float perto = 0.3 + clamp((uv.y - uHorizonte) / max(1.0 - uHorizonte, 0.01), 0.0, 1.0) * 1.7;
    float escala = uAgua.y / perto;
    vec2 q = vec2(uv.x * escala * 0.08, uv.y * escala);
    float t = uTempo * uAgua.z;
    float onda = (ruido(q + vec2(t * 0.3, t)) - 0.5) + 0.5 * (ruido(q * 2.3 + vec2(-t * 0.2, t * 1.6)) - 0.5);
    uv.x += onda * uAgua.x * perto * agua;
  }

  // Desfoque de lente pelos níveis de mipmap (LOD fixo, filtragem trilinear).
  vec3 n = lin(textureLod(uNoite, uv, uFoco).rgb);
  vec3 d = lin(textureLod(uDia, uv, uFoco).rgb);
  vec4 m = textureLod(uMasc, uv, uFoco * 0.5);
  float ext = m.r;

  // Luz interna: cada luminária ilumina a sala toda, mais forte perto dela.
  float soma = 0.0;
  float total = 0.0;
  for (int i = 0; i < ${MAX_LUZES}; i++) {
    if (i >= uN || uLiFixo >= 0.0) break;
    vec2 q = (uv - uLuz[i].xy) * vec2(uImg, 1.0);
    float f = 1.0 / (1.0 + pow(dot(q, q) / (uLuz[i].z * uLuz[i].z), 1.6));
    soma += f * uOn[i];
    total += f;
  }
  float li = uN == 0 ? uCeu : uLiFixo >= 0.0 ? uLiFixo : soma / max(total, 1e-4);
  vec3 interior = mix(n, d, li);

  // Exterior: céu clareando e luzes da cidade apagando cada uma no seu tempo.
  vec3 exterior = mix(n, d, uCeu);
  // Cada janela acende no seu tempo; o reflexo na água usa a célula da janela acima (espelhada na linha d'água).
  vec2 uvCel = uvSeco;
  if (agua > 0.0) uvCel.y = 2.0 * uHorizonte - uvCel.y;
  float celula = hash(floor(uvCel * vec2(260.0, 146.0)));
  float acesa = smoothstep(celula - 0.04, celula + 0.04, uCidade);
  exterior -= n * m.b * (1.0 - acesa) * (1.0 - uCeu) * 0.9;

  // Luz quente: forte perto do horizonte e entrando pela janela.
  vec3 quente = lin(uCorAurora);
  float horizonte = smoothstep(0.05, 0.75, uv.y);
  float derrame = textureLod(uMasc, uv, 5.0).r;
  exterior = exterior * mix(vec3(1.0), quente * 1.5, uAurora * horizonte * 0.8) + quente * uAurora * horizonte * 0.18;
  // Céu (cenas externas): faixa quente logo acima dos prédios e estrelas que surgem com a noite.
  float ceu = uExterior * m.g;
  if (ceu > 0.0) {
    float faixa = exp(-abs(uv.y - (uHorizonte - 0.12)) * 7.0);
    exterior += quente * uAurora * faixa * ceu * 0.45;
    vec2 grade = uv * vec2(1100.0, 620.0);
    float h = hash(floor(grade));
    float estrela = step(1.0 - uEstrelas.x, h) * (1.0 - smoothstep(0.0, 0.5, length(fract(grade) - 0.5)));
    float cintila = 0.65 + 0.35 * sin(uTempo * uEstrelas.z + h * 40.0);
    float noite = (1.0 - uCeu) * (1.0 - uCeu);
    exterior += vec3(estrela * cintila * uEstrelas.y * noite * ceu);
  }
  interior *= mix(vec3(1.0), quente * 1.4, uAurora * derrame * 0.55);

  vec3 c = mix(interior, exterior, ext);

  // Bloom das luminárias (segue a luz local) e das luzes da cidade.
  c += lin(uBloom) * textureLod(uMasc, uv, 2.5).g * li * 0.3 * (1.0 - uExterior);
  c += lin(uBloomCidade) * textureLod(uMasc, uv, 3.0).b * uCidade * (1.0 - uCeu) * 0.6;
  // Neblina de luz: a cidade acesa ilumina o ar acima dela.
  c += lin(uBloomCidade) * textureLod(uMasc, uv, 6.0).b * uCidade * (1.0 - uCeu) * uNeblina;

  c *= uExpo;
  c *= mix(lin(uGradeNoite), lin(uGradeDia), uP);
  c = joelho(c);

  vec3 s = srgb(c);
  vec2 vv = v - 0.5;
  s *= 1.0 - uVinheta * dot(vv, vv) * 1.6;
  s += (hash(gl_FragCoord.xy + uSemente * 61.0) - 0.5) * uGrao;
  saida = vec4(s, 1.0);
}`;

async function bitmap(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Falha ao carregar ${url}`);
  return createImageBitmap(await r.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
}

function compilar(gl: WebGL2RenderingContext, tipo: number, fonte: string) {
  const s = gl.createShader(tipo)!;
  gl.shaderSource(s, fonte);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
}

export class Renderizador {
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private texturas: WebGLTexture[] = [];
  private pronto = false;

  private static temSuporte: boolean | null = null;
  private destruido = false;
  private buffer: WebGLBuffer | null = null;

  /** Testa uma vez por página e libera o contexto de teste (há limite de contextos por aba). */
  static suportado() {
    if (Renderizador.temSuporte === null) {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        Renderizador.temSuporte = !!gl;
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        Renderizador.temSuporte = false;
      }
    }
    return Renderizador.temSuporte;
  }

  constructor(
    private canvas: HTMLCanvasElement,
    private cena: Cena,
    private cores: Cores,
    private ajustes: Ajustes,
  ) {
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL 2 indisponível');
    this.gl = gl;
    const prog = gl.createProgram()!;
    const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
    const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'programa');
    this.prog = prog;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    this.buffer = buf;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    for (const nome of [
      'uDia', 'uNoite', 'uMasc', 'uTela', 'uImg', 'uLuz', 'uOn', 'uN', 'uP', 'uCeu', 'uAurora', 'uCidade',
      'uExpo', 'uZoom', 'uFoco', 'uTempo', 'uSemente', 'uLiFixo', 'uGrao', 'uVinheta', 'uDeriva', 'uAgua',
      'uGradeNoite', 'uGradeDia', 'uCorAurora', 'uBloom', 'uBloomCidade',
      'uExterior', 'uHorizonte', 'uEstrelas', 'uNeblina',
    ]) {
      this.u[nome] = gl.getUniformLocation(prog, nome);
    }
  }

  async carregar() {
    const { gl, cena } = this;
    const imagens = await Promise.all([bitmap(cena.dia), bitmap(cena.noite), bitmap(cena.mascaras)]);
    // Desmontado durante a carga (StrictMode, troca de fundo): não toca no contexto, que pode já ser de outro.
    if (this.destruido || gl.isContextLost()) {
      imagens.forEach((img) => img.close());
      return false;
    }
    gl.useProgram(this.prog);
    imagens.forEach((img, i) => {
      const t = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      img.close();
      this.texturas.push(t);
    });
    gl.uniform1i(this.u.uDia, 0);
    gl.uniform1i(this.u.uNoite, 1);
    gl.uniform1i(this.u.uMasc, 2);

    // Dados fixos da cena e das cores.
    const luz = new Float32Array(MAX_LUZES * 3);
    cena.luzes.slice(0, MAX_LUZES).forEach((l, i) => {
      luz[i * 3] = l.x / 100;
      luz[i * 3 + 1] = l.y / 100;
      luz[i * 3 + 2] = cena.alcance.base + (l.w / 100) * cena.alcance.fator;
    });
    gl.uniform3fv(this.u.uLuz, luz);
    gl.uniform1i(this.u.uN, Math.min(cena.luzes.length, MAX_LUZES));
    gl.uniform1f(this.u.uImg, cena.proporcao);
    gl.uniform1f(this.u.uGrao, this.ajustes.grao);
    gl.uniform1f(this.u.uVinheta, this.ajustes.vinheta);
    const a = this.ajustes.agua;
    gl.uniform3f(this.u.uAgua, a.amplitude, a.frequencia, a.velocidade);
    const e = this.ajustes.estrelas;
    gl.uniform3f(this.u.uEstrelas, e.densidade, e.brilho, e.cintilar);
    gl.uniform1f(this.u.uNeblina, this.ajustes.neblina);
    gl.uniform1f(this.u.uExterior, cena.tipo === 'exterior' ? 1 : 0);
    gl.uniform1f(this.u.uHorizonte, cena.horizonte ?? 1);
    const c = this.cores;
    gl.uniform3fv(this.u.uGradeNoite, c.gradeNoite);
    gl.uniform3fv(this.u.uGradeDia, c.gradeDia);
    gl.uniform3fv(this.u.uCorAurora, c.aurora);
    gl.uniform3fv(this.u.uBloom, c.bloom);
    gl.uniform3fv(this.u.uBloomCidade, c.bloomCidade);
    this.pronto = true;
    return true;
  }

  /** Ajusta o tamanho interno do canvas ao tamanho na tela, limitado a `maxPixels` (a cena é desfocada). */
  redimensionar(maxPixels: number) {
    const { canvas } = this;
    const cw = canvas.clientWidth * (window.devicePixelRatio || 1);
    const ch = canvas.clientHeight * (window.devicePixelRatio || 1);
    const k = Math.min(1, Math.sqrt(maxPixels / Math.max(1, cw * ch)));
    const w = Math.max(1, Math.round(cw * k));
    const h = Math.max(1, Math.round(ch * k));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  desenhar(q: Quadro) {
    if (!this.pronto || this.destruido) return false;
    const { gl, u, canvas } = this;
    if (gl.isContextLost()) return false;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.uTela, canvas.width, canvas.height);
    gl.uniform1fv(u.uOn, q.luzes);
    gl.uniform1f(u.uP, q.p);
    gl.uniform1f(u.uCeu, q.ceu);
    gl.uniform1f(u.uAurora, q.aurora);
    gl.uniform1f(u.uCidade, q.cidade);
    gl.uniform1f(u.uExpo, q.exposicao);
    gl.uniform1f(u.uZoom, q.zoom);
    gl.uniform1f(u.uFoco, q.foco);
    gl.uniform1f(u.uTempo, q.tempo);
    gl.uniform1f(u.uSemente, q.semente);
    const l = q.luzes;
    const n = Math.min(this.cena.luzes.length, MAX_LUZES);
    let fixo = n > 0 ? l[0] : -1;
    for (let i = 1; i < n && fixo >= 0; i++) if (Math.abs(l[i] - fixo) > 1e-4) fixo = -1;
    gl.uniform1f(u.uLiFixo, fixo);
    gl.uniform2f(u.uDeriva, q.deriva[0], q.deriva[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return true;
  }

  /** Libera texturas e programa. Não perde o contexto: o mesmo canvas pode ser reusado (remontagem do React). */
  destruir() {
    const { gl } = this;
    this.destruido = true;
    this.pronto = false;
    this.texturas.forEach((t) => gl.deleteTexture(t));
    this.texturas = [];
    if (this.buffer) gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.prog);
  }
}
