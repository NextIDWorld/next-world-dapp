import { useEffect, useRef } from 'react'
import * as THREE from 'three';
import makeBlockie from 'ethereum-blockies-base64';
import { ethers } from "ethers";

import SpriteText from 'three-spritetext';


import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';



import { useAppContext } from './hooks/useAppState'




export default function Game(props) {


  const { state,actions } = useAppContext();
  const ref = useRef({});

  useEffect(() => {
    init();
    animate();
  }, []);
  useEffect(() => {
    ref.current = state;
  }, [state]);
  useEffect(() => {
    ref.current.client = props.client;
    ref.current.getGameUris = props.getGameUris;
  },[props])
  let camera, scene, renderer, controls;
  const objects = [];
  let raycaster;

  let moveForward = false;
  let moveBackward = false;
  let moveLeft = false;
  let moveRight = false;
  let canJump = false;

  let prevTime = performance.now();
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const vertex = new THREE.Vector3();
  const color = new THREE.Color();
  const infos = [];
  let collision = false;
  let gameText;


  const occupySpace = async () => {
    camera.updateMatrixWorld();
    const vector = camera.position.clone();
    console.log(vector)
    const x = (vector.x/10).toFixed(0);
    const z = (vector.z/10).toFixed(0);
    console.log(`Inserting data at ${x},${z}`)
    const coinbaseGame = ref.current.coinbase;
    const contract = ref.current.gameContract;
    const gameProvider = ref.current.provider;
    const sendingTxGame = ref.current.sendingTx;
    console.log(ref.current)
    if (!sendingTxGame && coinbaseGame && contract) {
      ref.current = {
        ...ref.current,
        sendingTx: true
      }
      try {
        let text = new SpriteText("No URI selected", 5, "red");
        let string = "test"//ref.current.uri;
        if(string){
          text = new SpriteText("Inserting data, accept transaction ...", 5, "blue");
        }
        setGameMessage(text);
        console.log(string)
        if (!string) {
          ref.current = {
            ...ref.current,
            sendingTx: false
          }
          return
        };
        const signer = gameProvider.getSigner();
        const gameContractWithSigner = contract.connect(signer);
        const tx = await gameContractWithSigner.requestRandomWords(string,[x,z]);
        text = new SpriteText("Transaction sent, wait for confirmation ...", 5, "blue");
        setGameMessage(text);
        await tx.wait();
        text = new SpriteText("Transaction confirmed", 5, "blue");
        setGameMessage(text);

      } catch (err) {
        console.log(err)
      }
      ref.current = {
        ...ref.current,
        sendingTx: false
      }
    }
  }


  const onKeyDown = async function (event) {

    switch (event.code) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        break;

      case 'KeyP':
        console.log(ref.current)
        if(ref.current?.netId !== 534351) {
          const text = new SpriteText(`Connect to Scroll Sepholia first`, 4, "blue");
          setGameMessage(text)
          return;
        }
        if(!ref.current?.lock) return;
        occupySpace();
        break;

      case 'KeyM':
        try{
          // USE ORBIS INSTEAD
          const streamId = "0xdd3b7754aee323a8b51cb8e063e8fc4a31e5c2cc/empty-space";
          console.log(streamId)
          console.log(ref.current);
          let text;
          if(!ref.current?.lock) return;
          if(!ref.current?.coinbase) return;

        } catch(err){
          console.log(err)
        }
        break;
      case 'KeyU':
        const vector = camera.position.clone();
        const x = (vector.x/10).toFixed(0);
        const z = (vector.z/10).toFixed(0);
        const info = infos[`${x}_${z}`]
        if(info?.uri){
          const y = window.confirm(`Open ${info.uri} ?`);
          if(y){
            window.open(info.uri,"_blank")
          }
        }
        break;
      case 'Space':
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;

    }

  };

  const setGameMessage = (text) => {
    const dist = 50;
    const cwd = new THREE.Vector3();
    camera.getWorldDirection(cwd);

    cwd.multiplyScalar(dist);
    cwd.add(camera.position);

    text.position.set(cwd.x, cwd.y+3, cwd.z);
    text.setRotationFromQuaternion(camera.quaternion);
    scene.add(text);
    gameText = text
    setTimeout(() => {
      scene.remove(text);
      gameText = null;
    },8000);
  }

  const onKeyUp = function (event) {

    switch (event.code) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        break;

    }

  };

  const addInfo = async (info) => {
    const contractInitiated = ref.current?.contractInitiated;
    const contract = ref.current?.gameContract;
    const getGameUris = ref.current?.getGameUris;
    const uriGame = info.uri;
    let metadata;
    console.log(`${uriGame} at ${info.x},${info.z}`)
    if(infos[`${info.x}_${info.z}`]){
      scene.remove(infos[`${info.x}_${info.z}`]);
    }
    try{
      // Assumes it is nft metadata
      metadata = JSON.parse(await (await fetch(`https://nftstorage.link/ipfs/${uriGame.replace("ipfs://", "")}`)).text());

      const gameInfo = new THREE.Group()
      var geometry = new THREE.BoxGeometry(14, 14, 14, 1, 1, 1);
      const imgTexture = new THREE.TextureLoader().load(metadata.image.replace("ipfs://", "https://nftstorage.link/ipfs/"));

      const material = new THREE.MeshBasicMaterial({ map: imgTexture,transparent:true, opacity: 1 });
      const cube = new THREE.Mesh(geometry,material);

      const materialSprite = new THREE.SpriteMaterial({ map: imgTexture });
      const sprite = new THREE.Sprite(materialSprite);
      sprite.scale.set(10, 10, 10)
      console.log(metadata)
      const name = new SpriteText(metadata.name, 5, "red");
      const description = new SpriteText(metadata.description, 3, "blue")
      const external_url = new SpriteText(metadata.external_url, 1, "green");
      name.position.y = 40;
      description.position.y = 25;
      external_url.position.y = 20
      sprite.position.y = 12;
      gameInfo.add(sprite)
      gameInfo.add(cube)
      gameInfo.add(name)
      gameInfo.add(description)
      gameInfo.add(external_url)
      if (metadata.scenario) {
        const loader = new GLTFLoader().setPath(`https://nftstorage.link/ipfs/${metadata.scenario}/gltf/`);
        loader.load('scene.gltf', function (gltf) {
          console.log(gltf)
          gltf.scene.scale.set(gltf.scene.scale.x * 1.2, gltf.scene.scale.y * 1.2, gltf.scene.scale.z * 1.2)
          gltf.scene.position.set(info.x*10, 1, info.z*10)
          scene.add(gltf.scene);


        });
      }

      if(metadata.scenario){
        const loader = new GLTFLoader().setPath(`https://nftstorage.link/ipfs/${metadata.scenario}/gltf/` );
        loader.load( 'scene.gltf', function ( gltf ) {
          console.log(gltf)
          gltf.scene.position.set(info.x*10,1,info.z*10)
          gltf.scene.scale.set(gltf.scene.scale.x*1.2,gltf.scene.scale.y*1.2,gltf.scene.scale.z*1.2)
          scene.add( gltf.scene );


        } );
      }
      gameInfo.position.set(info.x*10, 5 , info.z*10)
      console.log(gameInfo.position)
      gameInfo.scale.set(0.5,0.5,0.5)
      gameInfo.name = metadata.name;
      gameInfo.uri = metadata.external_url?.replace("ipfs://","https://ipfs.io/ipfs/");
      scene.add(gameInfo);
      infos[`${info.x}_${info.z}`] = gameInfo;



    } catch(err){
      console.log(err)
    }
  }

  const checkUris = async () => {
    const contractInitiated = ref.current?.contractInitiated;
    const contract = ref.current?.gameContract;
    const getGameUris = ref.current?.getGameUris;

    if (contract && !contractInitiated) {
        const results = await getGameUris();
        results.data.infos.map(async info => {
          const uriGame = info.uri;
            if(uriGame){
                await addInfo(info)
            }
        })
        const filter = contract.filters.Result();
        contract.on(filter, handleEvents)
    }
    ref.current = {
      ...ref.current,
      contractInitiated: true
    }
  }

  const handleEvents = async (uri, number,result,x,z) => {

    console.log(`Event: URI - ${uri} Result - ${result} - ${x},${z}`);
    let text;
    if (result) {
      if (uri === ref.current?.uri) {
        text = new SpriteText("The space is yours!", 5, "green");
      } else {
        text = new SpriteText("Someone won a space!", 5, "blue");
      }
      scene.remove(infos[`${x}_${z}`]);
      await addInfo({
        x: x,
        z: z,
        uri: uri
      });
    } else {
      let i = 0;
      if (uri === ref.current?.uri) {
        text = new SpriteText("You could not get the space, try again!", 5, "red");
      } else {
        text = new SpriteText("Someone tried to get a space!", 5, "blue");
      }
    }
    setGameMessage(text);
  }

  const generateFloor = () => {
    // floor

    let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    floorGeometry.rotateX(- Math.PI / 2);

    // vertex displacement

    let position = floorGeometry.attributes.position;

    for (let i = 0, l = position.count; i < l; i++) {

      vertex.fromBufferAttribute(position, i);

      vertex.x += Math.random() * 20 - 10;
      vertex.y += Math.random() * 2;
      vertex.z += Math.random() * 20 - 10;

      position.setXYZ(i, vertex.x, vertex.y, vertex.z);

    }

    floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

    position = floorGeometry.attributes.position;
    const colorsFloor = [];

    for (let i = 0, l = position.count; i < l; i++) {

      color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
      colorsFloor.push(color.r, color.g, color.b);

    }

    floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsFloor, 3));

    const floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(1000,0,1000)

    scene.add(floor);
  }

  async function init() {

    ref.current = {
      ...ref.current,
      lock: false
    }
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(1000,1,1000)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 0, 750);
    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);
    controls = new PointerLockControls(camera, document.body);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function () {
      controls.lock();
      ref.current = {
        ...ref.current,
        lock: true
      }
    });

    controls.addEventListener('lock', function () {

      instructions.style.display = 'none';
      blocker.style.display = 'none';
      ref.current = {
        ...ref.current,
        lock: true
      }

    });

    controls.addEventListener('unlock', function () {

      blocker.style.display = 'block';
      instructions.style.display = '';
      ref.current = {
        ...ref.current,
        lock: false
      }
    });

    scene.add(controls.getObject());

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);

    generateFloor();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.getElementById("canvas-container").appendChild(renderer.domElement);



    window.addEventListener('resize', onWindowResize);

  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

  }

  async function animate() {
    const contractInitiated = ref.current?.contractInitiated;
    const client = ref.current?.client;
    if (!contractInitiated && client) {
      await checkUris();
    }

    if(gameText){
      const dist = 50;
      const cwd = new THREE.Vector3();
      camera.getWorldDirection(cwd);

      cwd.multiplyScalar(dist);
      cwd.add(camera.position);

      gameText.position.set(cwd.x, cwd.y+2, cwd.z);
    }
    requestAnimationFrame(animate);
    const time = performance.now();
    if (controls.isLocked === true) {

      raycaster.ray.origin.copy(controls.getObject().position);
      raycaster.ray.origin.y -= 10;

      const intersections = raycaster.intersectObjects(objects, false);

      const onObject = intersections.length > 0;

      const delta = (time - prevTime) / 1000;

      velocity.x -= velocity.x * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;

      velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

      direction.z = Number(moveForward) - Number(moveBackward);
      direction.x = Number(moveRight) - Number(moveLeft);
      direction.normalize(); // this ensures consistent movements in all directions

      if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
      if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

      if (onObject === true) {

        velocity.y = Math.max(0, velocity.y);
        canJump = true;

      }

      controls.moveRight(- velocity.x * delta);
      controls.moveForward(- velocity.z * delta);

      controls.getObject().position.y += (velocity.y * delta); // new behavior

      if (controls.getObject().position.y < 10) {

        velocity.y = 0;
        controls.getObject().position.y = 10;

        canJump = true;

      }

    }
    camera.updateMatrixWorld();
    /*
    const vector = camera.position.clone();
    const x = (vector.x/10).toFixed(0);
    const z = (vector.z/10).toFixed(0);
    const info = infos[`${x}_${z}`]
    if(info && !gameText){
      const text = new SpriteText(`Press P to try to get the space from ${info.name}`, 3, "blue");
      setGameMessage(text)
    }
    */
    prevTime = time;

    renderer?.render(scene, camera);

  }

  return (
    <>
    </>
  )
}
