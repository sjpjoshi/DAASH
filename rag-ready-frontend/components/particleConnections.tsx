"use client";

import type { Container, Engine } from "@tsparticles/engine";

import React, { useCallback, useEffect, useState, memo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

interface ParticleConnectionsProps {
  className?: string;
}

const particlesConfig = {
  particles: {
    number: {
      value: 45,
      density: {
        enable: true,
        area: 800,
      },
    },
    color: {
      value: "#e8a0eb",
    },
    size: {
      value: 2,
    },
    move: {
      enable: true,
      speed: 2,
      outModes: "bounce" as const,
    },
    links: {
      enable: true,
      distance: 250,
      color: "#e8a0eb",
      opacity: 0.5,
      width: 1,
    },
  },
  fpsLimit: 120,
  detectRetina: true,
};

const ParticleConnectionsComponent: React.FC<ParticleConnectionsProps> = ({ className }) => {
  const [init, setInit] = useState(false);

  // This should be run only once per application lifetime
  useEffect(() => {
    let isMounted = true;

    initParticlesEngine(async (engine: Engine) => {
      // This loads the tsparticles package bundle, it's the easiest method for getting everything ready
      // Starting from v2 you can add only the features you need reducing the bundle size
      await loadSlim(engine);
    }).then(() => {
      if (isMounted) {
        setInit(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const particlesLoaded = useCallback(async (container?: Container) => {
    // You can use the container to customize the tsParticles instance
    if (container) {
      console.log("Particles container loaded:", container);
    }
  }, []);

  return (
    <div className={`${className}`} id="particles-container">
      {init && (
        <Particles id="particles" options={particlesConfig} particlesLoaded={particlesLoaded} />
      )}
    </div>
  );
};

// Export a memoized version of the component
const ParticleConnections = memo(ParticleConnectionsComponent);

export default ParticleConnections;
