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
uniform float u_sharpenStrength;
uniform float u_contrastStrength;
uniform float u_exposure;
uniform float u_toneMapStrength;
varying vec2 v_texCoord;

void main() {
  vec4 center = texture2D(u_texture, v_texCoord);
  vec4 top    = texture2D(u_texture, v_texCoord + vec2(0.0, u_texelSize.y));
  vec4 bottom = texture2D(u_texture, v_texCoord - vec2(0.0, u_texelSize.y));
  vec4 left   = texture2D(u_texture, v_texCoord - vec2(u_texelSize.x, 0.0));
  vec4 right  = texture2D(u_texture, v_texCoord + vec2(u_texelSize.x, 0.0));
  vec4 neighborhood = (top + bottom + left + right) * 0.25;
  vec3 color = clamp(center.rgb + (center.rgb - neighborhood.rgb) * u_sharpenStrength, 0.0, 1.0);

  color = clamp((color - 0.5) * (1.0 + u_contrastStrength) + 0.5, 0.0, 1.0);

  vec3 exposed = color * u_exposure;
  vec3 tonemapped = exposed / (exposed + vec3(1.0));
  tonemapped = pow(tonemapped, vec3(1.0 / 2.2));
  color = mix(color, tonemapped, u_toneMapStrength);

  gl_FragColor = vec4(color, center.a);
}
`;
