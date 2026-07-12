import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// ----------------------------------------------------
// 1. Nature Effect (Floating Leaves)
// ----------------------------------------------------
export function LeavesEffect() {
  const groupRef = useRef();

  // Create a procedural leaf shape
  const leafGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    // Draw leaf outline
    shape.quadraticCurveTo(0.6, 0.6, 0, 1.2);
    shape.quadraticCurveTo(-0.6, 0.6, 0, 0);
    
    // Extrude slightly to make it 3D
    const extrudeSettings = {
      steps: 1,
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  // Generate leaf properties
  const leaves = useMemo(() => {
    const leafColors = ['#10b981', '#34d399', '#f59e0b', '#d97706', '#84cc16']; // green, emerald, gold, amber, lime
    const temp = [];
    for (let i = 0; i < 45; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 20, // X
          Math.random() * 15 - 5,     // Y
          (Math.random() - 0.5) * 10 - 2 // Z
        ],
        scale: Math.random() * 0.4 + 0.25,
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        speedY: Math.random() * 0.8 + 0.6,
        speedX: Math.random() * 0.4 - 0.2,
        rotSpeedX: Math.random() * 1.5 + 0.5,
        rotSpeedY: Math.random() * 1.5 + 0.5,
        rotSpeedZ: Math.random() * 1.0 + 0.5,
        phase: Math.random() * Math.PI * 2,
        windFreq: Math.random() * 0.5 + 0.2
      });
    }
    return temp;
  }, []);

  const meshRefs = useRef([]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    leaves.forEach((leaf, idx) => {
      const mesh = meshRefs.current[idx];
      if (!mesh) return;

      // Update positions (falling down + drifting)
      leaf.position[1] -= leaf.speedY * delta; // Fall
      leaf.position[0] += (leaf.speedX + Math.sin(time * leaf.windFreq + leaf.phase) * 0.5) * delta; // Sway

      // Spin rotation
      mesh.rotation.x += leaf.rotSpeedX * delta * 0.5;
      mesh.rotation.y += leaf.rotSpeedY * delta * 0.5;
      mesh.rotation.z += leaf.rotSpeedZ * delta * 0.3;

      // Reset when falling out of bounds
      if (leaf.position[1] < -10) {
        leaf.position[1] = 10;
        leaf.position[0] = (Math.random() - 0.5) * 20;
        leaf.position[2] = (Math.random() - 0.5) * 10 - 2;
      }

      mesh.position.set(...leaf.position);
    });

    // Subtle parallax shift based on mouse position
    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, state.pointer.x * 1.0, 0.05);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, state.pointer.y * 0.5, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.8} />
      {leaves.map((leaf, idx) => (
        <mesh
          key={idx}
          ref={(el) => (meshRefs.current[idx] = el)}
          geometry={leafGeometry}
          scale={leaf.scale}
        >
          <meshStandardMaterial 
            color={leaf.color} 
            roughness={0.4} 
            metalness={0.1}
            side={THREE.DoubleSide} 
          />
        </mesh>
      ))}
    </group>
  );
}

