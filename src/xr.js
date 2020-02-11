const {THREE} = window;
  
const canvas2d = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  canvas: canvas2d,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight, false);
// renderer.setClearColor(new THREE.Color(0x000000), 0);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
// renderer.gammaFactor = 1;
renderer.xr.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xCCCCCC);

const camera = new THREE.PerspectiveCamera();
camera.position.y = 1;
camera.position.z = 0.2;
const rect = canvas2d.getBoundingClientRect();
camera.aspect = rect.width/rect.height;
camera.updateProjectionMatrix();

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 2);
directionalLight.position.set(2, 2, 2);
scene.add(directionalLight);
const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 2);
directionalLight2.position.set(0, 1, -1);
scene.add(directionalLight2);
const ambientLight = new THREE.AmbientLight(0x808080);
scene.add(ambientLight);

const cubeMesh = (() => {
  const geometry = new THREE.BoxBufferGeometry(0.2, 0.2, 0.2);
  const material = new THREE.MeshPhongMaterial({
    color: 0x5c6bc0,
  });
  return new THREE.Mesh(geometry, material);
})();
cubeMesh.position.set(0, 1.5, -1);
cubeMesh.frustumCulled = false;
scene.add(cubeMesh);

const card = (() => {
  const object = new THREE.Object3D();
  new THREE.GLTFLoader().load('crad.glb', o => {
    o = o.scene;
    o = o.children[2];
    // o.children = o.children.slice(0, 1);
    // console.log('got object', o);
    /* o.children.forEach(o => {
      // console.log('got o', o);
      o.material = new THREE.MeshPhongMaterial({
        map: o.material.map,
        color: o.material.color,
      });
      // o.material.roughness = 0;
    }); */
    window.o = o;
    object.add(o);
  }, function onProgress() {
    // nothing
  }, err => {
    console.warn(err);
  });
  object.position.set(0, 1, 0);
  return object;
})();
scene.add(card);

renderer.setAnimationLoop(render);
function render() {
  cubeMesh.rotation.x += 0.01;
  cubeMesh.rotation.z += 0.01;
  
  card.rotation.x += 0.05;

  renderer.render(scene, camera);
}

