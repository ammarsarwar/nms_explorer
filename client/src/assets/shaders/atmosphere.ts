// Vertex shader for atmosphere effect
const atmosphereVertex = `
// Atmospheric scattering vertex shader
// Based on "GPU Gems 2" chapter 16

uniform vec3 lightPosition;
uniform vec3 planetPosition;
uniform float atmosphereRadius;
uniform float planetRadius;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLightDirection;
varying vec3 vEyeDirection;
varying float vLightIntensity;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  
  // Calculate light direction
  vLightDirection = normalize(lightPosition - vPosition);
  
  // Calculate eye direction
  vEyeDirection = normalize(cameraPosition - vPosition);
  
  // Calculate basic light intensity
  vLightIntensity = max(0.0, dot(vNormal, vLightDirection));
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment shader for atmosphere effect
const atmosphereFragment = `
uniform vec3 atmosphereColor;
uniform float atmosphereDensity;
uniform float atmosphereStrength;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLightDirection;
varying vec3 vEyeDirection;
varying float vLightIntensity;

void main() {
  // Calculate atmosphere effect based on viewing angle
  float viewAngle = 1.0 - max(0.0, dot(vNormal, vEyeDirection));
  
  // Fresnel-like effect for atmosphere edge
  float fresnel = pow(viewAngle, 2.0) * atmosphereStrength;
  
  // Calculate scattering effect - stronger at the edges (limb darkening)
  float scattering = fresnel * atmosphereDensity;
  
  // Add light influence
  float lightInfluence = pow(max(0.0, dot(vEyeDirection, vLightDirection)), 0.5);
  
  // Combine effects
  vec3 finalColor = atmosphereColor * (scattering + lightInfluence * 0.2);
  
  // Apply opacity based on atmosphere density
  float alpha = clamp(scattering * 2.0, 0.0, 1.0);
  
  gl_FragColor = vec4(finalColor, alpha);
}
`;

export { atmosphereVertex, atmosphereFragment };
export default atmosphereVertex;
