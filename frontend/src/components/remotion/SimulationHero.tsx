import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring } from 'remotion';

export const SimulationHero: React.FC<{ 
  accentColor: string;
  dotColor: string; 
}> = ({ accentColor, dotColor }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  
  // Generating organic particles
  const nodes = new Array(25).fill(0).map((_, i) => {
    const delay = i * 2;
    const progress = spring({
      fps,
      frame: Math.max(0, frame - delay),
      config: { damping: 12, stiffness: 80 }
    });
    
    // Seeded random positions for visual stability
    const x = ((Math.sin(i * 123.45) + 1) / 2) * 80 + 10;
    const y = ((Math.cos(i * 678.9) + 1) / 2) * 80 + 10;
    
    // Pulse effect
    const pulse = Math.sin((frame - delay) * 0.1) * 2;
    
    return {
      id: i,
      x: `${x}%`,
      y: `${y}%`,
      scale: progress + pulse * 0.1,
      opacity: progress,
      isInfluencer: i % 4 === 0
    };
  });

  return (
    <AbsoluteFill style={{ 
      background: 'transparent',
      justifyContent: 'center', 
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      {/* Background ambient glow */}
      <div style={{
        position: 'absolute',
        width: '60%', height: '60%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
        opacity: 0.15 + Math.sin(frame * 0.05) * 0.05,
        filter: 'blur(40px)'
      }} />

      {/* Connection lines (simplified logic for performance) */}
      <svg style={{ position: 'absolute', width: '100%', height: '100%' }}>
         {nodes.map((node, i) => {
           if (i === 0) return null;
           const target = nodes[i - 1];
           const progress = spring({
             fps,
             frame: Math.max(0, frame - (i * 2 + 5)),
             config: { damping: 14 }
           });
           
           return (
             <line 
               key={`line-${i}`}
               x1={node.x} y1={node.y}
               x2={target.x} y2={target.y}
               stroke={accentColor}
               strokeWidth="1.5"
               opacity={progress * 0.3}
             />
           );
         })}
      </svg>

      {/* Nodes */}
      {nodes.map(node => (
        <div key={node.id} style={{
          position: 'absolute',
          left: node.x,
          top: node.y,
          width: node.isInfluencer ? 14 : 8,
          height: node.isInfluencer ? 14 : 8,
          backgroundColor: node.isInfluencer ? accentColor : dotColor,
          borderRadius: '50%',
          transform: `translate(-50%, -50%) scale(${node.scale})`,
          opacity: node.opacity,
          boxShadow: `0 0 ${node.isInfluencer ? 15 : 5}px ${node.isInfluencer ? accentColor : dotColor}`
        }} />
      ))}
    </AbsoluteFill>
  );
};
