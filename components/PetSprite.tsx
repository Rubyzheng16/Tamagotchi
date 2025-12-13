import React from 'react';
import { PetStage, PetCharacter, ActionState, GameState, GameType } from '../types';

interface PetSpriteProps {
  stage: PetStage;
  character: PetCharacter;
  actionState: ActionState;
  isSick: boolean;
  gameState: GameState;
  className?: string;
}

const PixelSvg: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <svg viewBox="0 0 32 32" className={`w-48 h-48 image-pixelated ${className}`} style={{ zIndex: 10, position: 'relative' }} shapeRendering="crispEdges">
    {children}
  </svg>
);

const Rect: React.FC<{ x: number; y: number; w?: number; h?: number; fill?: string; className?: string }> = ({ x, y, w = 1, h = 1, fill = 'currentColor', className }) => (
  <rect x={x} y={y} width={w} height={h} fill={fill} className={className} />
);

// --- Game Renderers ---

const SnakeGameView: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const GRID_SIZE = 16;
  return (
    <g>
      {/* Game boundary - visible border to show play area */}
      <rect x="0" y="0" width={GRID_SIZE * 2} height={GRID_SIZE * 2} fill="none" stroke="#999" strokeWidth="0.3" />
      {/* Snake Body */}
      {gameState.snake.map((p, i) => (
        <Rect key={i} x={p.x * 2} y={p.y * 2} w={2} h={2} fill="#2d2d2d" />
      ))}
      {/* Food */}
      <Rect x={gameState.food.x * 2} y={gameState.food.y * 2} w={2} h={2} fill="#ff0000" />
    </g>
  );
};

const DodgeGameView: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  // 3 Lanes. Center X coords: 5, 16, 27
  const getLaneX = (lane: number) => {
      if (lane === 0) return 5;
      if (lane === 1) return 16;
      return 27;
  };

  return (
    <g>
      {/* Lane Markers */}
      <Rect x={10} y={0} w={0.5} h={32} fill="#ddd" />
      <Rect x={21} y={0} w={0.5} h={32} fill="#ddd" />

      {/* Rocket - original size */}
      <text 
        x={getLaneX(gameState.rocketLane)} 
        y={28} 
        textAnchor="middle" 
        fontSize="6" 
        className="animate-pulse"
      >🚀</text>

      {/* Asteroids - original size */}
      {gameState.asteroids.map((a, i) => {
         // Map logic Y (0-20) to SVG Y (0-30 approx)
         // Logic Y max 20, SVG max 32. 
         const renderY = (a.y / 20) * 32; 
         return (
            <text key={i} x={getLaneX(a.lane)} y={renderY} textAnchor="middle" fontSize="6">🪨</text>
         );
      })}
    </g>
  );
};