/* const NUM_POSITIONS_CHUNK = 150 * 1024;
const pixelSize = 0.03;

const _makeImageDataGeometry = (width, height, size, matrix, imageDataData) => {
  const halfSize = size / 2;
  const vertices = [
    [-halfSize, halfSize, -halfSize], // 0 left up back
    [halfSize, halfSize, -halfSize], // 1 right up back
    [-halfSize, halfSize, halfSize], // 2 left up front
    [halfSize, halfSize, halfSize], // 3 right up front
    [-halfSize, -halfSize, -halfSize], // 4 left down back
    [halfSize, -halfSize, -halfSize], // 5 right down back
    [-halfSize, -halfSize, halfSize], // 6 left down front
    [halfSize, -halfSize, halfSize], // 7 right down front
  ];
  const getPixelValue = (imageDataData, x, y, pixelData) => {
    const index = (x + y * width) * 4;
    pixelData[0] = imageDataData[index + 0];
    pixelData[1] = imageDataData[index + 1];
    pixelData[2] = imageDataData[index + 2];
    pixelData[3] = imageDataData[index + 3];
  };
  const getPixelVertices = (x, y, left, right, top, bottom) => {
    const result = vertices[2].concat(vertices[6]).concat(vertices[3]) // front
      .concat(vertices[6]).concat(vertices[7]).concat(vertices[3])
      .concat(vertices[1]).concat(vertices[5]).concat(vertices[0]) // back
      .concat(vertices[5]).concat(vertices[4]).concat(vertices[0]);

    if (left) {
      result.push.apply(
        result,
        vertices[0].concat(vertices[4]).concat(vertices[2])
          .concat(vertices[4]).concat(vertices[6]).concat(vertices[2])
      );
    }
    if (right) {
      result.push.apply(
        result,
        vertices[3].concat(vertices[7]).concat(vertices[1])
          .concat(vertices[7]).concat(vertices[5]).concat(vertices[1])
      );
    }
    if (top) {
      result.push.apply(
        result,
        vertices[0].concat(vertices[2]).concat(vertices[1])
          .concat(vertices[2]).concat(vertices[3]).concat(vertices[1])
      );
    }
    if (bottom) {
      result.push.apply(
        result,
        vertices[6].concat(vertices[4]).concat(vertices[7])
          .concat(vertices[4]).concat(vertices[5]).concat(vertices[7])
      );
    }

    const numPositions = result.length / 3;
    const xOffset = (-(width / 2) + x) * size;
    const yOffset = ((height / 2) - y) * size;
    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 3;
      result[baseIndex + 0] += xOffset;
      result[baseIndex + 1] += yOffset;
      result[baseIndex + 2] += size / 2;
    }
    return Float32Array.from(result);
  };
  const isSolidPixel = (x, y) => imageDataData[((x + y * width) * 4) + 3] >= 128;

  const positions = new Float32Array(NUM_POSITIONS_CHUNK);
  const colors = new Float32Array(NUM_POSITIONS_CHUNK);
  let attributeIndex = 0;
  const pixelData = Array(4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      getPixelValue(imageDataData, x, y, pixelData);

      if (pixelData[3] >= 128) {
        const newPositions = getPixelVertices(
          x,
          y,
          !((x - 1) >= 0 && isSolidPixel(x - 1, y)),
          !((x + 1) < width && isSolidPixel(x + 1, y)),
          !((y - 1) >= 0 && isSolidPixel(x, y - 1)),
          !((y + 1) < height && isSolidPixel(x, y + 1))
        );
        positions.set(newPositions, attributeIndex);

        const numNewPositions = newPositions.length / 3;
        const rFactor = pixelData[0] / 255;
        const gFactor = pixelData[1] / 255;
        const bFactor = pixelData[2] / 255;
        for (let i = 0; i < numNewPositions; i++) {
          const baseIndex = i * 3;
          colors[attributeIndex + baseIndex + 0] = rFactor;
          colors[attributeIndex + baseIndex + 1] = gFactor;
          colors[attributeIndex + baseIndex + 2] = bFactor;
        }

        attributeIndex += newPositions.length;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions.buffer, 0, attributeIndex), 3));
  geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(colors.buffer, 0, attributeIndex), 3));

  const numPositions = attributeIndex / 3;
  const dys = new Float32Array(numPositions * 2);
  for (let i = 0; i < numPositions; i++) {
    dys[(i * 2) + 0] = positions[(i * 3) + 0];
    dys[(i * 2) + 1] = positions[(i * 3) + 2];
  }

  geometry.applyMatrix(matrix);

  geometry.addAttribute('dy', new THREE.BufferAttribute(dys, 2));
  geometry.addAttribute('zeroDy', new THREE.BufferAttribute(new Float32Array(dys.length), 2));
  geometry.computeVertexNormals();

  return geometry;
};
const _getImageData = img => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const pixelMaterial = new THREE.MeshPhongMaterial({
  vertexColors: THREE.FaceColors,
  shininess: 0,
});

const makeSpriteMesh = img => {
  const imageData = _getImageData(img);
  const {data: imageDataData} = imageData;
  const geometry = _makeImageDataGeometry(img.width, img.height, pixelSize, new THREE.Matrix4(), imageDataData);
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, (pixelSize / 2) - (pixelSize * 0.15), 0));
  const material = pixelMaterial;

  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}; */

export function xrEnter() {
  let currentSession = null;

  function onSessionStarted( session ) {
    session.addEventListener( 'end', onSessionEnded);
    renderer.xr.setSession(session);
    currentSession = session;
  }

  function onSessionEnded(/*event*/) {
    currentSession.removeEventListener('end', onSessionEnded);
    currentSession = null;
  }
  
  const sessionInit = {optionalFeatures: ['local-floor', 'bounded-floor']};
  navigator.xr.requestSession('immersive-vr', sessionInit ).then( onSessionStarted);
};