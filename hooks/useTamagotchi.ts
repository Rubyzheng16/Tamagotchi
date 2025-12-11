import { useState, useEffect, useCallback, useRef } from 'react';
import { PetState, PetStage, PetCharacter, GameAction, ActionState, GameState, Point } from '../types';

const INITIAL_STATE: PetState = {
  stage: PetStage.EGG,
  character: PetCharacter.UNKNOWN,
  age: 0,
  weight: 5,
  hunger: 50,
  happiness: 50,
  health: 100,
  poopCount: 0,
  isSick: false,
  actionState: ActionState.IDLE,
  birthTime: Date.now(),
};

// Reduced grid size for "bigger" snake pixels
const GRID_SIZE = 16; 

export const useTamagotchi = () => {
  const [pet, setPet] = useState<PetState>(INITIAL_STATE);
  const [chatMessage, setChatMessage] = useState<string | null>(null);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    active: false,
    snake: [{x: 5, y: 5}, {x: 4, y: 5}, {x: 3, y: 5}], // Adjusted start pos for 16x16
    food: {x: 10, y: 8},
    direction: {x: 1, y: 0},
    score: 0,
    gameOver: false,
  });

  const gameStateRef = useRef(gameState); // Ref for loop access
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // --- Main Pet Loop ---
  useEffect(() => {
    const tickRate = 3000; // 3 seconds per tick
    
    const interval = setInterval(() => {
      setPet(prev => {
        if (prev.stage === PetStage.EGG || prev.stage === PetStage.GHOST || prev.actionState === ActionState.PLAYING_GAME) return prev;

        // Slowed down decay
        let newHunger = Math.max(0, prev.hunger - (prev.actionState === ActionState.SLEEPING ? 0.5 : 1)); 
        let newHappiness = Math.max(0, prev.happiness - (prev.actionState === ActionState.SLEEPING ? 0.5 : 2));
        let newHealth = prev.health;
        let newPoop = prev.poopCount;
        let newSick = prev.isSick;
        let newAge = prev.age + 0.01; 

        // Poop chance (reduced)
        if (prev.actionState !== ActionState.SLEEPING && Math.random() < 0.05) {
          newPoop = Math.min(4, prev.poopCount + 1);
        }

        // Sickness logic
        if (prev.poopCount > 3 || newHunger < 10 || newHappiness < 10) {
          if (Math.random() < 0.2) newSick = true;
        }
        if (newSick) {
          newHealth = Math.max(0, prev.health - 2); // Slower health drain
          newHappiness = Math.max(0, newHappiness - 2);
        }

        // Evolution logic
        let newStage: PetStage = prev.stage;
        let newChar = prev.character;

        if (prev.stage === PetStage.BABY && newAge > 0.5) {
           newStage = PetStage.CHILD;
           newChar = PetCharacter.CAT; 
        }

        // Death logic
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

  // --- Snake Game Loop ---
  useEffect(() => {
    if (!gameState.active || gameState.gameOver) return;

    const gameInterval = setInterval(() => {
      setGameState(prev => {
        if (prev.gameOver) return prev;

        const head = prev.snake[0];
        const newHead = {
          x: head.x + prev.direction.x,
          y: head.y + prev.direction.y
        };

        // Wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          return { ...prev, gameOver: true };
        }
        // Self collision
        if (prev.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
           return { ...prev, gameOver: true };
        }

        const newSnake = [newHead, ...prev.snake];
        let newScore = prev.score;
        let newFood = prev.food;

        // Eat Food
        if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
           newScore += 1;
           newFood = {
             x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
             y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
           };
        } else {
           newSnake.pop(); // Remove tail
        }

        return {
          ...prev,
          snake: newSnake,
          score: newScore,
          food: newFood
        };
      });
    }, 200); // Game Speed

    return () => clearInterval(gameInterval);
  }, [gameState.active, gameState.gameOver]);


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

  // Snake Control Inputs
  const gameInput = useCallback((key: 'LEFT' | 'RIGHT') => {
      setGameState(prev => {
         const { x, y } = prev.direction;
         let newDir = { x, y };
         if (key === 'LEFT') {
             // Rotate Counter Clockwise: (x, y) -> (y, -x)
             newDir = { x: y, y: -x };
         } else {
             // Rotate Clockwise: (x, y) -> (-y, x)
             newDir = { x: -y, y: x };
         }
         return { ...prev, direction: newDir };
      });
  }, []);

  const startGame = useCallback(() => {
    setPet(prev => ({ ...prev, actionState: ActionState.PLAYING_GAME }));
    setGameState({
      active: true,
      snake: [{x: 8, y: 8}, {x: 7, y: 8}, {x: 6, y: 8}],
      food: {x: 12, y: 8},
      direction: {x: 1, y: 0},
      score: 0,
      gameOver: false
    });
  }, []);

  const stopGame = useCallback(() => {
     setPet(prev => ({ 
       ...prev, 
       actionState: ActionState.IDLE, 
       happiness: Math.min(100, prev.happiness + gameStateRef.current.score * 5),
       hunger: Math.max(0, prev.hunger - 5) // Playing makes hungry
     }));
     setGameState(prev => ({ ...prev, active: false }));
  }, []);


  const interact = useCallback((action: GameAction, value?: number) => {
    if (pet.stage === PetStage.EGG || pet.stage === PetStage.GHOST) return;

    setPet(prev => {
      let next = { ...prev };
      
      // If action is already happening, ignore (debounce)
      if (prev.actionState !== ActionState.IDLE && prev.actionState !== ActionState.SLEEPING) return prev;

      switch (action) {
        case GameAction.FEED:
          if (!prev.isSick && prev.actionState !== ActionState.SLEEPING) {
            next.actionState = ActionState.EATING;
            next.hunger = Math.min(100, prev.hunger + (value || 20));
            next.weight += 1;
            next.happiness += 5;
            // Reset animation after 2s
            setTimeout(() => setPet(p => ({ ...p, actionState: ActionState.IDLE })), 2000);
          }
          break;
        case GameAction.LIGHT:
           next.actionState = prev.actionState === ActionState.SLEEPING ? ActionState.IDLE : ActionState.SLEEPING;
           break;
        case GameAction.PLAY:
             // This is now handled by startGame externally, but backup here
             break;
        case GameAction.BATH:
           if (prev.actionState !== ActionState.SLEEPING) {
             next.actionState = ActionState.BATHING;
             next.poopCount = 0;
             next.happiness += 10;
             // Reset animation after 2s
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

  return { pet, hatch, interact, setChatMessage, chatMessage, gameState, startGame, stopGame, gameInput };
};