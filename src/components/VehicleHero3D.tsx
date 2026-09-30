import React, { useEffect } from 'react';

// Extend JSX Intrinsic Elements to allow <model-viewer> in TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        poster?: string;
        alt?: string;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        'disable-zoom'?: boolean;
        'disable-pan'?: boolean;
        'shadow-intensity'?: string;
        'environment-image'?: string;
        exposure?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        'interaction-prompt'?: 'auto' | 'none';
        'min-camera-orbit'?: string;
        'max-camera-orbit'?: string;
        'camera-orbit'?: string;
        'field-of-view'?: string;
        class?: string;
        style?: React.CSSProperties;
      }, HTMLElement>;
    }
  }
}

interface VehicleHero3DProps {
  /** Path to the Draco-compressed .glb file */
  src: string;
  /** Path to a WebP poster image for fallback/loading state */
  poster?: string;
  alt?: string;
  className?: string;
}

export default function VehicleHero3D({ 
  src, 
  poster,
  alt = "3D vehicle model", 
  className = "" 
}: VehicleHero3DProps) {
  
  // Dynamically import model-viewer on client side
  useEffect(() => {
    import('@google/model-viewer');
  }, []);

  return (
    <div className={`relative w-full h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden rounded-2xl ${className}`} style={{ background: 'var(--bg-primary, #0D0F14)' }}>
      {/* Subtle glowing radial background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-orange-500/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
      
      <model-viewer
        src={src}
        poster={poster}
        alt={alt}
        auto-rotate
        camera-controls
        disable-zoom // Disables scroll hijacking so touch users don't get trapped
        disable-pan
        shadow-intensity="1.2"
        exposure="1.0"
        loading="lazy"
        interaction-prompt="none"
        // Prevent camera from going under the floor (polar angle limit)
        max-camera-orbit="auto 85deg auto"
        class="w-full h-full relative z-10"
        style={{
          width: '100%',
          height: '100%',
          outline: 'none',
          backgroundColor: 'transparent'
        }}
      >
        {/* Skeleton/Shimmer Loader while asset downloads */}
        <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-[#0D0F14]">
          <div className="animate-pulse w-full h-full bg-white/5 flex flex-col items-center justify-center border border-white/10">
            <div className="w-10 h-10 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin mb-4" />
            <span className="text-orange-500/60 text-xs font-bold tracking-[0.2em] uppercase">Loading WebGL...</span>
          </div>
        </div>
      </model-viewer>
    </div>
  );
}
