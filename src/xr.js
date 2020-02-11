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
// renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
// renderer.gammaFactor = 1;
renderer.xr.enabled = true;

const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xCCCCCC);

const camera = new THREE.PerspectiveCamera();
camera.position.y = 1;
camera.position.z = 0.2;
camera.near = 0.01;
camera.far = 100;
const rect = canvas2d.getBoundingClientRect();
camera.aspect = rect.width/rect.height;
camera.updateProjectionMatrix();

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 3);
directionalLight.position.set(2, 2, 2);
scene.add(directionalLight);
const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 3);
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
  
  Promise.all([
    /* fetch('DejaVu-sdf.json').then(res => res.json()),
    new Promise((accept, reject) => {
      new THREE.TextureLoader().load('DejaVu-sdf.png', accept);
    }), */
    new Promise((accept, reject) => {
      new THREE.GLTFLoader().load('crad.glb', o => {
        o = o.scene;
        o = o.children[2];
        o.children[1].material = new THREE.MeshPhongMaterial({
          color: 0x771111,
        });
        accept(o);
      }, function onProgress() {
        // nothing
      }, reject);
    }),
  ]).then(([
    // fontJson,
    // fontTexture,
    o,
  ]) => {
    // console.log('got', fontJson, fontTexture, o);
    const w = 0.0856 * 0.8;
    const _makeTextMesh = (s = '') => {
      const geometry = new THREE.PlaneBufferGeometry(w, w/10);
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 2048/10;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = "rgba(255, 255, 255, 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#FFF";
      ctx.textAlign = "start";
      ctx.textBaseline = "top";
      ctx.font = "80px Consolas";
      ctx.fillText(s, 0, 0);
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.5,
      });
      const mesh = new THREE.Mesh(geometry, material);
      return mesh;
    };
    const textMesh = _makeTextMesh('Avaer');
    textMesh.frustumCulled = false;
    textMesh.position.y = -0.02;
    textMesh.position.z = 0.001;
    // window.textMesh = textMesh;
    object.add(textMesh);

    const chipMesh = (() => {
      const geometry = new THREE.PlaneBufferGeometry(0.01, 0.01);
      const img = new Image();
      img.src = 'chip.png';
      img.onload = () => {
        texture.needsUpdate = true;
      };
      const texture = new THREE.Texture(img);
      /* texture.needsUpdate = true;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter; */
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.5,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = -w/2 + 0.01/2;
      // mesh.position.y = -0.01;
      mesh.position.z = 0.001;
      return mesh;
    })();
    object.add(chipMesh);

    object.add(o);
  });
    
  object.position.set(0, 1, 0);
  return object;
})();
scene.add(card);

const NUM_POSITIONS_CHUNK = 150 * 1024;
const pixelSize = 0.007;

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
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, (pixelSize / 2), 0));
  const material = pixelMaterial;

  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
};

const makeBlockMesh = (() => {
  const targetGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries([
    new THREE.BoxBufferGeometry(0.03, 0.2, 0.03)
      .applyMatrix(new THREE.Matrix4().makeTranslation(0, -0.1, 0)),
    new THREE.BoxBufferGeometry(0.03, 0.2, 0.03)
      .applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1))))
      .applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, 0.1)),
    new THREE.BoxBufferGeometry(0.03, 0.2, 0.03)
      .applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0))))
      .applyMatrix(new THREE.Matrix4().makeTranslation(0.1, 0, 0)),
  ]);
  const geometry = THREE.BufferGeometryUtils.mergeBufferGeometries([
    targetGeometry.clone()
      .applyMatrix(new THREE.Matrix4().makeTranslation(-0.5, 0.5, -0.5)),
    targetGeometry.clone()
      .applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, -1, 0))))
      .applyMatrix(new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5)),
    targetGeometry.clone()
      .applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))))
      .applyMatrix(new THREE.Matrix4().makeTranslation(-0.5, 0.5, 0.5)),
    targetGeometry.clone()
      .applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0))))
      .applyMatrix(new THREE.Matrix4().makeTranslation(0.5, 0.5, -0.5)),
    targetGeometry.clone()
      .applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0))))
      .applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))))
      .applyMatrix(new THREE.Matrix4().makeTranslation(0.5, 0.5, 0.5)),
    targetGeometry.clone()
      .applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))))
      .applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, -1, 0))))
      .applyMatrix(new THREE.Matrix4().makeTranslation(-0.5, -0.5, 0.5)),
    targetGeometry.clone()
      .applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0))))
      .applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, 0))))
      .applyMatrix(new THREE.Matrix4().makeTranslation(0.5, -0.5, -0.5)),
    targetGeometry.clone()
      .applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-1, 1, 0).normalize(), new THREE.Vector3(1, -1, 0).normalize())))
      .applyMatrix(new THREE.Matrix4().makeTranslation(0.5, -0.5, 0.5)),
  ]).applyMatrix(new THREE.Matrix4().makeScale(0.1, 0.1, 0.1));
  const targetVsh = `
    varying vec2 vUv;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
  `;
  const targetFsh = `
    uniform float uSelected;
    uniform float uTime;
    void main() {
      if (uSelected > 0.0) {
        gl_FragColor = vec4(${new THREE.Color(0x4fc3f7).toArray().map(n => n.toFixed(8)).join(', ')}, 1.0);
      } else {
        gl_FragColor = vec4(vec3(1.0 - min(pow(uTime, 0.5), 0.9)), 1.0);
      }
    }
  `;
  return () => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uSelected: {
          type: 'f',
          value: 0,
        },
        uTime: {
          type: 'f',
          value: 0,
        },
      },
      vertexShader: targetVsh,
      fragmentShader: targetFsh,
      // transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    // mesh.visible = false;
    return mesh;
  };
})();