// ----------------------------------------------------
// 2. Floating Squares (Tech Portfolio)
// ----------------------------------------------------
export function TechEffect() {
  const groupRef = useRef();

  const items = useMemo(() => {
    const temp = [];
    const colors = ['#3b82f6', '#60a5fa', '#a855f7', '#c084fc', '#818cf8']; // Tech blues and purples
    
    for (let i = 0; i < 30; i++) {
      // Half cubes, half flat squares (thin boxes)
      const isCube = Math.random() > 0.5;
      temp.push({
        position: [
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8 - 3
        ],
        size: isCube 
          ? [Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4, Math.random() * 0.8 + 0.4]
          : [Math.random() * 1.0 + 0.5, Math.random() * 1.0 + 0.5, 0.05],
        color: colors[Math.floor(Math.random() * colors.length)],
        rotSpeed: [
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.2
        ],
        moveSpeed: [
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.1
        ],
        phase: Math.random() * 100
      });
    }
    return temp;
  }, []);

  const meshRefs = useRef([]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    items.forEach((item, idx) => {
      const mesh = meshRefs.current[idx];
      if (!mesh) return;

      // Slow floating movement
      mesh.position.x += item.moveSpeed[0] * delta + Math.sin(time * 0.2 + item.phase) * 0.002;
      mesh.position.y += item.moveSpeed[1] * delta + Math.cos(time * 0.2 + item.phase) * 0.002;
      mesh.position.z += item.moveSpeed[2] * delta;

      // Rotate
      mesh.rotation.x += item.rotSpeed[0] * delta;
      mesh.rotation.y += item.rotSpeed[1] * delta;
      mesh.rotation.z += item.rotSpeed[2] * delta;

      // Boundary loop check
      if (Math.abs(mesh.position.x) > 12) mesh.position.x = -Math.sign(mesh.position.x) * 11;
      if (Math.abs(mesh.position.y) > 8) mesh.position.y = -Math.sign(mesh.position.y) * 7;
      if (mesh.position.z < -10) mesh.position.z = 0;
      if (mesh.position.z > 2) mesh.position.z = -8;
    });

    // React to mouse coordinates
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, state.pointer.x * 0.25, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -state.pointer.y * 0.25, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#3b82f6" />
      <pointLight position={[-10, -10, 5]} intensity={1.0} color="#a855f7" />
      
      {items.map((item, idx) => (
        <mesh
          key={idx}
          ref={(el) => (meshRefs.current[idx] = el)}
          position={item.position}
        >
          <boxGeometry args={item.size} />
          <meshPhysicalMaterial
            transmission={0.8}
            roughness={0.2}
            thickness={0.8}
            color={item.color}
            transparent
            opacity={0.4}
            metalness={0.1}
            ior={1.4}
          />
        </mesh>
      ))}
    </group>
  );
}

// ----------------------------------------------------
// 3. Particle/Air Effect (Cinematic Dust Particles)
// ----------------------------------------------------
export function ParticlesEffect() {
  const count = 750;
  const meshRef = useRef();

  // Create a canvas texture for a soft circular glowing point
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Set initial random particle coordinate arrays
  const [positions, speedData] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const speed = [];
    for (let i = 0; i < count; i++) {
      // Spread coordinates
      pos[i * 3] = (Math.random() - 0.5) * 20;     // X
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14; // Y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2; // Z

      speed.push({
        y: Math.random() * 0.2 + 0.05,
        x: (Math.random() - 0.5) * 0.08,
        freq: Math.random() * 0.8 + 0.1,
        amp: Math.random() * 0.15 + 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }
    return [pos, speed];
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (!meshRef.current) return;

    const geo = meshRef.current.geometry;
    const posAttr = geo.attributes.position;
    const arr = posAttr.array;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const data = speedData[i];

      // Slowly drift particles upwards
      arr[idx + 1] += data.y * delta;
      // Sinusoidal horizontal sway
      arr[idx] += (data.x + Math.sin(time * data.freq + data.phase) * data.amp) * delta;

      // Wrap-around
      if (arr[idx + 1] > 8) {
        arr[idx + 1] = -8;
        arr[idx] = (Math.random() - 0.5) * 20;
      }
      if (Math.abs(arr[idx]) > 11) {
        arr[idx] = -Math.sign(arr[idx]) * 10;
      }
    }

    posAttr.needsUpdate = true;

    // React slightly to cursor by shifting point group position
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, state.pointer.x * 0.6, 0.05);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, state.pointer.y * 0.3, 0.05);
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        map={particleTexture}
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        color="#a5f3fc" // Soft cyan glow
      />
    </points>
  );
}

