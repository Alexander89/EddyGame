#version 300 es
precision mediump float;

layout(location=0)in vec3 a_pos;
layout(location=1)in vec2 a_uv;

uniform mat4 uNormalMatrix;
uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uCameraMatrix;
uniform vec2 uTexShift;

out highp vec2 texCoord;

void main() {
	texCoord = a_uv+uTexShift;
	gl_Position =  uPMatrix * uCameraMatrix * uMVMatrix * vec4(a_pos.xyz, 1.0);
}