#version 300 es
precision mediump float; 
#define maxLights 25

in highp vec2 o_texCoord;
in vec3 o_normal;
in vec3 o_normalT;
in vec3 o_normalBT;
in vec3 o_pos;
in vec4 o_shadowPos[5];

uniform sampler2D uMainTex;
uniform sampler2D uSpecTex;
uniform sampler2D uNormalTex;
uniform sampler2D uAmbiantTex;
uniform sampler2D uBumpTex;

uniform sampler2D uShadowTex0;
uniform sampler2D uShadowTex1;
uniform sampler2D uShadowTex2;
uniform sampler2D uShadowTex3;
uniform sampler2D uShadowTex4;

uniform vec3 uEyePos;
uniform int uUsingLightCount;

struct LightData {
	vec3 lightpos;        // 0   16   0
	vec3 lightcolor;      // 16  16   4
	vec3 speccolor;       // 32  16   8
	vec3 direction;       // 48  16  12
	int type;             // 60   4  15
  
	float intens;         // 64   4  16
	float specIntens;     // 68   4  17
	float specularPow;    // 72   4  18
	float falloffLinear;  // 80   4  19
  
	float falloffQaud;    // 84   4  20
	float innerCone;      // 88   4  21
	float outerCone;      // 92   4  22
	float maxDist;        // 96   4  23

	int on;               // 100  4  24
	int shadowMapID;      // 104  4  25
	int shadowSize;       // 108  4  26
	int shadowSmooth;      // 112  4  27
};

layout(std140) uniform uLights {
	LightData lights[maxLights]; 
} Lights;

out vec4 finalColor; 

