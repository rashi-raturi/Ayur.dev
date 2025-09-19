/* eslint-disable react-hooks/exhaustive-deps, react/prop-types */
import { useState, useEffect, useContext } from "react";
import "./MyForm.css";
import logicData from "./logic.json";

import axios from 'axios';
import { AppContext } from '../../context/AppContext';
const MyForm = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [doshaScores, setDoshaScores] = useState({
    Vata: 0,
    Pitta: 0,
    Kapha: 0,
  });
  const [showResults, setShowResults] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Access backend URL and auth token from context
  const { backendUrl, token } = useContext(AppContext);

  // Use the imported logic data and filter out non-question blocks
  const formData = {
    ...logicData,
    blocks: logicData.blocks.filter(
      (block) => block.type === "multiple-choice"
    ),
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (showWelcome || showResults || showThankYou) return;

      const currentQuestion = formData.blocks[currentQuestionIndex];
      const isAnswered = answers[currentQuestion.id] !== undefined;

      if (event.key === "Enter" && isAnswered) {
        event.preventDefault();
        nextQuestion();
      }

      // Number key shortcuts for options (1, 2, 3)
      if (event.key >= "1" && event.key <= "9") {
        const optionIndex = parseInt(event.key) - 1;
        if (optionIndex < currentQuestion.options.length) {
          handleOptionSelect(
            currentQuestion.id,
            optionIndex,
            currentQuestion.options[optionIndex].points
          );
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [currentQuestionIndex, answers, showResults, showThankYou, showWelcome]);

  const handleOptionSelect = (questionId, optionIndex, points) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        option: optionIndex,
        points: points,
      },
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < formData.blocks.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateResults();
      setShowResults(true);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateResults = () => {
    const scores = { Vata: 0, Pitta: 0, Kapha: 0 };

    Object.values(answers).forEach((answer) => {
      Object.entries(answer.points).forEach(([dosha, points]) => {
        scores[dosha] += points;
      });
    });

    const totalPoints = Object.values(scores).reduce(
      (sum, score) => sum + score,
      0
    );
    Object.keys(scores).forEach((dosha) => {
      scores[dosha] = Math.round((scores[dosha] / totalPoints) * 100);
    });

    setDoshaScores(scores);
    console.log("Dosha Assessment Results:", scores);
    console.log("Individual Answers:", answers);
  };

  const handleSubmit = async () => {
    try {
      // save assessment
      await axios.post(
        `${backendUrl}/api/user/prakruti`,
        { inputData: answers, resultData: doshaScores },
        { headers: { token } }
      );
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Assessment save failed:', error);
    }
    setShowThankYou(true);
  };

  const startQuiz = () => {
    setShowWelcome(false);
  };

  const restartAssessment = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setDoshaScores({ Vata: 0, Pitta: 0, Kapha: 0 });
    setShowResults(false);
    setShowThankYou(false);
    setShowWelcome(true);
  };

  const progressPercentage =
    ((currentQuestionIndex + 1) / formData.blocks.length) * 100;
  const currentQuestion = formData.blocks[currentQuestionIndex];
  const isAnswered = answers[currentQuestion?.id] !== undefined;

  // Welcome Page
  if (showWelcome) {
    return (
      <div className="ms-forms-container">
        <div className="ms-forms-card">
          <div className="welcome-page">
            <h1 className="welcome-title">Prakruti Analysis</h1>
            <div className="welcome-subtitle">
              Ayurvedic Constitution Assessment
            </div>
            <p className="welcome-description">
              Discover your unique Ayurvedic constitution through this
              comprehensive assessment. Prakruti represents your natural state
              of being, determined by the balance of three doshas: Vata, Pitta,
              and Kapha.
            </p>
            <div className="welcome-features">
              <div className="feature-item">
                <span className="feature-icon">🌿</span>
                <span>20 Comprehensive Questions</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚖️</span>
                <span>Detailed Dosha Analysis</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📋</span>
                <span>Personalized Recommendations</span>
              </div>
            </div>
            <div className="welcome-actions">
              <button
                className="ms-forms-button ms-forms-button-primary welcome-start-btn"
                onClick={startQuiz}
              >
                Begin Analysis →
              </button>
            </div>
            <div className="welcome-note">
              <small>
                ✨ Take your time with each question for the most accurate
                results
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showThankYou) {
    return (
      <div className="ms-forms-container">
        <div className="ms-forms-card">
          <div className="ms-forms-thank-you">
            <div className="ms-forms-icon">✓</div>
            <h2>Assessment Complete!</h2>
            <p>
              Thank you for completing the Dosha Calculator assessment. Your
              Ayurvedic constitution has been analyzed and can help guide you
              toward better health and well-being.
            </p>
            <button
              type="button"
              className="ms-forms-button ms-forms-button-primary"
              onClick={restartAssessment}
              style={{ marginTop: "24px" }}
            >
              Take Assessment Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const dominantDosha = Object.entries(doshaScores).reduce((a, b) =>
      doshaScores[a[0]] > doshaScores[b[0]] ? a : b
    )[0];

    const getDoshaDescription = (dosha) => {
      const descriptions = {
        Vata: "You have a Vata constitution, characterized by movement, creativity, and quick thinking. Vata types are typically energetic, enthusiastic, and adaptable, but may experience anxiety or restlessness when imbalanced.",
        Pitta:
          "You have a Pitta constitution, characterized by transformation, intelligence, and determination. Pitta types are typically focused, organized, and goal-oriented, but may experience anger or impatience when imbalanced.",
        Kapha:
          "You have a Kapha constitution, characterized by stability, strength, and calmness. Kapha types are typically patient, loyal, and steady, but may experience lethargy or attachment when imbalanced.",
      };
      return descriptions[dosha] || "";
    };

    const getDoshaRecommendations = (dosha) => {
      const recommendations = {
        Vata: [
          "Maintain regular daily routines",
          "Eat warm, cooked foods",
          "Practice calming activities like yoga",
          "Get adequate rest and sleep",
          "Stay warm and avoid cold environments",
        ],
        Pitta: [
          "Keep cool and avoid excessive heat",
          "Eat cooling foods like cucumber and coconut",
          "Practice moderation in activities",
          "Avoid spicy and acidic foods",
          "Take time for relaxation and leisure",
        ],
        Kapha: [
          "Engage in regular vigorous exercise",
          "Eat light, warm, and spicy foods",
          "Avoid heavy, oily, and sweet foods",
          "Stay active and avoid oversleeping",
          "Embrace variety and new experiences",
        ],
      };
      return recommendations[dosha] || [];
    };

    return (
      <div className="ms-forms-container">
        <div className="ms-forms-card">
          <div className="ms-forms-header">
            <h1>Your Prakruti Analysis Results</h1>
            <p>
              Discover your unique Ayurvedic constitution and personalized
              wellness insights
            </p>
          </div>

          <div className="ms-forms-content">
            <div className="dosha-results">
              <div
                className={`dosha-result dosha-vata ${
                  dominantDosha === "Vata" ? "dominant" : ""
                }`}
              >
                <div className="dosha-info">
                  <div className="dosha-header">
                    <span className="dosha-name">Vata</span>
                    <span className="dosha-elements">Air & Space</span>
                  </div>
                  <span className="dosha-percentage">{doshaScores.Vata}%</span>
                </div>
                <div className="dosha-bar">
                  <div
                    className="dosha-fill"
                    style={{ width: `${doshaScores.Vata}%` }}
                  />
                </div>
                <div className="dosha-characteristics">
                  <span>Movement • Creativity • Quick Thinking</span>
                </div>
              </div>

              <div
                className={`dosha-result dosha-pitta ${
                  dominantDosha === "Pitta" ? "dominant" : ""
                }`}
              >
                <div className="dosha-info">
                  <div className="dosha-header">
                    <span className="dosha-name">Pitta</span>
                    <span className="dosha-elements">Fire & Water</span>
                  </div>
                  <span className="dosha-percentage">{doshaScores.Pitta}%</span>
                </div>
                <div className="dosha-bar">
                  <div
                    className="dosha-fill"
                    style={{ width: `${doshaScores.Pitta}%` }}
                  />
                </div>
                <div className="dosha-characteristics">
                  <span>Transformation • Leadership • Focus</span>
                </div>
              </div>

              <div
                className={`dosha-result dosha-kapha ${
                  dominantDosha === "Kapha" ? "dominant" : ""
                }`}
              >
                <div className="dosha-info">
                  <div className="dosha-header">
                    <span className="dosha-name">Kapha</span>
                    <span className="dosha-elements">Earth & Water</span>
                  </div>
                  <span className="dosha-percentage">{doshaScores.Kapha}%</span>
                </div>
                <div className="dosha-bar">
                  <div
                    className="dosha-fill"
                    style={{ width: `${doshaScores.Kapha}%` }}
                  />
                </div>
                <div className="dosha-characteristics">
                  <span>Stability • Nurturing • Strength</span>
                </div>
              </div>
            </div>

            <div className="dominant-dosha">
              <h3>
                Your Dominant Dosha: {dominantDosha} (
                {doshaScores[dominantDosha]}%)
              </h3>
              <p>{getDoshaDescription(dominantDosha)}</p>

              <div className="recommendations">
                <h4>Recommendations for {dominantDosha} Constitution:</h4>
                <ul>
                  {getDoshaRecommendations(dominantDosha).map(
                    (recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    )
                  )}
                </ul>
              </div>
            </div>

            <div className="results-actions">
              <button
                className="ms-forms-button ms-forms-button-primary"
                onClick={handleSubmit}
              >
                Complete Analysis
              </button>
              <button
                className="ms-forms-button ms-forms-button-secondary"
                onClick={restartAssessment}
              >
                Restart Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ms-forms-container">
      <div className="ms-forms-card">
        <div className="ms-forms-progress">
          <div className="progress-info">
            <span className="progress-text">
              Question {currentQuestionIndex + 1} of {formData.blocks.length}
            </span>
            <span className="progress-percentage">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div
            className="ms-forms-progress-bar"
            style={{ "--progress-width": `${progressPercentage}%` }}
          ></div>
        </div>

        <div className="ms-forms-content">
          <div className="ms-forms-question">
            <div className="question-number">{currentQuestionIndex + 1}.</div>
            <h2 className="question-title">{currentQuestion.title}</h2>

            <div className="ms-forms-options">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={`ms-forms-option ${
                    answers[currentQuestion.id]?.option === index
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleOptionSelect(currentQuestion.id, index, option.points)
                  }
                >
                  <div className="option-radio">
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      checked={answers[currentQuestion.id]?.option === index}
                      onChange={() => {}}
                    />
                    <span className="radio-custom"></span>
                  </div>
                  <span className="option-text">{option.label}</span>
                </div>
              ))}
            </div>

            <div className="keyboard-hint">
              <span>
                🌿 Use number keys (1-{currentQuestion.options.length}) to
                select options, Enter to continue
              </span>
            </div>
          </div>

          <div className="ms-forms-navigation">
            <button
              type="button"
              className="ms-forms-button ms-forms-button-secondary"
              onClick={previousQuestion}
              style={{
                visibility: currentQuestionIndex === 0 ? "hidden" : "visible",
              }}
            >
              ← Previous
            </button>
            <button
              type="button"
              className="ms-forms-button ms-forms-button-primary"
              onClick={nextQuestion}
              disabled={!isAnswered}
            >
              {currentQuestionIndex === formData.blocks.length - 1
                ? "View Results →"
                : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyForm;
