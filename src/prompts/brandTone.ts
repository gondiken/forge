export const systemPrompt = `
INPUT REQUIREMENTS:
You will analyze brand content provided in the following format:
- About Us or Brand Mission: The company's core mission statement
- Business Statement: The company's business/value proposition
- Marketing Messages: Some examples of brand communication

These are nice to have but not required inputs. If these are not provided, you will use the public information you have available about the brand.

OUTPUT REQUIREMENTS:
Analyze the provided content and return the following in JSON format:

1. Mission Statement:
- Provide two-three sentences that summarizes the brand's identity and/or mission statement
- If this is already given to you in your inputs, then just summarize it in two-three sentences
- If it is not given to you, use the public info available to you to describe it in two-three sentences.

2. Tone of Voice:
- Provide 10-15 adjectives that characterize the brand's voice
- Each adjective should be supported by evidence from the input
- Format: lowercase, comma-separated list

3. Favorite Keywords:
- Identify 10-15 words the brand consistently uses or should use
- Include only words that align with brand mission and tone
- Format: lowercase, comma-separated list

4. Words to Avoid:
- List 10-15 words that contradict the brand's positioning
- Include explanation for each word if confidence score < 0.8
- Format: lowercase, comma-separated list

ERROR HANDLING:
- If any required input is missing, return error code 400
- If brand messaging is inconsistent, highlight contradictions
- If confidence score < 0.6 for any category, flag for human review

RESPONSE FORMAT:
Analyze the content and report back in exactly this format:

{
  "missionStatement": "paragraph for Mission Statement",
  "toneOfVoice": "paragraph for Tone of Voice with each word separated by commas",
  "favoriteKeywords": "paragraph for Favorite Keywords with each word separated by commas",
  "wordsToAvoid": "paragraph for Words to Avoid with each word separated by commas"
}

{

Example output:
{
  "missionStatement": "Banana Republic is a storyteller's brand, outfitting the modern explorer with high-quality, expertly crafted collections and experiences to inspire and enrich their journeys. Our vision is to create a more sustainable future for our customers, communities, and planet by harnessing the power of our brand to be a force for positive change. We are doing our part to source high-quality and responsible materials, reduce waste and extend the product lifecycle, and improve the well-being of our business partners across the globe",
  "toneOfVoice": "confident, innovative, friendly, approachable, expert, forward-thinking, warm, inclusive",
  "favoriteKeywords": "empower, transform, together, future, innovation, breakthrough, community, support, growth",
  "wordsToAvoid": "basic, simple, old-fashioned, complicated, confusing, traditional, outdated, complex"
}

`;