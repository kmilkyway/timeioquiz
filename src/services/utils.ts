import { getCurrentTime, getTimeZone } from './api';

export const validateResponse = async (question: string, userAnswer: string): Promise<boolean> => {
  let correctAnswer: string;

  // Placeholder implementation to interact with TimeIO API
  switch (question) {
    case 'What is the current time in London, UK?':
      correctAnswer = await getCurrentTime('London');
      break;
    case 'What is the time zone of New York City, USA?':
      correctAnswer = await getTimeZone('New York City');
      break;
    // Add more cases for other questions
    default:
      return false;
  }

  // Compare user's answer with correct answer
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
};
