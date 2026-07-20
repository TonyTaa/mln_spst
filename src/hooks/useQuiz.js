import { useState, useCallback } from 'react';
import apiService from '../services/api';
import { useGameState } from '../contexts/GameStateContext';

export const useQuiz = () => {
  const { incrementScore, trackQuestActivity } = useGameState();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);

  // Boss Sequence States
  const [bossQuizQuestions, setBossQuizQuestions] = useState([]);
  const [bossQuizIndex, setBossQuizIndex] = useState(-1);
  const [bossCorrectCount, setBossCorrectCount] = useState(0);

  const resetQuiz = useCallback(() => {
    setCurrentQuestion(null);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
  }, []);

  const loadQuestion = useCallback(async (chapter, difficulty) => {
    setLoading(true);
    resetQuiz();
    try {
      // Query questions by chapter and difficulty
      const questions = await apiService.getQuestions({ chapter, difficulty });
      if (questions && questions.length > 0) {
        // Pick a random one
        const randIdx = Math.floor(Math.random() * questions.length);
        setCurrentQuestion(questions[randIdx]);
      } else {
        // Fallback: get all questions and filter
        const allQuestions = await apiService.getQuestions();
        const filtered = allQuestions.filter(q => q.chapter === chapter && q.difficulty === difficulty);
        if (filtered.length > 0) {
          const randIdx = Math.floor(Math.random() * filtered.length);
          setCurrentQuestion(filtered[randIdx]);
        } else {
          // Absolute fallback: pick any question
          const randIdx = Math.floor(Math.random() * allQuestions.length);
          setCurrentQuestion(allQuestions[randIdx]);
        }
      }
    } catch (err) {
      console.error('Error fetching quiz question:', err);
    } finally {
      setLoading(false);
    }
  }, [resetQuiz]);

  const selectOption = useCallback((index) => {
    if (isAnswered) return;
    setSelectedOption(index);
  }, [isAnswered]);

  const submitAnswer = useCallback(() => {
    if (selectedOption === null || isAnswered || !currentQuestion) return null;

    const correct = selectedOption === currentQuestion.answer;
    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      incrementScore();
      // Track quest progress for answering questions correctly
      trackQuestActivity('answer_questions', '', 1);
    }

    return correct;
  }, [selectedOption, isAnswered, currentQuestion, incrementScore, trackQuestActivity]);

  // Load a 5-question sequence for Boss defeat evaluation
  const loadBossQuiz = useCallback(async (chapter) => {
    setLoading(true);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setBossCorrectCount(0);
    
    try {
      const allQuestions = await apiService.getQuestions();
      const chQuestions = allQuestions.filter(q => q.chapter === chapter);

      // Select 5 questions from the chapter: 2 bronze, 2 silver, 1 gold if possible
      const bronze = chQuestions.filter(q => q.difficulty === 'bronze');
      const silver = chQuestions.filter(q => q.difficulty === 'silver');
      const gold = chQuestions.filter(q => q.difficulty === 'gold');

      const selected = [];
      const drawRandom = (arr, count) => {
        const pool = [...arr];
        for (let i = 0; i < count; i++) {
          if (pool.length === 0) break;
          const idx = Math.floor(Math.random() * pool.length);
          selected.push(pool[idx]);
          pool.splice(idx, 1);
        }
      };

      drawRandom(bronze, 2);
      drawRandom(silver, 2);
      drawRandom(gold, 1);

      // If we don't have enough, fill with any remaining questions from the chapter
      const remainingPool = chQuestions.filter(q => !selected.includes(q));
      while (selected.length < 5 && remainingPool.length > 0) {
        const idx = Math.floor(Math.random() * remainingPool.length);
        selected.push(remainingPool[idx]);
        remainingPool.splice(idx, 1);
      }

      setBossQuizQuestions(selected);
      setBossQuizIndex(0);
      setCurrentQuestion(selected[0]);
    } catch (err) {
      console.error('Error creating Boss quiz sequence:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitBossAnswer = useCallback(() => {
    if (selectedOption === null || isAnswered || !currentQuestion) return null;

    const correct = selectedOption === currentQuestion.answer;
    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      incrementScore();
      setBossCorrectCount(prev => prev + 1);
      trackQuestActivity('answer_questions', '', 1);
    }

    return correct;
  }, [selectedOption, isAnswered, currentQuestion, incrementScore, trackQuestActivity]);

  const nextBossQuestion = useCallback(() => {
    const nextIdx = bossQuizIndex + 1;
    if (nextIdx < bossQuizQuestions.length && nextIdx < 5) {
      setBossQuizIndex(nextIdx);
      setCurrentQuestion(bossQuizQuestions[nextIdx]);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);
      return true;
    } else {
      // Completed the 5-question sequence
      setBossQuizIndex(-1);
      return false;
    }
  }, [bossQuizIndex, bossQuizQuestions]);

  return {
    currentQuestion,
    selectedOption,
    isAnswered,
    isCorrect,
    loading,
    resetQuiz,
    loadQuestion,
    selectOption,
    submitAnswer,
    // Boss Sequence exports
    bossQuizIndex,
    bossQuizQuestions,
    bossCorrectCount,
    loadBossQuiz,
    submitBossAnswer,
    nextBossQuestion
  };
};

export default useQuiz;
