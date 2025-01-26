import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs/promises';

import { replacePlaceholders } from './replacePlaceholders';

import { systemPrompt as brandTonePrompt } from '@/prompts/brandTone';
import { systemPrompt as zeroPartyPrompt } from '@/prompts/zeroParty';
import { systemPrompt as retentionEmailPrompt } from '@/prompts/retentionEmails';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
});

const cleanJsonString = (str: string) => {
  return str.replace(/^```json\n/, '').replace(/\n```$/, '');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { brandName, brandInfo } = req.body;

  try {
    const baseJsonPath = path.join(process.cwd(), 'src', 'templates', 'baseTemplate.json');
    const baseTemplate = await fs.readFile(baseJsonPath, 'utf-8').then(JSON.parse).catch(() => ({}));

    const brandToneRes = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: brandTonePrompt },
        { role: 'user', content: `Brand: ${brandName}\nInfo: ${brandInfo}` }
      ],
      model: 'deepseek-chat',
    });

    // Add null check for message content
    const brandToneContent = brandToneRes.choices[0].message.content;
    if (!brandToneContent) {
      throw new Error('Failed to generate brand tone analysis');
    }

    const brandTone = JSON.parse(cleanJsonString(brandToneContent));

    const enhancedContext = `
Brand: ${brandName}
Brand Information: ${brandInfo}

Brand Analysis Results:
- Mission: ${brandTone.missionStatement}
- Tone of Voice: ${brandTone.toneOfVoice}
- Key Brand Words: ${brandTone.favoriteKeywords}
- Words to Avoid: ${brandTone.wordsToAvoid}
    `.trim();

    const [weblayerRes, emailRes] = await Promise.all([
      openai.chat.completions.create({
        messages: [
          { role: 'system', content: zeroPartyPrompt },
          { role: 'user', content: enhancedContext }
        ],
        model: 'deepseek-chat',
      }),
      openai.chat.completions.create({
        messages: [
          { role: 'system', content: retentionEmailPrompt },
          { role: 'user', content: enhancedContext }
        ],
        model: 'deepseek-chat',
      })
    ]);

    // Add null checks for other responses
    const weblayerContent = weblayerRes.choices[0].message.content;
    const emailContent = emailRes.choices[0].message.content;

    if (!weblayerContent || !emailContent) {
      throw new Error('Failed to generate weblayer or email content');
    }

    const weblayer = JSON.parse(cleanJsonString(weblayerContent));
    const emails = JSON.parse(cleanJsonString(emailContent));

    const finalJson = replacePlaceholders(baseTemplate, {
      brand: {
        name: brandName
      },
      weblayer,
      emails
    });

    const outputDir = path.join(process.cwd(), 'outputs');
    await fs.mkdir(outputDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(outputDir, `${brandName}-${timestamp}.json`);
    await fs.writeFile(outputPath, JSON.stringify(finalJson, null, 2));

    res.status(200).json({
      brandTone,
      fullJson: finalJson,
      rawResponses: {
        brandTone: brandToneContent,
        weblayer: weblayerContent,
        emails: emailContent
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}