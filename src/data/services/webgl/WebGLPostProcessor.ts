import {
  DEFAULT_POST_PROCESSOR_CONFIG,
  type PostProcessorConfig,
} from "@/domain/entities/PostProcessorConfig";
import { VERTEX_SHADER, ENHANCE_FRAGMENT_SHADER } from "./shaders";

type UniformLocations = Record<string, WebGLUniformLocation | null>;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, ENHANCE_FRAGMENT_SHADER);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

function getUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
): UniformLocations {
  const names = [
    "u_texture",
    "u_flipY",
    "u_texelSize",
    "u_sharpenStrength",
    "u_contrastStrength",
    "u_exposure",
    "u_toneMapStrength",
    "u_filterBrightness",
    "u_filterSaturation",
    "u_filterWarmth",
    "u_filterSepia",
    "u_filterVignette",
    "u_filterFisheye",
    "u_filterKaleidoscope",
    "u_filterGlitch",
    "u_filterPixelate",
    "u_filterMirror",
    "u_filterSketch",
    "u_filterCartoon",
    "u_filterInk",
    "u_filterNeon",
    "u_filterEmboss",
    "u_filterHatching",
    "u_filterPointillism",
    "u_resolution",
  ];
  const locs: UniformLocations = {};
  for (const name of names) {
    locs[name] = gl.getUniformLocation(program, name);
  }
  return locs;
}

const PASSTHROUGH: PostProcessorConfig = {
  enabled: true,
  sharpenStrength: 0,
  contrastStrength: 0,
  exposure: 1,
  toneMapStrength: 0,
  filterBrightness: 1,
  filterSaturation: 1,
  filterWarmth: 0,
  filterSepia: 0,
  filterVignette: 0,
  filterFisheye: 0,
  filterKaleidoscope: 0,
  filterGlitch: 0,
  filterPixelate: 0,
  filterMirror: 0,
  filterSketch: 0,
  filterCartoon: 0,
  filterInk: 0,
  filterNeon: 0,
  filterEmboss: 0,
  filterHatching: 0,
  filterPointillism: 0,
};

const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

