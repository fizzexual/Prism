export const fixturePage = {
  id: 'pg',
  name: 'Home',
  canvas: { background: '#ffffff' },
  elements: [
    {
      id: 'h1',
      type: 'heading',
      name: 'Heading',
      zIndex: 0,
      rect: { x: 40, y: 40, width: 400, height: 50, rotation: 0 },
      responsive: { mobile: { x: 10, width: 300, style: { font: { size: 24 } } } },
      style: { color: '#111827', font: { size: 32, weight: 700 } },
      content: { text: 'Welcome' },
    },
    {
      id: 'btn',
      type: 'button',
      name: 'Button',
      zIndex: 1,
      rect: { x: 40, y: 120, width: 160, height: 44, rotation: 0 },
      responsive: {},
      style: { background: '#4f46e5', color: '#ffffff', radius: 8 },
      content: { text: 'Go', href: '#' },
    },
    {
      id: 'cube',
      type: '3d',
      name: '3D Object',
      zIndex: 2,
      rect: { x: 40, y: 200, width: 360, height: 300, rotation: 0 },
      responsive: {},
      style: { radius: 8 },
      content: {},
      three: {
        model: { url: null, format: null },
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
        material: { enabled: false, color: '#9aa6ff', metalness: 0.1, roughness: 0.6, wireframe: false, opacity: 1 },
        lights: [
          { type: 'ambient', intensity: 0.6, color: '#ffffff' },
          { type: 'directional', intensity: 1, color: '#ffffff', position: [5, 6, 4] },
        ],
        environment: 'city',
        camera: { fov: 50, autoRotate: false, orbit: true, position: [3, 2, 4] },
        background: null,
      },
    },
  ],
};

export const fixtureProject = { id: 'p', name: 'Fixture Site', pages: [fixturePage] };
