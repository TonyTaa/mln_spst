import React, { useState } from 'react';
import { Offcanvas, Tabs, Tab, Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { useGameState } from '../contexts/GameStateContext';
import { useInventory } from '../hooks/useInventory';

export const DashboardOffcanvas = ({ show, handleClose }) => {
  const { player, quests, acceptQuest, claimQuestReward } = useGameState();
  const { inventory, equipped, shopItems, equip, unequip, usePotion, buy, sell } = useInventory();
  const [activeTab, setActiveTab] = useState('inventory');

  if (!player) return null;

  // Group quests: active (not finished) and completed (ready to hand in), and available in this stage
  const currentStageQuests = quests.filter(q => q.stageId === player.currentStageId);
  const activeQuestIds = player.activeQuests.map(q => q.questId);
  
  const activeQuestsWithProgress = player.activeQuests.map((aq) => {
    const qDetails = quests.find(q => q.id === aq.questId);
    return { ...aq, details: qDetails };
  }).filter(q => q.details);

  const availableQuests = currentStageQuests.filter(q => 
    !activeQuestIds.includes(q.id) && 
    !player.completedStages.includes(q.stageId) // If stage not fully cleared yet
  );

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" className="bg-dark text-light border-start border-secondary" style={{ width: '450px' }}>
      <Offcanvas.Header closeButton closeVariant="white" className="border-bottom border-secondary">
        <Offcanvas.Title className="pixel-header">STUDENT DASHBOARD</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="p-0">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="nav-tabs-custom border-bottom border-secondary bg-darker"
          justify
        >
          {/* TAB 1: INVENTORY & EQUIPMENT */}
          <Tab eventKey="inventory" title={<span className="pixel-text">🎒 GEAR</span>} className="p-3">
            <h5 className="pixel-header text-info mb-3">Equipped Gear</h5>
            <Row className="mb-4 text-center">
              {/* Weapon Slot */}
              <Col xs={4}>
                <div className="border border-secondary p-2 rounded bg-darker h-100 d-flex flex-column justify-content-between">
                  <span className="pixel-text text-muted" style={{ fontSize: '7px' }}>WEAPON</span>
                  <div className="fs-3 my-2">⚔️</div>
                  {equipped.weapon ? (
                    <div>
                      <div className="pixel-text text-green" style={{ fontSize: '8px' }}>{equipped.weapon.name}</div>
                      <div className="pixel-text text-muted" style={{ fontSize: '7px' }}>+{equipped.weapon.statValue} ATK</div>
                      <Button variant="outline-danger" size="sm" className="pixel-text p-1 mt-2" style={{ fontSize: '6px' }} onClick={() => unequip('weapon')}>
                        REMOVE
                      </Button>
                    </div>
                  ) : (
                    <span className="pixel-text text-muted" style={{ fontSize: '7px' }}>Empty</span>
                  )}
                </div>
              </Col>
              
              {/* Armor Slot */}
              <Col xs={4}>
                <div className="border border-secondary p-2 rounded bg-darker h-100 d-flex flex-column justify-content-between">
                  <span className="pixel-text text-muted" style={{ fontSize: '7px' }}>ARMOR</span>
                  <div className="fs-3 my-2">🛡️</div>
                  {equipped.armor ? (
                    <div>
                      <div className="pixel-text text-green" style={{ fontSize: '8px' }}>{equipped.armor.name}</div>
                      <div className="pixel-text text-muted" style={{ fontSize: '7px' }}>+{equipped.armor.statValue} DEF</div>
                      <Button variant="outline-danger" size="sm" className="pixel-text p-1 mt-2" style={{ fontSize: '6px' }} onClick={() => unequip('armor')}>
                        REMOVE
                      </Button>
                    </div>
                  ) : (
                    <span className="pixel-text text-muted" style={{ fontSize: '7px' }}>Empty</span>
                  )}
                </div>
              </Col>

              {/* Accessory Slot */}
              <Col xs={4}>
                <div className="border border-secondary p-2 rounded bg-darker h-100 d-flex flex-column justify-content-between">
                  <span className="pixel-text text-muted" style={{ fontSize: '7px' }}>ACCESSORY</span>
                  <div className="fs-3 my-2">💍</div>
                  {equipped.accessory ? (
                    <div>
                      <div className="pixel-text text-green" style={{ fontSize: '8px' }}>{equipped.accessory.name}</div>
                      <div className="pixel-text text-muted" style={{ fontSize: '7px' }}>
                        +{equipped.accessory.statValue} {equipped.accessory.statName.toUpperCase()}
                      </div>
                      <Button variant="outline-danger" size="sm" className="pixel-text p-1 mt-2" style={{ fontSize: '6px' }} onClick={() => unequip('accessory')}>
                        REMOVE
                      </Button>
                    </div>
                  ) : (
                    <span className="pixel-text text-muted" style={{ fontSize: '7px' }}>Empty</span>
                  )}
                </div>
              </Col>
            </Row>

            <h5 className="pixel-header text-info mb-3">Inventory Bag</h5>
            {inventory.length === 0 ? (
              <div className="text-center py-4 border border-secondary rounded bg-darker">
                <span className="pixel-text text-muted" style={{ fontSize: '8px' }}>INVENTORY IS EMPTY</span>
              </div>
            ) : (
              <Row className="g-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {inventory.map((item) => (
                  <Col xs={12} key={item.itemId}>
                    <Card className="bg-darker border-secondary text-light p-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="fs-5">
                              {item.details.type === 'weapon' ? '⚔️' : item.details.type === 'armor' ? '🛡️' : item.details.type === 'potion' ? '🧪' : '💍'}
                            </span>
                            <div>
                              <strong className="pixel-text text-warning" style={{ fontSize: '9px' }}>{item.details.name}</strong>
                              <Badge className={`ms-2 badge-${item.details.rarity}`} style={{ fontSize: '6px', padding: '3px' }}>
                                {item.details.rarity.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-muted mt-1" style={{ fontSize: '11px' }}>
                            {item.details.description}
                          </div>
                          <div className="pixel-text text-green mt-1" style={{ fontSize: '7px' }}>
                            Effect: +{item.details.statValue} {item.details.statName.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-end">
                          <Badge bg="secondary" className="mb-2 pixel-text" style={{ fontSize: '8px' }}>x{item.quantity}</Badge>
                          <div>
                            {item.details.type === 'potion' ? (
                              <Button variant="success" size="sm" className="pixel-text p-1 me-1" style={{ fontSize: '7px' }} onClick={() => usePotion(item.itemId)}>
                                DRINK
                              </Button>
                            ) : (
                              <Button variant="primary" size="sm" className="pixel-text p-1 me-1" style={{ fontSize: '7px' }} onClick={() => equip(item.itemId)}>
                                EQUIP
                              </Button>
                            )}
                            <Button variant="outline-warning" size="sm" className="pixel-text p-1" style={{ fontSize: '7px' }} onClick={() => sell(item.itemId)}>
                              SELL
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Tab>

          {/* TAB 2: QUEST LOG */}
          <Tab eventKey="quests" title={<span className="pixel-text">📜 QUESTS</span>} className="p-3">
            <h5 className="pixel-header text-info mb-3">Active Quests</h5>
            {activeQuestsWithProgress.length === 0 ? (
              <div className="text-center py-3 border border-secondary rounded bg-darker mb-4">
                <span className="pixel-text text-muted" style={{ fontSize: '8px' }}>NO ACTIVE QUESTS</span>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3 mb-4">
                {activeQuestsWithProgress.map((aq) => {
                  const isDone = aq.progress >= aq.details.targetCount;
                  return (
                    <Card key={aq.questId} className="bg-darker border-secondary text-light rpg-quest-card p-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong className="pixel-text text-warning" style={{ fontSize: '9px' }}>{aq.details.title}</strong>
                          <p className="text-muted mt-2 mb-1" style={{ fontSize: '12px' }}>{aq.details.description}</p>
                          <div className="pixel-text text-info mt-2" style={{ fontSize: '7px' }}>
                            Rewards: +{aq.details.rewardGold} Gold, +{aq.details.rewardExp} EXP
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="pixel-text text-light mb-2" style={{ fontSize: '8px' }}>
                            Prog: {aq.progress}/{aq.details.targetCount}
                          </div>
                          {isDone ? (
                            <Button variant="success" size="sm" className="pixel-text p-1" style={{ fontSize: '7px' }} onClick={() => claimQuestReward(aq.questId)}>
                              CLAIM
                            </Button>
                          ) : (
                            <Badge bg="secondary" className="pixel-text" style={{ fontSize: '7px' }}>IN PROGRESS</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            <h5 className="pixel-header text-info mb-3">Available Chapter Quests</h5>
            {availableQuests.length === 0 ? (
              <div className="text-center py-3 border border-secondary rounded bg-darker">
                <span className="pixel-text text-muted" style={{ fontSize: '8px' }}>NO QUESTS AVAILABLE AT THIS STAGE</span>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {availableQuests.map((quest) => (
                  <Card key={quest.id} className="bg-darker border-secondary text-light p-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <strong className="pixel-text text-info" style={{ fontSize: '9px' }}>{quest.title}</strong>
                        <p className="text-muted mt-2 mb-1" style={{ fontSize: '12px' }}>{quest.description}</p>
                        <div className="pixel-text text-warning mt-2" style={{ fontSize: '7px' }}>
                          Rewards: +{quest.rewardGold} Gold, +{quest.rewardExp} EXP
                        </div>
                      </div>
                      <Button variant="outline-info" size="sm" className="pixel-text p-1" style={{ fontSize: '7px' }} onClick={() => acceptQuest(quest.id)}>
                        ACCEPT
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Tab>

          {/* TAB 3: MERCHANT SHOP */}
          <Tab eventKey="shop" title={<span className="pixel-text">⚖️ SHOP</span>} className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="pixel-header text-info m-0">Marketplace</h5>
              <div className="pixel-text text-warning" style={{ fontSize: '10px' }}>
                YOUR GOLD: {player.gold}g
              </div>
            </div>
            <Row className="g-2" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {shopItems.map((item) => (
                <Col xs={12} key={item.id}>
                  <Card className="bg-darker border-secondary text-light p-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fs-5">
                            {item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : item.type === 'potion' ? '🧪' : '💍'}
                          </span>
                          <div>
                            <strong className="pixel-text text-warning" style={{ fontSize: '9px' }}>{item.name}</strong>
                            <Badge className={`ms-2 badge-${item.rarity}`} style={{ fontSize: '6px', padding: '3px' }}>
                              {item.rarity.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-muted mt-1" style={{ fontSize: '11px' }}>
                          {item.description}
                        </div>
                        <div className="pixel-text text-green mt-1" style={{ fontSize: '7px' }}>
                          +{item.statValue} {item.statName.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="pixel-text text-warning mb-2" style={{ fontSize: '8px' }}>{item.cost}g</div>
                        <Button
                          variant="success"
                          size="sm"
                          className="pixel-text p-1"
                          style={{ fontSize: '7px' }}
                          disabled={player.gold < item.cost}
                          onClick={() => buy(item)}
                        >
                          BUY
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Tab>
        </Tabs>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default DashboardOffcanvas;