/************************************************** SHADOW *************************************************/
float decodeFloat (vec4 color) {
	const vec4 bitShift = vec4(
		1.0 / (256.0 * 256.0 * 256.0),
		1.0 / (256.0 * 256.0),
		1.0 / 256.0,
		1
	);
	return dot(color, bitShift);
}
float calcAmountInSoft1LightHelper( in vec3 fragmentDepth, in sampler2D tex, in int size ) {
	float texelSize = 1.0 / float(size);
	float amountInLight = 0.0;
	for (int x = -1; x <= 1; x++) {
		for (int y = -1; y <= 1; y++) {
			if (fragmentDepth.z < decodeFloat( texture( tex, fragmentDepth.xy + (vec2(x, y) * texelSize) ) ) ) 
				amountInLight += 0.11111112;				
		}
	}
	return amountInLight;
}
float calcAmountInSoft2LightHelper( in vec3 fragmentDepth, in sampler2D tex, in int size ) {
	float texelSize = 1.0 / float(size);
	float amountInLight = 0.0;
	for (int x = -2; x <= 2; x++) {
		for (int y = -2; y <= 2; y++) {
			if (fragmentDepth.z < decodeFloat( texture( tex, fragmentDepth.xy + (vec2(x, y) * texelSize) ))) 
				amountInLight += 0.04;				
		}
	}
	return amountInLight;
}
float calcSimpleAmountInLightHelper( in vec3 fragmentDepth, in sampler2D tex ){
	if (fragmentDepth.z < decodeFloat( texture( tex, fragmentDepth.xy ))) 
		return 1.0;
	return 0.0;
}
float calcAmountInLight( in vec3 fragmentDepth, in int id, in int shadowSmooth, in int size ) {
	if ( shadowSmooth == 0 ) {
		switch ( id ) {
			case 0: return calcSimpleAmountInLightHelper(fragmentDepth, uShadowTex0);
			case 1: return calcSimpleAmountInLightHelper(fragmentDepth, uShadowTex1);
			case 2: return calcSimpleAmountInLightHelper(fragmentDepth, uShadowTex2);
			case 3: return calcSimpleAmountInLightHelper(fragmentDepth, uShadowTex3);
			case 4: return calcSimpleAmountInLightHelper(fragmentDepth, uShadowTex4);
		}
	}
	if ( shadowSmooth == 1 ) {
		switch ( id ) {
			case 0: return calcAmountInSoft1LightHelper(fragmentDepth, uShadowTex0, size);
			case 1: return calcAmountInSoft1LightHelper(fragmentDepth, uShadowTex1, size);
			case 2: return calcAmountInSoft1LightHelper(fragmentDepth, uShadowTex2, size);
			case 3: return calcAmountInSoft1LightHelper(fragmentDepth, uShadowTex3, size);
			case 4: return calcAmountInSoft1LightHelper(fragmentDepth, uShadowTex4, size);
		}
	}
	if ( shadowSmooth == 2 ) {
		switch ( id ) {
			case 0: return calcAmountInSoft2LightHelper(fragmentDepth, uShadowTex0, size);
			case 1: return calcAmountInSoft2LightHelper(fragmentDepth, uShadowTex1, size);
			case 2: return calcAmountInSoft2LightHelper(fragmentDepth, uShadowTex2, size);
			case 3: return calcAmountInSoft2LightHelper(fragmentDepth, uShadowTex3, size);
			case 4: return calcAmountInSoft2LightHelper(fragmentDepth, uShadowTex4, size);
		}
	}
}
/************************************************** LIGHT *************************************************/
vec3 calcSpecLight( in LightData light, in vec3 norm, in vec3 halfwayDir ) {
	float value = pow(max(dot(norm, halfwayDir), 0.0), light.specularPow);
	return light.speccolor * value * light.specIntens;
}
vec3 calcLight( LightData light, vec3 norm, vec3 pos ) {
	if ( light.on == 0 )
		return vec3(0.0);
	// AmbientLight
	if ( light.type == 0 ) 
		return (light.lightcolor * light.intens);

	float amountInLight = 1.0;
	
	if ( light.shadowMapID >= 0 ) {
		vec3 fragmentDepth = o_shadowPos[light.shadowMapID].xyz;
		float shadowAcneRemover = 0.0001; //0.0001
		fragmentDepth.z -= shadowAcneRemover;
		amountInLight = calcAmountInLight( fragmentDepth, light.shadowMapID, light.shadowSmooth, light.shadowSize );		
		if (amountInLight == 0.0)
			return vec3(0.0);
	}

	vec3 difuseLight = vec3(0.0);
	vec3 specLight = vec3(0.0);

	vec3 viewDir = normalize(pos-uEyePos);			// can be done for Vertex once

	// do not have Distance attenuation
	// DirectionalLight
	if ( light.type == 1 ) { 
		vec3 lightDir = normalize(light.direction);
		vec3 halfwayDir = normalize(lightDir + viewDir);	// can be done for Vertex once  

		float angle = max(dot(norm, lightDir ),0.0);
		difuseLight = light.lightcolor * angle * light.intens;
		specLight = calcSpecLight( light, norm, halfwayDir );
	}
	// the rest is using attenuation
	else { 
		vec3 lightDir = normalize(pos - light.lightpos);	// can be done for Vertex once
		vec3 halfwayDir = normalize(lightDir + viewDir);	// can be done for Vertex once  
		float dist = distance( light.lightpos, pos );
		// light to far away
		if ( dist > light.maxDist )	
			return vec3(0.0);

		// PointLight
		if ( light.type == 2 ) {
			float angle = max( dot( norm, lightDir ), 0.0);
			difuseLight = light.lightcolor * angle * light.intens;
		}
		// SpotLight
		else if ( light.type == 3 ) {
			float spotAngle = max(dot( light.direction, lightDir ),0.0);
			// out of the lightcone?
			if ( spotAngle < light.outerCone )
				return vec3(0.0);

			spotAngle = pow( min(spotAngle * (1.0 + light.innerCone), 1.0), light.specularPow);
			float faceAngle = max(dot( norm, lightDir ),0.0);
			difuseLight = light.lightcolor * faceAngle * spotAngle * light.intens;
		}
		else if ( light.type == 99 ) { // temp um optim zu unterdrücken
			vec4 textureColor = texture(uAmbiantTex, o_texCoord)+texture(uBumpTex, o_texCoord);
			if(textureColor.x > 1.0)
				return vec3(1.0);
		}
		// calc Specular light
		specLight = calcSpecLight( light, norm, halfwayDir );

		// calc attenuation		
		float attenuation = 1.0 / (1.0 + light.falloffLinear * dist + light.falloffQaud * dist * dist);

		// calc final result
		difuseLight *= attenuation;
		specLight *= attenuation;
	}

	return clamp( (difuseLight + specLight)*amountInLight, 0., 1.);
}

/************************************************** NormalMap **********************************************/
vec3 applyNormalMap() {
	vec3 normal = -normalize(o_normal);
	//vec3 tangent = -normalize(o_normalT);
	//vec3 betangent = -normalize(o_normalBT);
	//mat3 normMat = mat3(betangent, tangent, normal);
	//	
	//normal = -normalize(normMat * (texture(uNormalTex, o_texCoord).rgb * 1.0 - 0.5) );
	return normal;
}
/************************************************** MAIN   *************************************************/
void main() {
	// texture
	vec4 textureColor = texture(uMainTex, o_texCoord);

	vec3 normal = applyNormalMap();
	//mat3 normMat = mat3(o_normalBT, o_normalT, o_normal);	
	//vec3 normal = -normalize(normMat * (texture(uNormalTex, o_texCoord).rgb * 1.0 - 0.5) );


	vec3 lightValue = vec3(0.0);
	for ( int i = 0; i < uUsingLightCount; i++ ) 
		lightValue += calcLight(Lights.lights[i], normal, o_pos );

	finalColor = textureColor * vec4(lightValue, 1.0);
}