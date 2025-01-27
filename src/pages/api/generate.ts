// src/pages/api/generate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';

import OpenAI from 'openai';
import path from 'path';
import fs from 'fs/promises';

import { replacePlaceholders } from './replacePlaceholders';
import { systemPrompt as brandTonePrompt } from '@/prompts/brandTone';
import { systemPrompt as zeroPartyPrompt } from '@/prompts/zeroParty';
import { systemPrompt as retentionEmailPrompt } from '@/prompts/retentionEmails';


const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
  defaultHeaders: {
    'Content-Type': 'application/json'
  },
  timeout: 20000
});

const cleanJsonString = (str: string) => {
  return str.replace(/^```json\n/, '').replace(/\n```$/, '');
};


type EmailPersona = 'inspiration' | 'nostalgia' | 'social_proof';

type EmailImageOptions = {
  persona: EmailPersona;
  category: string;
} | {
  type: 'fallback';
};

// Type guard function to check if options is of email type
function isEmailOptions(options: EmailImageOptions): options is { persona: EmailPersona; category: string } {
  return 'persona' in options && 'category' in options;
}

async function storeEmailImage(
  brandName: string,
  imageBuffer: Buffer,
  options: EmailImageOptions
): Promise<string> {
  try {
    const safeBrandName = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let filename = `demo-assets/${safeBrandName}/`;
    
    if (!isEmailOptions(options)) {
      filename += `default-${Date.now()}.png`;
    } else {
      const safeCategory = options.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
      filename += `${options.persona}-${safeCategory}-${Date.now()}.png`;
    }

    const { url } = await put(filename, imageBuffer, {
      access: 'public',
      addRandomSuffix: true
    });
    
    return url;
  } catch (error) {
    console.error('Error storing image:', error);
    throw new Error('Failed to store image');
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { brandName, brandInfo, category1, category2 } = req.body;

  if (!brandName || !brandInfo) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: 'Both brandName and brandInfo are required'
    });
  }

  try {
    // Verify API key is present
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    // Read base template
    const baseJsonPath = path.join(process.cwd(), 'src', 'templates', 'baseTemplate.json');
    const baseTemplate = await fs.readFile(baseJsonPath, 'utf-8')
      .then(JSON.parse)
      .catch(error => {
        console.error('Error reading base template:', error);
        throw new Error('Failed to read base template');
      });

    // Step 1: Get brand tone analysis first
    console.log('Starting brand tone analysis...');
    const brandToneRes = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: brandTonePrompt },
        { role: 'user', content: `Brand: ${brandName}\nInfo: ${brandInfo}` }
      ],
      model: 'deepseek-chat'
    });

    const brandToneContent = brandToneRes.choices[0].message.content;
    if (!brandToneContent) {
      throw new Error('Empty response from brand tone API');
    }

    const brandTone = JSON.parse(cleanJsonString(brandToneContent));
    const finalCategory1 = category1?.trim() || brandTone.category1;
    const finalCategory2 = category2?.trim() || brandTone.category2;
    
    // Create enhanced context using brand tone results
    const enhancedContext = `
Brand: ${brandName}
Brand Information: ${brandInfo}

Brand Analysis Results:
- Mission: ${brandTone.missionStatement}
- Tone of Voice: ${brandTone.toneOfVoice}
- Key Brand Words: ${brandTone.favoriteKeywords}
- Words to Avoid: ${brandTone.wordsToAvoid}
- Category 1: ${finalCategory1}
- Category 2: ${finalCategory2}
    `.trim();

    // Step 2: Now we can make the weblayer and email calls in parallel
    // since they both depend only on the brand tone results
    console.log('Starting weblayer and email generation...');
    const [weblayerRes, emailRes] = await Promise.all([
      openai.chat.completions.create({
        messages: [
          { role: 'system', content: zeroPartyPrompt },
          { role: 'user', content: enhancedContext }
        ],
        model: 'deepseek-chat'
      }),
      openai.chat.completions.create({
        messages: [
          { role: 'system', content: retentionEmailPrompt },
          { role: 'user', content: enhancedContext }
        ],
        model: 'deepseek-chat'
      })
    ]);

    const weblayerContent = weblayerRes.choices[0].message.content;
    const emailContent = emailRes.choices[0].message.content;
    
    if (!weblayerContent || !emailContent) {
      throw new Error('Empty response from weblayer or email API');
    }

    // Parse responses
    const weblayer = JSON.parse(cleanJsonString(weblayerContent));
    const emails = JSON.parse(cleanJsonString(emailContent));

    // Generate final JSON
    const finalJson = replacePlaceholders(baseTemplate, {
      brand: { name: brandName },
      weblayer,
      emails,
      categories: {
        category1: finalCategory1,
        category2: finalCategory2
      }
    });

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
    console.error('Detailed error:', error);
    
    if (error instanceof Error) {
      // If it's a timeout error
      if (error.message.includes('timeout')) {
        return res.status(504).json({
          error: 'Request timeout',
          details: 'The request took too long to complete. Please try again.'
        });
      }
      
      // If it's a parsing error
      if (error instanceof SyntaxError) {
        return res.status(500).json({
          error: 'Failed to parse API response',
          details: error.message
        });
      }
    }

    return res.status(500).json({
      error: 'Failed to generate assets',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}