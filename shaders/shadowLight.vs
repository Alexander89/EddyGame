#version 300 es
precision mediump float;

// InputData from mesh
layout(location=0)in vec3 a_pos;

// Translation Matrix
uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uCameraMatrix;

void main(){
	gl_Position = uPMatrix * uCameraMatrix * uMVMatrix * vec4(a_pos,1.0);
}