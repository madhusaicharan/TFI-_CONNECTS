import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Plane, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './ThreeCinema.css';

// Silence the unavoidable THREE.Clock deprecation warning from R3F internals
if (typeof window !== 'undefined' && !window.__THREE_WARNING_PATCHED) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) return;
    originalWarn(...args);
  };
  window.__THREE_WARNING_PATCHED = true;
}

gsap.registerPlugin(ScrollTrigger);

// ── Video Scene Component ─────────────────────────────────────
const VideoScene = ({ video, billboardImageUrl }) => {
  const { viewport } = useThree();
  const billboardRef = useRef();
  
  const videoTexture = useMemo(() => {
    const tex = new THREE.VideoTexture(video);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.format = THREE.RGBAFormat;
    tex.colorSpace = THREE.SRGBColorSpace; 
    return tex;
  }, [video]);

  const billboardTex = billboardImageUrl ? useTexture(billboardImageUrl) : null;
  if (billboardTex) billboardTex.colorSpace = THREE.SRGBColorSpace;

  // Exact object-fit: cover logic without the 1.05x crop so the full theatre is visible
  const videoAspect = video.videoWidth / video.videoHeight || 16/9;
  const viewportAspect = viewport.width / viewport.height;
  
  let scaleX = viewport.width;
  let scaleY = viewport.height;
  
  if (viewportAspect > videoAspect) {
    scaleY = viewport.width / videoAspect;
  } else {
    scaleX = viewport.height * videoAspect;
  }

  useFrame(() => {
    if (!video) return;

    // Force texture update on every frame for flawless scrubbing
    if (videoTexture) videoTexture.needsUpdate = true;

    // 3. DYNAMIC BILLBOARD TRACKING
    if (!billboardRef.current || !billboardTex) return;
    
    const time = video.currentTime;
    const startPosX = scaleX * 0.28; 
    const startPosY = scaleY * 0.05;
    const startScaleX = scaleX * 0.2;
    const startScaleY = scaleY * 0.55;

    if (time < 1.9) {
      billboardRef.current.position.set(startPosX, startPosY, 0.1);
      billboardRef.current.scale.set(startScaleX, startScaleY, 1);
      billboardRef.current.material.opacity = 1;
    } else if (time >= 1.9 && time < 3.5) {
      const progress = (time - 1.9) / (3.5 - 1.9); 
      const scaleMult = 1 + progress * 4; 
      const panX = startPosX + (progress * scaleX * 1.2); 
      const panY = startPosY - (progress * scaleY * 0.1); 
      
      billboardRef.current.position.set(panX, panY, 0.1);
      billboardRef.current.scale.set(startScaleX * scaleMult, startScaleY * scaleMult, 1);
      billboardRef.current.material.opacity = 1 - Math.pow(progress, 1.5);
    } else {
      billboardRef.current.material.opacity = 0;
    }
  });

  return (
    <group>
      <Plane args={[scaleX, scaleY]} position={[0, 0, 0]}>
        <meshBasicMaterial map={videoTexture} />
      </Plane>
      
      {billboardTex && (
        <Plane ref={billboardRef} args={[1, 1]} position={[0, 0, 0.1]}>
          <meshBasicMaterial map={billboardTex} transparent opacity={1} />
        </Plane>
      )}
    </group>
  );
};

// ── Main Component ──────────────────────────────────────────
const ThreeCinema = () => {
  const containerRef = useRef(null);
  const [video, setVideo] = useState(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  const defaultImageUrl = null;

  useEffect(() => {
    const vid = document.createElement('video');
    vid.muted = true;
    vid.playsInline = true;
    vid.crossOrigin = 'anonymous';
    vid.preload = 'auto'; // Instant loading
    vid.src = '/reference-video.mp4';
    
    const onLoadedMetadata = () => {
      setVideoLoaded(true);
    };
    vid.addEventListener('loadedmetadata', onLoadedMetadata);
    setVideo(vid);

    return () => {
      vid.removeEventListener('loadedmetadata', onLoadedMetadata);
      vid.pause();
      vid.removeAttribute('src');
      vid.load();
    };
  }, []);

  useEffect(() => {
    if (!videoLoaded || !video || !containerRef.current) return;

    // ── Step 1: Initialize Lenis for buttery smooth page scrolling ─────────────
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    // ── Step 2: Sync GSAP ScrollTrigger with Lenis ─────────────────────────────
    const lenisScrollHandler = ScrollTrigger.update;
    lenis.on('scroll', lenisScrollHandler);

    // CRITICAL: capture the raf function reference so we can remove EXACTLY this
    // listener later. Passing `lenis.raf` to gsap.ticker.remove() won't work if
    // it's a bound method created lazily — we need a stable reference.
    const gsapTickerFn = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(gsapTickerFn);
    gsap.ticker.lagSmoothing(0);

    // ── Step 3: GSAP context (scoped to the container) ─────────────────────────
    let ctx = null;

    video.play()
      .then(() => {
        video.pause();
        // Guard: if component already unmounted before this resolves, do nothing
        if (!containerRef.current) return;

        ctx = gsap.context(() => {
          gsap.to(video, {
            currentTime: video.duration || 8,
            ease: 'none',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 1.5,
            },
          });
        }, containerRef);
      })
      .catch((err) => console.error('Video play error:', err));

    // ── Cleanup — always runs synchronously on unmount ─────────────────────────
    // This is OUTSIDE .then(), so React will always call it.
    return () => {
      if (ctx) ctx.revert();                // destroy GSAP context & ScrollTrigger
      lenis.off('scroll', lenisScrollHandler);
      lenis.destroy();                      // destroy Lenis smooth scroll
      gsap.ticker.remove(gsapTickerFn);     // remove exact ticker reference
    };
  }, [videoLoaded, video]);

  return (
    <div className="three-cinema-scroll-wrapper" ref={containerRef}>
      <div className="three-cinema-sticky">
        
        {!videoLoaded && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', zIndex: 10, fontFamily: 'var(--font-heading)' }}>
            Loading Cinematic Experience...
          </div>
        )}

        {videoLoaded && (
          <Canvas orthographic camera={{ position: [0, 0, 10], zoom: 1 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
            <React.Suspense fallback={null}>
              <VideoScene video={video} billboardImageUrl={defaultImageUrl} />
            </React.Suspense>
          </Canvas>
        )}
        
        <div className="three-scroll-hint">
          <p>Scroll to Explore</p>
          <div className="mouse-wheel"></div>
        </div>
      </div>
    </div>
  );
};

export default ThreeCinema;
