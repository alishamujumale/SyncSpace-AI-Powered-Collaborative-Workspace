const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate full project plan from idea
const generateProjectPlan = async (idea) => {
  const prompt = `
You are an expert project manager and software architect.
A user wants to build: "${idea}"

Generate a detailed project plan in the following JSON format only, no extra text:
{
  "projectName": "string",
  "summary": "string",
  "features": ["feature1", "feature2"],
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "low|medium|high",
      "deadline": "number of days from today",
      "suggestedRole": "string"
    }
  ],
  "suggestedRoles": ["role1", "role2"],
  "timeline": "string"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });

  const text = response.choices[0].message.content;
  return JSON.parse(text);
};

// Answer questions about the project
const askAssistant = async (question, context) => {
  const prompt = `
You are a helpful project management assistant for a team workspace called SyncSpace.

Current project context:
${context}

User question: "${question}"

Give a short, helpful, direct answer in plain text.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5
  });

  return response.choices[0].message.content;
};

// Summarize chat messages
const summarizeChat = async (messages) => {
  const chatText = messages.map(m => `${m.sender.name}: ${m.text}`).join('\n');

  const prompt = `
Summarize this team chat in 3-4 bullet points. Focus on decisions made and action items:

${chatText}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5
  });

  return response.choices[0].message.content;
};

module.exports = { generateProjectPlan, askAssistant, summarizeChat };