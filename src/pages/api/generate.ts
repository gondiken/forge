// src/pages/api/generate.ts
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
  apiKey: process.env.DEEPSEEK_API_KEY,
  defaultHeaders: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout
});

const cleanJsonString = (str: string) => {
  return str.replace(/^```json\n/, '').replace(/\n```$/, '');
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { brandName, brandInfo } = req.body;
  
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

    // Prepare context for all API calls
    const enhancedContext = `Brand: ${brandName}\nBrand Information: ${brandInfo}`;

    // Make parallel API calls
    const [brandToneRes, weblayerRes, emailRes] = await Promise.all([
      openai.chat.completions.create({
        messages: [
          { role: 'system', content: brandTonePrompt },
          { role: 'user', content: enhancedContext }
        ],
        model: 'deepseek-chat'
      }),
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

    // Process responses
    const brandToneContent = brandToneRes.choices[0].message.content;
    const weblayerContent = weblayerRes.choices[0].message.content;
    const emailContent = emailRes.choices[0].message.content;

    if (!brandToneContent || !weblayerContent || !emailContent) {
      throw new Error('Received empty response from API');
    }

    // Parse responses
    const brandTone = JSON.parse(cleanJsonString(brandToneContent));
    const weblayer = JSON.parse(cleanJsonString(weblayerContent));
    const emails = JSON.parse(cleanJsonString(emailContent));

    // Generate final JSON
    const finalJson = replacePlaceholders(baseTemplate, {
      brand: { name: brandName },
      weblayer,
      emails
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
      
      // If it's an API key error
      if (error.message.includes('DEEPSEEK_API_KEY')) {
        return res.status(500).json({
          error: 'API configuration error',
          details: 'The API key is not properly configured'
        });
      }
    }

    // Generic error response
    return res.status(500).json({
      error: 'Failed to generate assets',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}