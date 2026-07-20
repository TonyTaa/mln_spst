import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../contexts/GameStateContext';
import { useBattle } from '../hooks/useBattle';
import { useQuiz } from '../hooks/useQuiz';
import HUD from '../components/HUD';
import MapScreen from '../features/map/MapScreen';
import BattleScreen from '../features/battle/BattleScreen';
import QuizScreen from '../features/quiz/QuizScreen';

export const GamePage = () => {
  const { player, items, stages, updatePlayerHp, saveGameProgress, addLog, loading, error } = useGameState();
  const navigate = useNavigate();

  // Custom hook instances
  const battle = useBattle();
  const quiz = useQuiz();

  // Layout panels: map, battle, quiz
  const [currentPanel, setCurrentPanel] = useState('map');
  const [battleType, setBattleType] = useState('minion'); // minion, boss
  const [chestDifficulty, setChestDifficulty] = useState('bronze'); // bronze, silver, gold
  
  // Pending rewards from active fight to be claimed in quiz
  const [pendingRewards, setPendingRewards] = useState({ exp: 0, gold: 0, lootItems: [] });
  
  // Defeat modal control
  const [showDefeatModal, setShowDefeatModal] = useState(false);

  // Redirect to home if player not loaded (e.g. page refreshed)
  useEffect(() => {
    if (!loading && !player) {
      navigate('/');
    }
  }, [player, loading, navigate]);

  const handleCombatVictory = useCallback(() => {
    const enemyRef = battle.enemy;
    if (!enemyRef) return;

    if (battleType === 'minion') {
      const rand = Math.random();
      let diff = 'bronze';
      if (rand > 0.85) {
        diff = 'gold';
      } else if (rand > 0.55) {
        diff = 'silver';
      }
      setChestDifficulty(diff);

      const lootItems = [];
      const matchRarityItems = items.filter(i => i.rarity === diff);
      const potions = items.filter(i => i.type === 'potion');

      if (Math.random() < 0.7 && matchRarityItems.length > 0) {
        const randGear = matchRarityItems[Math.floor(Math.random() * matchRarityItems.length)];
        lootItems.push(randGear.id);
      } else if (Math.random() < 0.8 && potions.length > 0) {
        const randPotion = potions[Math.floor(Math.random() * potions.length)];
        lootItems.push(randPotion.id);
      }

      let multiplier = 1.0;
      if (diff === 'silver') multiplier = 1.4;
      if (diff === 'gold') multiplier = 1.8;

      setPendingRewards({
        exp: Math.floor(enemyRef.expReward * multiplier),
        gold: Math.floor(enemyRef.goldReward * multiplier),
        lootItems
      });

      setCurrentPanel('quiz');
      battle.setBattleState('idle');
    } else {
      const bossLoot = [];
      const highTierItems = items.filter(i => i.rarity === 'gold' || i.rarity === 'silver');
      if (highTierItems.length > 0) {
        const randGear = highTierItems[Math.floor(Math.random() * highTierItems.length)];
        bossLoot.push(randGear.id);
      }

      const elixirs = items.filter(i => i.id === 'p_elixir' || i.id === 'p_large');
      if (elixirs.length > 0) {
        bossLoot.push(elixirs[Math.floor(Math.random() * elixirs.length)].id);
      }

      setPendingRewards({
        exp: enemyRef.expReward,
        gold: enemyRef.goldReward,
        lootItems: bossLoot
      });

      setCurrentPanel('quiz');
      battle.setBattleState('idle');
    }
  }, [battle, battleType, items]);

  // Monitor combat outcomes
  useEffect(() => {
    if (battle.battleState === 'victory') {
      const timer = setTimeout(() => {
        handleCombatVictory();
      }, 1500);
      return () => clearTimeout(timer);
    } else if (battle.battleState === 'defeat') {
      const timer = setTimeout(() => {
        setShowDefeatModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (battle.battleState === 'escaped') {
      const timer = setTimeout(() => {
        setCurrentPanel('map');
        battle.setBattleState('idle');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [battle.battleState, battle, handleCombatVictory]);

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-100 text-light">
        <span className="pixel-text">ESTABLISHING GAME PORTAL...</span>
      </Container>
    );
  }

  if (error || !player) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-100 text-light">
        <Card className="rpg-panel p-5 text-center bg-darker border-danger">
          <h2 className="pixel-header text-red mb-3">CONNECTION TIMEOUT</h2>
          <p>{error || 'No active session detected. Please return to Main Menu.'}</p>
          <Button variant="outline-danger" className="rpg-btn rpg-btn-red mt-3" onClick={() => navigate('/')}>
            BACK TO HOME
          </Button>
        </Card>
      </Container>
    );
  }

  // Combat defeat revive
  const handleRevive = () => {
    // 10% Gold penalty, revive to full health, return to map
    const goldPenalty = Math.floor(player.gold * 0.1);
    const revivedPlayer = {
      ...player,
      gold: Math.max(0, player.gold - goldPenalty),
      hp: player.maxHp
    };

    updatePlayerHp(player.maxHp);
    setShowDefeatModal(false);
    setCurrentPanel('map');
    battle.setBattleState('idle');
    addLog(`You were revived at the classroom clinic. Lost ${goldPenalty} gold.`);
    
    // Save revived state
    setTimeout(() => {
      saveGameProgress(revivedPlayer);
    }, 100);
  };

  // Start generic minion fight
  const handleStartMinionBattle = (monsterObj) => {
    setBattleType('minion');
    battle.startBattle(monsterObj);
    setCurrentPanel('battle');
  };

  // Start generic boss fight
  const handleStartBossBattle = (bossObj) => {
    setBattleType('boss');
    battle.startBattle(bossObj);
    setCurrentPanel('battle');
  };

  // Stage index helper
  const activeStage = stages.find(s => s.id === player.currentStageId) || stages[0];

  return (
    <div className="d-flex flex-column min-vh-100 bg-darker">
      <HUD />
      
      <Container className="py-4 flex-grow-1">
        {currentPanel === 'map' && (
          <MapScreen
            onStartBattle={handleStartMinionBattle}
            onStartBossBattle={handleStartBossBattle}
          />
        )}

        {currentPanel === 'battle' && (
          <BattleScreen
            battle={battle}
            isBoss={battleType === 'boss'}
          />
        )}

        {currentPanel === 'quiz' && (
          <QuizScreen
            quiz={quiz}
            difficulty={chestDifficulty}
            chapter={activeStage.chapter}
            rewardData={pendingRewards}
            isBossSequence={battleType === 'boss'}
            onBackToMap={() => {
              setCurrentPanel('map');
              quiz.resetQuiz();
            }}
          />
        )}
      </Container>

      {/* Revive Modal */}
      <Modal 
        show={showDefeatModal} 
        onHide={() => {}} 
        backdrop="static" 
        keyboard={false} 
        centered
        className="rpg-defeat-modal text-light"
      >
        <Modal.Body className="bg-dark text-center border border-danger rounded p-5">
          <div className="fs-1 mb-3">💀🪦🕯️</div>
          <h3 className="pixel-header text-red mb-3">YOU WERE DEFEATED</h3>
          <p className="mb-4">
            Em đã kiệt sức trong đấu trường lý luận! Bộ phận y tế của khoa đã khôi phục thể trạng của em.
          </p>
          <div className="bg-darker border border-secondary rounded p-3 mb-4">
            <span className="pixel-text text-muted" style={{ fontSize: '8px' }}>CONSEQUENCES</span>
            <div className="pixel-text text-warning mt-2" style={{ fontSize: '9px' }}>
              HP Restored: 100%<br />
              Clinic Fee: -10% Gold (-{Math.floor(player.gold * 0.1)}g)
            </div>
          </div>
          <Button variant="outline-danger" className="rpg-btn rpg-btn-red py-2 px-4" onClick={handleRevive}>
            REVIVE & RETURN
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default GamePage;
