import { Anthropic } from '@anthropic-ai/sdk';
import { getNegotiationSystemPrompt, MCQ_GENERATION_PROMPT, VISION_JUDGMENT_PROMPT } from './prompts';

const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// 1. Phase 1: Negotiation
export async function negotiateGoalWithAI(goalText: string, proofDescription: string, userProfile?: { occupation: string, target_goal: string }) {
  const anthropic = getAnthropic();
  
  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 500,
    temperature: 0,
    system: getNegotiationSystemPrompt(userProfile),
    messages: [
      {
        role: "user",
        content: `My goal is: "${goalText}".\nI will prove it by: "${proofDescription}".`
      }
    ]
  });

  // @ts-ignore
  const responseText = msg.content[0].text;
  return JSON.parse(responseText);
}

// 2. Phase 2: MCQ Generation for Academics
export async function generateMCQs(topicList: string) {
  const anthropic = getAnthropic();

  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 800,
    temperature: 0,
    system: MCQ_GENERATION_PROMPT,
    messages: [
      {
        role: "user",
        content: `Topics studied: [${topicList}]`
      }
    ]
  });

  // @ts-ignore
  const responseText = msg.content[0].text;
  return JSON.parse(responseText);
}

// 3. Phase 2: Final Judgment (Vision)
export async function judgeProofWithVision(
  category: string, 
  proofUrls: string[], 
  extraData?: { topicList?: string, userAnswers?: any, mcqJson?: any }
) {
  const anthropic = getAnthropic();

  let textContent = `Please analyze the provided proof for the category: ${category}.`;
  if (category === 'academics' && extraData) {
    textContent += `\nTopics: ${extraData.topicList}\nGenerated MCQs: ${JSON.stringify(extraData.mcqJson)}\nUser Answers: ${JSON.stringify(extraData.userAnswers)}`;
  }

  const content: any[] = [
    { type: "text", text: textContent }
  ];

  // In a real app we need to fetch the images and convert to base64 for Claude Vision,
  // since Claude API doesn't accept direct URLs easily unless using specific wrappers,
  // but for V1 MVP we can assume base64 is passed, OR we fetch it here.
  // We'll pass the URL to Claude and hope it works if it's public, or we fetch it.
  // Actually, Anthropic SDK requires base64 image data.
  // We will need to fetch the images from the public URLs.
  for (const url of proofUrls) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType as any,
          data: base64Data
        }
      });
    } catch (e) {
      console.error("Failed to fetch image for Claude:", e);
    }
  }

  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 300,
    temperature: 0,
    system: VISION_JUDGMENT_PROMPT,
    messages: [
      { role: "user", content }
    ]
  });

  // @ts-ignore
  const responseText = msg.content[0].text;
  return JSON.parse(responseText);
}
