import React, { useState } from 'react';
import { useTamagotchi } from './hooks/useTamagotchi';
import { PetSprite, PoopSprite } from './components/PetSprite';
import { PetStage, GameAction, ActionState } from './types';
import { generatePetThought } from './services/geminiService';

const App: React.FC = () => {
  const { pet, hatch, interact, setChatMessage, chatMessage, gameState, startGame, stopGame, gameInput } = useTamagotchi();
  const [selectedIcon, setSelectedIcon] = useState<number>(0);
  const [showFoodMenu, setShowFoodMenu] = useState(false);

  // Icon definitions (Chinese)
  const icons = [
    { id: GameAction.FEED, label: '进食', icon: '🍗' },
    { id: GameAction.LIGHT, label: '睡眠', icon: '💡' },
    { id: GameAction.PLAY, label: '娱乐', icon: '🎾' },
    { id: GameAction.MEDICINE, label: '治疗', icon: '💊' },
    { id: GameAction.BATH, label: '清洁', icon: '🚿' },
    { id: GameAction.STATS, label: '状态', icon: '📊' },
    { id: GameAction.CHAT, label: '聊天', icon: '💬' },
  ];

  const foods = [
    { name: '鱼', icon: '🐟', value: 30 },
    { name: '牛奶', icon: '🥛', value: 15 },
    { name: '鸡腿', icon: '🍗', value: 40 },
    { name: '饼干', icon: '🍪', value: 10 },
  ];
  const [selectedFoodIndex, setSelectedFoodIndex] = useState(0);

  // --- BUTTON HANDLERS ---

  const handleBtnA = () => {
    if (gameState.active && !gameState.gameOver) {
       // Game Mode: Turn Left
       gameInput('LEFT');
       return;
    }

    if (showFoodMenu) {
       // Menu Mode: Cycle Food
       setSelectedFoodIndex(prev => (prev + 1) % foods.length);
       return;
    }
    
    // Normal Mode: Cycle Icons
    setSelectedIcon((prev) => (prev + 1) % icons.length);
  };

  const handleBtnB = async () => {
    if (gameState.active) {
       if (gameState.gameOver) stopGame(); // Exit game
       return;
    }

    if (showFoodMenu) {
       // Confirm Food
       interact(GameAction.FEED, foods[selectedFoodIndex].value);
       setShowFoodMenu(false);
       return;
    }

    // --- Main Interactions ---
    const action = icons[selectedIcon].id;
    
    if (pet.stage === PetStage.EGG || pet.stage === PetStage.GHOST) {
        hatch();
        return;
    }

    switch (action) {
      case GameAction.FEED:
        setShowFoodMenu(true);
        break;
      case GameAction.PLAY:
        startGame();
        break;
      case GameAction.CHAT:
        setChatMessage("喵...");
        const thought = await generatePetThought(pet);
        setChatMessage(thought);
        setTimeout(() => setChatMessage(null), 4000);
        break;
      default:
        interact(action);
        break;
    }
  };

  const handleBtnC = () => {
    if (gameState.active && !gameState.gameOver) {
      // Game Mode: Turn Right
      gameInput('RIGHT');
      return;
    }

    if (showFoodMenu) {
      setShowFoodMenu(false);
      return;
    }

    setChatMessage(null);
  };

  const isStats = icons[selectedIcon].id === GameAction.STATS;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

      {/* DEVICE SHELL - Enlarged */}
      <div className="relative w-[420px] h-[520px] rounded-[50%_50%_45%_45%] 
                      bg-gradient-to-br from-[#D4C1EC] via-[#F3D1F4] to-[#B8E1FF] 
                      shadow-[0px_20px_40px_rgba(150,100,200,0.5),inset_-5px_-5px_15px_rgba(255,255,255,0.6)]
                      flex flex-col items-center pt-14 pb-8 border-4 border-white/40 ring-4 ring-[#E0BBE4]/50">
        
        <div className="text-[#957DAD] font-bold text-sm tracking-widest mb-4 opacity-80">
          TAMAGOTCHI
        </div>

        {/* SCREEN AREA - Enlarged */}
        <div className="relative w-[300px] h-[300px] bg-white rounded-3xl p-5 shadow-inner border-4 border-[#E0BBE4]">
          
          <div className="w-full h-full bg-[#fdf0ff] border-2 border-gray-200 rounded-xl relative overflow-hidden flex flex-col justify-between pixel-shadow">
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-10" 
                 style={{backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '4px 4px', zIndex: 0}}>
            </div>

            {/* TOP BAR - Water Blue Background */}
            <div className="relative z-10 w-full h-[48px] bg-sky-200 border-b-2 border-black/10 flex items-center justify-between px-3 shrink-0">
              {icons.slice(0, 4).map((icon, idx) => (
                 <IconItem 
                    key={icon.id} 
                    icon={icon.icon} 
                    label={icon.label}
                    selected={!gameState.active && !showFoodMenu && selectedIcon === idx} 
                 />
              ))}
            </div>

            {/* MAIN STAGE */}
            <div className="flex-1 w-full flex flex-col items-center justify-center relative z-0 overflow-hidden">
               
               {/* Chat Bubble */}
               {chatMessage && !gameState.active && (
                 <div className="absolute top-2 bg-white border-2 border-black p-2 rounded-lg text-xs text-center max-w-[200px] z-20 animate-bounce shadow-md">
                    {chatMessage}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-black border-r-[6px] border-r-transparent"></div>
                 </div>
               )}

               {/* FOOD MENU OVERLAY - Adjusted spacing */}
               {showFoodMenu && (
                 <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center p-4">
                    <h3 className="text-sm mb-6 font-bold text-gray-700">选择食物</h3>
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

               {/* GAME SCENE */}
               {(pet.stage === PetStage.EGG || pet.stage === PetStage.GHOST) ? (
                  <div className="flex flex-col items-center">
                     <PetSprite stage={pet.stage} character={pet.character} actionState={pet.actionState} isSick={false} gameState={gameState} />
                     <p className="mt-6 text-xs text-gray-500 blink font-bold animate-pulse">
                       {pet.stage === PetStage.EGG ? "按 B 键孵化" : "游戏结束 (按 B 键)"}
                     </p>
                  </div>
               ) : (
                  <>
                    {!gameState.active && (
                      <div className="absolute bottom-4 left-4 flex gap-1">
                        {Array.from({length: pet.poopCount}).map((_, i) => (
                          <PoopSprite key={i} />
                        ))}
                      </div>
                    )}

                    {isStats && selectedIcon === 5 && !gameState.active ? (
                      <div className="w-full h-full bg-[#fffcf0] absolute inset-0 z-20 flex flex-col p-6 text-sm text-gray-800 font-mono gap-4 overflow-y-auto">
                        <div className="flex justify-between items-center border-b-2 border-gray-200 pb-2">
                          <span className="font-bold">年龄</span> 
                          <span>{Math.floor(pet.age)} 岁</span>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs text-gray-500">饥饿度</div>
                          <div className="w-full bg-gray-200 h-4 rounded-full border border-gray-300 overflow-hidden relative">
                             <div style={{width: `${pet.hunger}%`}} className="h-full bg-green-400 transition-all duration-500"></div>
                             {/* Grid lines for retro feel */}
                             <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqkG4kGCsCpCl8OoF+QAAYCASN7M74hoAAAAASUVORK5CYII=')] opacity-20"></div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs text-gray-500">心情</div>
                          <div className="w-full bg-gray-200 h-4 rounded-full border border-gray-300 overflow-hidden relative">
                            <div style={{width: `${pet.happiness}%`}} className="h-full bg-pink-400 transition-all duration-500"></div>
                            <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqkG4kGCsCpCl8OoF+QAAYCASN7M74hoAAAAASUVORK5CYII=')] opacity-20"></div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs text-gray-500">健康</div>
                          <div className="w-full bg-gray-200 h-4 rounded-full border border-gray-300 overflow-hidden relative">
                            <div style={{width: `${pet.health}%`}} className="h-full bg-blue-400 transition-all duration-500"></div>
                            <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqkG4kGCsCpCl8OoF+QAAYCASN7M74hoAAAAASUVORK5CYII=')] opacity-20"></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center">
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

            {/* BOTTOM BAR - Water Blue Background */}
            <div className="relative z-10 w-full h-[48px] bg-sky-200 border-t-2 border-black/10 flex items-center justify-between px-5 shrink-0">
              {icons.slice(4).map((icon, idx) => (
                 <IconItem 
                    key={icon.id} 
                    icon={icon.icon} 
                    label={icon.label}
                    selected={!gameState.active && !showFoodMenu && selectedIcon === idx + 4} 
                 />
              ))}
            </div>

          </div>
        </div>

        {/* BUTTONS - Enlarged */}
        <div className="mt-auto mb-6 w-full flex justify-center gap-8">
          <Button label="A" subLabel={gameState.active ? "左转" : "选择"} onClick={handleBtnA} color="bg-pink-400" />
          <Button label="B" subLabel={gameState.active ? "退出" : "确认"} onClick={handleBtnB} color="bg-yellow-400" size="large" />
          <Button label="C" subLabel={gameState.active ? "右转" : "取消"} onClick={handleBtnC} color="bg-pink-400" />
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
  const sizeClasses = size === 'large' ? 'w-16 h-16 mt-4' : 'w-12 h-12';
  return (
    <div className="flex flex-col items-center gap-1">
      <button 
        onClick={onClick}
        className={`${sizeClasses} rounded-full ${color} shadow-[0_6px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all border-4 border-white/50 ring-1 ring-black/10`}
      ></button>
      <div className="flex flex-col items-center">
         <span className="text-xs font-bold text-purple-800 opacity-60">{label}</span>
         <span className="text-[10px] text-purple-800 opacity-40">{subLabel}</span>
      </div>
    </div>
  );
}

export default App;