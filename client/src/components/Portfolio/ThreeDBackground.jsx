import { Canvas } from '@react-three/fiber';
import { 
  LeavesEffect, 
  TechEffect, 
  ParticlesEffect, 
  GeometricEffect, 
  InteractiveEffect, 
  AppleEffect 
} from './EffectComponents';

export default function ThreeDBackground({ effectType, scrollProgress, eventSource }) {
  if (effectType === 'classic') {
    // The classic effect is handled via the HTML5 2D canvas in the main modal
    return null;
  }

  // Choose the matching 3D scene component
  const renderEffect = () => {
    switch (effectType) {
      case 'nature':
        return <LeavesEffect />;
      case 'tech':
        return <TechEffect />;
      case 'particles':
        return <ParticlesEffect />;
      case 'geometric':
        return <GeometricEffect scrollProgress={scrollProgress} />;
      case 'interactive':
        return <InteractiveEffect />;
      case 'apple':
        return <AppleEffect />;
      default:
        return <LeavesEffect />;
    }
  };

  return (
    <div 
      className="portfolio-3d-background-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        eventSource={eventSource} // Pipes mouse movement from the scrollable overlay wrapper to the 3D scene
        style={{ pointerEvents: 'none' }}
      >
        {renderEffect()}
      </Canvas>
    </div>
  );
}
