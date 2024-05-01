import React, { useState, useEffect, ChangeEvent } from 'react';
import { PrimaryButton, TextField, Text, ChoiceGroup, IChoiceGroupOption } from '@fluentui/react';
import { HttpClient, HttpClientResponse } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/sputilities";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

interface QuizQuestion {
  question: string;
  options?: string[] | boolean[];
  validationAPI?: string;
  correctAnswer?: string | boolean;
}

interface QuizQuestionsComponentProps {
  quizQuestions: QuizQuestion[];
  columnTypes: string[];
  onSubmitQuizQuestions: (answers: string[]) => void;
  spHttpClient: HttpClient;
  userName: string;
  wpcontext: WebPartContext;
  email: string;
}

interface QuizResult {
  question: string;
  response: string;
  isValid: boolean;
  correctAnswer?: string | boolean;
}

function QuizQuestionsComponent(props: QuizQuestionsComponentProps) {
  const { quizQuestions, columnTypes, spHttpClient, onSubmitQuizQuestions, userName, wpcontext, email } = props;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<string[]>(Array(quizQuestions.length).fill(''));
  const [validationError, setValidationError] = useState<string>('');
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Reset validation error when current question changes
  useEffect(() => {
    setValidationError('');
  }, [currentQuestionIndex]);

  const sp = spfi().using(SPFx(wpcontext));

  const sendEmail = async () => {
    try {
      const emailBody = `
        <html>
          <body>
            <p>Hello ${userName},</p>
            <p>Thank you for completing the quiz. Here are your results:</p>
            <ul>
              ${results.map((result, index) => {
        const { question, response, isValid, correctAnswer } = result;
        const status = isValid ? 'Correct' : 'Incorrect';
        const correctAnswerText = typeof correctAnswer === 'boolean' ? (correctAnswer ? 'Yes' : 'No') : correctAnswer || 'N/A';
        return `
                  <li>
                    <strong>Question ${index + 1}:</strong> ${question}<br/>
                    <strong>Your Answer:</strong> ${response}<br/>
                    <strong>Status:</strong> ${status}<br/>
                    ${isValid ? '' : `<strong>Correct Answer:</strong> ${correctAnswerText}<br/>`}
                  </li>
                `;
      }).join('')}
            </ul>
            <p>Regards,<br/>Your Quiz Team</p>
          </body>
        </html>
      `;


      await sp.utility.sendEmail({
        To: [email],
        Subject: 'Quiz Results',
        Body: emailBody,
        AdditionalHeaders: {
          "content-type": "text/html"
        },
      });

      console.log('Quiz results email sent successfully');
    } catch (error) {
      console.error('Error sending quiz results email:', error);
    }
  };

  // Push quiz results to SharePoint list
  async function pushQuizResultsToSharePoint(quizResults: QuizResult[], userName: string) {
    try {

      const list = sp.web.lists.getByTitle("Quiz Results");

      let totalCorrect = 0;
      let quizSummary = '';


      for (const result of quizResults) {
        const status = result.isValid ? 'Correct' : 'Incorrect';


        quizSummary += `<p><strong>${result.question}</strong></p>`;
        quizSummary += `<p><strong>Response:</strong> ${result.response}</p>`;
        quizSummary += `<p><strong>Status:</strong> ${status}</p>`;
        quizSummary += '<br>';


        if (result.isValid) {
          totalCorrect++;
        }
      }


      const itemCreateInfo = {
        Title: email,
        UserName: userName,
        QuizSummary: quizSummary,
        TotalCorrectAnswers: totalCorrect
      };


      const addItemResult = await list.items.add(itemCreateInfo);
      console.log(addItemResult);

      console.log('Quiz results updated in "Quiz Results" SharePoint list successfully');
    } catch (error) {
      console.error('Error updating quiz results in SharePoint list:', error);
    }
  }


  // Handle user response change for the current question
  const handleResponseChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const newResponses = [...userResponses];
    newResponses[currentQuestionIndex] = value;
    setUserResponses(newResponses);
  };

  // Handle moving to the next question or submitting the quiz
  const handleNext = async () => {
    const response = await validateCurrentQuestion();
    const updatedResults = [...results];
    updatedResults[currentQuestionIndex] = {
      question: quizQuestions[currentQuestionIndex].question,
      response: userResponses[currentQuestionIndex],
      isValid: response.isValid,
      correctAnswer: response.correctAnswer !== undefined ? response.correctAnswer.toString() : 'N/A' // Store correct answer if available
    };
    setResults(updatedResults);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {

      setQuizSubmitted(true);
      onSubmitQuizQuestions(userResponses);
    }
  };

  // Handle moving to the previous question
  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Validate the user's response for the current question
  const validateCurrentQuestion = async () => {
    const question = quizQuestions[currentQuestionIndex];
    if (question.validationAPI) {
      try {
        const endpointUrl = question.validationAPI;
        const requestOptions: RequestInit = {
          headers: {
            'Content-Type': 'application/json'
          }
        };
        const response: HttpClientResponse = await spHttpClient.get('https://cors-anywhere.herokuapp.com/' + endpointUrl, HttpClient.configurations.v1, requestOptions);

        if (response.ok) {
          const validationData: any = await response.json();
          const isValid = validateResponse(currentQuestionIndex, question, validationData);
          const correctAnswer = getCorrectAnswer(currentQuestionIndex, validationData);
          return { isValid, correctAnswer };
        } else {
          throw new Error(`Failed to fetch validation data: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching validation data:', error);
        return { isValid: false, correctAnswer: undefined }; // Return default values on error
      }
    }
    return { isValid: true, correctAnswer: undefined }; // No validation needed if no validationAPI specified
  };

  // Validate user response against correct answer
  const validateResponse = (index: number, question: QuizQuestion, validationData: any) => {
    const userResponse = userResponses[index];
    const correctAnswer = getCorrectAnswer(index, validationData);

    // Compare user's response with the correct answer
    return userResponse === correctAnswer;
  };

  // Get correct answer from validation data based on question index
  const getCorrectAnswer = (index: number, validationData: any): string | boolean | undefined => {
    switch (index) {
      case 0:
        return validationData.timeZone;
      case 1:
        return validationData.date;
      case 2:
        return validationData.dayOfWeek;
      case 3:
        return validationData.hasDayLightSaving.toString();
      default:
        return undefined;
    }
  };

  // Restart the quiz by resetting state
  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserResponses(Array(quizQuestions.length).fill(''));
    setResults([]);
    setQuizSubmitted(false);
  };

  // Render appropriate input based on question type
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

  // Send email and update SharePoint list when quiz is submitted
  useEffect(() => {
    if (quizSubmitted) {
      sendEmail();
      pushQuizResultsToSharePoint(results, userName); // Send email after quiz has been submitted
    }
  }, [quizSubmitted]);

  return (
    <div style={{ maxWidth: 600, margin: 'auto', textAlign: 'center' }}>
      {!quizSubmitted ? (
        <>
          <div style={{ marginBottom: 10 }}>
            <Text variant="xLarge">Question {currentQuestionIndex + 1}</Text>
          </div>
          <div style={{ marginBottom: 20 }}>
            <Text variant="large" style={{ fontWeight: '600' }}>{quizQuestions[currentQuestionIndex].question}</Text>
          </div>
          {renderInput()}
          {validationError && (
            <Text variant="medium" style={{ color: 'red', marginTop: 10 }}>
              {validationError}
            </Text>
          )}
          <div style={{ marginTop: 20 }}>
            <PrimaryButton onClick={handlePrev} disabled={currentQuestionIndex === 0}>
              Previous
            </PrimaryButton>
            <PrimaryButton
              onClick={handleNext}
              disabled={userResponses[currentQuestionIndex].trim() === ''}
              style={{ marginLeft: 10 }}
            >
              {currentQuestionIndex === quizQuestions.length - 1 ? 'Submit Quiz Answers' : 'Next'}
            </PrimaryButton>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 40 }}>
          <Text variant="xxLarge" style={{ fontWeight: 'bold', marginBottom: 20 }}>{`Hello ${userName}, below are the results from your latest quiz:`}</Text>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {results.map((result, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Text variant="medium" style={{ fontWeight: 'bold', marginRight: 10 }}>Question {index + 1}</Text>
                  <Text variant="medium" style={{ fontWeight: '600' }}>{result.question}</Text>
                </div>
                <Text variant="medium" style={{ fontWeight: 'bold', color: result.isValid ? 'green' : 'red', marginTop: 5 }}>
                  {result.isValid ? 'Correct' : 'Incorrect'}
                </Text>
              </div>
            ))}
          </div>
          <Text variant="large" style={{ marginTop: 20 }}>You will receive an email with the same.</Text>
          <div style={{ marginTop: 20 }}>
            <PrimaryButton onClick={restartQuiz}>
              Restart Quiz
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizQuestionsComponent;
