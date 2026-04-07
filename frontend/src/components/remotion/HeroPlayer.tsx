import React from 'react';
import { Player } from '@remotion/player';
import { SimulationHero } from './SimulationHero';

interface HeroPlayerProps {
  width?: number | string;
  height?: number | string;
}

export const HeroPlayer: React.FC<HeroPlayerProps> = ({ width = '100%', height = '100%' }) => {
  return (
    <div style={{ width, height, position: 'relative' }}>
      <Player
        component={SimulationHero}
        inputProps={{
          accentColor: '#FF4500', // Laranja MiroFish
          dotColor: '#666666'
        }}
        durationInFrames={300}
        fps={30}
        compositionWidth={500}
        compositionHeight={500}
        style={{
          width: '100%',
          height: '100%',
          opacity: 0.9
        }}
        autoPlay
        loop
        controls={false}
      />
    </div>
  );
};
