import React, { useState, useEffect } from "react";
import "./MyForm.css";
import logicData from "./logic.json";
import { Zap, RotateCcw } from "lucide-react";

const MyForm = () => {
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

  const handleSubmit = () => {
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
            <div className="welcome-icon">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '100%', height: '100%'}}>
                <circle cx="32" cy="16" r="12" fill="#7c3aed"/>
                <circle cx="16" cy="40" r="10" fill="#7c3aed" opacity="0.6"/>
                <circle cx="48" cy="40" r="10" fill="#7c3aed" opacity="0.6"/>
              </svg>
            </div>
            <h1 className="welcome-title">Prakruti Sense Assessment</h1>
            <div className="welcome-subtitle">
              Discover your unique Ayurvedic constitution
            </div>
            <p className="welcome-description">
              PrakrutiSense is an AI-powered Ayurvedic assessment tool that analyzes your unique body constitution (Prakruti) 
              by evaluating physical, mental, and behavioral characteristics. Through a comprehensive questionnaire, 
              it determines your dominant dosha: Vata, Pitta, or Kapha, and provides personalized lifestyle and dietary 
              recommendations tailored to your constitution for optimal health and balance.
            </p>
            <div className="welcome-actions">
              <button
                className="ms-forms-button ms-forms-button-primary welcome-start-btn"
                onClick={startQuiz}
              >
                Begin Assessment →
              </button>
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
        Vata: "Vata governs movement, creativity, and quick thinking.",
        Pitta:
          "Pitta governs transformation, intelligence, and determination.",
        Kapha:
          "Kapha governs structure, immunity, and fluid balance.",
      };
      return descriptions[dosha] || "";
    };

    const getDoshaRecommendations = (dosha) => {
      const recommendations = {
        Vata: [
          "Regular daily routine with consistent meal times",
          "Gentle, grounding exercises like yoga or walking",
          "Adequate rest and sleep (7-8 hours)",
          "Stress management through meditation",
        ],
        Pitta: [
          "Keep cool and avoid excessive heat",
          "Eat cooling foods like cucumber and coconut",
          "Practice moderation in activities",
          "Take time for relaxation and leisure",
        ],
        Kapha: [
          "Regular daily routine with consistent meal times",
          "Gentle, grounding exercises like yoga or walking",
          "Adequate rest and sleep (7-8 hours)",
          "Stress management through meditation",
        ],
      };
      return recommendations[dosha] || [];
    };

    const getDietaryGuidelines = (dosha) => {
      const guidelines = {
        Vata: [
          "Warm, cooked foods with good oils",
          "Sweet, sour, and salty tastes",
          "Regular meal times, avoid skipping meals",
          "Limit cold, dry, and raw foods",
        ],
        Pitta: [
          "Cool, refreshing foods",
          "Sweet, bitter, and astringent tastes",
          "Avoid spicy and acidic foods",
          "Moderate portions",
        ],
        Kapha: [
          "Warm, cooked foods with good oils",
          "Sweet, sour, and salty tastes",
          "Regular meal times, avoid skipping meals",
          "Limit cold, dry, and raw foods",
        ],
      };
      return guidelines[dosha] || [];
    };

    return (
      <div className="ms-forms-container">
        <div className="ms-forms-card">
          <div className="ms-forms-header">
            <h1>Your Prakruti Results</h1>
            <p>
              Your unique Ayurvedic constitution has been revealed
            </p>
          </div>

          <div className="ms-forms-content">
            <div className="constitution-card">
              <div className="primary-constitution-badge">Primary Constitution</div>
              
              <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginTop: '0', marginBottom: '12px', textAlign: 'center' }}>
                {dominantDosha} Dominant
              </h2>
              <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '20px', textAlign: 'center' }}>
                {dominantDosha === "Vata" ? "Air & Space • Movement, Creativity, Quick Thinking" :
                 dominantDosha === "Pitta" ? "Fire & Water • Transformation, Leadership, Focus" :
                 "Earth & Water • Structure, Stability, Immunity"}
              </p>
              
              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.6', marginBottom: '32px', textAlign: 'center' }}>
                {getDoshaDescription(dominantDosha)}
              </p>

              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '24px', textAlign: 'center' }}>
                Your Dosha Distribution
              </h3>

              <div className="dosha-results">
                <div className="dosha-result dosha-vata">
                  <div className="dosha-header">
                    <span className="dosha-name">Vata</span>
                  </div>
                  <div className="dosha-bar">
                    <div
                      className="dosha-fill"
                      style={{ width: `${doshaScores.Vata}%` }}
                    />
                  </div>
                  <span className="dosha-percentage" style={{ color: doshaScores.Vata === Math.max(doshaScores.Vata, doshaScores.Pitta, doshaScores.Kapha) ? '#7c3aed' : '#111827' }}>
                    {doshaScores.Vata}%
                  </span>
                </div>

                <div className="dosha-result dosha-pitta">
                  <div className="dosha-header">
                    <span className="dosha-name">Pitta</span>
                  </div>
                  <div className="dosha-bar">
                    <div
                      className="dosha-fill"
                      style={{ width: `${doshaScores.Pitta}%` }}
                    />
                  </div>
                  <span className="dosha-percentage" style={{ color: doshaScores.Pitta === Math.max(doshaScores.Vata, doshaScores.Pitta, doshaScores.Kapha) ? '#ef4444' : '#111827' }}>
                    {doshaScores.Pitta}%
                  </span>
                </div>

                <div className="dosha-result dosha-kapha">
                  <div className="dosha-header">
                    <span className="dosha-name">Kapha</span>
                  </div>
                  <div className="dosha-bar">
                    <div
                      className="dosha-fill"
                      style={{ width: `${doshaScores.Kapha}%` }}
                    />
                  </div>
                  <span className="dosha-percentage" style={{ color: doshaScores.Kapha === Math.max(doshaScores.Vata, doshaScores.Pitta, doshaScores.Kapha) ? '#10b981' : '#111827' }}>
                    {doshaScores.Kapha}%
                  </span>
                </div>
              </div>
            </div>

            <div className="recommendations-grid">
              <div className="recommendations">
                <h4>Lifestyle Recommendations</h4>
                <ul>
                  {getDoshaRecommendations(dominantDosha).map(
                    (recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    )
                  )}
                </ul>
              </div>

              <div className="dietary-guidelines">
                <h4>Dietary Guidelines</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {getDietaryGuidelines(dominantDosha).map((guideline, index) => (
                    <li key={index} style={{ padding: '10px 0 10px 28px', position: 'relative', fontSize: '15px', color: '#374151', lineHeight: '1.6' }}>
                      <span style={{ position: 'absolute', left: 0, fontSize: '16px', color: '#10b981', fontWeight: '700' }}>✓</span>
                      {guideline}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="results-actions">
              <button
                className="ms-forms-button ms-forms-button-primary get-diet-plan-btn"
                onClick={handleSubmit}
              >
                <Zap className="w-4 h-4 mr-2" /> Get Personalized Diet Plan
              </button>
              <button
                className="ms-forms-button ms-forms-button-secondary retake-assessment-btn"
                onClick={restartAssessment}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Retake Assessment
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
            <span className="question-number">Physical</span>
            <span className="progress-text">
              Question {currentQuestionIndex + 1} of {formData.blocks.length}
            </span>
          </div>
          <div
            className="ms-forms-progress-bar"
            style={{ "--progress-width": `${progressPercentage}%` }}
          ></div>
        </div>

        <div className="ms-forms-content">
          <div className="ms-forms-question">
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
                ? "View Results"
                : "Next"} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyForm;