let itemBlockMeshes = [];
const itemMeshes = Promise.all([
  'Armor_03.png',
  'Food_37.png',
].map((name, i) => {
  return new Promise((accept, reject) => {
    const img = new Image();
    img.src = 'icons/' + name;
    img.onload = () => {
      const blockMesh = makeBlockMesh();
      const itemMesh = makeSpriteMesh(img);
      blockMesh.add(itemMesh);
      blockMesh.position.x = i * 0.1;
      blockMesh.position.y = 1;
      blockMesh.position.z = -0.05;
      blockMesh.box = new THREE.Box3(
        blockMesh.position.clone().sub(new THREE.Vector3(0.1/2, 0.1/2, 0.1/2)),
        blockMesh.position.clone().add(new THREE.Vector3(0.1/2, 0.1/2, 0.1/2))
      );
      accept(blockMesh);
    };
    img.onerror = reject;
  });
})).then(newItemBlockMeshes => {
  itemBlockMeshes = newItemBlockMeshes;
  itemBlockMeshes.forEach(itemBlockMesh => {
    scene.add(itemBlockMesh);
  });
});

const lineMesh = (() => {
  const geometries = (() => {
    const result = [];
    for (let i = 0; i < 200; i += 3) {
      result.push(new THREE.BoxBufferGeometry(0.005, 0.005, 0.005).applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, 0.5 - 0.005 * i)));
    }
    return result;
  })();
  const geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
  const targetVsh = `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
  `;
  const targetFsh = `
    uniform float uTime;
    void main() {
      gl_FragColor = vec4(${new THREE.Color(0x4fc3f7).toArray().map(n => n.toFixed(8)).join(', ')}, 1.0);
    }
  `;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: {
        type: 'f',
        value: 0,
      },
    },
    vertexShader: targetVsh,
    fragmentShader: targetFsh,
    side: THREE.DoubleSide,
    // transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.setEndpoints = (start, end) => {
    mesh.position.copy(start).add(end).divideScalar(2);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      end.clone().sub(start).normalize()
    );
    const s = start.distanceTo(end)*2;
    mesh.scale.set(s, s, s);
  };
  return mesh;
})();
lineMesh.setEndpoints(new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(0.5, 2, 0));
scene.add(lineMesh);

const _makeControllerMesh = () => {
  const geometry = new THREE.CylinderBufferGeometry(0.005, 0.005, 1)
    .applyMatrix(new THREE.Matrix4().makeTranslation(0, 1/2, 0))
    .applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)));
  const material = new THREE.MeshBasicMaterial({
    color: 0x0000FF,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
};
const controllerMeshes = [
  _makeControllerMesh(),
  _makeControllerMesh(),
];
for (let i = 0; i < controllerMeshes.length; i++) {
  const controllerMesh = controllerMeshes[i];
  const grip = renderer.xr.getController(i);
  // const gripPoint = gripPoints[i];
  grip.addEventListener('selectstart', () => {
    console.log('grip position start', grip.posiiton.toArray());
  });
  grip.addEventListener('selectend', () => {
    console.log('grip position end', grip.posiiton.toArray());
  });
  grip.add(controllerMesh);
  scene.add(grip);
}

const controls = new THREE.OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
// controls.dampingFactor = 0.05;
// controls.screenSpacePanning = false;
// controls.minDistance = 100;
// controls.maxDistance = 500;
// controls.maxPolarAngle = Math.PI / 2;
controls.target.set(0, 1, 0);
controls.update();

renderer.setAnimationLoop(render);
function render() {
  cubeMesh.rotation.x += 0.01;
  cubeMesh.rotation.z += 0.01;
  
  // card.rotation.x += 0.05;

  itemBlockMeshes.forEach((itemBlockMesh, i) => {
    itemBlockMesh.material.uniforms.uSelected.value = (i > 0) ? 1 : 0;
    itemBlockMesh.material.uniforms.uTime.value = (Date.now() % 1000) / 1000;
  });

  renderer.render(scene, camera);
}

{
  const iframe = document.createElement('iframe');
  iframe.src = 'https://render.exokit.xyz/';
  // iframe.src = './exokit-render/index.html';
  iframe.onload = () => {
    const uiIframe = iframe;
    let renderIds = 0;

    const uiSize = 1024;
    const mc = new MessageChannel();
    mc.port1.onmessage = e => {
      const {data} = e;
      const {error, result} = data;

      if (result) {
        console.log('got render', result);

        const uiCanvas = document.createElement('canvas');
        uiCanvas.width = uiSize;
        uiCanvas.height = uiSize;
        const ctx = uiCanvas.getContext('2d');
        ctx.putImageData(new ImageData(new Uint8ClampedArray(result.data.buffer, result.data.byteOffset, result.data.byteLength), uiSize, uiSize), 0, 0);
        const uiMesh = (() => {
          const geometry = new THREE.PlaneBufferGeometry(1, 1);
          const texture = new THREE.Texture(uiCanvas);
          texture.needsUpdate = true;
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.frustumCulled = false;
          return mesh;
        })();
        uiMesh.position.y = 1;
        uiMesh.position.z = -0.5;
        scene.add(uiMesh);
      } else {
        console.warn(error);
      }
    };

    uiIframe.contentWindow.postMessage({
      method: 'render',
      id: ++renderIds,
      htmlString: `<div style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; background-color: #F30;"><h1>Lol</h1></div>`,
      templateData: {},
      width: uiSize,
      height: uiSize,
      port: mc.port2,
    }, '*', [mc.port2]);
  };
  iframe.onerror = err => {
    console.warn(err);
  };
  iframe.style.position = 'absolute';
  iframe.style.top = '-4096px';
  iframe.style.left = '-4096px';
  document.body.appendChild(iframe);
}

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