// ----------------------------------------------------
// 4. 3D Geometric Background (Neon Parallax Shapes)
// ----------------------------------------------------
export function GeometricEffect({ scrollProgress = 0 }) {
  const groupRef = useRef();

  const shapes = useMemo(() => {
    const temp = [];
    const colors = ['#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#a855f7']; // Neon highlights
    const shapeTypes = ['box', 'sphere', 'cone'];
    
    for (let i = 0; i < 20; i++) {
      temp.push({
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        position: [
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8 - 4
        ],
        scale: Math.random() * 0.5 + 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotSpeed: [
          Math.random() * 0.6 + 0.2,
          Math.random() * 0.6 + 0.2,
          Math.random() * 0.3
        ],
        depth: Math.random() * 3 + 1 // Used for parallax weight
      });
    }
    return temp;
  }, []);

  const meshRefs = useRef([]);

  useFrame((state, delta) => {
    // Rotation animation
    shapes.forEach((shape, idx) => {
      const mesh = meshRefs.current[idx];
      if (!mesh) return;

      mesh.rotation.x += shape.rotSpeed[0] * delta * 0.5;
      mesh.rotation.y += shape.rotSpeed[1] * delta * 0.5;
      mesh.rotation.z += shape.rotSpeed[2] * delta * 0.3;

      // Add a tiny float bobbing
      mesh.position.y += Math.sin(state.clock.getElapsedTime() * 0.8 + idx) * 0.001;
    });

    // Parallax scrolling calculation (move group Y linked to scrollProgress)
    if (groupRef.current) {
      // Map scroll progress (0-100) to target coordinate offset
      const targetY = (scrollProgress / 100) * 8.5;
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.08);

      // Slight horizontal cursor shift
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, state.pointer.x * 0.8, 0.08);
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      
      {/* Dynamic neon lights */}
      <pointLight position={[5, 5, 2]} intensity={2.0} color="#ec4899" distance={15} />
      <pointLight position={[-5, -5, 2]} intensity={2.0} color="#06b6d4" distance={15} />

      {shapes.map((s, idx) => {
        let geometry;
        if (s.type === 'box') {
          geometry = <boxGeometry args={[1, 1, 1]} />;
        } else if (s.type === 'sphere') {
          geometry = <sphereGeometry args={[0.6, 32, 32]} />;
        } else {
          // Pyramid shape
          geometry = <coneGeometry args={[0.6, 1.2, 4]} />;
        }

        return (
          <mesh
            key={idx}
            ref={(el) => (meshRefs.current[idx] = el)}
            position={s.position}
            scale={s.scale}
          >
            {geometry}
            <meshStandardMaterial
              color="#111827" // Dark slate body
              roughness={0.2}
              metalness={0.9}
              emissive={s.color} // Neon glowing borders/sides
              emissiveIntensity={0.65}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ----------------------------------------------------
// 5. Interactive Mouse Effect (Smooth Follow & Light)
// ----------------------------------------------------
export function InteractiveEffect() {
  const groupRef = useRef();
  const pointLightRef = useRef();

  const objects = useMemo(() => {
    const temp = [];
    const shapes = ['box', 'sphere', 'torus'];
    const colors = ['#f43f5e', '#10b981', '#3b82f6', '#eab308', '#d946ef'];

    for (let i = 0; i < 15; i++) {
      temp.push({
        type: shapes[Math.floor(Math.random() * shapes.length)],
        position: [
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4 - 2
        ],
        scale: Math.random() * 0.4 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        lerpFactor: Math.random() * 0.03 + 0.015, // Float delays
        rotSpeed: [Math.random() - 0.5, Math.random() - 0.5]
      });
    }
    return temp;
  }, []);

  const meshRefs = useRef([]);

  useFrame((state, delta) => {
    const mX = state.pointer.x * 6;
    const mY = state.pointer.y * 4.5;

    // Point light tracks mouse quickly
    if (pointLightRef.current) {
      pointLightRef.current.position.x = THREE.MathUtils.lerp(pointLightRef.current.position.x, mX, 0.12);
      pointLightRef.current.position.y = THREE.MathUtils.lerp(pointLightRef.current.position.y, mY, 0.12);
    }

    // Objects follow mouse with different inertia weights
    objects.forEach((obj, idx) => {
      const mesh = meshRefs.current[idx];
      if (!mesh) return;

      // Base target position has a randomized offset relative to cursor
      const tX = mX + Math.sin(state.clock.getElapsedTime() * 0.5 + idx) * 1.5;
      const tY = mY + Math.cos(state.clock.getElapsedTime() * 0.5 + idx) * 1.5;

      mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, tX, obj.lerpFactor);
      mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, tY, obj.lerpFactor);

      // Slow continuous spin
      mesh.rotation.x += obj.rotSpeed[0] * delta;
      mesh.rotation.y += obj.rotSpeed[1] * delta;
    });
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[0, 5, 5]} intensity={1.0} />

      {/* Point light that moves with the cursor */}
      <pointLight 
        ref={pointLightRef} 
        position={[0, 0, 3]} 
        intensity={3.5} 
        color="#ffffff" 
        distance={20} 
        decay={1}
      />

      {objects.map((obj, idx) => {
        let geom;
        if (obj.type === 'box') {
          geom = <boxGeometry args={[1.2, 1.2, 1.2]} />;
        } else if (obj.type === 'sphere') {
          geom = <sphereGeometry args={[0.8, 32, 32]} />;
        } else {
          geom = <torusGeometry args={[0.6, 0.25, 12, 24]} />;
        }

        return (
          <mesh
            key={idx}
            ref={(el) => (meshRefs.current[idx] = el)}
            scale={obj.scale}
          >
            {geom}
            <meshStandardMaterial
              color={obj.color}
              roughness={0.1}
              metalness={0.7}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ----------------------------------------------------
// 6. Premium Apple-like Effect (Refractive Glass)
// ----------------------------------------------------
export function AppleEffect() {
  const groupRef = useRef();

  const shapes = useMemo(() => {
    const temp = [];
    const geoms = ['sphere', 'torus', 'cube', 'cylinder'];
    for (let i = 0; i < 12; i++) {
      temp.push({
        type: geoms[Math.floor(Math.random() * geoms.length)],
        position: [
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 4 - 2
        ],
        scale: Math.random() * 0.6 + 0.5,
        speed: Math.random() * 0.4 + 0.2,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: [
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        ]
      });
    }
    return temp;
  }, []);

  const refs = useRef([]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    shapes.forEach((s, idx) => {
      const mesh = refs.current[idx];
      if (!mesh) return;

      // Soft vertical floating bounce
      mesh.position.y += Math.sin(time * s.speed + s.phase) * 0.003;
      mesh.rotation.x += s.rotSpeed[0] * delta;
      mesh.rotation.y += s.rotSpeed[1] * delta;
    });

    // Slow elegant camera orbit based on mouse
    if (state.camera) {
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.pointer.x * 1.5, 0.04);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.pointer.y * 1.0, 0.04);
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.2} />
      {/* Elegant, clean studio lighting */}
      <directionalLight position={[10, 15, 8]} intensity={2.0} color="#ffffff" />
      <directionalLight position={[-10, -5, -2]} intensity={0.8} color="#b0c4de" />
      <pointLight position={[0, 0, 5]} intensity={1.2} color="#ffffff" />

      {shapes.map((s, idx) => {
        let geom;
        if (s.type === 'sphere') {
          geom = <sphereGeometry args={[0.9, 32, 32]} />;
        } else if (s.type === 'torus') {
          geom = <torusGeometry args={[0.7, 0.3, 16, 32]} />;
        } else if (s.type === 'cube') {
          geom = <boxGeometry args={[1.2, 1.2, 1.2]} />;
        } else {
          geom = <cylinderGeometry args={[0.6, 0.6, 1.5, 32]} />;
        }

        return (
          <Float 
            key={idx} 
            speed={1.5} 
            rotationIntensity={0.5} 
            floatIntensity={0.5}
            position={s.position}
          >
            <mesh
              ref={(el) => (refs.current[idx] = el)}
              scale={s.scale}
            >
              {geom}
              {/* Premium translucent refractive glass material */}
              <meshPhysicalMaterial
                transmission={0.9}
                roughness={0.12}
                thickness={1.8}
                ior={1.52}
                clearcoat={1.0}
                clearcoatRoughness={0.1}
                color="#eef2f6"
                transparent
                opacity={0.8}
              />
            </mesh>
          </Float>
        );
      })}

      {/* Soft floor shadow overlay for realism */}
      <ContactShadows 
        position={[0, -5, 0]} 
        opacity={0.4} 
        scale={20} 
        blur={2.5} 
        far={6} 
      />
    </group>
  );
}
