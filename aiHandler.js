import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function analyzeMessage(message) {
  try {
    const response = await hf.textClassification({
      model: 'facebook/bart-large-mnli',
      inputs: message,
      parameters: {
        candidate_labels: ['low priority', 'medium priority', 'high priority'],
      },
    });

    const highestScore = Math.max(...response.scores);
    const highestLabel = response.labels[response.scores.indexOf(highestScore)];

    return highestLabel.split(' ')[0]; // Returns 'low', 'medium', or 'high'
  } catch (error) {
    console.error('Error analyzing message:', error);
    return 'medium'; // Default to medium priority if analysis fails
  }
}

export async function getAIResponse(message) {
  try {
    const response = await hf.textGeneration({
      model: 'gpt2',
      inputs: `Support agent: ${message}\nAI: `,
      parameters: {
        max_new_tokens: 50,
        temperature: 0.7,
        top_k: 50,
        top_p: 0.95,
      },
    });

    return response.generated_text.split('AI: ')[1].trim();
  } catch (error) {
    console.error('Error getting AI response:', error);
    return null;
  }
}

