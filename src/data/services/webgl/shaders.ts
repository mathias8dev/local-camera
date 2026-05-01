export const VERTEX_SHADER = `
attribute vec2 a_position;
uniform float u_flipY;
varying vec2 v_texCoord;
void main() {
  v_texCoord = vec2(a_position.x * 0.5 + 0.5, a_position.y * u_flipY * 0.5 + 0.5);
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const ENHANCE_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_texelSize;
uniform vec2 u_resolution;
uniform float u_sharpenStrength;
uniform float u_contrastStrength;
uniform float u_exposure;
uniform float u_toneMapStrength;
uniform float u_filterBrightness;
uniform float u_filterSaturation;
uniform float u_filterWarmth;
uniform float u_filterSepia;
uniform float u_filterVignette;
uniform float u_filterFisheye;
uniform float u_filterKaleidoscope;
uniform float u_filterGlitch;
uniform float u_filterPixelate;
uniform float u_filterMirror;
uniform float u_filterSketch;
uniform float u_filterCartoon;
uniform float u_filterInk;
uniform float u_filterNeon;
uniform float u_filterEmboss;
uniform float u_filterHatching;
uniform float u_filterPointillism;
uniform float u_faceSlimAmount;
uniform vec2 u_faceSlimLeftCheek;
uniform vec2 u_faceSlimRightCheek;
uniform vec2 u_faceCenter;
uniform float u_faceWidth;
uniform float u_faceBigEyesScale;
uniform vec2 u_faceBigEyesLeft;
uniform vec2 u_faceBigEyesRight;
uniform float u_faceBigEyesRadius;
varying vec2 v_texCoord;

#define PI 3.14159265359

vec2 applyDistortions(vec2 coord) {
  vec2 uv = coord;

  // Mirror: reflect x across center
  if (u_filterMirror > 0.5) {
    uv.x = uv.x < 0.5 ? uv.x : 1.0 - uv.x;
  }

  // Fisheye: barrel distortion from center
  if (u_filterFisheye > 0.0) {
    vec2 centered = uv - 0.5;
    float r = length(centered);
    float bind = 0.5;
    float power = u_filterFisheye * 2.0;
    vec2 distorted = centered * (1.0 + pow(r / bind, 2.0) * power);
    uv = distorted + 0.5;
  }

  // Kaleidoscope: repeat angular segments
  if (u_filterKaleidoscope > 0.0) {
    float segments = floor(u_filterKaleidoscope * 8.0 + 3.0);
    vec2 centered = uv - 0.5;
    float angle = atan(centered.y, centered.x);
    float r = length(centered);
    float segAngle = 2.0 * PI / segments;
    angle = mod(angle, segAngle);
    if (angle > segAngle * 0.5) angle = segAngle - angle;
    uv = vec2(cos(angle), sin(angle)) * r + 0.5;
  }

  // Pixelate: snap UV to grid cells
  if (u_filterPixelate > 0.0) {
    float cellSize = mix(1.0, 40.0, u_filterPixelate);
    vec2 cells = u_resolution / cellSize;
    uv = floor(uv * cells) / cells + 0.5 / cells;
  }

  // Face slim: push cheek regions toward face center
  if (u_faceSlimAmount > 0.0 && u_faceWidth > 0.0) {
    float slimRadius = u_faceWidth * 0.55;
    float aspect = u_resolution.x / u_resolution.y;

    vec2 dL = uv - u_faceSlimLeftCheek;
    vec2 dLA = vec2(dL.x, dL.y * aspect);
    float distL = length(dLA);
    if (distL < slimRadius) {
      float t = 1.0 - distL / slimRadius;
      t = t * t;
      vec2 inward = u_faceCenter - u_faceSlimLeftCheek;
      float il = length(vec2(inward.x, inward.y * aspect));
      if (il > 0.001) inward /= il;
      uv -= inward * t * u_faceSlimAmount * slimRadius * 0.35;
    }

    vec2 dR = uv - u_faceSlimRightCheek;
    vec2 dRA = vec2(dR.x, dR.y * aspect);
    float distR = length(dRA);
    if (distR < slimRadius) {
      float t = 1.0 - distR / slimRadius;
      t = t * t;
      vec2 inward = u_faceCenter - u_faceSlimRightCheek;
      float il = length(vec2(inward.x, inward.y * aspect));
      if (il > 0.001) inward /= il;
      uv -= inward * t * u_faceSlimAmount * slimRadius * 0.35;
    }
  }

  // Big eyes: magnify eye regions
  if (u_faceBigEyesScale > 1.0 && u_faceBigEyesRadius > 0.0) {
    float aspect = u_resolution.x / u_resolution.y;

    vec2 dL = uv - u_faceBigEyesLeft;
    vec2 dLA = vec2(dL.x, dL.y * aspect);
    float distL = length(dLA);
    if (distL < u_faceBigEyesRadius) {
      float t = distL / u_faceBigEyesRadius;
      float s = t * t * (3.0 - 2.0 * t);
      float scale = mix(u_faceBigEyesScale, 1.0, s);
      uv = u_faceBigEyesLeft + dL / scale;
    }

    vec2 dR = uv - u_faceBigEyesRight;
    vec2 dRA = vec2(dR.x, dR.y * aspect);
    float distR = length(dRA);
    if (distR < u_faceBigEyesRadius) {
      float t = distR / u_faceBigEyesRadius;
      float s = t * t * (3.0 - 2.0 * t);
      float scale = mix(u_faceBigEyesScale, 1.0, s);
      uv = u_faceBigEyesRight + dR / scale;
    }
  }

  return uv;
}

void main() {
  vec2 uv = applyDistortions(v_texCoord);

  // Glitch: RGB channel split with horizontal offset
  vec3 color;
  if (u_filterGlitch > 0.0) {
    float offset = u_filterGlitch * 0.02;
    vec2 uvR = applyDistortions(v_texCoord + vec2(offset, 0.0));
    vec2 uvB = applyDistortions(v_texCoord - vec2(offset, 0.0));
    color = vec3(
      texture2D(u_texture, uvR).r,
      texture2D(u_texture, uv).g,
      texture2D(u_texture, uvB).b
    );
  } else {
    color = texture2D(u_texture, uv).rgb;
  }

  // Sharpen using distorted UVs
  vec4 top    = texture2D(u_texture, uv + vec2(0.0, u_texelSize.y));
  vec4 bottom = texture2D(u_texture, uv - vec2(0.0, u_texelSize.y));
  vec4 left   = texture2D(u_texture, uv - vec2(u_texelSize.x, 0.0));
  vec4 right  = texture2D(u_texture, uv + vec2(u_texelSize.x, 0.0));
  vec3 neighborhood = (top.rgb + bottom.rgb + left.rgb + right.rgb) * 0.25;
  color = clamp(color + (color - neighborhood) * u_sharpenStrength, 0.0, 1.0);

  // Contrast
  color = clamp((color - 0.5) * (1.0 + u_contrastStrength) + 0.5, 0.0, 1.0);

  // Exposure + tone mapping
  vec3 exposed = color * u_exposure;
  vec3 tonemapped = exposed / (exposed + vec3(1.0));
  tonemapped = pow(tonemapped, vec3(1.0 / 2.2));
  color = mix(color, tonemapped, u_toneMapStrength);

  // Brightness
  color *= u_filterBrightness;

  // Saturation
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, u_filterSaturation);

  // Sepia
  vec3 sepiaColor = vec3(
    dot(color, vec3(0.393, 0.769, 0.189)),
    dot(color, vec3(0.349, 0.686, 0.168)),
    dot(color, vec3(0.272, 0.534, 0.131))
  );
  color = mix(color, sepiaColor, u_filterSepia);

  // Warmth
  color.r += u_filterWarmth * 0.1;
  color.b -= u_filterWarmth * 0.1;

  // Vignette
  vec2 vigUV = v_texCoord - 0.5;
  float vig = 1.0 - dot(vigUV, vigUV) * u_filterVignette;
  color *= clamp(vig, 0.0, 1.0);

  // Artistic effects (shared Sobel edge detection)
  bool needEdge = u_filterSketch > 0.0 || u_filterCartoon > 0.0 ||
                  u_filterInk > 0.0 || u_filterNeon > 0.0 || u_filterEmboss > 0.0;
  float edge = 0.0;
  float gx = 0.0;
  float gy = 0.0;
  if (needEdge) {
    vec3 lumW = vec3(0.2126, 0.7152, 0.0722);
    float lumT  = dot(top.rgb, lumW);
    float lumB  = dot(bottom.rgb, lumW);
    float lumL  = dot(left.rgb, lumW);
    float lumR  = dot(right.rgb, lumW);
    float lumTL = dot(texture2D(u_texture, uv + vec2(-u_texelSize.x,  u_texelSize.y)).rgb, lumW);
    float lumTR = dot(texture2D(u_texture, uv + vec2( u_texelSize.x,  u_texelSize.y)).rgb, lumW);
    float lumBL = dot(texture2D(u_texture, uv + vec2(-u_texelSize.x, -u_texelSize.y)).rgb, lumW);
    float lumBR = dot(texture2D(u_texture, uv + vec2( u_texelSize.x, -u_texelSize.y)).rgb, lumW);
    gx = -lumTL - 2.0 * lumL - lumBL + lumTR + 2.0 * lumR + lumBR;
    gy = -lumTL - 2.0 * lumT - lumTR + lumBL + 2.0 * lumB + lumBR;
    edge = sqrt(gx * gx + gy * gy);
  }

  // Pencil sketch: dark lines on white
  if (u_filterSketch > 0.0) {
    float ink = clamp(edge * 4.0, 0.0, 1.0);
    vec3 sketch = vec3(1.0 - ink);
    color = mix(color, sketch, u_filterSketch);
  }

  // Cartoon: quantized colors + edge outlines
  if (u_filterCartoon > 0.0) {
    float levels = 6.0;
    vec3 quantized = floor(color * levels + 0.5) / levels;
    float outline = clamp(edge * 5.0, 0.0, 1.0);
    vec3 cartoon = quantized * (1.0 - outline * 0.85);
    color = mix(color, cartoon, u_filterCartoon);
  }

  // Ink: XDoG-style crisp binary thresholding
  if (u_filterInk > 0.0) {
    float phi = 10.0;
    float epsilon = 0.08;
    float sharpEdge = smoothstep(epsilon - 0.03, epsilon + 0.03, edge);
    float inkVal = 1.0 - sharpEdge;
    color = mix(color, vec3(inkVal), u_filterInk);
  }

  // Neon: colored glowing edges on dark background
  if (u_filterNeon > 0.0) {
    float glow = clamp(edge * 3.0, 0.0, 1.0);
    vec3 edgeColor = color * glow * 2.5;
    vec3 neon = mix(vec3(0.0), edgeColor, glow);
    color = mix(color, neon, u_filterNeon);
  }

  // Emboss: directional 3D relief
  if (u_filterEmboss > 0.0) {
    float l = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float relief = l + gx * u_filterEmboss * 2.0;
    color = mix(color, vec3(clamp(relief + 0.5, 0.0, 1.0)), u_filterEmboss);
  }

  // Cross-hatching: luminance-driven diagonal line patterns
  if (u_filterHatching > 0.0) {
    float l = dot(color, vec3(0.2126, 0.7152, 0.0722));
    vec2 fc = gl_FragCoord.xy;
    float spacing = 6.0 * u_resolution.y / 480.0;
    float lineW = 0.4;
    float h1 = step(lineW, fract((fc.x + fc.y) / spacing));
    float h2 = step(lineW, fract((fc.x - fc.y) / spacing));
    float h3 = step(lineW, fract(fc.x / spacing));
    float h4 = step(lineW, fract(fc.y / spacing));
    float pattern = 1.0;
    if (l < 0.8) pattern *= h1;
    if (l < 0.6) pattern *= h2;
    if (l < 0.4) pattern *= h3;
    if (l < 0.2) pattern *= h4;
    vec3 hatched = vec3(pattern);
    color = mix(color, hatched, u_filterHatching);
  }

  // Pointillism: luminance-sized dots on a grid
  if (u_filterPointillism > 0.0) {
    float dotSpacing = mix(4.0, 12.0, u_filterPointillism) * u_resolution.y / 480.0;
    vec2 fc = gl_FragCoord.xy;
    vec2 cell = floor(fc / dotSpacing) * dotSpacing + dotSpacing * 0.5;
    float dist = length(fc - cell);
    vec3 cellColor = texture2D(u_texture, cell / u_resolution).rgb;
    float l = dot(cellColor, vec3(0.2126, 0.7152, 0.0722));
    float radius = dotSpacing * 0.5 * (1.0 - l);
    float dotMask = 1.0 - smoothstep(radius - 0.8, radius + 0.8, dist);
    vec3 pointillism = cellColor * dotMask + vec3(1.0) * (1.0 - dotMask);
    color = mix(color, pointillism, u_filterPointillism);
  }

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;
