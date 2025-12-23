import React, { useState, useRef, useEffect } from 'react';
import { useTamagotchi } from './hooks/useTamagotchi';
import { PetSprite, PoopSprite } from './components/PetSprite';
import { PetStage, GameAction, GameType, ActionState } from './types';
import { generatePetThought } from '@/services/chatService';

// --- SOUND SYSTEM ---
const playSound = (type: 'select' | 'confirm' | 'cancel') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  
  if (type === 'select') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'confirm') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'cancel') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  }
};

const POMODORO_TIME = 15 * 60; // 15 mins

const App: React.FC = () => {
  const { pet, hatch, interact, setChatMessage, chatMessage, gameState, startGame, stopGame, gameInput, setPaused, boostHappiness } = useTamagotchi();
  const [selectedIcon, setSelectedIcon] = useState<number>(0);
  const [showFoodMenu, setShowFoodMenu] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);

  // Pomodoro State
  const [pomoTime, setPomoTime] = useState(POMODORO_TIME);
  const [isPomoRunning, setIsPomoRunning] = useState(false);

  // Sync Timer with Pet Metabolism
  useEffect(() => {
    setPaused(isPomoRunning);
  }, [isPomoRunning, setPaused]);

  useEffect(() => {
    let interval: any;
    if (isPomoRunning && pomoTime > 0) {
      interval = setInterval(() => {
        setPomoTime(prev => prev - 1);
      }, 1000);
    } else if (pomoTime === 0 && isPomoRunning) {
      // Timer Finished Logic
      setIsPomoRunning(false);
      playSound('confirm');
      boostHappiness();
      setChatMessage("Good Job! ❤️");
      setTimeout(() => setChatMessage(null), 3000);
    }
    return () => clearInterval(interval);
  }, [isPomoRunning, pomoTime, boostHappiness, setChatMessage]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const togglePomo = () => setIsPomoRunning(!isPomoRunning);
  const resetPomo = () => {
    setIsPomoRunning(false);
    setPomoTime(POMODORO_TIME);
  };
  
  // Custom Faceplate State
  const [skinImage, setSkinImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // English Icons
  const icons = [
    { id: GameAction.FEED, label: 'FEED', icon: '🍗' },
    { id: GameAction.LIGHT, label: 'SLEEP', icon: '💡' },
    { id: GameAction.PLAY, label: 'PLAY', icon: '🎾' },
    { id: GameAction.MEDICINE, label: 'HEAL', icon: '💊' },
    { id: GameAction.BATH, label: 'BATH', icon: '🚿' },
    { id: GameAction.STATS, label: 'STATS', icon: '📊' },
    { id: GameAction.CHAT, label: 'CHAT', icon: '💬' },
  ];

  const foods = [
    { name: 'Fish', icon: '🐟', value: 30 },
    { name: 'Milk', icon: '🥛', value: 15 },
    { name: 'Meat', icon: '🍗', value: 40 },
    { name: 'Cookie', icon: '🍪', value: 10 },
  ];
  
  const games = [
    { type: GameType.SNAKE, name: 'SNAKE' },
    { type: GameType.DODGE, name: 'ROCKET' },
  ];

  const [selectedFoodIndex, setSelectedFoodIndex] = useState(0);

  // --- BACKGROUND SCENE LOGIC ---
  const getBackgroundImage = () => {
    // EGG stage always uses default living room background
    if (pet.stage === PetStage.EGG) return '/scene_living.png';

    // KITCHEN: Eating or Menu
    if (showFoodMenu || pet.actionState === ActionState.EATING) {
      return '/scene_kitchen.png';
    }

    // BATHROOM: Bathing, Stats, or selected icons for Bath/Stats
    const currentAction = icons[selectedIcon]?.id;
    if (pet.actionState === ActionState.BATHING || currentAction === GameAction.BATH || currentAction === GameAction.STATS) {
      return '/scene_bathroom.png';
    }

    // LIVING ROOM: Default for Play, Chat, Sleep, Medicine
    return '/scene_living.png';
  };

  const bgImage = getBackgroundImage();

  // --- HANDLERS ---

  const handleSkinUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSkinImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetSkin = () => {
    setSkinImage(null);
  };

  const handleBtnA = () => {
    playSound('select');
    if (gameState.active && !gameState.gameOver) {
       gameInput('LEFT');
       return;
    }
    if (showFoodMenu) {
       setSelectedFoodIndex(prev => (prev + 1) % foods.length);
       return;
    }
    if (showGameMenu) {
       setSelectedGameIndex(prev => (prev + 1) % games.length);
       return;
    }
    setSelectedIcon((prev) => (prev + 1) % icons.length);
  };

  const handleBtnB = async () => {
    playSound('confirm');
    
    // In Game Actions
    if (gameState.active) {
       if (gameState.gameOver) stopGame();
       return;
    }

    // Sub Menus
    if (showFoodMenu) {
       interact(GameAction.FEED, foods[selectedFoodIndex].value);
       setShowFoodMenu(false);
       return;
    }

    if (showGameMenu) {
       startGame(games[selectedGameIndex].type);
       setShowGameMenu(false);
       return;
    }

    // Main Menu
    const action = icons[selectedIcon].id;
    if (pet.stage === PetStage.EGG || pet.stage === PetStage.GHOST) {
        hatch();
        return;
    }

    switch (action) {
      case GameAction.FEED: setShowFoodMenu(true); break;
      case GameAction.PLAY: setShowGameMenu(true); break;
      case GameAction.CHAT:
        setChatMessage("Meow...");
        const thought = await generatePetThought(pet);
        setChatMessage(thought);
        setTimeout(() => setChatMessage(null), 4000);
        break;
      default: interact(action); break;
    }
  };

  const handleBtnC = () => {
    playSound('cancel');
    if (gameState.active && !gameState.gameOver) {
      gameInput('RIGHT');
      return;
    }
    if (showFoodMenu) {
      setShowFoodMenu(false);
      return;
    }
    if (showGameMenu) {
      setShowGameMenu(false);
      return;
    }
    setChatMessage(null);
  };

  const isStats = icons[selectedIcon].id === GameAction.STATS;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleSkinUpload} 
        className="hidden" 
        accept="image/*"
      />
      
      {/* Skin Controls */}
      <div className="fixed top-4 right-4 flex flex-col gap-2 z-50 items-end">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition-all border-2 border-white/20 font-sans tracking-wide"
        >
          CHANGE SKIN
        </button>
        
        <button 
          onClick={resetSkin}
          disabled={!skinImage}
          className={`px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition-all border-2 border-white/20 font-sans tracking-wide ${skinImage ? 'bg-[#93C5FD] hover:bg-[#60A5FA] text-blue-900 cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'}`}
        >
          DEFAULT SKIN
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 relative z-50">
        
        {/* POMODORO TIMER */}
        <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border-2 border-[#957DAD] shadow-sm flex items-center gap-4 relative z-50">
          <span className="font-mono text-[#555] font-bold">FOCUS</span>
          <span className="font-mono text-xl font-bold text-[#2d2d2d] w-20 text-center">{formatTime(pomoTime)}</span>
          <button onClick={togglePomo} className="text-xs bg-green-200 hover:bg-green-300 px-2 py-1 rounded text-green-800 font-bold">
            {isPomoRunning ? 'PAUSE' : 'START'}
          </button>
          <button onClick={resetPomo} className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700 font-bold">R</button>
        </div>

        {/* --- DEVICE CONTAINER --- */}
        <div className="relative w-[520px] h-[640px] shrink-0 z-50" style={{ position: 'relative', zIndex: 50 }}>
          
          {/* 1. OUTER SHELL */}
          <div className="absolute inset-0 bg-[#E0BBE4] rounded-[55%_55%_50%_50%] shadow-[0px_25px_50px_rgba(0,0,0,0.4),inset_-5px_-5px_20px_rgba(0,0,0,0.1),inset_5px_5px_20px_rgba(255,255,255,0.8)] border-4 border-white/60"></div>

          {/* 2. FACEPLATE */}
          <div 
            className="absolute top-4 left-4 right-4 bottom-4 rounded-[50%_50%_45%_45%] overflow-hidden shadow-inner border-[3px] border-white/30"
            style={{
              background: skinImage ? `url(${skinImage}) center/cover no-repeat` : 'linear-gradient(135deg, #D4C1EC 0%, #F3D1F4 50%, #B8E1FF 100%)'
            }}
          >
            {!skinImage && (
              <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
            )}
          </div>

          {/* 3. SCREEN BEZEL & CONTENT */}
          <div className="absolute inset-0 flex flex-col items-center pt-28 pb-8">
            
            <div className="text-white/90 font-bold text-sm tracking-[0.2em] mb-3 drop-shadow-md z-10 font-sans">
              TAMAGOTCHI
            </div>

            {/* Screen Glass Effect */}
            <div className="relative w-[360px] h-[360px] bg-white rounded-[32px] p-[6px] shadow-[0_0_0_8px_rgba(255,255,255,0.6),0_10px_20px_rgba(0,0,0,0.2)] z-20">
              {/* The Actual Screen */}
              <div 
                className="w-full h-full border-2 border-gray-200 rounded-[26px] relative overflow-hidden flex flex-col justify-between pixel-shadow isolate transition-all duration-500"
                style={{
                  backgroundImage: `url(${bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#fdf0ff' // Fallback
                }}
              >
                
                {/* Grid Overlay (Optional: reduced opacity so image is visible) */}
                <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-multiply" 
                    style={{backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '4px 4px', zIndex: -1}}>
                </div>
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.05)] z-1 rounded-[26px]"></div>

                {/* TOP BAR */}
                <div className="relative z-10 w-full h-[48px] bg-white/60 backdrop-blur-sm border-b-2 border-black/5 flex items-center justify-between px-3 shrink-0">
                  {icons.slice(0, 4).map((icon, idx) => (
                    <IconItem 
                        key={icon.id} 
                        icon={icon.icon} 
                        label={icon.label}
                        selected={!gameState.active && !showFoodMenu && !showGameMenu && selectedIcon === idx} 
                    />
                  ))}
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 w-full flex flex-col items-center justify-center relative z-0 overflow-hidden">
                  
                  {/* Chat Bubble */}
                  {chatMessage && !gameState.active && (
                    <div className="absolute top-2 bg-white border-2 border-black p-2 rounded-lg text-xs text-center max-w-[200px] z-30 animate-bounce shadow-md">
                        {chatMessage}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-black border-r-[6px] border-r-transparent"></div>
                    </div>
                  )}

                  {/* Food Menu */}
                  {showFoodMenu && (
                    <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center p-4">
                        <h3 className="text-sm mb-6 font-bold text-gray-700">SELECT FOOD</h3>
                        <div className="flex gap-2 mb-4">
                          {foods.map((food, idx) => (
                            <div key={idx} className={`p-2 rounded-lg border-2 transition-all ${selectedFoodIndex === idx ? 'border-blue-400 bg-blue-50 scale-110 shadow-sm' : 'border-transparent opacity-60'}`}>
                                <div className="text-4xl">{food.icon}</div>
                            </div>
                          ))}
                        </div>
                        <div className="text-sm font-bold text-gray-600 bg-gray-100 px-4 py-1 rounded-full">{foods[selectedFoodIndex].name}</div>
                    </div>
                  )}

                  {/* Game Menu */}
                  {showGameMenu && (
                    <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center p-4">
                        <h3 className="text-sm mb-6 font-bold text-gray-700">SELECT GAME</h3>
                        <div className="flex flex-col gap-2 mb-4 w-full px-8">
                          {games.map((g, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border-2 text-center font-bold transition-all ${selectedGameIndex === idx ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-gray-200 opacity-60'}`}>
                                {g.name}
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] text-gray-400">PRESS B TO START</div>
                    </div>
                  )}

                  {/* Game/Pet View */}
                  {(pet.stage === PetStage.EGG || pet.stage === PetStage.GHOST) ? (
                      <div className="flex flex-col items-center w-full h-full justify-center pb-4 relative" style={{ zIndex: 20 }}>
                        <PetSprite stage={pet.stage} character={pet.character} actionState={pet.actionState} isSick={false} gameState={gameState} />
                        <p className="absolute bottom-8 text-xs text-gray-700 font-bold animate-pulse bg-white/80 px-2 py-1 rounded" style={{ zIndex: 30 }}>
                          {pet.stage === PetStage.EGG ? "PRESS B TO HATCH" : "GAME OVER (PRESS B)"}
                        </p>
                      </div>
                  ) : (
                      <>
                        {!gameState.active && (
                          <div className="absolute bottom-4 left-4 flex gap-1 z-10">
                            {Array.from({length: pet.poopCount}).map((_, i) => (
                              <PoopSprite key={i} />
                            ))}
                          </div>
                        )}

                        {isStats && selectedIcon === 5 && !gameState.active ? (
                          <div className="w-full h-full bg-[#fffcf0] absolute inset-0 z-20 flex flex-col p-6 text-sm text-gray-800 font-mono gap-4 overflow-hidden">
                            <div className="flex justify-between items-center border-b-2 border-gray-200 pb-2">
                              <span className="font-bold">AGE</span> 
                              <span>{Math.floor(pet.age)} YRS</span>
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs text-gray-500">HUNGER</div>
                              <div className="w-full bg-gray-200 h-4 rounded-full border border-gray-300 overflow-hidden relative">
                                <div style={{width: `${pet.hunger}%`}} className="h-full bg-green-400 transition-all duration-500"></div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs text-gray-500">HAPPY</div>
                              <div className="w-full bg-gray-200 h-4 rounded-full border border-gray-300 overflow-hidden relative">
                                <div style={{width: `${pet.happiness}%`}} className="h-full bg-pink-400 transition-all duration-500"></div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs text-gray-500">HEALTH</div>
                              <div className="w-full bg-gray-200 h-4 rounded-full border border-gray-300 overflow-hidden relative">
                                <div style={{width: `${pet.health}%`}} className="h-full bg-blue-400 transition-all duration-500"></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full flex items-center justify-center" style={{ zIndex: 20, paddingTop: '75px' }}>
                            <PetSprite 
                              stage={pet.stage} 
                              character={pet.character} 
                              actionState={pet.actionState}
                              isSick={pet.isSick}
                              gameState={gameState}
                            />
                          </div>
                        )}
                      </>
                  )}
                </div>

                {/* BOTTOM BAR */}
                <div className="relative z-10 w-full h-[48px] bg-white/60 backdrop-blur-sm border-t-2 border-black/5 flex items-center justify-between px-5 shrink-0">
                  {icons.slice(4).map((icon, idx) => (
                    <IconItem 
                        key={icon.id} 
                        icon={icon.icon} 
                        label={icon.label}
                        selected={!gameState.active && !showFoodMenu && !showGameMenu && selectedIcon === idx + 4} 
                    />
                  ))}
                </div>

              </div>
            </div>

            {/* BUTTONS - Fixed position */}
            <div className="absolute bottom-4 w-full flex justify-center gap-10 z-20">
              <Button label="A" subLabel={gameState.active ? "LEFT" : "SELECT"} onClick={handleBtnA} color="bg-gradient-to-br from-pink-400 to-pink-600" />
              <Button label="B" subLabel={gameState.active ? "EXIT" : "OK"} onClick={handleBtnB} color="bg-gradient-to-br from-yellow-300 to-yellow-500" size="large" />
              <Button label="C" subLabel={gameState.active ? "RIGHT" : "CANCEL"} onClick={handleBtnC} color="bg-gradient-to-br from-pink-400 to-pink-600" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const IconItem: React.FC<{icon: string, label: string, selected: boolean}> = ({icon, label, selected}) => (
  <div className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${selected ? 'opacity-100 scale-110' : 'opacity-50'}`}>
     <div className={`text-2xl ${selected ? 'drop-shadow-md' : 'grayscale'}`}>
       {icon}
     </div>
     {selected && <div className="absolute -bottom-1 w-10 h-1 bg-black/20 rounded-full"></div>}
  </div>
);

const Button: React.FC<{ label: string, subLabel: string, onClick: () => void, color: string, size?: 'normal' | 'large' }> = ({ label, subLabel, onClick, color, size = 'normal' }) => {
  const sizeClasses = size === 'large' ? 'w-16 h-16 mt-6' : 'w-14 h-14';
  return (
    <div className="flex flex-col items-center gap-1 group">
      <button 
        onClick={onClick}
        className={`${sizeClasses} rounded-full ${color} shadow-[0_4px_0_rgba(0,0,0,0.3),0_8px_10px_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_rgba(0,0,0,0.3)] active:translate-y-1 transition-all border-2 border-white/40 ring-2 ring-white/20`}
      >
        <div className="w-1/2 h-1/2 bg-gradient-to-br from-white/60 to-transparent rounded-full ml-1 mt-1"></div>
      </button>
      <div className="flex flex-col items-center mt-1">
         <span className="text-[10px] text-white/90 font-bold drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity">{subLabel}</span>
      </div>
    </div>
  );
}

export default App;