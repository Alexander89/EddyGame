#version 300 es
precision mediump float; 

layout(location=0)in vec2 a_pos;
layout(location=1)in vec2 a_uv;

out highp vec2 texCoord;

void main() {
	texCoord = a_uv;
	gl_Position =  vec4(a_pos.x, a_pos.y, 1.0, 1.0);
}