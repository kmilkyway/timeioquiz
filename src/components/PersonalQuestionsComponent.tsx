import React, { useState } from 'react';
import { PrimaryButton, TextField, ChoiceGroup, Text } from '@fluentui/react';

interface PersonalQuestion {
  question: string;
  options?: string[] | boolean[];
}

interface PersonalQuestionsComponentProps {
  personalQuestions: PersonalQuestion[];
  onSubmitPersonalAnswers: (answers: string[]) => void;
}

function PersonalQuestionsComponent({ personalQuestions, onSubmitPersonalAnswers }: PersonalQuestionsComponentProps) {
  const [userResponses, setUserResponses] = useState<string[]>(Array(personalQuestions.length).fill(''));
  const [errors, setErrors] = useState<string[]>(Array(personalQuestions.length).fill(''));
  const [showQuestions, setShowQuestions] = useState<boolean>(false);

  // Handle user response change for a specific question
  const handleResponseChange = (index: number, newValue: string) => {
    const newResponses = [...userResponses];
    newResponses[index] = newValue;
    setUserResponses(newResponses);

    // Perform email validation if the question pertains to an email address
    if (isEmailQuestion(personalQuestions[index].question)) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue);
      const newErrors = [...errors];
      newErrors[index] = isValidEmail ? '' : 'Please enter a valid email address';
      setErrors(newErrors);
    }
  };

  // Check if the question pertains to an email address
  const isEmailQuestion = (question: string): boolean => {
    return question.toLowerCase().includes('email'); 
  };

  // Handle form submission for personal answers
  const handleSubmit = () => {
    // Check for empty or whitespace-only values
    const newErrors = userResponses.map((response, index) => {
      if (!response.trim()) {
        return 'This field is required';
      } else if (isEmailQuestion(personalQuestions[index].question) && errors[index]) {
        return 'Please enter a valid email address';
      } else {
        return '';
      }
    });
    setErrors(newErrors);

    // Check if any errors exist before submitting
    if (newErrors.some(error => error !== '')) {
      alert('Please fill in all required fields correctly before submitting.');
      return;
    }

    onSubmitPersonalAnswers(userResponses);
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', textAlign: 'left' }}>
      {!showQuestions ? (
        // Render message and button to start the quiz
        <>
          <Text variant="large" style={{ marginBottom: '20px' }}>
            Get ready to take the quiz! Click below to start.
          </Text>
          <PrimaryButton onClick={() => setShowQuestions(true)} style={{ marginBottom: '20px', marginTop: '20px' }}>
            Start Quiz
          </PrimaryButton>
        </>
      ) : (
        // Render personal questions when showQuestions is true
        <>
          {personalQuestions.map((question, index) => (
            <div key={index} style={{ marginBottom: 20 }}>
              <p style={{ margin: 0 }}>{question.question} *</p>
              {question.options ? (
                // Render choice group for options if available
                <ChoiceGroup
                  options={question.options.map((option) => ({ key: option.toString(), text: option.toString() }))}
                  selectedKey={userResponses[index]}
                  onChange={(ev, option) => handleResponseChange(index, option ? option.key : '')}
                  styles={{ flexContainer: { display: 'flex', flexDirection: 'row', gap: 10 } }}
                />
              ) : (
                // Render text field for free-form response
                <TextField
                  value={userResponses[index]}
                  onChange={(ev, newValue) => handleResponseChange(index, newValue || '')}
                  styles={{ root: { width: '100%', marginBottom: 10 } }}
                />
              )}
              {errors[index] && <span style={{ color: 'red', fontSize: '12px' }}>{errors[index]}</span>}
            </div>
          ))}
          <div style={{ marginTop: '20px' }}>
            <PrimaryButton onClick={handleSubmit}>
              Submit Personal Answers
            </PrimaryButton>
          </div>
        </>
      )}
    </div>
  );
}

export default PersonalQuestionsComponent;