const GameOverlay: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  // For DODGE game, use larger viewBox to fill the screen
  if (gameState.gameType === GameType.DODGE) {
    return (
      <svg viewBox="0 0 32 32" className="w-[140%] h-[140%] image-pixelated" style={{ zIndex: 10, position: 'relative', margin: '-20% -20% -20% -20%', marginTop: '-35%' }} shapeRendering="crispEdges">
        {/* Background Grid - larger white canvas, centered and shifted up */}
        <rect x="-4" y="-4" width="40" height="40" fill="#f8fafc" />
        <g opacity="0.1">
          {Array.from({length: 16}).map((_, i) => (
            <React.Fragment key={i}>
              <Rect x={0} y={i * 2} w={32} h={0.1} fill="#000" />
              <Rect x={i * 2} y={0} w={0.1} h={32} fill="#000" />
            </React.Fragment>
          ))}
        </g>

        <DodgeGameView gameState={gameState} />

        {gameState.gameOver && (
          <g>
            <rect x="4" y="10" width="24" height="12" fill="white" stroke="black" strokeWidth="1" />
            <text x="16" y="16" textAnchor="middle" fontSize="4" fontFamily="monospace" fill="black" fontWeight="bold">GAME OVER</text>
            <text x="16" y="20" textAnchor="middle" fontSize="3" fontFamily="monospace" fill="#555">SCORE: {gameState.score}</text>
          </g>
        )}
      </svg>
    );
  }
  
  // For SNAKE game, use larger viewBox to fill the screen
  if (gameState.gameType === GameType.SNAKE) {
    return (
      <svg viewBox="0 0 32 32" className="w-[140%] h-[140%] image-pixelated" style={{ zIndex: 10, position: 'relative', margin: '-20% -20% -20% -20%', marginTop: '-35%' }} shapeRendering="crispEdges">
        {/* Background Grid - larger white canvas, centered and shifted up more */}
        <rect x="-4" y="-4" width="40" height="40" fill="#f8fafc" />
        {/* Visible border for game area (0-32 corresponds to GRID_SIZE 16 * 2) */}
        <rect x="0" y="0" width="32" height="32" fill="none" stroke="#ddd" strokeWidth="0.5" />
        <g opacity="0.1">
          {Array.from({length: 16}).map((_, i) => (
            <React.Fragment key={i}>
              <Rect x={0} y={i * 2} w={32} h={0.1} fill="#000" />
              <Rect x={i * 2} y={0} w={0.1} h={32} fill="#000" />
            </React.Fragment>
          ))}
        </g>

        <SnakeGameView gameState={gameState} />

        {gameState.gameOver && (
          <g>
            <rect x="4" y="10" width="24" height="12" fill="white" stroke="black" strokeWidth="1" />
            <text x="16" y="16" textAnchor="middle" fontSize="4" fontFamily="monospace" fill="black" fontWeight="bold">GAME OVER</text>
            <text x="16" y="20" textAnchor="middle" fontSize="3" fontFamily="monospace" fill="#555">SCORE: {gameState.score}</text>
          </g>
        )}
      </svg>
    );
  }
  
  return (
    <PixelSvg>
       {/* Background Grid */}
       <rect x="0" y="0" width="32" height="32" fill="#f8fafc" />
       <g opacity="0.1">
         {Array.from({length: 16}).map((_, i) => (
           <React.Fragment key={i}>
             <Rect x={0} y={i * 2} w={32} h={0.1} fill="#000" />
             <Rect x={i * 2} y={0} w={0.1} h={32} fill="#000" />
           </React.Fragment>
         ))}
       </g>

       {gameState.gameType === GameType.SNAKE && <SnakeGameView gameState={gameState} />}
       {gameState.gameType === GameType.DODGE && <DodgeGameView gameState={gameState} />}

       {gameState.gameOver && (
        <g>
           <rect x="4" y="10" width="24" height="12" fill="white" stroke="black" strokeWidth="1" />
           <text x="16" y="16" textAnchor="middle" fontSize="4" fontFamily="monospace" fill="black" fontWeight="bold">GAME OVER</text>
           <text x="16" y="20" textAnchor="middle" fontSize="3" fontFamily="monospace" fill="#555">SCORE: {gameState.score}</text>
        </g>
      )}
    </PixelSvg>
  );
};

