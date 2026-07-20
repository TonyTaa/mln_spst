import React, { useState } from 'react';
import { Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useGameState } from '../../contexts/GameStateContext';

export const MapScreen = ({ onStartBattle, onStartBossBattle }) => {
  const { player, stages, quests, monsters, bosses, acceptQuest } = useGameState();
  const [selectedStageId, setSelectedStageId] = useState(player?.currentStageId || 'stage_1');

  if (!player) return null;

  const currentStageIndex = stages.findIndex(s => s.id === player.currentStageId);
  const selectedStageIndex = stages.findIndex(s => s.id === selectedStageId);
  const selectedStage = stages[selectedStageIndex] || stages[0];

  // Quests related to the selected stage
  const stageQuests = quests.filter(q => q.stageId === selectedStageId);
  const activeQuestIds = player.activeQuests.map(q => q.questId);
  
  // NPC details based on Chapter/Stage
  const getNpcDetails = (stageId) => {
    switch (stageId) {
      case 'stage_1': return { name: 'Giáo sư Triết học (Philosophy Prof)', emoji: '👨‍🏫', msg: 'Chào em! Hãy nắm thật chắc khái niệm cốt lõi về thế giới quan khoa học và phương pháp trừu tượng hóa trước khi ra thực tiễn nhé.' };
      case 'stage_2': return { name: 'Bác Nông Dân (Farmer)', emoji: '👩‍🌾', msg: 'Khu chợ này đang hỗn loạn vì hàng giả và lạm phát. Hãy dùng thước đo giá trị và các quy luật trao đổi ngang giá để giúp bà con!' };
      case 'stage_3': return { name: 'Anh Công Nhân (Factory Worker)', emoji: '🧑‍🏭', msg: 'Tư bản đang bóc lột sức lao động quá mức qua ngày làm việc kéo dài. Chúng ta cần đấu tranh giành lại giá trị thặng dư!' };
      case 'stage_4': return { name: 'Chị Thanh Tra (Market Inspector)', emoji: '👩‍✈️', msg: 'Các tập đoàn tài phiệt đang bắt tay lũng đoạn thị trường bằng giá độc quyền cao. Hãy phá vỡ xiềng xích độc quyền này.' };
      case 'stage_5': return { name: 'Chú Bộ Đội (Border Guard)', emoji: '💂', msg: 'Thị trường tự do vô hạn đang gây ra bóng ma đầu cơ và chợ đen. Định hướng XHCN sẽ là kim chỉ nam để ổn định cuộc sống nhân dân.' };
      case 'stage_6': return { name: 'Kỹ Sư Trẻ (High-Tech Engineer)', emoji: '👩‍💻', msg: 'Thời đại cách mạng công nghiệp 4.0 đòi hỏi trí tuệ chất lượng cao. Hãy hội nhập kinh tế quốc tế và đưa công nghệ hiện đại vào sản xuất!' };
      default: return { name: 'Người hướng dẫn (Guide)', emoji: '🧙‍♂️', msg: 'Đi theo chân lý cách mạng lý luận để giải phóng tiềm năng của chính mình!' };
    }
  };

  const npc = getNpcDetails(selectedStageId);

  const handleStageSelect = (stageId, index) => {
    // Player can only preview stages up to their current unlocked stage
    if (index <= currentStageIndex) {
      setSelectedStageId(stageId);
    }
  };

  const getStageStatus = (stageId) => {
    if (player.completedStages.includes(stageId)) return 'completed';
    if (stageId === player.currentStageId) return 'active';
    return 'locked';
  };

  const handleExplore = () => {
    // Pick a random minion from the selected stage's monsters
    const monsterIds = selectedStage.monsters;
    const randId = monsterIds[Math.floor(Math.random() * monsterIds.length)];
    const monsterTemplate = monsters.find(m => m.id === randId);
    if (monsterTemplate) {
      onStartBattle(monsterTemplate);
    }
  };

  const handleChallengeBoss = () => {
    const bossTemplate = bosses.find(b => b.id === selectedStage.bossId);
    if (bossTemplate) {
      onStartBossBattle(bossTemplate);
    }
  };

  return (
    <Row className="gy-4">
      {/* LEFT COLUMN: CHAPTERS GRID */}
      <Col lg={4}>
        <Card className="rpg-panel p-3 h-100 bg-darker">
          <h5 className="pixel-header text-info mb-3" style={{ fontSize: '12px' }}>THEORY MAP</h5>
          <div className="d-flex flex-column gap-2">
            {stages.map((stage, idx) => {
              const status = getStageStatus(stage.id);
              const isSelected = selectedStageId === stage.id;
              
              return (
                <div
                  key={stage.id}
                  className={`stage-grid-node p-3 d-flex align-items-center justify-content-between ${
                    status === 'locked' ? 'locked' : isSelected ? 'active' : ''
                  }`}
                  onClick={() => handleStageSelect(stage.id, idx)}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-4">
                      {idx === 0 ? '📚' : idx === 1 ? '🛒' : idx === 2 ? '🏭' : idx === 3 ? '🏢' : idx === 4 ? '⚖️' : '🚀'}
                    </span>
                    <div className="text-start">
                      <div className="pixel-text text-light" style={{ fontSize: '8px' }}>
                        CHAP {idx + 1}
                      </div>
                      <div className="pixel-sub text-muted" style={{ fontSize: '7px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                        {stage.name}
                      </div>
                    </div>
                  </div>
                  <div>
                    {status === 'completed' && <Badge bg="success" className="pixel-text" style={{ fontSize: '6px' }}>DONE</Badge>}
                    {status === 'active' && <Badge bg="warning" className="pixel-text" style={{ fontSize: '6px' }}>CURRENT</Badge>}
                    {status === 'locked' && <span className="fs-6">🔒</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </Col>

      {/* RIGHT COLUMN: STAGE ACTIONS & NPC */}
      <Col lg={8}>
        <div className="d-flex flex-column gap-4 h-100">
          {/* Section 1: Stage details & quest */}
          <Card className="rpg-panel p-4 active-glow">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="pixel-text text-warning" style={{ fontSize: '10px' }}>
                  CHAPTER {selectedStageIndex + 1} ARENA
                </span>
                <h3 className="pixel-header text-info mt-1">{selectedStage.name}</h3>
              </div>
              <Badge bg="secondary" className="pixel-text p-2" style={{ fontSize: '8px' }}>
                MIN LVL: {selectedStage.minLevel}
              </Badge>
            </div>
            <p className="text-light" style={{ fontSize: '14px' }}>
              {selectedStage.description}
            </p>

            {/* Quests available in this stage */}
            <div className="mt-4 pt-3 border-top border-secondary">
              <span className="pixel-text text-warning d-block mb-2" style={{ fontSize: '8px' }}>STAGE QUESTS</span>
              {stageQuests.length === 0 ? (
                <div className="text-muted small">No quests configured for this stage.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {stageQuests.map((q) => {
                    const isActive = activeQuestIds.includes(q.id);
                    
                    return (
                      <div key={q.id} className="d-flex justify-content-between align-items-center bg-darker p-2 border border-secondary rounded">
                        <div>
                          <strong style={{ fontSize: '13px' }}>{q.title}</strong>
                          <div className="text-muted small">{q.description}</div>
                        </div>
                        <div>
                          {isActive ? (
                            <Badge bg="info" className="pixel-text" style={{ fontSize: '7px' }}>ACTIVE</Badge>
                          ) : (
                            <Button variant="outline-warning" size="sm" className="pixel-text p-1" style={{ fontSize: '7px' }} onClick={() => acceptQuest(q.id)}>
                              ACCEPT
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Section 2: NPC Dialog */}
          <Card className="rpg-panel p-3 bg-darker" style={{ borderStyle: 'solid' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="npc-avatar">{npc.emoji}</div>
              <div className="text-start">
                <strong className="pixel-text text-warning" style={{ fontSize: '10px' }}>{npc.name}</strong>
                <div className="text-light mt-1 italic" style={{ fontSize: '13px', fontStyle: 'italic' }}>
                  "{npc.msg}"
                </div>
              </div>
            </div>
          </Card>

          {/* Section 3: Fight controls */}
          <Card className="rpg-panel p-4">
            <h5 className="pixel-header text-info mb-3" style={{ fontSize: '10px' }}>COMBAT CONTROLS</h5>
            <Row className="g-3">
              <Col md={6}>
                <div className="border border-secondary p-3 rounded bg-darker text-center">
                  <div className="fs-2 mb-2">👾</div>
                  <strong className="d-block mb-1">Explore Chapter Minions</strong>
                  <p className="text-muted small mb-3">Battle random normal enemies to earn EXP and Gold. Correctly answer questions to unlock loot chests!</p>
                  <Button variant="outline-info" className="rpg-btn w-100" onClick={handleExplore}>
                    ⚔️ EXPLORE FIGHT
                  </Button>
                </div>
              </Col>
              
              <Col md={6}>
                <div className="border border-secondary p-3 rounded bg-darker text-center h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="fs-2 mb-2">👑</div>
                    <strong className="d-block mb-1">Challenge Chapter Boss</strong>
                    <p className="text-muted small mb-3">Defeat the Boss to unlock the final evaluation quiz (5 consecutive questions) and clear the chapter.</p>
                  </div>
                  <Button 
                    variant="outline-danger" 
                    className="rpg-btn rpg-btn-red w-100"
                    disabled={player.currentStageId !== selectedStageId}
                    onClick={handleChallengeBoss}
                  >
                    💀 CHALLENGE BOSS
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      </Col>
    </Row>
  );
};

export default MapScreen;
