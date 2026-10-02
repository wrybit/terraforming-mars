/* Zeichnet einen Planeten-Streifen per WebGL echt auf die Kugel: Bogenlänge statt x (zum Rand hin gestaucht),
   Licht von oben links. Eine gemeinsame WebGL-Fläche für alle Buttons (Browser erlauben nur wenige Kontexte);
   das Ergebnis wird in die 2D-Canvas des jeweiligen Buttons kopiert. */
import {PlanetDrawRequest, PlanetRenderer} from './planetRenderer';
import {GLOBE, SPRITE_ROW, STRIPES_TEXTURE_SIZE, STRIPES_TEXTURE_URL} from './planetStripes';

const float = (value: number) => value.toFixed(3);

const VERTEX_SOURCE = `
  attribute vec2 position;
  uniform vec2 buttonSize;
  varying vec2 buttonPoint;
  void main() {
    // Button-Koordinaten in CSS-Pixeln, y nach unten wie im Layout
    buttonPoint = vec2((position.x + 1.0) * 0.5 * buttonSize.x, (1.0 - position.y) * 0.5 * buttonSize.y);
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

const FRAGMENT_SOURCE = `
  precision highp float;
  varying vec2 buttonPoint;
  uniform sampler2D stripes;
  uniform vec2 buttonSize;
  uniform float globeScale;   // CSS-Pixel je Sprite-Pixel
  uniform float spriteTop;    // Oberkante des Buttons im Sprite-Raster
  uniform float stripeTop;
  uniform float stripeHeight;
  uniform float startX;
  uniform float offset;
  uniform float glow;
  const vec2 textureSize = vec2(${float(STRIPES_TEXTURE_SIZE.width)}, ${float(STRIPES_TEXTURE_SIZE.height)});
  const vec3 globe = vec3(${float(GLOBE.centerX)}, ${float(GLOBE.centerY)}, ${float(GLOBE.radius)});
  const vec2 spriteRow = vec2(${float(SPRITE_ROW.width)}, ${float(SPRITE_ROW.height)});
  void main() {
    // Button-Punkt ins Sprite-Raster: einheitlich skaliert, damit die Bögen aller Buttons zusammenpassen
    float scale = globeScale;
    vec2 spritePoint = vec2(buttonPoint.x / scale, spriteTop + buttonPoint.y / scale);
    vec2 point = spritePoint - globe.xy;
    float radius = globe.z;
    float distanceFromCenter = length(point);
    // Kantenglättung am Planetenrand (1 Bildschirmpixel)
    float coverage = clamp((radius - distanceFromCenter) * scale, 0.0, 1.0);
    if (coverage <= 0.0) { gl_FragColor = vec4(0.0); return; }
    // Bogenlänge auf dem Breitenkreis statt x: links fast unverzerrt, zum Rand hin gestaucht
    float circleRadius = sqrt(max(radius * radius - point.y * point.y, 1.0));
    float surfaceX = circleRadius * asin(clamp(point.x / circleRadius, -1.0, 1.0));
    float stripeScale = spriteRow.y / stripeHeight;
    float sourceX = startX + (surfaceX + globe.x - offset) / stripeScale;
    float sourceY = clamp(stripeTop + (spritePoint.y - spriteTop) / stripeScale, stripeTop + 0.5, stripeTop + stripeHeight - 0.5);
    vec3 color = texture2D(stripes, vec2(sourceX, sourceY) / textureSize).rgb;
    // Licht von oben links vorn
    vec3 normal = vec3(point.x, -point.y, sqrt(max(radius * radius - distanceFromCenter * distanceFromCenter, 0.0))) / radius;
    float diffuse = max(dot(normal, normalize(vec3(-0.38, 0.2, 0.9))), 0.0);
    // Hover: flacheres, helleres Licht (alle Reihen leuchten gleich), aber mit Randabdunklung je Reihe – bezogen auf
    // den Breitenkreis, damit die unteren Reihen nicht insgesamt dunkler werden; hält die Kugel rund
    float rowDepth = sqrt(max(1.0 - pow(point.x / circleRadius, 2.0), 0.0));
    float limb = mix(0.3, 1.0, smoothstep(0.0, 0.6, rowDepth));
    float shade = mix(0.26 + 0.92 * diffuse, (0.85 + 0.35 * diffuse) * limb, glow);
    gl_FragColor = vec4(color * shade * coverage, coverage);
  }`;

type Uniforms = Record<'buttonSize' | 'globeScale' | 'spriteTop' | 'stripeTop' | 'stripeHeight' | 'startX' | 'offset' | 'glow', WebGLUniformLocation | null>;

export class PlanetGlobeRenderer implements PlanetRenderer {
  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly gl: WebGLRenderingContext,
    private readonly uniforms: Uniforms,
  ) {}

  /** Baut den Renderer und lädt die Textur; undefined, wenn der Browser kein WebGL kann (dann bleibt planets.jpg). */
  public static async create(): Promise<PlanetGlobeRenderer | undefined> {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', {premultipliedAlpha: true, alpha: true});
    if (gl === null) {
      return undefined;
    }
    const program = linkProgram(gl);
    if (program === undefined) {
      return undefined;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const location = (name: keyof Uniforms) => gl.getUniformLocation(program, name);
    const uniforms: Uniforms = {
      buttonSize: location('buttonSize'), globeScale: location('globeScale'), spriteTop: location('spriteTop'), stripeTop: location('stripeTop'), stripeHeight: location('stripeHeight'),
      startX: location('startX'), offset: location('offset'), glow: location('glow'),
    };
    const image = await loadImage(STRIPES_TEXTURE_URL);
    if (image === undefined) {
      return undefined;
    }
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Textur ist keine Zweierpotenz: ohne Mipmaps und mit CLAMP, sonst bleibt sie in WebGL 1 schwarz
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    return new PlanetGlobeRenderer(canvas, gl, uniforms);
  }

  public draw(request: PlanetDrawRequest): void {
    const {target} = request;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = target.clientWidth;
    const cssHeight = target.clientHeight;
    if (cssWidth === 0 || cssHeight === 0) {
      return;
    }
    const width = Math.round(cssWidth * pixelRatio);
    const height = Math.round(cssHeight * pixelRatio);
    for (const canvas of [this.canvas, target]) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }
    const gl = this.gl;
    gl.uniform2f(this.uniforms.buttonSize, cssWidth, cssHeight);
    gl.uniform1f(this.uniforms.globeScale, request.placement.scale);
    gl.uniform1f(this.uniforms.spriteTop, request.placement.spriteTop);
    gl.uniform1f(this.uniforms.stripeTop, request.stripe.top);
    gl.uniform1f(this.uniforms.stripeHeight, request.stripe.height);
    gl.uniform1f(this.uniforms.startX, request.stripe.startX);
    gl.uniform1f(this.uniforms.offset, request.offset);
    gl.uniform1f(this.uniforms.glow, request.glow);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const context = target.getContext('2d');
    context?.clearRect(0, 0, width, height);
    context?.drawImage(this.canvas, 0, 0);
  }
}

function linkProgram(gl: WebGLRenderingContext): WebGLProgram | undefined {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (shader === null) {
      return undefined;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : undefined;
  };
  const vertex = compile(gl.VERTEX_SHADER, VERTEX_SOURCE);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
  const program = gl.createProgram();
  if (vertex === undefined || fragment === undefined || program === null) {
    return undefined;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : undefined;
}

function loadImage(url: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(undefined);
    image.src = url;
  });
}
