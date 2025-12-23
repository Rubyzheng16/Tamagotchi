import { PetState, PetStage } from "@/types";

// 固定的对话内容库 - 基于宠物状态的智能对话
const chatMessages = {
  // 根据饥饿度
  hungry: [
    "Meow... I'm hungry!",
    "Want some fish! 🐟",
    "Feed me please!",
    "Meow meow... hungry!",
    "Need food! 🍗",
    "My tummy is rumbling!",
    "Time for a snack?",
    "Hungry kitty needs food!"
  ],
  // 根据快乐度
  happy: [
    "Purr purr! So happy!",
    "Meow! I love you! ❤️",
    "Happy meow!",
    "Feeling great!",
    "Meow meow! 😊",
    "Best day ever!",
    "You make me so happy!",
    "Life is wonderful!"
  ],
  // 根据健康状态
  sick: [
    "Meow... not feeling well...",
    "Need medicine... 💊",
    "Meow... sick...",
    "Help me...",
    "Not good... meow...",
    "Feel dizzy...",
    "Need rest...",
    "Not my best day..."
  ],
  // 根据便便数量
  dirty: [
    "Meow... too dirty!",
    "Need a bath! 🚿",
    "Clean me please!",
    "Meow... stinky!",
    "Bath time!",
    "Time for cleanup!",
    "Feeling messy!",
    "Need some cleaning!"
  ],
  // 睡觉状态
  sleeping: [
    "Zzz... sleeping...",
    "Dreaming of fish...",
    "Shhh... sleeping...",
    "Nap time...",
    "So cozy... zzz..."
  ],
  // 玩耍状态
  playing: [
    "This is fun!",
    "Play with me more!",
    "Yay! Games!",
    "So exciting!",
    "Let's play again!"
  ],
  // 默认/正常状态
  normal: [
    "Meow!",
    "Meow meow!",
    "Hello!",
    "Purr...",
    "Meow! What's up?",
    "Feeling good!",
    "Meow meow meow!",
    "Happy to see you!",
    "Meow! Play with me!",
    "Purr purr purr!",
    "Nice to meet you!",
    "How are you?",
    "What's new?",
    "Let's have fun!",
    "You're the best!"
  ]
};

export const generatePetThought = async (pet: PetState): Promise<string> => {
  // 根据宠物状态选择对话
  let messages: string[] = chatMessages.normal;

  // 优先检查是否生病
  if (pet.isSick) {
    messages = chatMessages.sick;
  }
  // 检查是否睡觉
  else if (pet.actionState === 'SLEEPING') {
    messages = chatMessages.sleeping;
  }
  // 检查是否在玩游戏
  else if (pet.actionState === 'PLAYING_GAME') {
    messages = chatMessages.playing;
  }
  // 检查是否太脏
  else if (pet.poopCount > 3) {
    messages = chatMessages.dirty;
  }
  // 检查是否饥饿
  else if (pet.hunger < 30) {
    messages = chatMessages.hungry;
  }
  // 检查是否非常快乐
  else if (pet.happiness > 80) {
    messages = chatMessages.happy;
  }
  // 其他情况使用正常消息
  else {
    messages = chatMessages.normal;
  }

  // 随机选择一条消息
  const randomIndex = Math.floor(Math.random() * messages.length);
  
  // 模拟异步延迟，使对话更自然
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return messages[randomIndex];
};
