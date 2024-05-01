import React, { useState } from 'react';
import { PrimaryButton, Text } from '@fluentui/react';
import PersonalQuestionsComponent from '../../../components/PersonalQuestionsComponent';
import QuizQuestionsComponent from '../../../components/QuizQuestionsComponent';
import { HttpClient } from '@microsoft/sp-http'; 
import { WebPartContext } from '@microsoft/sp-webpart-base';

interface Question {
  type: 'personal' | 'quiz';
  question: string;
  options?: string[] | boolean[];
  columnType?: 'single' | 'choice' | 'boolean';
  validationAPI?: string;
}

const TimeIOQuiz = ({ httpClient,spcontext }: { httpClient: HttpClient, spcontext:WebPartContext }) => { // Receive SPHttpClient as prop
  const [personalAnswers, setPersonalAnswers] = useState<string[]>([]);
  const [showResponses, setShowResponses] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleSubmitPersonalAnswers = (answers: string[]) => {
    setPersonalAnswers(answers);
    setShowResponses(true);
  };

  const handleToggleSections = () => {
    setShowResponses(!showResponses);
    setShowQuiz(!showQuiz);
  };

  

  const handleSubmitQuizQuestions = (answers: string[]) => {
    // Handle submission of quiz answers here
    console.log('Quiz answers:', answers);
  };

  const questions: Question[] = [
    { type: 'personal', question: 'What is your first name?' },
    { type: 'personal', question: 'What is your surname?' },
    { type: 'personal', question: 'What is your gender?', options: ['Male', 'Female', 'Other'] },
    { type: 'personal', question: 'What is your age?' },
    { type: 'personal', question: 'What country are you from?' },
    { type: 'personal', question: 'What is your email address?' },
    {
      type: 'quiz',
      question: 'What is the time zone of Paris, France?',
      options: ['Europe/Paris', 'Pacific/Paris', 'Greenwich Mean Time'],
      columnType: 'choice',
      validationAPI: 'https://timeapi.io/api/TimeZone/zone?timeZone=Europe/Paris'
    },
    {
      type: 'quiz',
      question: 'What is the current date in Sydney, Australia?',
      columnType: 'single',
      validationAPI: 'https://timeapi.io/api/Time/current/zone?timeZone=Australia/Sydney'
    },
    {
      type: 'quiz',
      question: 'What is the day of the week 2021-03-14?',
      columnType: 'single',
      validationAPI: 'https://timeapi.io/api/Conversion/DayOfTheWeek/2021-03-14'
    },
    {
      type: 'quiz',
      question: 'Is Daylight Saving Time observed in Tokyo, Japan?',
      options: [true, false],
      columnType: 'boolean',
      validationAPI: 'https://timeapi.io/api/TimeZone/zone?timeZone=Asia/Tokyo'
    },
   
  ];

  const quizQuestions = questions.filter(q => q.type === 'quiz');
  const columnTypes: string[] = questions.filter(q => q.type === 'quiz').map(q => q.columnType || '');

  const userName = personalAnswers[0] && personalAnswers[1] ? `${personalAnswers[0]} ${personalAnswers[1]}` : '';
  const email = personalAnswers[5];

 

  return (
    <div>
      <h1>Interactive Quiz</h1>
      {!showQuiz && !showResponses && (
        <PersonalQuestionsComponent
          personalQuestions={questions.filter(q => q.type === 'personal')}
          onSubmitPersonalAnswers={handleSubmitPersonalAnswers}
        />
      )}

      {showResponses && (
        <div style={{ maxWidth: 400, margin: 'auto', textAlign: 'center', marginTop: 20 }}>
          <Text variant="xLarge" style={{ fontWeight: 'bold', marginBottom: 20 }}>Your Responses</Text>
          {personalAnswers.map((answer, index) => (
            <div key={index} style={{ marginBottom: 20, marginTop: 20 }}>
              <div>
                <Text variant="medium">{questions[index].question}</Text>
              </div>
              <div>
                <Text variant="medium">{answer}</Text>
              </div>
            </div>
          ))}
          <PrimaryButton onClick={handleToggleSections} style={{ marginTop: 10 }}>
            Proceed to Quiz
          </PrimaryButton>
        </div>
      )}

      {showQuiz && (
        <QuizQuestionsComponent
          quizQuestions={quizQuestions}
          columnTypes={columnTypes}
          onSubmitQuizQuestions={handleSubmitQuizQuestions}
          spHttpClient={httpClient} 
          userName={userName}
          wpcontext={spcontext} email={email}
        />
      )}
    </div>
  );
};

export default TimeIOQuiz;