export class WebGLPostProcessor {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private buffer: WebGLBuffer | null = null;
  private uniforms: UniformLocations = {};
  private canvas: HTMLCanvasElement | null = null;
  private videoSource: HTMLVideoElement | null = null;
  private animFrameId = 0;
  private contextLost = false;
  private config: PostProcessorConfig = { ...DEFAULT_POST_PROCESSOR_CONFIG };

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    this.initGL();
  }

  detach(): void {
    this.stopPreview();
    if (this.canvas) {
      this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
      this.canvas.removeEventListener(
        "webglcontextrestored",
        this.onContextRestored,
      );
    }
    this.deleteGLResources();
    this.gl = null;
    this.canvas = null;
  }

  startPreview(video: HTMLVideoElement): void {
    this.stopPreview();
    this.videoSource = video;
    const loop = () => {
      this.animFrameId = requestAnimationFrame(loop);
      if (this.contextLost || !this.videoSource) return;
      if (this.videoSource.readyState < this.videoSource.HAVE_CURRENT_DATA)
        return;
      this.resizeCanvasToVideo();
      this.drawFrame(this.videoSource);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stopPreview(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
    this.videoSource = null;
  }

  setConfig(partial: Partial<PostProcessorConfig>): void {
    Object.assign(this.config, partial);
  }

  getConfig(): PostProcessorConfig {
    return { ...this.config };
  }

  async processBlob(
    blob: Blob,
    width: number,
    height: number,
  ): Promise<Blob> {
    const bitmap = await createImageBitmap(blob);
    const offscreen = new OffscreenCanvas(width, height);
    const gl = offscreen.getContext("webgl", {
      alpha: false,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
    })!;

    const program = createProgram(gl);
    const uniforms = getUniforms(gl, program);
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    bitmap.close();

    gl.viewport(0, 0, width, height);
    gl.useProgram(program);

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const enhance = this.config.enabled ? this.config : PASSTHROUGH;
    gl.uniform1i(uniforms.u_texture, 0);
    gl.uniform1f(uniforms.u_flipY, -1.0);
    gl.uniform2f(uniforms.u_texelSize, 1 / width, 1 / height);
    gl.uniform1f(uniforms.u_sharpenStrength, enhance.sharpenStrength);
    gl.uniform1f(uniforms.u_contrastStrength, enhance.contrastStrength);
    gl.uniform1f(uniforms.u_exposure, enhance.exposure);
    gl.uniform1f(uniforms.u_toneMapStrength, enhance.toneMapStrength);
    gl.uniform1f(uniforms.u_filterBrightness, this.config.filterBrightness);
    gl.uniform1f(uniforms.u_filterSaturation, this.config.filterSaturation);
    gl.uniform1f(uniforms.u_filterWarmth, this.config.filterWarmth);
    gl.uniform1f(uniforms.u_filterSepia, this.config.filterSepia);
    gl.uniform1f(uniforms.u_filterVignette, this.config.filterVignette);
    gl.uniform1f(uniforms.u_filterFisheye, this.config.filterFisheye);
    gl.uniform1f(uniforms.u_filterKaleidoscope, this.config.filterKaleidoscope);
    gl.uniform1f(uniforms.u_filterGlitch, this.config.filterGlitch);
    gl.uniform1f(uniforms.u_filterPixelate, this.config.filterPixelate);
    gl.uniform1f(uniforms.u_filterMirror, this.config.filterMirror);
    gl.uniform1f(uniforms.u_filterSketch, this.config.filterSketch);
    gl.uniform1f(uniforms.u_filterCartoon, this.config.filterCartoon);
    gl.uniform1f(uniforms.u_filterInk, this.config.filterInk);
    gl.uniform1f(uniforms.u_filterNeon, this.config.filterNeon);
    gl.uniform1f(uniforms.u_filterEmboss, this.config.filterEmboss);
    gl.uniform1f(uniforms.u_filterHatching, this.config.filterHatching);
    gl.uniform1f(uniforms.u_filterPointillism, this.config.filterPointillism);
    gl.uniform2f(uniforms.u_resolution, width, height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const result = await offscreen.convertToBlob({
      type: "image/jpeg",
      quality: 0.95,
    });

    gl.deleteTexture(tex);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    const ext = gl.getExtension("WEBGL_lose_context");
    ext?.loseContext();

    return result;
  }

  dispose(): void {
    this.detach();
  }

  private initGL(): void {
    if (!this.canvas) return;
    this.gl = this.canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!this.gl) return;
    const gl = this.gl;

    this.program = createProgram(gl);
    this.uniforms = getUniforms(gl, this.program);

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  private deleteGLResources(): void {
    if (!this.gl) return;
    const gl = this.gl;
    if (this.texture) gl.deleteTexture(this.texture);
    if (this.buffer) gl.deleteBuffer(this.buffer);
    if (this.program) gl.deleteProgram(this.program);
    this.texture = null;
    this.buffer = null;
    this.program = null;
    this.uniforms = {};
  }

  private resizeCanvasToVideo(): void {
    if (!this.canvas || !this.videoSource) return;
    const { videoWidth, videoHeight } = this.videoSource;
    if (this.canvas.width !== videoWidth || this.canvas.height !== videoHeight) {
      this.canvas.width = videoWidth;
      this.canvas.height = videoHeight;
    }
  }

  private drawFrame(source: HTMLVideoElement): void {
    const gl = this.gl;
    if (!gl || !this.program || !this.texture) return;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.useProgram(this.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    const posLoc = gl.getAttribLocation(this.program, "a_position");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const enhance = this.config.enabled ? this.config : PASSTHROUGH;
    gl.uniform1i(this.uniforms.u_texture, 0);
    gl.uniform1f(this.uniforms.u_flipY, 1.0);
    gl.uniform2f(
      this.uniforms.u_texelSize,
      1 / gl.drawingBufferWidth,
      1 / gl.drawingBufferHeight,
    );
    gl.uniform1f(this.uniforms.u_sharpenStrength, enhance.sharpenStrength);
    gl.uniform1f(this.uniforms.u_contrastStrength, enhance.contrastStrength);
    gl.uniform1f(this.uniforms.u_exposure, enhance.exposure);
    gl.uniform1f(this.uniforms.u_toneMapStrength, enhance.toneMapStrength);
    gl.uniform1f(this.uniforms.u_filterBrightness, this.config.filterBrightness);
    gl.uniform1f(this.uniforms.u_filterSaturation, this.config.filterSaturation);
    gl.uniform1f(this.uniforms.u_filterWarmth, this.config.filterWarmth);
    gl.uniform1f(this.uniforms.u_filterSepia, this.config.filterSepia);
    gl.uniform1f(this.uniforms.u_filterVignette, this.config.filterVignette);
    gl.uniform1f(this.uniforms.u_filterFisheye, this.config.filterFisheye);
    gl.uniform1f(this.uniforms.u_filterKaleidoscope, this.config.filterKaleidoscope);
    gl.uniform1f(this.uniforms.u_filterGlitch, this.config.filterGlitch);
    gl.uniform1f(this.uniforms.u_filterPixelate, this.config.filterPixelate);
    gl.uniform1f(this.uniforms.u_filterMirror, this.config.filterMirror);
    gl.uniform1f(this.uniforms.u_filterSketch, this.config.filterSketch);
    gl.uniform1f(this.uniforms.u_filterCartoon, this.config.filterCartoon);
    gl.uniform1f(this.uniforms.u_filterInk, this.config.filterInk);
    gl.uniform1f(this.uniforms.u_filterNeon, this.config.filterNeon);
    gl.uniform1f(this.uniforms.u_filterEmboss, this.config.filterEmboss);
    gl.uniform1f(this.uniforms.u_filterHatching, this.config.filterHatching);
    gl.uniform1f(this.uniforms.u_filterPointillism, this.config.filterPointillism);
    gl.uniform2f(this.uniforms.u_resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
    cancelAnimationFrame(this.animFrameId);
    this.animFrameId = 0;
  };

  private onContextRestored = () => {
    this.contextLost = false;
    this.deleteGLResources();
    this.initGL();
    if (this.videoSource) {
      this.startPreview(this.videoSource);
    }
  };
}
