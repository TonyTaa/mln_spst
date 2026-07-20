import React, { useState } from 'react';
import { Navbar, Container, Button, Toast, ToastContainer } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../contexts/GameStateContext';
import DashboardOffcanvas from './DashboardOffcanvas';

export const HUD = () => {
  const { player, saveGameProgress } = useGameState();
  const navigate = useNavigate();
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  if (!player) return null;

  // Level Up threshold: level * 100
  const nextLevelThreshold = player.level * 100;
  const expPercentage = Math.min(100, (player.exp / nextLevelThreshold) * 100);
  const hpPercentage = Math.min(100, (player.hp / player.maxHp) * 100);

  const handleManualSave = async () => {
    const success = await saveGameProgress();
    if (success) {
      setShowSaveToast(true);
    }
  };

  return (
    <>
      <Navbar className="rpg-hud p-2 sticky-top border-bottom border-secondary" style={{ zIndex: 1000 }}>
        <Container fluid className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Section 1: Player info */}
          <div className="d-flex align-items-center gap-3">
            <div className="text-start">
              <div className="pixel-text text-warning m-0" style={{ fontSize: '9px' }}>
                {player.playerName.toUpperCase()}
              </div>
              <div className="pixel-sub" style={{ fontSize: '7px' }}>
                {player.classType}
              </div>
            </div>
            <div className="border border-secondary px-2 py-1 rounded bg-darker text-center">
              <span className="pixel-text text-info" style={{ fontSize: '8px' }}>LVL {player.level}</span>
            </div>
          </div>

          {/* Section 2: HP & EXP bars */}
          <div className="d-flex align-items-center flex-grow-1 mx-3 gap-3" style={{ minWidth: '220px', maxWidth: '500px' }}>
            {/* HP Bar */}
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="pixel-text text-red" style={{ fontSize: '7px' }}>❤️ HP</span>
                <span className="pixel-text" style={{ fontSize: '7px' }}>{player.hp}/{player.maxHp}</span>
              </div>
              <div className="rpg-progress">
                <div 
                  className="rpg-progress-bar" 
                  style={{ width: `${hpPercentage}%`, background: 'var(--hp-gradient)' }}
                />
              </div>
            </div>

            {/* EXP Bar */}
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="pixel-text text-blue" style={{ fontSize: '7px' }}>✨ EXP</span>
                <span className="pixel-text" style={{ fontSize: '7px' }}>{player.exp}/{nextLevelThreshold}</span>
              </div>
              <div className="rpg-progress">
                <div 
                  className="rpg-progress-bar" 
                  style={{ width: `${expPercentage}%`, background: 'var(--exp-gradient)' }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Gold, Score & Actions */}
          <div className="d-flex align-items-center gap-3">
            <div className="pixel-text text-warning m-0" style={{ fontSize: '9px' }}>
              🪙 {player.gold}g
            </div>
            
            <div className="pixel-text text-green m-0 d-none d-md-block" style={{ fontSize: '9px' }}>
              📝 SCORE: {player.score}
            </div>

            <Button variant="outline-light" size="sm" className="rpg-btn" style={{ padding: '6px 12px' }} onClick={() => setShowDashboard(true)}>
              🎒 DASHBOARD
            </Button>

            <Button variant="outline-success" size="sm" className="rpg-btn rpg-btn-green" style={{ padding: '6px 12px' }} onClick={handleManualSave}>
              💾 SAVE
            </Button>

            <Button variant="outline-danger" size="sm" className="rpg-btn rpg-btn-red" style={{ padding: '6px 12px' }} onClick={() => navigate('/')}>
              🚪 LEAVE
            </Button>
          </div>
        </Container>
      </Navbar>

      {/* Dashboard Offcanvas drawer */}
      <DashboardOffcanvas show={showDashboard} handleClose={() => setShowDashboard(false)} />

      {/* Save confirmation popup toast */}
      <ToastContainer position="top-center" className="p-3">
        <Toast bg="success" onClose={() => setShowSaveToast(false)} show={showSaveToast} delay={2000} autohide className="border-0">
          <Toast.Body className="text-white pixel-text text-center" style={{ fontSize: '9px' }}>
            💾 PROGRESS SAVED SUCCESSFULLY
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default HUD;
