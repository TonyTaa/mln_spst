import { useState, useCallback } from 'react';
import { useGameState } from '../contexts/GameStateContext';

export const useBattle = () => {
  const { player, updatePlayerHp, consumePotion, trackQuestActivity } = useGameState();
  const [battleState, setBattleState] = useState('idle'); // idle, intro, player_turn, enemy_turn, victory, defeat, escaped
  const [enemy, setEnemy] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [floaters, setFloaters] = useState([]);

  const addBattleLog = useCallback((msg) => {
    setBattleLog((prev) => [msg, ...prev]);
  }, []);

  const spawnFloater = useCallback((amount, type) => {
    const id = Date.now() + Math.random().toString();
    setFloaters((prev) => [...prev, { id, amount, type }]);
    
    // Clear floater after 1s
    setTimeout(() => {
      setFloaters((prev) => prev.filter(f => f.id !== id));
    }, 1000);
  }, []);

  const startBattle = useCallback((monsterTemplate) => {
    setEnemy({
      ...monsterTemplate,
      hp: monsterTemplate.maxHp
    });
    setBattleState('intro');
    setBattleLog([]);
    setFloaters([]);
    addBattleLog(`A wild ${monsterTemplate.name} appears! Prepare for combat.`);
    
    setTimeout(() => {
      setBattleState('player_turn');
    }, 1200);
  }, [addBattleLog]);

  const executeEnemyTurn = useCallback(() => {
    if (!enemy) return;
    setBattleState('enemy_turn');
    addBattleLog(`${enemy.name} is preparing to strike...`);

    setTimeout(() => {
      // Calculate damage: max(1, enemy.attack - player.defense) with 10% variation
      const baseDmg = Math.max(1, enemy.attack - player.defense);
      const variance = Math.floor((Math.random() - 0.5) * 4); // -2 to +2
      const finalDmg = Math.max(1, baseDmg + variance);

      const nextPlayerHp = Math.max(0, player.hp - finalDmg);
      updatePlayerHp(nextPlayerHp);
      
      addBattleLog(`${enemy.name} deals ${finalDmg} damage to you!`);
      spawnFloater(finalDmg, 'damage');

      if (nextPlayerHp <= 0) {
        addBattleLog(`You have been defeated by ${enemy.name}...`);
        setBattleState('defeat');
      } else {
        setBattleState('player_turn');
      }
    }, 1000);
  }, [enemy, player, updatePlayerHp, addBattleLog, spawnFloater]);

  const playerAttack = useCallback(() => {
    if (battleState !== 'player_turn' || !enemy) return;

    // Calculate damage: max(1, player.attack - enemy.defense) with 10% variation
    const baseDmg = Math.max(1, player.attack - enemy.defense);
    const variance = Math.floor((Math.random() - 0.5) * 4); // -2 to +2
    const finalDmg = Math.max(1, baseDmg + variance);

    const nextEnemyHp = Math.max(0, enemy.hp - finalDmg);
    setEnemy((prev) => ({ ...prev, hp: nextEnemyHp }));
    
    addBattleLog(`You attack ${enemy.name} for ${finalDmg} damage!`);
    spawnFloater(finalDmg, 'enemy_damage');

    if (nextEnemyHp <= 0) {
      addBattleLog(`You defeated ${enemy.name}!`);
      setBattleState('victory');
      
      // Track quest kills (monster stage matches active stage)
      if (enemy.id.startsWith('m_')) {
        trackQuestActivity('kill_monsters', player.currentStageId, 1);
      }
    } else {
      executeEnemyTurn();
    }
  }, [battleState, enemy, player, executeEnemyTurn, addBattleLog, spawnFloater, trackQuestActivity]);

  const playerUsePotion = useCallback((potionId) => {
    if (battleState !== 'player_turn') return;

    const potionItem = player.inventory.find(i => i.itemId === potionId);
    if (!potionItem) return;

    const success = consumePotion(potionId);
    if (success) {
      addBattleLog(`You consumed a potion and restored health!`);
      spawnFloater('HP restored', 'heal');
      
      // Consume turn
      executeEnemyTurn();
    }
  }, [battleState, player, consumePotion, executeEnemyTurn, addBattleLog, spawnFloater]);

  const attemptFlee = useCallback(() => {
    if (battleState !== 'player_turn' || !enemy) return;

    addBattleLog(`You attempt to run away...`);
    setBattleState('enemy_turn');

    setTimeout(() => {
      // 50% escape rate
      const escaped = Math.random() > 0.5;
      if (escaped) {
        addBattleLog(`Successfully escaped from combat!`);
        setBattleState('escaped');
      } else {
        addBattleLog(`Flee failed! ${enemy.name} blocks your path.`);
        executeEnemyTurn();
      }
    }, 1000);
  }, [battleState, enemy, executeEnemyTurn, addBattleLog]);

  return {
    battleState,
    enemy,
    battleLog,
    floaters,
    startBattle,
    playerAttack,
    playerUsePotion,
    attemptFlee,
    setBattleState
  };
};

export default useBattle;
