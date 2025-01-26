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
  console.log('Starting request processing for brand:', brandName);

  try {
    console.log('Reading base template...');
    const baseJsonPath = path.join(process.cwd(), 'src', 'templates', 'baseTemplate.json');
    const baseTemplate = await fs.readFile(baseJsonPath, 'utf-8').then(JSON.parse).catch((err) => {
      console.error('Error reading base template:', err);
      console.log('Base template path:', baseJsonPath);
      return {};
    });

    console.log('Calling Deepseek API for brand tone...');
    const brandToneRes = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: brandTonePrompt },
        { role: 'user', content: `Brand: ${brandName}\nInfo: ${brandInfo}` }
      ],
      model: 'deepseek-chat',
    });
    console.log('Brand tone API response received');

    const brandToneContent = brandToneRes.choices[0].message.content;
    if (!brandToneContent) {
      throw new Error('Empty response from brand tone API');
    }
    console.log('Raw brand tone content:', brandToneContent);

    const brandTone = JSON.parse(cleanJsonString(brandToneContent));
    console.log('Parsed brand tone data successfully');

    const enhancedContext = `
Brand: ${brandName}
Brand Information: ${brandInfo}

Brand Analysis Results:
- Mission: ${brandTone.missionStatement}
- Tone of Voice: ${brandTone.toneOfVoice}
- Key Brand Words: ${brandTone.favoriteKeywords}
- Words to Avoid: ${brandTone.wordsToAvoid}
    `.trim();

    console.log('Making parallel API calls for weblayer and emails...');
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
    console.log('Parallel API calls completed');

    const weblayerContent = weblayerRes.choices[0].message.content;
    const emailContent = emailRes.choices[0].message.content;
    
    console.log('Raw weblayer content:', weblayerContent);
    console.log('Raw email content:', emailContent);

    if (!weblayerContent || !emailContent) {
      throw new Error('Empty response from weblayer or email API');
    }

    const weblayer = JSON.parse(cleanJsonString(weblayerContent));
    const emails = JSON.parse(cleanJsonString(emailContent));
    console.log('Successfully parsed weblayer and email data');

    const finalJson = replacePlaceholders(baseTemplate, {
      brand: { name: brandName },
      weblayer,
      emails
    });
    console.log('Replacements completed successfully');

    return res.status(200).json({
      brandTone,
      fullJson: finalJson,
      rawResponses: {
        brandTone: brandToneContent,
        weblayer: weblayerContent,
        emails: emailContent
      }
    });
  } catch (error) {
    console.error('Detailed error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error // Log the full error object
    });
    return res.status(500).json({ 
      error: 'Failed to generate assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}