#version 300 es
precision mediump float; 

in highp vec2 texCoord;

// UI Object Type
uniform int uType;

// 0 pannel
uniform vec4 uBgColor;

// 1 Image
uniform sampler2D uImage;

out vec4 finalColor; 

float decodeFloat (vec4 color) {
	const vec4 bitShift = vec4(
		1.0 / (256.0 * 256.0 * 256.0),
		1.0 / (256.0 * 256.0),
		1.0 / 256.0,
		1
	);
	return dot(color, bitShift);
}
float decodeFloat2(vec4 color) {
	const vec4 bitShift = vec4(
		0.0,
		0.0,
		0.0,
		1
	);
	return dot(color, bitShift);
}

void main() {
	if ( uType == 0 )
		finalColor = uBgColor;

	else if ( uType == 1 ){
		//vec4 color = texture(uImage, texCoord);
		//float texelDepth = decodeFloat2(color);
		//finalColor = vec4( texelDepth, texelDepth, texelDepth, 1.0);
		finalColor = texture(uImage, texCoord);
	}

	else
		finalColor = vec4(1.0, 0.0, 0.0, 1.0);
}