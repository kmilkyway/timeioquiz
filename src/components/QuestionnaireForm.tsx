import * as React from 'react';
import { useState } from 'react';
import { Button, TextField, Typography } from '@mui/material';

interface IQuestion {
  type: 'personal' | 'quiz';
  question: string;
  options?: string[];
}

interface IQuestionnaireFormProps {
  questions: IQuestion[];
}

const QuestionnaireForm: React.FC<IQuestionnaireFormProps> = ({ questions }): React.ReactElement => {
  const personalQuestions = questions.filter(q => q.type === 'personal');
  const quizQuestions = questions.filter(q => q.type === 'quiz');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userResponses, setUserResponses] = useState<string[]>(Array.from({ length: personalQuestions.length + quizQuestions.length }, () => ''));
  const [showPersonalAnswers, setShowPersonalAnswers] = useState<boolean>(false);
  const [showQuizSection, setShowQuizSection] = useState<boolean>(false);

  const handleResponseChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newResponses = [...userResponses];
    newResponses[index] = event.target.value;
    setUserResponses(newResponses);
  };

  const handleNext = (): void => {
    if (!showPersonalAnswers) {
      if (currentQuestionIndex < personalQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setShowPersonalAnswers(true);
      }
    } else if (currentQuestionIndex < personalQuestions.length + quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = (): void => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = (): void => {
    // Handle submission of quiz questions
    // For example, save the responses or perform validation
  };

  const handleProceedToQuiz = (): void => {
    setShowPersonalAnswers(false);
    setCurrentQuestionIndex(0); // Resetting the index for quiz questions
    setShowQuizSection(true);
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', textAlign: 'center' }}>
      <Typography variant="h5">Question {currentQuestionIndex + 1}</Typography>
      {!showPersonalAnswers ? (
        <>
          <Typography variant="body1">{personalQuestions[currentQuestionIndex].question}</Typography>
          <TextField
            variant="outlined"
            value={userResponses[currentQuestionIndex]}
            onChange={handleResponseChange(currentQuestionIndex)}
            fullWidth
            style={{ margin: '10px 0' }}
          />
          <Button variant="contained" onClick={handlePrev} disabled={currentQuestionIndex === 0} style={{ marginRight: 10 }}>Previous</Button>
          {currentQuestionIndex !== personalQuestions.length - 1 && (
            <Button variant="contained" onClick={handleNext}>Next</Button>
          )}
          {currentQuestionIndex === personalQuestions.length - 1 && (
            <Button variant="contained" onClick={() => setShowPersonalAnswers(true)} style={{ marginTop: 10 }}>Show Answers</Button>
          )}
        </>
      ) : (
        <>
          <div>
            <Typography variant="h5">Your Responses</Typography>
            {personalQuestions.map((question, index) => (
              <div key={index}>
                <Typography variant="body1">{question.question}</Typography>
                <Typography variant="body1">{userResponses[index]}</Typography>
              </div>
            ))}
            <Button variant="contained" onClick={handleProceedToQuiz} style={{ marginTop: 10 }}>Proceed to Quiz</Button>
          </div>
        </>
      )}
      {showQuizSection && (
        <>
          <div>
            <Typography variant="h5">Quiz Questions</Typography>
            <Typography variant="body1">{quizQuestions[currentQuestionIndex - personalQuestions.length].question}</Typography>
            <TextField
              variant="outlined"
              value={userResponses[personalQuestions.length + currentQuestionIndex]}
              onChange={handleResponseChange(personalQuestions.length + currentQuestionIndex)}
              fullWidth
              style={{ margin: '10px 0' }}
            />
            <Button variant="contained" onClick={handlePrev} disabled={currentQuestionIndex === personalQuestions.length} style={{ marginRight: 10 }}>Previous</Button>
            {currentQuestionIndex !== personalQuestions.length + quizQuestions.length - 1 && (
              <Button variant="contained" onClick={handleNext}>Next</Button>
            )}
            {currentQuestionIndex === personalQuestions.length + quizQuestions.length - 1 && (
              <Button variant="contained" onClick={handleSubmit} style={{ marginTop: 10 }}>Submit</Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default QuestionnaireForm;
