// Obstacle Achievement Rewards Pool
// When an obstacle achievement is unlocked, a random item is popped from this list and given to the user

import { boboEmojis } from './bobo-emojis';
import { boboCostumes } from './bobo-costumes';
import { boboHats } from './bobo-hats';

// Build the complete rewards pool with type and rarity info
export const obstacleRewardsPool = [
  // === EMOJIS (20 items) ===
  { id: 'emoji_sparkly_happy', type: 'emoji', key: 'sparkly_happy', name: 'Sparkly Happy', rarity: 'common' },
  { id: 'emoji_sleepy', type: 'emoji', key: 'sleepy', name: 'Sleepy', rarity: 'common' },
  { id: 'emoji_heart_eyes', type: 'emoji', key: 'heart_eyes', name: 'Heart Eyes', rarity: 'rare' },
  { id: 'emoji_blushing', type: 'emoji', key: 'blushing', name: 'Blushing', rarity: 'common' },
  { id: 'emoji_winking', type: 'emoji', key: 'winking', name: 'Winking', rarity: 'common' },
  { id: 'emoji_star_eyes', type: 'emoji', key: 'star_eyes', name: 'Star Eyes', rarity: 'rare' },
  { id: 'emoji_surprised', type: 'emoji', key: 'surprised', name: 'Surprised', rarity: 'common' },
  { id: 'emoji_giggly', type: 'emoji', key: 'giggly', name: 'Giggly', rarity: 'common' },
  { id: 'emoji_kawaii_shy', type: 'emoji', key: 'kawaii_shy', name: 'Kawaii Shy', rarity: 'rare' },
  { id: 'emoji_excited', type: 'emoji', key: 'excited', name: 'Excited', rarity: 'common' },
  { id: 'emoji_dreamy', type: 'emoji', key: 'dreamy', name: 'Dreamy', rarity: 'common' },
  { id: 'emoji_playful', type: 'emoji', key: 'playful', name: 'Playful', rarity: 'common' },
  { id: 'emoji_loving', type: 'emoji', key: 'loving', name: 'Loving', rarity: 'rare' },
  { id: 'emoji_cheeky', type: 'emoji', key: 'cheeky', name: 'Cheeky', rarity: 'common' },
  { id: 'emoji_innocent', type: 'emoji', key: 'innocent', name: 'Innocent', rarity: 'common' },
  { id: 'emoji_cheerful', type: 'emoji', key: 'cheerful', name: 'Cheerful', rarity: 'common' },
  { id: 'emoji_mischievous', type: 'emoji', key: 'mischievous', name: 'Mischievous', rarity: 'rare' },
  { id: 'emoji_confused', type: 'emoji', key: 'confused', name: 'Confused', rarity: 'common' },
  { id: 'emoji_sleepy_smile', type: 'emoji', key: 'sleepy_smile', name: 'Sleepy Smile', rarity: 'common' },
  { id: 'emoji_super_happy', type: 'emoji', key: 'super_happy', name: 'Super Happy', rarity: 'legendary' },

  // === COSTUMES (20 items) ===
  { id: 'costume_superhero', type: 'costume', key: 'superhero', name: 'Superhero Cape', rarity: 'rare' },
  { id: 'costume_angel', type: 'costume', key: 'angel', name: 'Angel Wings', rarity: 'legendary' },
  { id: 'costume_bowtie', type: 'costume', key: 'bowtie', name: 'Bow Tie', rarity: 'common' },
  { id: 'costume_scarf', type: 'costume', key: 'scarf', name: 'Cozy Scarf', rarity: 'common' },
  { id: 'costume_fairy', type: 'costume', key: 'fairy', name: 'Fairy Wings', rarity: 'legendary' },
  { id: 'costume_apron', type: 'costume', key: 'apron', name: 'Cute Apron', rarity: 'common' },
  { id: 'costume_wizard_robe', type: 'costume', key: 'wizard_robe', name: 'Wizard Robe', rarity: 'rare' },
  { id: 'costume_flower_crown', type: 'costume', key: 'flower_crown', name: 'Flower Crown', rarity: 'rare' },
  { id: 'costume_vest', type: 'costume', key: 'vest', name: 'Cute Vest', rarity: 'common' },
  { id: 'costume_rainbow_cape', type: 'costume', key: 'rainbow_cape', name: 'Rainbow Cape', rarity: 'legendary' },
  { id: 'costume_overalls', type: 'costume', key: 'overalls', name: 'Cute Overalls', rarity: 'common' },
  { id: 'costume_tutu', type: 'costume', key: 'tutu', name: 'Cute Tutu', rarity: 'rare' },
  { id: 'costume_pirate_vest', type: 'costume', key: 'pirate_vest', name: 'Pirate Vest', rarity: 'rare' },
  { id: 'costume_bandana', type: 'costume', key: 'bandana', name: 'Cute Bandana', rarity: 'common' },
  { id: 'costume_lab_coat', type: 'costume', key: 'lab_coat', name: 'Lab Coat', rarity: 'rare' },
  { id: 'costume_poncho', type: 'costume', key: 'poncho', name: 'Cute Poncho', rarity: 'common' },
  { id: 'costume_suspenders', type: 'costume', key: 'suspenders', name: 'Cute Suspenders', rarity: 'common' },
  { id: 'costume_kimono', type: 'costume', key: 'kimono', name: 'Cute Kimono', rarity: 'rare' },
  { id: 'costume_hoodie', type: 'costume', key: 'hoodie', name: 'Cute Hoodie', rarity: 'common' },
  { id: 'costume_princess', type: 'costume', key: 'princess', name: 'Princess Dress', rarity: 'legendary' },

  // === HATS (20 items) ===
  { id: 'hat_pirate', type: 'hat', key: 'pirate', name: 'Pirate Hat', rarity: 'rare' },
  { id: 'hat_wizard', type: 'hat', key: 'wizard', name: 'Wizard Hat', rarity: 'rare' },
  { id: 'hat_chef', type: 'hat', key: 'chef', name: 'Chef Hat', rarity: 'common' },
  { id: 'hat_tophat', type: 'hat', key: 'tophat', name: 'Top Hat', rarity: 'rare' },
  { id: 'hat_baseball', type: 'hat', key: 'baseball', name: 'Baseball Cap', rarity: 'common' },
  { id: 'hat_cowboy', type: 'hat', key: 'cowboy', name: 'Cowboy Hat', rarity: 'common' },
  { id: 'hat_viking', type: 'hat', key: 'viking', name: 'Viking Helmet', rarity: 'rare' },
  { id: 'hat_beret', type: 'hat', key: 'beret', name: 'Beret', rarity: 'common' },
  { id: 'hat_santa', type: 'hat', key: 'santa', name: 'Santa Hat', rarity: 'rare' },
  { id: 'hat_graduation', type: 'hat', key: 'graduation', name: 'Graduation Cap', rarity: 'rare' },
  { id: 'hat_crown', type: 'hat', key: 'crown', name: 'Crown', rarity: 'legendary' },
  { id: 'hat_sombrero', type: 'hat', key: 'sombrero', name: 'Sombrero', rarity: 'common' },
  { id: 'hat_fedora', type: 'hat', key: 'fedora', name: 'Fedora', rarity: 'common' },
  { id: 'hat_beanie', type: 'hat', key: 'beanie', name: 'Beanie', rarity: 'common' },
  { id: 'hat_police', type: 'hat', key: 'police', name: 'Police Hat', rarity: 'rare' },
  { id: 'hat_jester', type: 'hat', key: 'jester', name: 'Jester Hat', rarity: 'legendary' },
  { id: 'hat_bucket', type: 'hat', key: 'bucket', name: 'Bucket Hat', rarity: 'common' },
  { id: 'hat_space_helmet', type: 'hat', key: 'space_helmet', name: 'Space Helmet', rarity: 'legendary' },
  { id: 'hat_turban', type: 'hat', key: 'turban', name: 'Turban', rarity: 'rare' },
  { id: 'hat_propeller', type: 'hat', key: 'propeller', name: 'Propeller Hat', rarity: 'rare' },
];

