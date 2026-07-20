import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, ListGroup, Table, Badge, Button, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../../contexts/GameStateContext';
import apiService from '../../services/api';

export const HomeScreen = () => {
  const { classes, createNewGame, loadSaveGame } = useGameState();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('menu');
  const [playerName, setPlayerName] = useState('');
  const [selectedClass, setSelectedClass] = useState(0);
  const [savegames, setSavegames] = useState([]);
  const [loadingSaves, setLoadingSaves] = useState(false);

  // Load savegames list when mounting or switching tabs
  useEffect(() => {
    if (activeTab === 'continue' || activeTab === 'leaderboard') {
      const fetchSaves = async () => {
        setLoadingSaves(true);
        try {
          const saves = await apiService.getSaveGames();
          // Sort by timestamp desc for Continue screen
          // Sort by Level/Score desc for Leaderboard
          setSavegames(saves);
        } catch (err) {
          console.error('Failed to load save games:', err);
        } finally {
          setLoadingSaves(false);
        }
      };
      fetchSaves();
    }
  }, [activeTab]);

  const handleCreateGame = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const success = await createNewGame(playerName, selectedClass);
    if (success) {
      navigate('/game');
    }
  };

  const handleLoadSave = async (id) => {
    const success = await loadSaveGame(id);
    if (success) {
      navigate('/game');
    }
  };

  const formatTimestamp = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('vi-VN');
    } catch {
      return isoString;
    }
  };

  return (
    <Container className="py-5 text-light d-flex flex-column justify-content-center min-vh-100">
      <Row className="justify-content-center text-center mb-5">
        <Col md={10} lg={8}>
          <div className="mb-3 fs-1">📚⚔️🛡️</div>
          <h1 className="pixel-header text-warning mb-2" style={{ fontSize: '32px', lineHeight: '1.4' }}>
            POLITICAL ECONOMY RPG
          </h1>
          <p className="pixel-text text-muted" style={{ fontSize: '10px' }}>
            Marxist-Leninist Theory Learning through 2D Combat & Quizzes
          </p>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="rpg-panel gold-glow p-4">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="nav-tabs-custom border-bottom border-secondary mb-4 bg-darker"
              justify
            >
              {/* MENU TAB */}
              <Tab eventKey="menu" title={<span className="pixel-text">🏠 MAIN</span>}>
                <div className="d-flex flex-column gap-3 text-center py-4">
                  <div className="mb-4">
                    <p className="lead">Chào mừng các bạn sinh viên đến với Đấu trường Lý luận!</p>
                    <p className="text-muted" style={{ fontSize: '14px' }}>
                      Hãy hóa thân vào các vai trò kinh tế, chinh phục 6 chương lý thuyết Kinh tế Chính trị Mác - Lênin cốt lõi để bảo vệ thị trường định hướng XHCN.
                    </p>
                  </div>
                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <Button variant="outline-warning" className="rpg-btn rpg-btn-gold w-100 py-3" onClick={() => setActiveTab('newgame')}>
                        ✨ NEW GAME
                      </Button>
                    </Col>
                    <Col xs={12} md={6}>
                      <Button variant="outline-info" className="rpg-btn w-100 py-3" onClick={() => setActiveTab('continue')}>
                        💾 CONTINUE
                      </Button>
                    </Col>
                    <Col xs={12} md={6}>
                      <Button variant="outline-success" className="rpg-btn rpg-btn-green w-100 py-3" onClick={() => setActiveTab('leaderboard')}>
                        🏆 LEADERBOARD
                      </Button>
                    </Col>
                    <Col xs={12} md={6}>
                      <Button variant="outline-light" className="rpg-btn w-100 py-3" onClick={() => setActiveTab('about')}>
                        ❔ ABOUT
                      </Button>
                    </Col>
                  </Row>
                </div>
              </Tab>

              {/* NEW GAME TAB */}
              <Tab eventKey="newgame" title={<span className="pixel-text">✨ NEW GAME</span>}>
                <Form onSubmit={handleCreateGame}>
                  <Form.Group className="mb-4">
                    <Form.Label className="pixel-text text-warning">Student Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter character name..."
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="bg-dark text-white border-secondary pixel-text"
                      maxLength={18}
                      required
                    />
                  </Form.Group>

                  <Form.Label className="pixel-text text-warning mb-3">Choose Your Class Profile</Form.Label>
                  <Row className="g-3 mb-4">
                    {classes.map((cls, idx) => (
                      <Col md={4} key={idx}>
                        <Card
                          className={`rpg-choice-card h-100 flex-column text-center p-3 ${selectedClass === idx ? 'selected' : ''}`}
                          onClick={() => setSelectedClass(idx)}
                        >
                          <div className="fs-2 mb-2">
                            {idx === 0 ? '👨‍🏫' : idx === 1 ? '👨‍🔧' : '💼'}
                          </div>
                          <strong className="pixel-text text-warning d-block mb-2" style={{ fontSize: '10px' }}>
                            {cls.classType.split(' ')[0]}
                          </strong>
                          <span className="text-muted mb-2" style={{ fontSize: '11px', flexGrow: 1 }}>
                            {cls.description}
                          </span>
                          <div className="pixel-text text-info border-top border-secondary pt-2 mt-2 w-100" style={{ fontSize: '7px' }}>
                            HP:{cls.hp} | ATK:{cls.attack} | DEF:{cls.defense}
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  <div className="d-flex justify-content-between pt-3">
                    <Button variant="outline-light" className="rpg-btn" onClick={() => setActiveTab('menu')}>
                      BACK
                    </Button>
                    <Button type="submit" variant="outline-warning" className="rpg-btn rpg-btn-gold" disabled={!playerName.trim()}>
                      START GAME
                    </Button>
                  </div>
                </Form>
              </Tab>

              {/* CONTINUE TAB */}
              <Tab eventKey="continue" title={<span className="pixel-text">💾 CONTINUE</span>}>
                {loadingSaves ? (
                  <div className="text-center py-5">
                    <span className="pixel-text">LOADING SAVES...</span>
                  </div>
                ) : savegames.length === 0 ? (
                  <div className="text-center py-5">
                    <span className="pixel-text text-muted">NO SAVE GAMES FOUND</span>
                    <div className="mt-3">
                      <Button variant="outline-warning" className="rpg-btn rpg-btn-gold" onClick={() => setActiveTab('newgame')}>
                        CREATE NEW
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <ListGroup className="d-flex flex-column gap-2 p-1">
                      {[...savegames].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map((save) => (
                        <ListGroup.Item
                          key={save.id}
                          className="bg-darker border-secondary text-light d-flex justify-content-between align-items-center rounded p-3"
                        >
                          <div>
                            <strong className="pixel-text text-warning" style={{ fontSize: '12px' }}>{save.playerName}</strong>
                            <div className="pixel-sub mt-1" style={{ fontSize: '8px' }}>
                              Level {save.level} {save.classType}
                            </div>
                            <div className="text-muted mt-2" style={{ fontSize: '11px' }}>
                              Last Played: {formatTimestamp(save.timestamp)}
                            </div>
                          </div>
                          <div className="text-end">
                            <Badge bg="info" className="pixel-text mb-2 d-block" style={{ fontSize: '8px' }}>
                              Score: {save.score} pts
                            </Badge>
                            <Button variant="outline-warning" size="sm" className="rpg-btn rpg-btn-gold" style={{ padding: '6px 12px' }} onClick={() => handleLoadSave(save.id)}>
                              LOAD
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                )}
                <div className="pt-4">
                  <Button variant="outline-light" className="rpg-btn" onClick={() => setActiveTab('menu')}>
                    BACK
                  </Button>
                </div>
              </Tab>

              {/* LEADERBOARD TAB */}
              <Tab eventKey="leaderboard" title={<span className="pixel-text">🏆 RANKINGS</span>}>
                {loadingSaves ? (
                  <div className="text-center py-5">
                    <span className="pixel-text">LOADING LEADERBOARD...</span>
                  </div>
                ) : savegames.length === 0 ? (
                  <div className="text-center py-5">
                    <span className="pixel-text text-muted">NO RANKINGS YET</span>
                  </div>
                ) : (
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <Table responsive hover variant="dark" className="border-secondary mb-0">
                      <thead>
                        <tr className="pixel-text" style={{ fontSize: '8px', color: 'var(--accent-gold)' }}>
                          <th>RANK</th>
                          <th>PLAYER</th>
                          <th>CLASS</th>
                          <th>LEVEL</th>
                          <th>SCORE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...savegames]
                          .sort((a, b) => b.score - a.score || b.level - a.level)
                          .map((save, rank) => (
                            <tr key={save.id} style={{ fontSize: '14px' }}>
                              <td>
                                <span className="pixel-text text-warning">
                                  {rank === 0 ? '🥇 1st' : rank === 1 ? '🥈 2nd' : rank === 2 ? '🥉 3rd' : `#${rank + 1}`}
                                </span>
                              </td>
                              <td className="font-weight-bold">{save.playerName}</td>
                              <td className="text-muted">{save.classType.split(' ')[0]}</td>
                              <td><Badge bg="info">Lvl {save.level}</Badge></td>
                              <td className="pixel-text text-green" style={{ fontSize: '10px' }}>{save.score} pts</td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                  </div>
                )}
                <div className="pt-4">
                  <Button variant="outline-light" className="rpg-btn" onClick={() => setActiveTab('menu')}>
                    BACK
                  </Button>
                </div>
              </Tab>

              {/* ABOUT TAB */}
              <Tab eventKey="about" title={<span className="pixel-text">❔ ABOUT</span>}>
                <div className="py-2" style={{ maxHeight: '350px', overflowY: 'auto', fontSize: '14px', lineHeight: '1.6' }}>
                  <h5 className="pixel-header text-warning mb-3" style={{ fontSize: '12px' }}>Hướng dẫn học & chơi</h5>
                  <p>
                    <strong>Political Economy RPG</strong> là sản phẩm giáo dục số hóa, tích hợp kiến thức môn học <strong>Kinh tế Chính trị học Mác - Lênin</strong> vào cơ chế gameplay nhập vai 2D.
                  </p>
                  <h6 className="text-info mt-3">Quy tắc trò chơi:</h6>
                  <ul>
                    <li>Người chơi lựa chọn 1 trong 3 nhóm nhân vật: Học giả, Công nhân, Doanh nhân với thế mạnh chỉ số riêng.</li>
                    <li>Di chuyển khám phá qua 6 chương bản đồ tương ứng 6 nội dung lý thuyết lớn trong giáo trình.</li>
                    <li>Đụng độ quái vật để tham chiến theo lượt (Turn-based battle). Sử dụng HP và vũ khí/giáp đã trang bị để chiến thắng.</li>
                    <li>Sau mỗi chiến thắng, người chơi sẽ gặp rương báu (Bronze, Silver, Gold). Giải mã câu hỏi trắc nghiệm tương ứng độ khó để mở rương nhận trang bị hiếm và nhận 100% EXP/Vàng.</li>
                    <li>Nếu trả lời sai, rương biến mất, không có trang bị và chỉ nhận 50% EXP.</li>
                    <li>Cuối mỗi chương, bạn phải hạ Boss chương và vượt qua bài thi 5 câu hỏi liên tiếp để hoàn thành chương.</li>
                  </ul>
                  <h6 className="text-info mt-3">Bản đồ 6 chương học:</h6>
                  <ol>
                    <li>Chương 1: Khái niệm & Chức năng của Kinh tế chính trị Mác - Lênin.</li>
                    <li>Chương 2: Hàng hóa, Tiền tệ & Chủ thể thị trường.</li>
                    <li>Chương 3: Giá trị thặng dư & Quy luật tích lũy.</li>
                    <li>Chương 4: Cạnh tranh & Độc quyền tư bản.</li>
                    <li>Chương 5: Kinh tế thị trường định hướng XHCN ở Việt Nam.</li>
                    <li>Chương 6: Công nghiệp hóa, Hiện đại hóa & Hội nhập quốc tế.</li>
                  </ol>
                  <p className="text-muted mt-4 text-center" style={{ fontSize: '11px' }}>
                    Senior Front-end & Game Developer Project. 2026.
                  </p>
                </div>
                <div className="pt-4">
                  <Button variant="outline-light" className="rpg-btn" onClick={() => setActiveTab('menu')}>
                    BACK
                  </Button>
                </div>
              </Tab>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default HomeScreen;
