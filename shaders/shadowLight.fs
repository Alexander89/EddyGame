#version 300 es
precision mediump float; 

// Ouput data
layout(location = 0) out vec4 fragmentdepth;

vec4 encodeFloat (float depth) {
  const vec4 bitShift = vec4(
    256 * 256 * 256,
    256 * 256,
    256,
    1.0
  );
  const vec4 bitMask = vec4(
    0,
    1.0 / 256.0,
    1.0 / 256.0,
    1.0 / 256.0
  );
  vec4 comp = fract(depth * bitShift);
  comp -= comp.xxyz * bitMask;
  return comp;
}

void main (void) {
  fragmentdepth = encodeFloat(gl_FragCoord.z);
}