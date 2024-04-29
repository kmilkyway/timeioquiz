import React, { useState } from 'react';
import { PrimaryButton, TextField, ChoiceGroup } from '@fluentui/react';

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

  const handleResponseChange = (index: number, newValue: string) => {
    const newResponses = [...userResponses];
    newResponses[index] = newValue;
    setUserResponses(newResponses);
  };

  const handleSubmit = () => {
    // Check for empty or whitespace-only values
    const newErrors = userResponses.map((response) => {
      if (!response.trim()) {
        return 'This field is required';
      } else {
        return '';
      }
    });
    setErrors(newErrors);

    // Check if any errors exist
    if (newErrors.some(error => error !== '')) {
      alert('Please fill in all required fields correctly before submitting.');
      return;
    }

    onSubmitPersonalAnswers(userResponses);
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', textAlign: 'left' }}>
      {personalQuestions.map((question, index) => (
        <div key={index} style={{ marginBottom: 20 }}>
          <p style={{ margin: 0 }}>{question.question} *</p>
          {question.options ? (
            <ChoiceGroup
              options={question.options.map((option) => ({ key: option.toString(), text: option.toString() }))}
              selectedKey={userResponses[index]}
              onChange={(ev, option) => handleResponseChange(index, option ? option.key : '')}
              styles={{ flexContainer: { display: 'flex', flexDirection: 'row', gap: 10 } }}
            />
          ) : (
            <TextField
              value={userResponses[index]}
              onChange={(ev, newValue) => handleResponseChange(index, newValue || '')}
              styles={{ root: { width: '100%', marginBottom: 10 } }}
            />
          )}
          {errors[index] && <span style={{ color: 'red', fontSize: '12px' }}>{errors[index]}</span>}
        </div>
      ))}
      <PrimaryButton onClick={handleSubmit} style={{ float: 'right' }}>
        Submit Personal Answers
      </PrimaryButton>
    </div>
  );
}

export default PersonalQuestionsComponent;
