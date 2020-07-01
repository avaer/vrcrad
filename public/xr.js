import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';
import {TextMesh} from './textmesh-standalone.esm.js'
import {makeCredentials, executeTransaction, executeScript} from 'https://flow.webaverse.com/flow.js';

const _makeTextMesh = (text, fontSize, color, anchorX, anchorY) => {
  const textMesh = new TextMesh();
  textMesh.text = text;
  textMesh.font = './GeosansLight.ttf';
  textMesh.fontSize = fontSize;
  // textMesh.position.set(0, 1, -2);
  textMesh.color = color;
  textMesh.anchorX = anchorX;
  textMesh.anchorY = anchorY;
  textMesh.frustumCulled = false;
  textMesh.sync();
  return textMesh;
};

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setClearColor(new THREE.Color(0x000000), 0);
// renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
// renderer.gammaFactor = 1;
renderer.xr.enabled = true;

const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xCCCCCC);

const camera = new THREE.PerspectiveCamera();

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 3);
directionalLight.position.set(2, 2, 2);
scene.add(directionalLight);
const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 3);
directionalLight2.position.set(0, 1, -1);
scene.add(directionalLight2);
const ambientLight = new THREE.AmbientLight(0x808080);
scene.add(ambientLight);

const card = (() => {
  const object = new THREE.Object3D();
  
  Promise.all([
    /* fetch('DejaVu-sdf.json').then(res => res.json()),
    new Promise((accept, reject) => {
      new THREE.TextureLoader().load('DejaVu-sdf.png', accept);
    }), */
    new Promise((accept, reject) => {
      new GLTFLoader().load('crad.glb', o => {
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

    const textMesh = _makeTextMesh('Avaer Kazmer', 0.007, 0xFFFFFF, 'left', 'bottom-baseline');
    textMesh.position.x = -w/2;
    textMesh.position.y = -0.02;
    textMesh.position.z = 0.001;
    scene.add(textMesh);

    const creditTextMesh = _makeTextMesh('2 CRD', 0.015, 0xFFFFFF, 'right', 'middle');
    creditTextMesh.position.x = w/2;
    creditTextMesh.position.z = 0.001;
    scene.add(creditTextMesh);
    object.creditTextMesh = creditTextMesh;

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
    
  // object.position.set(0, 1, 0);
  return object;
})();
scene.add(card);

const raycaster = new THREE.Raycaster();
let lastClicked = false;
renderer.setAnimationLoop(render);
function render(timestamp, frame) {
  if (dialog) {
    dialog.okButton.material.color.setHex(0xef5350);
    dialog.cancelButton.material.color.setHex(0xef5350);

    let clicked = false;

    if (currentSession && frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const inputSources = Array.from(currentSession.inputSources);
      const inputSource = inputSources.find(inputSource => inputSource.handedness === 'right');
      if (inputSource) {
        let pose, gamepad;
        if ((pose = frame.getPose(inputSource.targetRaySpace, referenceSpace)) && (gamepad = inputSource.gamepad)) {
          const p = new THREE.Vector3();
          const q = new THREE.Quaternion();
          const s = new THREE.Vector3();
          new THREE.Matrix4().fromArray(pose.transform.matrix).decompose(p, q, s);

          clicked = gamepad.buttons[0].pressed;

          raycaster.ray.origin.copy(p);
          raycaster.ray.direction.set(0, 0, -1).applyQuaternion(q);
          const intersects = raycaster.intersectObjects([dialog.okButton, dialog.cancelButton]);
          if (intersects.length > 0) {
            const {object} = intersects[0];
            object.material.color.multiplyScalar(0.5);

            if (clicked && !lastClicked) {
              console.log('clicked', object === dialog.okButton);

              if (object === dialog.okButton) {
                dialog.respond({
                  credentials,
                });
              }

              scene.remove(dialog);
              dialog = null;
            }
          }
        }
      }
    }

    lastClicked = clicked;
  }

  renderer.render(scene, camera);
}

let dialog = null;
const _makeDialog = () => {
  const object = new THREE.Object3D();

  const background = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  }));
  object.add(background);

  const textMesh = _makeTextMesh('Confirm purchase?', 0.1, 0x333333, 'center', 'middle');
  textMesh.position.z = 0.01;
  object.add(textMesh);

  {
    const okButton = new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.2), new THREE.MeshBasicMaterial({
      color: 0xef5350,
      side: THREE.DoubleSide,
    }));
    const textMesh = _makeTextMesh('OK', 0.05, 0xFFFFFF, 'center', 'middle');
    textMesh.position.z = 0.01;
    okButton.add(textMesh);
    okButton.position.x = 0.25;
    okButton.position.y = -0.25;
    okButton.position.z = 0.01;
    object.add(okButton);
    object.okButton = okButton;
  }
  {
    const cancelButton = new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.2), new THREE.MeshBasicMaterial({
      color: 0xef5350,
      side: THREE.DoubleSide,
    }));
    const textMesh = _makeTextMesh('Cancel', 0.05, 0xFFFFFF, 'center', 'middle');
    textMesh.position.z = 0.01;
    cancelButton.add(textMesh);
    cancelButton.position.x = -0.25;
    cancelButton.position.y = -0.25;
    cancelButton.position.z = 0.01;
    object.add(cancelButton);
    object.cancelButton = cancelButton;
  }

  return object;
};

