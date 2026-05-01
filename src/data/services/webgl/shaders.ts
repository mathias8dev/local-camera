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

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;
