import React, { useState, useEffect, ChangeEvent } from 'react';
import { PrimaryButton, TextField, Text, ChoiceGroup, IChoiceGroupOption } from '@fluentui/react';
import { HttpClient, HttpClientResponse } from '@microsoft/sp-http';

interface QuizQuestion {
  question: string;
  options?: string[] | boolean[];
  validationAPI?: string;
}

interface QuizQuestionsComponentProps {
  quizQuestions: QuizQuestion[];
  columnTypes: string[];
  onSubmitQuizQuestions: (answers: string[]) => void;
  spHttpClient: HttpClient;
}

function QuizQuestionsComponent(props: QuizQuestionsComponentProps) {
  const { quizQuestions, columnTypes, onSubmitQuizQuestions, spHttpClient } = props;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<string[]>(Array(quizQuestions.length).fill(''));
  const [validationError, setValidationError] = useState<string>('');
  const [results, setResults] = useState<{ question: string; response: string; isValid: boolean }[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  useEffect(() => {
    setValidationError('');
  }, [currentQuestionIndex]);

  const handleResponseChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const newResponses = [...userResponses];
    newResponses[currentQuestionIndex] = value;
    setUserResponses(newResponses);
  };

  const handleNext = async () => {
    const response = await validateCurrentQuestion();
    const updatedResults = [...results];
    updatedResults[currentQuestionIndex] = {
      question: quizQuestions[currentQuestionIndex].question,
      response: userResponses[currentQuestionIndex],
      isValid: response.isValid // Placeholder for validation logic
    };
    setResults(updatedResults);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    // Submit all user responses to parent component
    onSubmitQuizQuestions(userResponses);
    setQuizSubmitted(true); // Mark the quiz as submitted
  };

  const validateCurrentQuestion = async () => {
    const question = quizQuestions[currentQuestionIndex];
    if (question.validationAPI) {
      try {
        const endpointUrl = question.validationAPI;
       // const corsProxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const requestOptions: RequestInit = {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'accept': 'application/json'
          }
        };
        const response: HttpClientResponse = await spHttpClient.get('https://cors-anywhere.herokuapp.com/'+endpointUrl, HttpClient.configurations.v1,requestOptions);
        if (response.ok) {
          const validationData: any = await response.json();
          const isValid = validateResponse(currentQuestionIndex, question, validationData);
          return { isValid };
        } else {
          throw new Error(`Failed to fetch validation data: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching validation data:', error);
        return { isValid: false };
      }
    }
    return { isValid: true }; // No validation needed if no validationAPI specified
  };

  const validateResponse = (index: number, question: QuizQuestion, validationData: any) => {
    const userResponse = userResponses[index];
    switch (index) {
      case 0:
        return userResponse === validationData.timeZone;
      case 1:
        const currentDate = new Date(validationData.date);
        return userResponse === currentDate.toDateString();
      case 2:
        return userResponse === validationData;
      case 3:
        return userResponse === validationData;
      default:
        return true;
    }
  };

  const renderInput = () => {
    switch (columnTypes[currentQuestionIndex]) {
      case 'single':
        return (
          <TextField
            value={userResponses[currentQuestionIndex]}
            onChange={handleResponseChange}
            styles={{ root: { width: '100%', margin: '10px 0' } }}
          />
        );
      case 'boolean':
        return (
          <ChoiceGroup
            options={[
              { key: 'true', text: 'Yes' },
              { key: 'false', text: 'No' }
            ]}
            selectedKey={userResponses[currentQuestionIndex]}
            onChange={(ev, option) =>
              option &&
              setUserResponses((prev) => {
                const newResponses = [...prev];
                newResponses[currentQuestionIndex] = option.key as string;
                return newResponses;
              })
            }
          />
        );
      case 'choice':
        const options: IChoiceGroupOption[] =
          quizQuestions[currentQuestionIndex].options?.map((option, index) => ({
            key: option.toString(),
            text: option.toString()
          })) || [];
        return (
          <ChoiceGroup
            options={options}
            selectedKey={userResponses[currentQuestionIndex]}
            onChange={(ev, option) =>
              option &&
              setUserResponses((prev) => {
                const newResponses = [...prev];
                newResponses[currentQuestionIndex] = option.key as string;
                return newResponses;
              })
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', textAlign: 'center' }}>
      {!quizSubmitted && currentQuestionIndex < quizQuestions.length ? (
        <>
          <Text variant="large">Question {currentQuestionIndex + 1}</Text>
          <Text variant="medium">{quizQuestions[currentQuestionIndex].question}</Text>
          {renderInput()}
          {validationError && (
            <Text variant="medium" style={{ color: 'red', marginTop: 10 }}>
              {validationError}
            </Text>
          )}
          <div style={{ marginTop: 10 }}>
            <PrimaryButton onClick={handlePrev} disabled={currentQuestionIndex === 0}>
              Previous
            </PrimaryButton>
            <PrimaryButton
              onClick={handleNext}
              disabled={userResponses[currentQuestionIndex].trim() === ''}
              style={{ marginLeft: 10 }}
            >
              Next
            </PrimaryButton>
          </div>
        </>
      ) : (
        <div>
          <Text variant="large">Quiz Answers Submitted</Text>
          <div style={{ marginTop: 20 }}>
            <Text variant="large">Results</Text>
            {results.map((result, index) => (
              <div key={index}>
                <Text variant="medium">{result.question}:</Text>
                <Text
                  variant="medium"
                  style={{ color: result.isValid ? 'green' : 'red' }}
                >
                  {result.isValid ? 'Correct' : 'Incorrect'}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}
      {!quizSubmitted && currentQuestionIndex < quizQuestions.length && (
        <PrimaryButton
          onClick={handleSubmit}
          disabled={userResponses.some((response) => response.trim() === '')}
          style={{ marginTop: 20 }}
        >
          Submit Quiz Answers
        </PrimaryButton>
      )}
    </div>
  );
}

export default QuizQuestionsComponent;