let credentials = null;
navigator.xr.addEventListener('secure', async e => {
  console.log('got user contract address', e.data);
  const {packageAddress} = e.data;
  credentials = e.data.credentials;

  await executeTransaction(credentials, `
    // Transaction2.cdc

    import FungibleToken from 0x${packageAddress}

    // This transaction configures an account to store and receive tokens defined by
    // the FungibleToken contract.
    transaction {
      prepare(acct: AuthAccount) {
        // Store the vault in the account storage
        let vaultRef = acct.borrow<&FungibleToken.Vault>(from: /storage/MainVault)
        if (vaultRef == nil) {
          // Create a new empty Vault object
          let vaultA <- FungibleToken.createEmptyVault()
          acct.save<@FungibleToken.Vault>(<-vaultA, to: /storage/MainVault)
        }

        log("Empty Vault stored")

        // Create a public Receiver capability to the Vault
        let ReceiverRef = acct.link<&FungibleToken.Vault{FungibleToken.Receiver, FungibleToken.Balance}>(/public/MainReceiver, target: /storage/MainVault)

        log("References created")
      }

        post {
            // Check that the capabilities were created correctly
            getAccount(0x${credentials.address}).getCapability(/public/MainReceiver)!
                            .check<&FungibleToken.Vault{FungibleToken.Receiver}>():  
                            "Vault Receiver Reference was not created correctly"
        }
    }
  `);
  setInterval(async () => {
    const result = await executeScript(`
      import FungibleToken from 0x${packageAddress}

      pub fun main() : UFix64 {
        let publicAccount = getAccount(0x${credentials.address})
        let capability = publicAccount.getCapability(/public/MainReceiver)!
        let vaultRef = capability.borrow<&FungibleToken.Vault{FungibleToken.Receiver, FungibleToken.Balance}>()!
        return vaultRef.balance
      }
    `);
    const crd = parseFloat(result.encodedData.value);
    console.log('got result', crd, result);
    card.creditTextMesh.text = `${crd} CRD`;
    card.creditTextMesh.sync();
  }, 1000);  

  navigator.xr.addEventListener('event', async e => {
    console.log('event event', e.data);
    if (e.data.type === 'paymentrequest') {
      if (!dialog) {
        dialog = _makeDialog();
        console.log('got camera position', camera.position.toArray().join(','));
        dialog.position.copy(camera.position)
          .add(new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion));
        dialog.quaternion.copy(camera.quaternion);
        dialog.respond = e.data.respond;
        scene.add(dialog);
      }
    }
  });
});

let currentSession = null;
{
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
  navigator.xr && navigator.xr.requestSession('immersive-vr', sessionInit ).then( onSessionStarted);
}