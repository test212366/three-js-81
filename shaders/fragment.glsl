uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
float PI = 3.1415926;
void main() {
	float border = 0.05;
	float radius = 0.5;
	vec4 color0 = vec4(0., 0.,0.,0.);
	vec4 color1 = vec4(1., 1., 1., 1.);

	vec2 m = vPosition.xy;
	float dist = radius - sqrt(m.x * m.x + m.y * m.y);

	float t = 0.;

	if(dist > border) 
		t = 1.0;
	 else if(dist > 0.) 
		t = dist/border;
	

	gl_FragColor = mix(color0, color1, t);
}