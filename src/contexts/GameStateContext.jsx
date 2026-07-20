import React, { createContext, useState, useEffect, useContext } from 'react';
import apiService from '../services/api';

const GameStateContext = createContext();
const ACTIVE_SAVE_KEY = 'politicalEconomyRpgActiveSaveId';

const normalizePlayerSave = (save) => ({
  ...save,
  inventory: Array.isArray(save?.inventory) ? save.inventory : [],
  equippedItems: {
    weapon: null,
    armor: null,
    accessory: null,
    ...(save?.equippedItems || {})
  },
  activeQuests: Array.isArray(save?.activeQuests) ? save.activeQuests : [],
  completedStages: Array.isArray(save?.completedStages) ? save.completedStages : [],
  score: Number.isFinite(save?.score) ? save.score : 0
});

export const useGameState = () => useContext(GameStateContext);

export const GameStateProvider = ({ children }) => {
  const [player, setPlayer] = useState(null);
  const [activeSaveId, setActiveSaveId] = useState(null);
  const [items, setItems] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [bosses, setBosses] = useState([]);
  const [stages, setStages] = useState([]);
  const [quests, setQuests] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameLog, setGameLog] = useState([]);

  // Utility to append log messages in-game
  const addLog = (message) => {
    setGameLog((prev) => [
      { id: Date.now() + Math.random().toString(), text: message },
      ...prev.slice(0, 49) // Keep last 50 logs
    ]);
  };

  const restoreSavedGame = async () => {
    const savedId = window.localStorage.getItem(ACTIVE_SAVE_KEY);
    if (!savedId) return;

    try {
      const save = normalizePlayerSave(await apiService.getSaveGameById(savedId));
      setPlayer(save);
      setActiveSaveId(save.id);
      addLog(`Session restored for ${save.playerName}. Welcome back!`);
    } catch (err) {
      console.warn('Failed to restore saved game:', err);
      window.localStorage.removeItem(ACTIVE_SAVE_KEY);
    }
  };

  // Load baseline game database on mount
  useEffect(() => {
    const loadGameDatabase = async () => {
      try {
        setLoading(true);
        const [clsData, monsterData, bossData, stageData, itemData, questData] = await Promise.all([
          apiService.getClasses(),
          apiService.getMonsters(),
          apiService.getBosses(),
          apiService.getStages(),
          apiService.getItems(),
          apiService.getQuests()
        ]);
        setClasses(clsData);
        setMonsters(monsterData);
        setBosses(bossData);
        setStages(stageData);
        setItems(itemData);
        setQuests(questData);
        await restoreSavedGame();
      } catch (err) {
        console.error('Failed to load initial RPG database:', err);
        setError('Could not establish connection to the local game database server.');
      } finally {
        setLoading(false);
      }
    };
    loadGameDatabase();
  }, []);

  // Calculate dynamic stats including equipped gear
  const getDynamicStats = () => {
    if (!player) return null;
    
    let extraHp = 0;
    let extraAttack = 0;
    let extraDefense = 0;

    const { weapon, armor, accessory } = player.equippedItems || {};

    if (weapon) {
      const wItem = items.find(i => i.id === weapon);
      if (wItem) extraAttack += wItem.statValue;
    }
    if (armor) {
      const aItem = items.find(i => i.id === armor);
      if (aItem) extraDefense += aItem.statValue;
    }
    if (accessory) {
      const acItem = items.find(i => i.id === accessory);
      if (acItem) {
        if (acItem.statName === 'hp') extraHp += acItem.statValue;
        if (acItem.statName === 'attack') extraAttack += acItem.statValue;
        if (acItem.statName === 'defense') extraDefense += acItem.statValue;
      }
    }

    return {
      ...player,
      maxHp: player.maxHp + extraHp,
      attack: player.attack + extraAttack,
      defense: player.defense + extraDefense
    };
  };

  // Start a new game save
  const createNewGame = async (playerName, selectedClassIndex) => {
    const classTemplate = classes[selectedClassIndex];
    if (!classTemplate) return false;

    const initialPlayer = {
      playerName,
      classType: classTemplate.classType,
      level: 1,
      exp: 0,
      gold: classTemplate.gold,
      hp: classTemplate.hp,
      maxHp: classTemplate.maxHp,
      attack: classTemplate.attack,
      defense: classTemplate.defense,
      currentStageId: 'stage_1',
      inventory: [...classTemplate.inventory],
      equippedItems: { ...classTemplate.equippedItems },
      activeQuests: [],
      completedStages: [],
      score: 0,
      timestamp: new Date().toISOString()
    };

    try {
      const newSave = normalizePlayerSave(await apiService.createSaveGame(initialPlayer));
      setPlayer(newSave);
      setActiveSaveId(newSave.id);
      window.localStorage.setItem(ACTIVE_SAVE_KEY, newSave.id);
      addLog(`Character "${playerName}" of class ${classTemplate.classType} created successfully!`);
      return newSave;
    } catch (err) {
      console.error('Failed to create save game:', err);
      return false;
    }
  };

  // Load an existing game save
  const loadSaveGame = async (saveId) => {
    try {
      const save = normalizePlayerSave(await apiService.getSaveGameById(saveId));
      setPlayer(save);
      setActiveSaveId(save.id);
      window.localStorage.setItem(ACTIVE_SAVE_KEY, save.id);
      addLog(`Welcome back, Scholar ${save.playerName}!`);
      return save;
    } catch (err) {
      console.error('Failed to load savegame:', err);
      return false;
    }
  };

  // Save current progress to backend DB
  const saveGameProgress = async (overridePlayer = null) => {
    const targetPlayer = overridePlayer || player;
    if (!targetPlayer || !activeSaveId) return false;

    const dataToSave = normalizePlayerSave({
      ...targetPlayer,
      timestamp: new Date().toISOString()
    });

    try {
      const updatedSave = normalizePlayerSave(await apiService.updateSaveGame(activeSaveId, dataToSave));
      setPlayer(updatedSave);
      addLog(`Game progress saved successfully!`);
      return true;
    } catch (err) {
      console.error('Failed to save game progress:', err);
      return false;
    }
  };

  // Gain exp and gold, and add optional items
  const gainRewards = (expGained, goldGained, itemRewards = []) => {
    if (!player) return;

    setPlayer((prev) => {
      let newExp = prev.exp + expGained;
      let newLevel = prev.level;
      let newMaxHp = prev.maxHp;
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newHp = prev.hp;
      let leveledUp = false;

      // Level up threshold: Level * 100
      let nextLevelThreshold = newLevel * 100;
      while (newExp >= nextLevelThreshold) {
        newExp -= nextLevelThreshold;
        newLevel += 1;
        newMaxHp += 15;
        newAttack += 3;
        newDefense += 1;
        newHp = newMaxHp; // Fully heal on level up
        leveledUp = true;
        nextLevelThreshold = newLevel * 100;
      }

      const updatedInventory = [...prev.inventory];
      itemRewards.forEach((itemId) => {
        const existingItem = updatedInventory.find(i => i.itemId === itemId);
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          updatedInventory.push({ itemId, quantity: 1 });
        }
      });

      const nextPlayerState = {
        ...prev,
        level: newLevel,
        exp: newExp,
        gold: prev.gold + goldGained,
        hp: newHp,
        maxHp: newMaxHp,
        attack: newAttack,
        defense: newDefense,
        inventory: updatedInventory
      };

      if (leveledUp) {
        addLog(`LEVEL UP! You reached Level ${newLevel}! Dynamic stats increased.`);
      }
      
      // Auto-save progress after combat rewards
      setTimeout(() => saveGameProgress(nextPlayerState), 100);
      return nextPlayerState;
    });
  };

  // Update specific player HP (e.g. during combat or potion use)
  const updatePlayerHp = (newHp) => {
    if (!player) return;
    const cleanHp = Math.max(0, Math.min(getDynamicStats().maxHp, newHp));
    setPlayer((prev) => ({
      ...prev,
      hp: cleanHp
    }));
  };

  // Equip weapon, armor, accessory
  const equipItem = (itemId) => {
    if (!player) return;
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setPlayer((prev) => {
      const inventory = [...prev.inventory];
      const equippedItems = { ...prev.equippedItems };

      // Find item in inventory
      const invIndex = inventory.findIndex(i => i.itemId === itemId);
      if (invIndex === -1) return prev;

      // Decrease quantity from inventory
      inventory[invIndex].quantity -= 1;
      if (inventory[invIndex].quantity <= 0) {
        inventory.splice(invIndex, 1);
      }

      // Unequip currently equipped item in that slot and put it back in inventory
      const slot = item.type; // weapon, armor, accessory
      const currentlyEquippedId = equippedItems[slot];
      if (currentlyEquippedId) {
        const existingInvItem = inventory.find(i => i.itemId === currentlyEquippedId);
        if (existingInvItem) {
          existingInvItem.quantity += 1;
        } else {
          inventory.push({ itemId: currentlyEquippedId, quantity: 1 });
        }
      }

      // Set item as equipped
      equippedItems[slot] = itemId;

      const nextState = {
        ...prev,
        inventory,
        equippedItems
      };
      
      addLog(`Equipped: ${item.name} (${item.type.toUpperCase()} +${item.statValue} ${item.statName.toUpperCase()}).`);
      setTimeout(() => saveGameProgress(nextState), 100);
      return nextState;
    });
  };

  // Unequip slot
  const unequipItem = (slot) => {
    if (!player) return;
    const itemId = player.equippedItems[slot];
    if (!itemId) return;

    const item = items.find(i => i.id === itemId);

    setPlayer((prev) => {
      const inventory = [...prev.inventory];
      const equippedItems = { ...prev.equippedItems };

      equippedItems[slot] = null;

      const existingInvItem = inventory.find(i => i.itemId === itemId);
      if (existingInvItem) {
        existingInvItem.quantity += 1;
      } else {
        inventory.push({ itemId, quantity: 1 });
      }

      const nextState = {
        ...prev,
        inventory,
        equippedItems
      };

      if (item) {
        addLog(`Unequipped: ${item.name}.`);
      }
      setTimeout(() => saveGameProgress(nextState), 100);
      return nextState;
    });
  };

  // Consume Potion
  const consumePotion = (potionId) => {
    if (!player) return false;
    const potion = items.find(i => i.id === potionId && i.type === 'potion');
    if (!potion) return false;

    const dynStats = getDynamicStats();
    if (player.hp >= dynStats.maxHp) {
      addLog("Your health is already full.");
      return false;
    }

    let success = false;

    setPlayer((prev) => {
      const inventory = [...prev.inventory];
      const invIndex = inventory.findIndex(i => i.itemId === potionId);
      if (invIndex === -1) return prev;

      inventory[invIndex].quantity -= 1;
      if (inventory[invIndex].quantity <= 0) {
        inventory.splice(invIndex, 1);
      }

      const newHp = Math.min(dynStats.maxHp, prev.hp + potion.statValue);
      addLog(`Consumed ${potion.name}. Restored ${potion.statValue} HP.`);
      success = true;

      const nextState = {
        ...prev,
        hp: newHp,
        inventory
      };
      setTimeout(() => saveGameProgress(nextState), 100);
      return nextState;
    });

    return success;
  };

  // Quest Management
  const acceptQuest = (questId) => {
    if (!player) return;
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    // Check if already active or completed
    const isActive = player.activeQuests.some(q => q.questId === questId);
    if (isActive) return;

    setPlayer((prev) => {
      const nextQuests = [...prev.activeQuests, { questId, progress: 0 }];
      const nextState = {
        ...prev,
        activeQuests: nextQuests
      };
      addLog(`Quest Accepted: "${quest.title}". Goal: ${quest.description}`);
      setTimeout(() => saveGameProgress(nextState), 100);
      return nextState;
    });
  };

  const trackQuestActivity = (type, targetStageId = '', amount = 1) => {
    if (!player || player.activeQuests.length === 0) return;

    setPlayer((prev) => {
      let changed = false;
      const nextQuests = prev.activeQuests.map((aq) => {
        const questDef = quests.find(q => q.id === aq.questId);
        if (!questDef) return aq;

        // Check matching quest conditions
        let match = false;
        if (questDef.type === type) {
          if (type === 'complete_chapter' && questDef.stageId === targetStageId) {
            match = true;
          } else if (type === 'kill_monsters' && questDef.stageId === prev.currentStageId) {
            match = true;
          } else if (type === 'answer_questions') {
            match = true;
          }
        }

        if (match && aq.progress < questDef.targetCount) {
          changed = true;
          const newProg = Math.min(questDef.targetCount, aq.progress + amount);
          if (newProg === questDef.targetCount) {
            addLog(`Quest Goal Achieved: "${questDef.title}"! Talk to the NPC to claim rewards.`);
          }
          return { ...aq, progress: newProg };
        }
        return aq;
      });

      if (!changed) return prev;

      const nextState = {
        ...prev,
        activeQuests: nextQuests
      };
      setTimeout(() => saveGameProgress(nextState), 100);
      return nextState;
    });
  };

  const claimQuestReward = (questId) => {
    if (!player) return;
    const quest = quests.find(q => q.id === questId);
    const activeQuest = player.activeQuests.find(q => q.questId === questId);

    if (!quest || !activeQuest || activeQuest.progress < quest.targetCount) return;

    setPlayer((prev) => {
      // Remove from active
      const activeQuests = prev.activeQuests.filter(q => q.questId !== questId);
      
      // Add rewards directly, saveGame is handled at the end
      const inventory = [...prev.inventory];
      if (quest.rewardItemId) {
        const existing = inventory.find(i => i.itemId === quest.rewardItemId);
        if (existing) {
          existing.quantity += 1;
        } else {
          inventory.push({ itemId: quest.rewardItemId, quantity: 1 });
        }
      }

      // Check level up logic inside
      let newExp = prev.exp + quest.rewardExp;
      let newLevel = prev.level;
      let newMaxHp = prev.maxHp;
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newHp = prev.hp;
      let leveledUp = false;
      let nextLevelThreshold = newLevel * 100;

      while (newExp >= nextLevelThreshold) {
        newExp -= nextLevelThreshold;
        newLevel += 1;
        newMaxHp += 15;
        newAttack += 3;
        newDefense += 1;
        newHp = newMaxHp;
        leveledUp = true;
        nextLevelThreshold = newLevel * 100;
      }

      const nextState = {
        ...prev,
        activeQuests,
        inventory,
        gold: prev.gold + quest.rewardGold,
        exp: newExp,
        level: newLevel,
        maxHp: newMaxHp,
        attack: newAttack,
        defense: newDefense,
        hp: newHp
      };

      const itemRewardText = quest.rewardItemId ? `, Loot: ${items.find(i => i.id === quest.rewardItemId)?.name || ''}` : '';
      addLog(`Quest Completed: "${quest.title}". Reward: +${quest.rewardGold} Gold, +${quest.rewardExp} EXP${itemRewardText}.`);
      if (leveledUp) {
        addLog(`LEVEL UP! You reached Level ${newLevel}!`);
      }

      setTimeout(() => saveGameProgress(nextState), 100);
      return nextState;
    });
  };

  // Stage unlocking
  const completeStage = (stageId) => {
    if (!player) return;
    
    setPlayer((prev) => {
      const completedStages = [...prev.completedStages];
      if (!completedStages.includes(stageId)) {
        completedStages.push(stageId);
      }

      // Find current stage index and unlock next one
      const stageIdx = stages.findIndex(s => s.id === stageId);
      let nextStageId = prev.currentStageId;
      if (stageIdx !== -1 && stageIdx + 1 < stages.length) {
        nextStageId = stages[stageIdx + 1].id;
        addLog(`Congratulations! Chapter ${stageIdx + 1} completed. Unlocked: ${stages[stageIdx + 1].name}`);
      }

      const nextState = {
        ...prev,
        completedStages,
        currentStageId: nextStageId
      };

      // Handle complete chapter quest
      setTimeout(() => {
        trackQuestActivity('complete_chapter', stageId, 1);
      }, 50);

      setTimeout(() => saveGameProgress(nextState), 100);
      return nextState;
    });
  };

  // Shop functions
  const buyItem = (item) => {
    if (!player || player.gold < item.cost) {
      addLog("Not enough gold to purchase this item.");
      return false;
    }

    let success = false;
    setPlayer((prev) => {
      const inventory = [...prev.inventory];
      const existing = inventory.find(i => i.itemId === item.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        inventory.push({ itemId: item.id, quantity: 1 });
      }

      const nextState = {
        ...prev,
        gold: prev.gold - item.cost,
        inventory
      };
      
      addLog(`Purchased ${item.name} for ${item.cost} gold.`);
      success = true;
      setTimeout(() => saveGameProgress(nextState), 100);
      return nextState;
    });

    return success;
  };

  const sellItem = (itemId) => {
    if (!player) return false;
    const item = items.find(i => i.id === itemId);
    if (!item) return false;

    const sellValue = Math.floor(item.cost * 0.5);
    let success = false;

    setPlayer((prev) => {
      const inventory = [...prev.inventory];
      const idx = inventory.findIndex(i => i.itemId === itemId);
      if (idx === -1) return prev;

      inventory[idx].quantity -= 1;
      if (inventory[idx].quantity <= 0) {
        inventory.splice(idx, 1);
      }

      const nextState = {
        ...prev,
        gold: prev.gold + sellValue,
        inventory
      };
      
      addLog(`Sold ${item.name} for ${sellValue} gold.`);
      success = true;
      setTimeout(() => saveGameProgress(nextState), 100);
      return nextState;
    });

    return success;
  };

  // Add correct answer points to player score
  const incrementScore = () => {
    if (!player) return;
    setPlayer(prev => {
      const nextState = {
        ...prev,
        score: prev.score + 1
      };
      setTimeout(() => saveGameProgress(nextState), 100);
      return nextState;
    });
  };

  return (
    <GameStateContext.Provider value={{
      player: getDynamicStats(),
      rawPlayer: player, // holds un-boosted base stats
      activeSaveId,
      classes,
      items,
      monsters,
      bosses,
      stages,
      quests,
      loading,
      error,
      gameLog,
      addLog,
      createNewGame,
      loadSaveGame,
      saveGameProgress,
      gainRewards,
      updatePlayerHp,
      equipItem,
      unequipItem,
      usePotion: consumePotion,
      consumePotion,
      acceptQuest,
      claimQuestReward,
      trackQuestActivity,
      completeStage,
      buyItem,
      sellItem,
      incrementScore
    }}>
      {children}
    </GameStateContext.Provider>
  );
};
