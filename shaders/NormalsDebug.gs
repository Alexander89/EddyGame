#version 300 es
precision mediump float; 

layout(triangles) in;

// 9 lines will be generated: 18 vertices
layout(line_strip, max_vertices=18) out;

#define Normal_Length = 0.1;


in Vertex
{
	in mat4 mvp;
	vec3 normal;
	vec3 normalT;
	vec3 normalBT;
} vertex[];

out vec4 color;

void main() {

	for ( int i = 0; i < 3; ++i ) {
		vec3 P  = gl_in[i].gl_Position;
		vec3 N  = vertex[i].normal;
		vec3 T  = vertex[i].normalT;
		vec3 BT = vertex[i].normalBT;


		// Normal
		gl_Position = vertex[i].mvp * vec4(P, 1.0);
		color = vec4( 1.0, 0.0, 0.0, 1.0);
		EmitVertex();
		gl_Position = vertex[i].mvp * vec4(P + N * Normal_Length, 1.0);
		color = vec4( 1.0, 0.0, 0.0, 1.0);
		EmitVertex();

		EndPrimitive();


		//Tangent
		gl_Position = vertex[i].mvp * vec4(P, 1.0);
		color = vec4( 0.0, 1.0, 0.0, 1.0);
		EmitVertex();

		gl_Position = vertex[i].mvp * vec4(P + T * Normal_Length, 1.0);
		color = vec4( 0.0, 1.0, 0.0, 1.0);
		EmitVertex();

		EndPrimitive();


		// ByTangent
		gl_Position = vertex[i].mvp * vec4(P, 1.0);
		color = vec4( 0.0, 0.0, 1.0, 1.0);
		EmitVertex();

		gl_Position = vertex[i].mvp * vec4(P + BT * Normal_Length, 1.0);
		color = vec4( 0.0, 0.0, 1.0, 1.0);
		EmitVertex();

		EndPrimitive();
	}

}