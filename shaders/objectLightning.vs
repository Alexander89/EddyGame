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

out highp vec2 o_texCoord;
out vec3 o_normal;
out vec3 o_normalT;
out vec3 o_normalBT;
out vec3 o_pos;
out vec4 o_shadowPos[5];

// shadow stuff:
const mat4 texUnitConverter = mat4(0.5, 0.0, 0.0, 0.0,   0.0, 0.5, 0.0, 0.0,   0.0, 0.0, 0.5, 0.0,   0.5, 0.5, 0.5, 1.0);
uniform mat4 uLightPMatrix[5];
uniform mat4 uLightCameraMatrix[5];


void main() {
	o_texCoord = a_uv;

	mat3 normalMatrix = transpose(inverse(mat3(uMVMatrix)));
	o_normal = normalMatrix * a_norm;
	vec3 Tangent = normalMatrix * a_normT;
	Tangent = normalize(Tangent - dot(Tangent, o_normal) * o_normal);
	o_normalT = Tangent;
	o_normalBT = cross(Tangent, o_normal);

	vec4 pos = uMVMatrix * vec4(a_pos.xyz, 1.0);
	o_pos = pos.xyz;
	gl_Position = uPMatrix * uCameraMatrix * pos;
	//gl_Position = uLightPMatrix[1] * uLightCameraMatrix[1] * pos;

	for( int i = 0; i <= 5; ++i) {
		o_shadowPos[i] = texUnitConverter*uLightPMatrix[i] * uLightCameraMatrix[i] * pos;
		o_shadowPos[i] = o_shadowPos[i] / o_shadowPos[i].w;
	}
	
}