export const PetSprite: React.FC<PetSpriteProps> = ({ stage, character, actionState, isSick, gameState, className = '' }) => {
  
  if (actionState === ActionState.PLAYING_GAME && gameState.active) {
    return <GameOverlay gameState={gameState} />;
  }

  // EGG STAGE - Moved down
  if (stage === PetStage.EGG) {
    return (
      <div className="relative" style={{ zIndex: 20 }}>
        <PixelSvg className={`${className} animate-bounce`} style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}>
          <g fill="#2d2d2d" transform="translate(0, 4)">
            <Rect x={12} y={10} w={8} h={1} />
            <Rect x={10} y={11} w={2} h={1} />
            <Rect x={20} y={11} w={2} h={1} />
            <Rect x={9} y={12} w={1} h={8} />
            <Rect x={22} y={12} w={1} h={8} />
            <Rect x={10} y={20} w={2} h={1} />
            <Rect x={20} y={20} w={2} h={1} />
            <Rect x={12} y={21} w={8} h={1} />
            {/* Decor */}
            <Rect x={14} y={14} w={1} h={1} />
            <Rect x={17} y={16} w={1} h={1} />
          </g>
        </PixelSvg>
      </div>
    );
  }

  // GHOST STAGE
  if (stage === PetStage.GHOST) {
    return (
      <PixelSvg className={`${className} opacity-50`}>
         <g fill="#000">
           <Rect x={12} y={10} w={8} h={1} />
           <Rect x={10} y={12} w={1} h={10} />
           <Rect x={21} y={12} w={1} h={10} />
           {/* Eyes */}
           <Rect x={13} y={15} w={2} h={2} />
           <Rect x={17} y={15} w={2} h={2} />
           {/* Tail */}
           <Rect x={12} y={23} w={1} h={2} />
           <Rect x={19} y={23} w={1} h={2} />
         </g>
      </PixelSvg>
    );
  }

  // --- CAT CONSTRUCTION ---
  const isSleeping = actionState === ActionState.SLEEPING;
  const isEating = actionState === ActionState.EATING;
  const isBathing = actionState === ActionState.BATHING;

  const Body = (
    <g fill="#2d2d2d">
      {/* Ears */}
      <Rect x={11} y={10} w={2} h={3} />
      <Rect x={19} y={10} w={2} h={3} />
      
      {/* Head Main */}
      <Rect x={10} y={13} w={12} h={8} />
      <Rect x={9} y={15} w={1} h={5} />
      <Rect x={22} y={15} w={1} h={5} />

      {/* Body Lower */}
      <Rect x={11} y={21} w={10} h={3} />
      {/* Legs */}
      <Rect x={11} y={24} w={2} h={1} />
      <Rect x={19} y={24} w={2} h={1} />

      {/* Tail (Curled up) */}
      <Rect x={22} y={20} w={2} h={1} />
      <Rect x={23} y={18} w={1} h={2} />
    </g>
  );

  const FaceDetails = (
    <g>
      {/* Eyes with Blinking */}
      {isSleeping ? (
        <>
          <Rect x={12} y={16} w={3} h={1} fill="#fff" />
          <Rect x={17} y={16} w={3} h={1} fill="#fff" />
        </>
      ) : (
        <>
           {/* White Eye Background */}
           <Rect x={12} y={16} w={2} h={2} fill="#fff" className="animate-blink" />
           <Rect x={18} y={16} w={2} h={2} fill="#fff" className="animate-blink" />
        </>
      )}

      {/* Mouth */}
      {!isSleeping && (
         isEating ? (
           // Eating Animation: Mouth Open
           <Rect x={15} y={19} w={2} h={2} fill="#ffaaaa" /> 
         ) : (
           // Normal Mouth
           <Rect x={15} y={19} w={2} h={1} fill="#ffaaaa" /> 
         )
      )}
    </g>
  );

  const Whiskers = (
    <g fill="#2d2d2d">
       <Rect x={8} y={17} w={2} h={1} />
       <Rect x={8} y={19} w={2} h={1} />
       <Rect x={22} y={17} w={2} h={1} />
       <Rect x={22} y={19} w={2} h={1} />
    </g>
  );

  return (
    <PixelSvg className={`${className} ${isSick ? 'animate-pulse' : (isEating ? 'animate-bounce' : '')}`}>
      {Body}
      {FaceDetails}
      {Whiskers}
      
      {/* Sickness Indicator */}
      {isSick && <Rect x={24} y={10} w={3} h={3} fill="#ff0000" />}

      {/* Bathing Animation Overlay */}
      {isBathing && (
         <g className="animate-pulse">
           {/* Shower Head */}
           <Rect x={20} y={4} w={8} h={2} fill="#999" />
           <Rect x={22} y={6} w={4} h={1} fill="#999" />
           {/* Drops */}
           <Rect x={14} y={8} w={1} h={2} fill="#3b82f6" />
           <Rect x={18} y={12} w={1} h={2} fill="#3b82f6" />
           <Rect x={12} y={16} w={1} h={2} fill="#3b82f6" />
           <Rect x={22} y={14} w={1} h={2} fill="#3b82f6" />
         </g>
      )}

      {/* Eating Animation Overlay */}
      {isEating && (
         <g>
           <text x="24" y="24" fontSize="10">🐟</text>
         </g>
      )}

      {/* Sleeping Zzz */}
      {isSleeping && (
        <g className="animate-pulse" fill="#000">
           <text x="24" y="10" fontSize="8">Z</text>
           <text x="28" y="6" fontSize="8">z</text>
        </g>
      )}
    </PixelSvg>
  );
};

export const PoopSprite: React.FC = () => (
  <PixelSvg className="w-8 h-8 opacity-90">
    <g fill="#5A4A42">
       <Rect x={14} y={26} w={6} h={2} />
       <Rect x={15} y={24} w={4} h={2} />
       <Rect x={16} y={22} w={2} h={2} />
       {/* Flies */}
       <Rect x={14} y={20} w={1} h={1} fill="#000" />
       <Rect x={18} y={21} w={1} h={1} fill="#000" />
    </g>
  </PixelSvg>
);