// Get the actual asset data for a reward
export const getRewardAsset = (reward) => {
  switch (reward.type) {
    case 'emoji':
      return boboEmojis[reward.key];
    case 'costume':
      return boboCostumes[reward.key];
    case 'hat':
      return boboHats[reward.key];
    default:
      return null;
  }
};

// Rarity colors for UI display
export const rarityColors = {
  common: { bg: '#9E9E9E', text: '#FFFFFF', glow: 'rgba(158, 158, 158, 0.5)' },
  rare: { bg: '#2196F3', text: '#FFFFFF', glow: 'rgba(33, 150, 243, 0.5)' },
  legendary: { bg: '#FFD700', text: '#000000', glow: 'rgba(255, 215, 0, 0.7)' },
};

// Rarity distribution: common=60%, rare=30%, legendary=10%
export const getRandomRewardByRarity = (availableRewards) => {
  const roll = Math.random();
  let targetRarity;
  
  if (roll < 0.1) {
    targetRarity = 'legendary';
  } else if (roll < 0.4) {
    targetRarity = 'rare';
  } else {
    targetRarity = 'common';
  }
  
  // Filter by target rarity
  let candidates = availableRewards.filter(r => r.rarity === targetRarity);
  
  // Fallback to any available if no candidates of target rarity
  if (candidates.length === 0) {
    candidates = availableRewards;
  }
  
  // Return random from candidates
  return candidates[Math.floor(Math.random() * candidates.length)];
};

// Total counts for reference
export const rewardCounts = {
  emojis: 20,
  costumes: 20,
  hats: 20,
  total: 60,
};
