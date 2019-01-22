#version 300 es
precision mediump float; 

in highp vec2 texCoord;
in vec3 normal;
in vec3 normalT;
in vec3 normalBT;

uniform sampler2D uMainTex;
uniform sampler2D uSpecTex;
uniform sampler2D uNormalTex;
uniform sampler2D uAmbiantTex;

out vec4 finalColor; 
void main() {
	// texture
	vec4 textureColor = texture(uMainTex, texCoord);

	mat3 normMat = mat3(normalBT, normalT, normal);	
	vec3 Normal = normalize(normMat * (texture(uNormalTex, texCoord).rgb * 2.0 - 1.0) );

	// ambiente Light
	vec3 aL_amitionLight = vec3(1.0,0.8,0.8);
	aL_amitionLight = aL_amitionLight * 0.25;
	vec4 aL = vec4( aL_amitionLight, 1.0 );

	// directionnal Light
	vec3 dL_Color = vec3(1.0, 1.0, 1.0);
	vec3 dL_direction = normalize(vec3(1.0,-0.4,0.5));
	float directionlight = max(dot( -Normal,dL_direction ),0.0);
	vec4 dL = vec4( dL_Color * directionlight * 1.6, 1.0 );

	finalColor = textureColor * (dL + aL);			
}