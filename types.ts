export enum PetStage {
  EGG = 'EGG',
  BABY = 'BABY',
  CHILD = 'CHILD',
  TEEN = 'TEEN',
  ADULT = 'ADULT',
  SENIOR = 'SENIOR',
  GHOST = 'GHOST' // Dead/Left
}

export enum PetCharacter {
  UNKNOWN = 'UNKNOWN',
  CAT = 'CAT',
  ANGEL_CAT = 'ANGEL_CAT',
  DEVIL_CAT = 'DEVIL_CAT'
}

export enum ActionState {
  IDLE = 'IDLE',
  EATING = 'EATING',
  BATHING = 'BATHING',
  PLAYING_GAME = 'PLAYING_GAME',
  SLEEPING = 'SLEEPING'
}

export interface PetState {
  stage: PetStage;
  character: PetCharacter;
  age: number; // in logical days
  weight: number; // in grams
  hunger: number; // 0 (starving) to 100 (full)
  happiness: number; // 0 (sad) to 100 (ecstatic)
  health: number; // 0 (sick) to 100 (healthy)
  poopCount: number;
  isSick: boolean;
  birthTime: number;
  actionState: ActionState; // Current animation state
}

export enum GameAction {
  NONE = 'NONE',
  FEED = 'FEED',
  LIGHT = 'LIGHT',
  PLAY = 'PLAY',
  MEDICINE = 'MEDICINE',
  BATH = 'BATH',
  STATS = 'STATS',
  CHAT = 'CHAT'
}

// Snake Game Types
export interface Point {
  x: number;
  y: number;
}

export interface GameState {
  active: boolean;
  snake: Point[];
  food: Point;
  direction: Point; // {x: 1, y: 0} etc
  score: number;
  gameOver: boolean;
}