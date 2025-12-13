import { useState, useEffect, useCallback, useRef } from 'react';
import { PetState, PetStage, PetCharacter, GameAction, ActionState, GameState, GameType } from '../types';

const INITIAL_STATE: PetState = {
  stage: PetStage.EGG,
  character: PetCharacter.UNKNOWN,
  age: 0,
  weight: 5,
  hunger: 80,
  happiness: 80,
  health: 100,
  poopCount: 0,
  isSick: false,
  actionState: ActionState.IDLE,
  birthTime: Date.now(),
};

const GRID_SIZE = 16; 

export const useTamagotchi = () => {
  const [pet, setPet] = useState<PetState>(INITIAL_STATE);
  const [chatMessage, setChatMessage] = useState<string | null>(null);
  
  // Ref to control metabolism pausing without re-triggering effects
  const isPausedRef = useRef(false);

  const setPaused = useCallback((paused: boolean) => {
    isPausedRef.current = paused;
  }, []);

  const boostHappiness = useCallback(() => {
    setPet(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 15),
      hunger: Math.min(100, prev.hunger + 5) // A little snack too
    }));
  }, []);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    active: false,
    gameType: GameType.SNAKE,
    score: 0,
    gameOver: false,
    // Snake
    snake: [{x: 5, y: 5}],
    food: {x: 10, y: 8},
    direction: {x: 1, y: 0},
    // Dodge
    rocketLane: 1,
    asteroids: [],
  });

  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // --- Main Pet Loop (Metabolism) ---
  useEffect(() => {
    // Significantly slower tick rate: 15 seconds
    const tickRate = 15000; 
    
    const interval = setInterval(() => {
      // Skip if paused (Pomodoro running)
      if (isPausedRef.current) return;

      setPet(prev => {
        if (prev.stage === PetStage.EGG || prev.stage === PetStage.GHOST || prev.actionState === ActionState.PLAYING_GAME) return prev;

        let decay = prev.actionState === ActionState.SLEEPING ? 0.2 : 0.5;

        let newHunger = Math.max(0, prev.hunger - decay); 
        let newHappiness = Math.max(0, prev.happiness - decay);
        let newHealth = prev.health;
        let newPoop = prev.poopCount;
        let newSick = prev.isSick;
        let newAge = prev.age + 0.005; 

        if (prev.actionState !== ActionState.SLEEPING && Math.random() < 0.02) {
          newPoop = Math.min(4, prev.poopCount + 1);
        }

        if (prev.poopCount > 3 || newHunger < 10 || newHappiness < 10) {
          if (Math.random() < 0.1) newSick = true;
        }
        if (newSick) {
          newHealth = Math.max(0, prev.health - 1);
          newHappiness = Math.max(0, newHappiness - 1);
        }

        let newStage: PetStage = prev.stage;
        let newChar = prev.character;

        if (prev.stage === PetStage.BABY && newAge > 0.1) {
           newStage = PetStage.CHILD;
           newChar = PetCharacter.CAT; 
        }

        if (newHealth <= 0) {
          newStage = PetStage.GHOST;
        }

        return {
          ...prev,
          hunger: newHunger,
          happiness: newHappiness,
          health: newHealth,
          poopCount: newPoop,
          isSick: newSick,
          age: newAge,
          stage: newStage,
          character: newChar
        };
      });
    }, tickRate);

    return () => clearInterval(interval);
  }, []);

  // --- Unified Game Loop ---
  useEffect(() => {
    if (!gameState.active || gameState.gameOver) return;

    let loopSpeed = 200;
    if (gameState.gameType === GameType.DODGE) loopSpeed = 150; // Faster for Dodge

    const gameInterval = setInterval(() => {
      setGameState(prev => {
        if (prev.gameOver) return prev;

        // --- SNAKE LOGIC ---
        if (prev.gameType === GameType.SNAKE) {
            const head = prev.snake[0];
            const newHead = { x: head.x + prev.direction.x, y: head.y + prev.direction.y };

            if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE || prev.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
              return { ...prev, gameOver: true };
            }

            const newSnake = [newHead, ...prev.snake];
            let newScore = prev.score;
            let newFood = prev.food;

            if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
              newScore += 1;
              newFood = { x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1, y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1 };
            } else {
              newSnake.pop();
            }
            return { ...prev, snake: newSnake, score: newScore, food: newFood };
        }

        // --- DODGE LOGIC ---
        if (prev.gameType === GameType.DODGE) {
            // 1. Move asteroids down
            const movedAsteroids = prev.asteroids.map(a => ({ ...a, y: a.y + 1 }));
            
            // 2. Check collision
            // Rocket is at the bottom (say Y index 28-30 in a 32 grid, logically we map lanes to X)
            // Let's say logic grid is height 20. Rocket is at Y=18.
            const ROCKET_Y = 18;
            
            let collision = false;
            movedAsteroids.forEach(a => {
               if (a.y === ROCKET_Y && a.lane === prev.rocketLane) {
                   collision = true;
               }
            });

            if (collision) {
                return { ...prev, asteroids: movedAsteroids, gameOver: true };
            }

            // 3. Remove off-screen asteroids and score
            let newScore = prev.score;
            const remainingAsteroids = movedAsteroids.filter(a => {
                if (a.y > 20) {
                    newScore++;
                    return false;
                }
                return true;
            });

            // 4. Spawn new asteroids
            // Logic: drastically reduced to 8% chance per tick (was 25%)
            if (Math.random() < 0.08) {
                const lane = Math.floor(Math.random() * 3); // 0, 1, 2
                remainingAsteroids.push({ lane, y: 0 });
            }

            return { 
                ...prev, 
                asteroids: remainingAsteroids, 
                score: newScore 
            };
        }

        return prev;
      });
    }, loopSpeed);

    return () => clearInterval(gameInterval);
  }, [gameState.active, gameState.gameOver, gameState.gameType]);


  const hatch = useCallback(() => {
    if (pet.stage === PetStage.EGG) {
      setPet(prev => ({
        ...prev,
        stage: PetStage.BABY,
        character: PetCharacter.CAT,
        hunger: 80,
        happiness: 80
      }));
    } else if (pet.stage === PetStage.GHOST) {
       setPet(INITIAL_STATE);
    }
  }, [pet.stage]);

  // --- Game Inputs ---
  const gameInput = useCallback((key: 'LEFT' | 'RIGHT') => {
      setGameState(prev => {
         if (!prev.active || prev.gameOver) return prev;

         // SNAKE INPUT
         if (prev.gameType === GameType.SNAKE) {
             const { x, y } = prev.direction;
             let newDir = { x, y };
             if (key === 'LEFT') newDir = { x: y, y: -x };
             else newDir = { x: -y, y: x };
             return { ...prev, direction: newDir };
         }

         // DODGE INPUT
         if (prev.gameType === GameType.DODGE) {
             let newLane = prev.rocketLane;
             if (key === 'LEFT') newLane = Math.max(0, prev.rocketLane - 1);
             else newLane = Math.min(2, prev.rocketLane + 1);
             return { ...prev, rocketLane: newLane };
         }

         return prev;
      });
  }, []);

  const startGame = useCallback((type: GameType = GameType.SNAKE) => {
    setPet(prev => ({ ...prev, actionState: ActionState.PLAYING_GAME }));
    
    // Initial State Setup based on type
    const baseState = {
        active: true,
        gameType: type,
        score: 0,
        gameOver: false,
        // Snake
        snake: [{x: 8, y: 8}, {x: 7, y: 8}],
        food: {x: 12, y: 8},
        direction: {x: 1, y: 0},
        // Dodge
        rocketLane: 1,
        asteroids: []
    };

    setGameState(baseState);
  }, []);

  const stopGame = useCallback(() => {
     setPet(prev => ({ 
       ...prev, 
       actionState: ActionState.IDLE, 
       happiness: Math.min(100, prev.happiness + gameStateRef.current.score * 2),
       hunger: Math.max(0, prev.hunger - 5) 
     }));
     setGameState(prev => ({ ...prev, active: false }));
  }, []);


  const interact = useCallback((action: GameAction, value?: number) => {
    if (pet.stage === PetStage.EGG || pet.stage === PetStage.GHOST) return;

    setPet(prev => {
      let next = { ...prev };
      if (prev.actionState !== ActionState.IDLE && prev.actionState !== ActionState.SLEEPING) return prev;

      switch (action) {
        case GameAction.FEED:
          if (!prev.isSick && prev.actionState !== ActionState.SLEEPING) {
            next.actionState = ActionState.EATING;
            next.hunger = Math.min(100, prev.hunger + (value || 20));
            next.weight += 1;
            next.happiness += 2;
            setTimeout(() => setPet(p => ({ ...p, actionState: ActionState.IDLE })), 2000);
          }
          break;
        case GameAction.LIGHT:
           next.actionState = prev.actionState === ActionState.SLEEPING ? ActionState.IDLE : ActionState.SLEEPING;
           break;
        case GameAction.PLAY:
             break;
        case GameAction.BATH:
           if (prev.actionState !== ActionState.SLEEPING) {
             next.actionState = ActionState.BATHING;
             next.poopCount = 0;
             next.happiness += 5;
             setTimeout(() => setPet(p => ({ ...p, actionState: ActionState.IDLE })), 2000);
           }
           break;
        case GameAction.MEDICINE:
           if (prev.isSick) {
             next.isSick = false;
             next.health += 20;
           }
           break;
      }
      return next;
    });
  }, [pet.stage]);

  return { pet, hatch, interact, setChatMessage, chatMessage, gameState, startGame, stopGame, gameInput, setPaused, boostHappiness };
};