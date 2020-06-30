import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';
import {TextMesh} from './textmesh-standalone.esm.js'

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

    const _makeTextMesh = (text, fontSize, anchorX, anchorY) => {
      const textMesh = new TextMesh();
      textMesh.text = text;
      textMesh.font = './GeosansLight.ttf';
      textMesh.fontSize = fontSize;
      // textMesh.position.set(0, 1, -2);
      textMesh.color = 0xFFFFFF;
      textMesh.anchorX = anchorX;
      textMesh.anchorY = anchorY;
      textMesh.frustumCulled = false;
      textMesh.sync();
      return textMesh;
    };
    const textMesh = _makeTextMesh('Avaer Kazmer', 0.007, 'left', 'bottom-baseline');
    textMesh.position.x = -w/2;
    textMesh.position.y = -0.02;
    textMesh.position.z = 0.001;
    scene.add(textMesh);

    const creditTextMesh = _makeTextMesh('2 CRD', 0.015, 'right', 'middle');
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

// const controls = new THREE.OrbitControls(camera, renderer.domElement);
// controls.target.set(0, 1, 0);
// controls.update();

renderer.setAnimationLoop(render);
function render() {
  renderer.render(scene, camera);
}

(async () => {
  const [userAddress, contractAddress] = await Promise.all([
    xrpackage.getUserAddress(),
    xrpackage.getContractAddress(),
  ]);
  console.log('got user contract address', userAddress, contractAddress);

  await xrpackage.executeTransaction(`
    // Transaction2.cdc

    import FungibleToken from 0x${contractAddress}

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
            getAccount(0x${userAddress}).getCapability(/public/MainReceiver)!
                            .check<&FungibleToken.Vault{FungibleToken.Receiver}>():  
                            "Vault Receiver Reference was not created correctly"
        }
    }
  `);
  setInterval(async () => {
    const result = await xrpackage.executeScript(`
      import FungibleToken from 0x${contractAddress}

      pub fun main() : UFix64 {
        let publicAccount = getAccount(0x${userAddress})
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
})().catch(console.warn);

{
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
  navigator.xr && navigator.xr.requestSession('immersive-vr', sessionInit ).then( onSessionStarted);
}