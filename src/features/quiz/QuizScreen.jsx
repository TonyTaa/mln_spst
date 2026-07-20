import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Badge } from 'react-bootstrap';
import { useGameState } from '../../contexts/GameStateContext';

export const QuizScreen = ({ quiz, difficulty, chapter, rewardData, onBackToMap, isBossSequence }) => {
  const { player, items, gainRewards, completeStage } = useGameState();
  const {
    currentQuestion,
    selectedOption,
    isAnswered,
    isCorrect,
    loading,
    loadQuestion,
    selectOption,
    submitAnswer,
    // Boss sequence hooks
    bossQuizIndex,
    bossCorrectCount,
    loadBossQuiz,
    submitBossAnswer,
    nextBossQuestion
  } = quiz;

  const [chestClicked, setChestClicked] = useState(false);
  const [bossCompleted, setBossCompleted] = useState(false);

  // Load question on mount
  useEffect(() => {
    if (isBossSequence) {
      loadBossQuiz(chapter);
      setBossCompleted(false);
    } else {
      loadQuestion(chapter, difficulty);
      setChestClicked(false);
    }
  }, [chapter, difficulty, isBossSequence, loadBossQuiz, loadQuestion]);

  if (loading || !currentQuestion) {
    return (
      <Card className="rpg-panel p-5 text-center bg-dark text-light border-secondary">
        <span className="pixel-text">FETCHING QUESTION DATABASE...</span>
      </Card>
    );
  }

  // Define chest details
  const getChestColor = () => {
    if (difficulty === 'gold') return { emoji: '👑🎁', name: 'GOLD CHEST (Khó)', text: 'text-warning' };
    if (difficulty === 'silver') return { emoji: '🥈🎁', name: 'SILVER CHEST (Trung bình)', text: 'text-info' };
    return { emoji: '🥉🎁', name: 'BRONZE CHEST (Dễ)', text: 'text-muted' };
  };

  const chest = getChestColor();

  const handleSubmit = () => {
    if (selectedOption === null || isAnswered) return;
    if (isBossSequence) {
      submitBossAnswer();
    } else {
      const correct = submitAnswer();
      // Give rewards based on answer accuracy
      if (correct) {
        gainRewards(rewardData.exp, rewardData.gold, rewardData.lootItems);
      } else {
        // 50% exp reward and no gold/loot
        gainRewards(Math.floor(rewardData.exp * 0.5), 0, []);
      }
    }
  };

  const handleNextBoss = () => {
    const hasNext = nextBossQuestion();
    if (!hasNext) {
      // Completed the 5 questions sequence!
      setBossCompleted(true);
      // Calculate reward tier based on correct answers
      const successRate = bossCorrectCount / 5;
      const baseExp = rewardData.exp;
      const baseGold = rewardData.gold;
      
      const finalExp = Math.floor(baseExp * (0.5 + successRate * 0.5)); // 50% to 100% exp
      const finalGold = Math.floor(baseGold * successRate); // 0% to 100% gold
      const lootReward = successRate >= 0.6 ? rewardData.lootItems : []; // Give loot if >= 3/5 correct

      gainRewards(finalExp, finalGold, lootReward);
      // Mark stage completed
      completeStage(player.currentStageId);
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  // Render chest click screen first
  if (!isBossSequence && !chestClicked) {
    return (
      <Card className="rpg-panel p-5 text-center bg-dark text-light border-secondary">
        <div className="loot-chest-container">
          <div className="pixel-text text-warning mb-2" style={{ fontSize: '10px' }}>BATTLE VICTORY SPONSOR</div>
          <h2 className="pixel-header text-info mb-4">{chest.name}</h2>
          <div className="chest-emoji mb-4" onClick={() => setChestClicked(true)} style={{ transition: 'transform 0.2s' }}>
            🎁🔓
          </div>
          <p className="lead mb-4">Bạn nhận được một chiếc rương lý luận!</p>
          <p className="text-muted small">Nhấp vào chiếc rương để giải câu hỏi trắc nghiệm. Trả lời đúng để nhận toàn bộ vật phẩm!</p>
          <Button variant="outline-warning" className="rpg-btn rpg-btn-gold" onClick={() => setChestClicked(true)}>
            MỞ RƯƠNG
          </Button>
        </div>
      </Card>
    );
  }

  // Boss Completed Summary Render
  if (isBossSequence && bossCompleted) {
    const successRate = bossCorrectCount / 5;
    const itemsWon = successRate >= 0.6 ? rewardData.lootItems.map(lid => items.find(it => it.id === lid)?.name).filter(Boolean) : [];
    
    return (
      <Card className="rpg-panel p-5 text-center bg-dark text-light border-secondary active-glow">
        <div className="fs-1 mb-3">🏆👑⚔️</div>
        <h2 className="pixel-header text-warning mb-4">CHAPTER COMPLETION EVALUATION</h2>
        <p className="lead mb-2">Chúc mừng em đã đánh bại Boss!</p>
        <p className="mb-4">Kết quả bài thi trắc nghiệm học phần:</p>
        
        <div className="border border-secondary p-4 rounded bg-darker mb-4 mx-auto" style={{ maxWidth: '400px' }}>
          <div className="pixel-text text-info mb-2" style={{ fontSize: '12px' }}>CHI TIẾT ĐIỂM SỐ</div>
          <h3 className="pixel-header text-green mb-3" style={{ fontSize: '28px' }}>{bossCorrectCount}/5 CÂU</h3>
          <p className="text-muted small">Tỷ lệ chính xác: {successRate * 100}%</p>
          <hr className="border-secondary" />
          <div className="text-start pixel-text text-muted" style={{ fontSize: '8px', lineHeight: '2' }}>
            🎁 EXP Nhận được: +{Math.floor(rewardData.exp * (0.5 + successRate * 0.5))}<br />
            🪙 Gold Nhận được: +{Math.floor(rewardData.gold * successRate)}g<br />
            ⚔️ Loot Nhận được: {itemsWon.join(', ') || 'Không có (Cần đạt tối thiểu 3/5)'}
          </div>
        </div>

        <Button variant="outline-success" className="rpg-btn rpg-btn-green py-3 px-5" onClick={onBackToMap}>
          TIẾP TỤC HÀNH TRÌNH
        </Button>
      </Card>
    );
  }

  return (
    <Card className="rpg-panel active-glow bg-dark text-light border-secondary p-4 overflow-hidden position-relative">
      {/* Quiz Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
        <div>
          <span className="pixel-text text-warning" style={{ fontSize: '9px' }}>
            {isBossSequence ? `EVALUATION QUIZ: CÂU ${bossQuizIndex + 1}/5` : `${chest.name}`}
          </span>
          <h4 className="pixel-header text-info mt-1" style={{ fontSize: '15px' }}>
            {isBossSequence ? 'Bài kiểm tra cuối chương' : 'Câu hỏi kiểm tra mở rương'}
          </h4>
        </div>
        <Badge bg={isBossSequence ? "danger" : "warning"} className="pixel-text" style={{ fontSize: '8px' }}>
          {currentQuestion.difficulty.toUpperCase()}
        </Badge>
      </div>

      {/* QUESTION BODY */}
      <div className="text-start mb-4">
        <h5 className="lead font-weight-bold" style={{ fontSize: '16px', lineHeight: '1.6' }}>
          {currentQuestion.question}
        </h5>
      </div>

      {/* OPTIONS LIST */}
      <Row className="g-3 mb-4">
        {currentQuestion.options.map((option, idx) => {
          let cardClass = '';
          if (isAnswered) {
            if (idx === currentQuestion.answer) {
              cardClass = 'correct';
            } else if (idx === selectedOption) {
              cardClass = 'incorrect';
            }
          } else if (idx === selectedOption) {
            cardClass = 'selected';
          }

          return (
            <Col xs={12} md={6} key={idx}>
              <Card className={`rpg-choice-card text-start h-100 ${cardClass}`} onClick={() => selectOption(idx)}>
                <div className="rpg-choice-bullet">{optionLabels[idx]}</div>
                <div style={{ fontSize: '13px', lineHeight: '1.4' }}>{option}</div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* EXPLANATION BOX */}
      {isAnswered && (
        <Card className="bg-darker border-secondary text-start p-3 mb-4">
          <div className="pixel-text text-warning mb-2" style={{ fontSize: '7px' }}>
            💡 HỌC LIỆU GIẢI THÍCH (EXPLANATION)
          </div>
          <div className="mb-2" style={{ fontSize: '13px' }}>
            {isCorrect ? (
              <span className="text-green font-weight-bold">✓ ĐÁP ÁN CHÍNH XÁC: </span>
            ) : (
              <span className="text-red font-weight-bold">✗ ĐÁP ÁN CHƯA ĐÚNG: </span>
            )}
            {currentQuestion.options[currentQuestion.answer]}
          </div>
          <div className="text-muted" style={{ fontSize: '13px', lineHeight: '1.5' }}>
            {currentQuestion.explanation}
          </div>
        </Card>
      )}

      {/* CONTROL ACTIONS */}
      <div className="d-flex justify-content-between pt-2 border-top border-secondary">
        <div>
          {!isBossSequence && isAnswered && (
            <Badge bg={isCorrect ? "success" : "danger"} className="pixel-text p-2" style={{ fontSize: '8px' }}>
              {isCorrect ? '🔓 CHEST OPENED: ALL LOOT CLAIMED' : '🔒 FAILED: LOOT VANISHED, 50% EXP'}
            </Badge>
          )}
        </div>

        <div>
          {!isAnswered ? (
            <Button
              variant="outline-warning"
              className="rpg-btn rpg-btn-gold"
              disabled={selectedOption === null}
              onClick={handleSubmit}
            >
              SUBMIT ANSWER
            </Button>
          ) : isBossSequence ? (
            <Button variant="outline-info" className="rpg-btn" onClick={handleNextBoss}>
              {bossQuizIndex === 4 ? 'VIEW RESULTS' : 'NEXT QUESTION'}
            </Button>
          ) : (
            <Button variant="outline-success" className="rpg-btn rpg-btn-green" onClick={onBackToMap}>
              QUAY LẠI BẢN ĐỒ
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default QuizScreen;
