#version 300 es
precision mediump float; 

layout(location=0)in vec3 a_pos;
layout(location=1)in vec2 a_uv;
layout(location=2)in vec3 a_norm;
layout(location=3)in vec3 a_normT;

uniform mat4 uNormalMatrix;
uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uCameraMatrix;


out Vertex
{
	mat4 mvp;
	vec3 normal;
	vec3 normalT;
	vec3 normalBT;
} vertex;


void main() {
	mat3 normalMatrix = transpose(inverse(mat3(uMVMatrix)));
	normal = normalMatrix * a_norm;
	vec3 Tangent = normalMatrix * a_normT;
	Tangent = normalize(Tangent - dot(Tangent, normal) * normal);
	normalT = Tangent;
	normalBT = cross(Tangent, normal);

	mvp = uPMatrix * uCameraMatrix * uMVMatrix;
	gl_Position =  mvp * vec4(a_pos.xyz, 1.0);
}