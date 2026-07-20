import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Button, Dropdown, Badge } from 'react-bootstrap';
import { useGameState } from '../../contexts/GameStateContext';
import { useInventory } from '../../hooks/useInventory';

export const BattleScreen = ({ battle, isBoss }) => {
  const { player } = useGameState();
  const { inventory } = useInventory();
  const { enemy, battleState, battleLog, floaters, playerAttack, playerUsePotion, attemptFlee } = battle;
  const [showPotionMenu, setShowPotionMenu] = useState(false);

  // Ref to automatically scroll the battle log console
  const logEndRef = useRef(null);
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [battleLog]);

  if (!enemy) return null;

  // Filter potions from hydrated inventory
  const potions = inventory.filter(i => i.details.type === 'potion');

  const enemyHpPercentage = Math.min(100, (enemy.hp / enemy.maxHp) * 100);
  const playerHpPercentage = Math.min(100, (player.hp / player.maxHp) * 100);

  // Animate status styling
  const isPlayerHit = battleState === 'enemy_turn';
  const isEnemyHit = battleState === 'player_turn';

  return (
    <Card className="rpg-panel active-glow battle-container bg-dark text-light border-secondary p-4 overflow-hidden position-relative">
      {/* Scanline CRT overlay */}
      <div className="scanlines"></div>

      {/* Floating combat numbers */}
      {floaters.map((f) => (
        <div
          key={f.id}
          className={
            f.type === 'damage' ? 'damage-floater' :
            f.type === 'enemy_damage' ? 'damage-floater text-warning fs-3' :
            'heal-floater'
          }
          style={{
            top: f.type === 'enemy_damage' ? '25%' : '60%',
            left: f.type === 'enemy_damage' ? '70%' : '25%',
          }}
        >
          {f.type === 'damage' ? `-${f.amount}` : f.type === 'enemy_damage' ? `-${f.amount}` : `${f.amount}`}
        </div>
      ))}

      {/* BATTLEGROUND RENDER */}
      <Row className="mb-4 text-center align-items-center" style={{ minHeight: '220px' }}>
        {/* Left Side: Player */}
        <Col xs={5} className="d-flex flex-column align-items-center">
          <div 
            className={`fs-1 mb-2 ${isPlayerHit ? 'shake-animation' : ''}`}
            style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}
          >
            🛡️🧑‍🎓
          </div>
          <strong className="pixel-text text-light" style={{ fontSize: '9px' }}>{player.playerName}</strong>
          <div className="pixel-sub text-info mt-1">LVL {player.level}</div>
          
          <div className="w-100 mt-3" style={{ maxWidth: '160px' }}>
            <div className="rpg-progress mb-1">
              <div 
                className="rpg-progress-bar" 
                style={{ width: `${playerHpPercentage}%`, background: 'var(--hp-gradient)' }}
              />
            </div>
            <span className="pixel-text text-muted" style={{ fontSize: '7px' }}>
              HP: {player.hp}/{player.maxHp}
            </span>
          </div>
        </Col>

        {/* Center: VS Banner */}
        <Col xs={2}>
          <div className="pixel-header text-red fs-4">VS</div>
          {isBoss && <Badge bg="danger" className="pixel-text mt-2" style={{ fontSize: '6px' }}>BOSS FIGHT</Badge>}
        </Col>

        {/* Right Side: Enemy Monster */}
        <Col xs={5} className="d-flex flex-column align-items-center">
          <div 
            className={`fs-1 mb-2 ${isEnemyHit ? 'shake-animation' : ''}`}
            style={{ width: '80px', height: '80px', background: 'rgba(255,0,0,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}
          >
            {enemy.image}
          </div>
          <strong className="pixel-text text-red" style={{ fontSize: '9px' }}>{enemy.name}</strong>
          <div className="pixel-sub text-muted mt-1">Chapter {enemy.chapter} Opponent</div>

          <div className="w-100 mt-3" style={{ maxWidth: '160px' }}>
            <div className="rpg-progress mb-1">
              <div 
                className="rpg-progress-bar" 
                style={{ width: `${enemyHpPercentage}%`, background: 'var(--hp-gradient)' }}
              />
            </div>
            <span className="pixel-text text-muted" style={{ fontSize: '7px' }}>
              HP: {enemy.hp}/{enemy.maxHp}
            </span>
          </div>
        </Col>
      </Row>

      {/* ACTION PANEL */}
      <Card className="bg-darker border-secondary p-3 mb-3">
        <h6 className="pixel-text text-info mb-3" style={{ fontSize: '8px' }}>COMMAND DECK</h6>
        <div className="d-flex flex-wrap justify-content-center gap-3">
          <Button
            variant="outline-danger"
            className="rpg-btn rpg-btn-red"
            style={{ minWidth: '130px' }}
            disabled={battleState !== 'player_turn'}
            onClick={playerAttack}
          >
            ⚔️ ATTACK
          </Button>

          {/* Potions Dropdown */}
          <Dropdown show={showPotionMenu} onToggle={(isOpen) => setShowPotionMenu(isOpen)} className="d-inline">
            <Dropdown.Toggle 
              variant="outline-success" 
              className="rpg-btn rpg-btn-green"
              style={{ minWidth: '130px' }}
              disabled={battleState !== 'player_turn' || potions.length === 0}
            >
              🧪 POTION ({potions.reduce((acc, p) => acc + p.quantity, 0)})
            </Dropdown.Toggle>
            <Dropdown.Menu className="bg-dark text-light border-secondary p-2 dropdown-menu-dark">
              {potions.map((p) => (
                <Dropdown.Item 
                  key={p.itemId} 
                  className="pixel-text text-light bg-hover-secondary rounded p-2"
                  style={{ fontSize: '8px' }}
                  onClick={() => {
                    playerUsePotion(p.itemId);
                    setShowPotionMenu(false);
                  }}
                >
                  🧪 {p.details.name} (x{p.quantity}) [+{p.details.statValue} HP]
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <Button
            variant="outline-warning"
            className="rpg-btn"
            style={{ minWidth: '130px' }}
            disabled={battleState !== 'player_turn' || isBoss}
            onClick={attemptFlee}
          >
            🏃 FLEE
          </Button>
        </div>
      </Card>

      {/* COMBAT LOG CONSOLE */}
      <Card className="bg-darker border-secondary p-2" style={{ height: '110px', overflowY: 'auto' }}>
        <div className="pixel-text text-start text-muted mb-2" style={{ fontSize: '7px', borderBottom: '1px solid #1e293b', paddingBottom: '3px' }}>
          COMBAT CONSOLE LOG
        </div>
        <div className="d-flex flex-column-reverse text-start gap-1" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
          {battleLog.map((log, idx) => {
            let colorClass = 'text-light';
            if (log.includes('attacks') || log.includes('attack')) colorClass = 'text-warning';
            if (log.includes('deals') && log.includes('to you')) colorClass = 'text-danger';
            if (log.includes('defeated') || log.includes('victory') || log.includes('escaped')) colorClass = 'text-success';
            if (log.includes('potion') || log.includes('restored')) colorClass = 'text-green';
            
            return (
              <div key={idx} className={colorClass}>
                &gt; {log}
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>
      </Card>
    </Card>
  );
};

export default BattleScreen;
