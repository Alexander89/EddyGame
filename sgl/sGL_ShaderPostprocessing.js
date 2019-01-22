"use strict";


class ShaderPostProcess {
	constructor(width, height, filterSrc) {
		this.rendertarget = ShaderPostProcess.createRenderTarget() ;

		if ( filterSrc ) {
			this.fs = filterSrc;
			this.initShader();
		}
	}

	initShader() {
		this.program = Shader.createShaderProg( gl, ,g_backbone.res(fsSrc) );
		this.name = "Default PostProcess";
		if (this.program === null) 
			return ;

		gl.useProgram(this.program);
		this.attribLoc = Shader.getStandartAttribLocations(gl, this.program);
		
		// create Output FBO
		/*this.uboLight = gl.createBuffer();

		gl.bindBuffer( gl.UNIFORM_BUFFER, this.uboLight );
		gl.bufferData( gl.UNIFORM_BUFFER, this.lightArraySize * this.maxLights, gl.DYNAMIC_DRAW );
		gl.bindBuffer( gl.UNIFORM_BUFFER, null);*/
	}

	render() {
		gl.useProgram(this.program);

		this.setUniforms();
	}

	static createRenderTarget() {
		var modal = Primitives.Quad.createModel( gl, 1.0 );
		modal.name = "PostProcess RenderTarget";
		modal.noCulling = false;
		modal.doBlending = false;
		modal.render = function( gl, shader ) {
			gl.bindVertexArray(this.mesh.vao);
			gl.drawElements( this.mesh.drawMode, this.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
			gl.bindVertexArray(null);
			return this;
		}
		return modal;
	}
}


const ShaderPostProcess.PostProcessVS = `#version 300 es
precision mediump float; 
layout(location=0)in vec3 a_pos;
layout(location=1)in vec2 a_uv;
out highp vec2 o_texCoord;
out vec3 o_pos;

void main() {
	o_texCoord = a_uv;
	o_pos = vec4(a_pos.xyz, 1.0);
	gl_Position = o_pos;
}`;