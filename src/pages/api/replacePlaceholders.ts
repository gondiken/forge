interface EmailDataPoint {
  metric: string;
  text: string;
}

interface EmailSection {
  subject_line: string;
  preheader: string;
  first_paragraph: string;
  second_title: string;
  second_subtitle: string;
  data_points: {
    first: EmailDataPoint;
    second: EmailDataPoint;
  };
}

interface EmailData {
  emails: {
    inspiration: EmailSection;
    nostalgia: EmailSection;
    social_proof: EmailSection;
  };
  missions?: {
    general: string;
    product_focus: string;
  };
}

interface WeblayerQuestion {
  id: string;
  category: string;
  text: string;
  options: string[];
}

interface WeblayerData {
  questions: WeblayerQuestion[];
}

interface BrandData {
  name: string;
}

interface TemplateData {
  brand: BrandData;
  weblayer: WeblayerData;
  emails: EmailData;
}

// Type-safe function to get nested values from an object
const getNestedValue = (obj: Record<string, unknown>, path: string): string | undefined => {
  const parts = path.split('.');
  // We need to explicitly type the accumulator as unknown here because
  // we're traversing an object of unknown depth
  return parts.reduce((acc: unknown, part) => {
    if (acc === undefined || acc === null) return undefined;
    
    if (part.includes('[') && part.includes(']')) {
      const arrayName = part.split('[')[0];
      const index = parseInt(part.split('[')[1].split(']')[0]);
      // Type assertion needed here as we're dealing with dynamic property access
      const arrayObj = (acc as Record<string, unknown>)[arrayName];
      return Array.isArray(arrayObj) ? arrayObj[index] : undefined;
    }
    // Type assertion needed for dynamic property access
    return (acc as Record<string, unknown>)[part];
  }, obj) as string | undefined;
};

// Utility function to handle different escape patterns in template strings
const replaceAllOccurrences = (str: string, searchValue: string, replaceValue: string): string => {
  // Create an array of possible escape variations that might occur in the template
  const searchPatterns = [
    searchValue,                              // Original pattern
    searchValue.replace(/"/g, '\\"'),         // With escaped quotes
    searchValue.replace(/"/g, '\\\\"'),       // With double escaped quotes
    JSON.stringify(searchValue).slice(1, -1)  // JSON stringified version without quotes
  ];

  // Replace all variations of the pattern in the string
  return searchPatterns.reduce((result, pattern) => {
    // Escape special regex characters in the search pattern
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedPattern, 'g');
    return result.replace(regex, replaceValue);
  }, str);
};

// Main function to replace placeholders in the template
const replacePlaceholders = (template: Record<string, unknown>, data: TemplateData): Record<string, unknown> => {
  // Convert template to string for global replacement
  let templateString = JSON.stringify(template);

  // Helper function to safely get email-related data
  const getEmailValue = (path: string): string => {
    const value = getNestedValue(data.emails, path);
    return value !== undefined ? value : '';
  };

  // Define mappings with correct paths and types
  const replacements: Record<string, string> = {
    // Weblayer replacements
    '#weblayer1_q1#': getNestedValue(data, 'weblayer.questions[0].text') || '',
    '#weblayer1_q1a#': getNestedValue(data, 'weblayer.questions[0].options') || '',
    '#weblayer1_q2#': getNestedValue(data, 'weblayer.questions[1].text') || '',
    '#weblayer1_q2a#': getNestedValue(data, 'weblayer.questions[1].options') || '',
    '#weblayer1_q3#': getNestedValue(data, 'weblayer.questions[2].text') || '',
    '#weblayer1_q3a#': getNestedValue(data, 'weblayer.questions[2].options') || '',

    '#zeroparty_q1#': getNestedValue(data, 'weblayer.questions[0].category') || '',
    '#zeroparty_q2#': getNestedValue(data, 'weblayer.questions[1].category') || '',
    '#zeroparty_q3#': getNestedValue(data, 'weblayer.questions[2].category') || '',

    // Email replacements using the helper function
    '#email1_subject#': getEmailValue('emails.inspiration.subject_line'),
    '#email1_preheader#': getEmailValue('emails.inspiration.preheader'),
    '#email1_paragraph1#': getEmailValue('emails.inspiration.first_paragraph'),
    '#email1_title2#': getEmailValue('emails.inspiration.second_title'),
    '#email1_subtitle2#': getEmailValue('emails.inspiration.second_subtitle'),
    '#email1_data1#': getEmailValue('emails.inspiration.data_points.first.text'),
    '#email1_datatag1#': getEmailValue('emails.inspiration.data_points.first.metric'),
    '#email1_data2#': getEmailValue('emails.inspiration.data_points.second.text'),
    '#email1_datatag2#': getEmailValue('emails.inspiration.data_points.second.metric'),

    '#email2_subject#': getEmailValue('emails.nostalgia.subject_line'),
    '#email2_preheader#': getEmailValue('emails.nostalgia.preheader'),
    '#email2_paragraph1#': getEmailValue('emails.nostalgia.first_paragraph'),
    '#email2_title2#': getEmailValue('emails.nostalgia.second_title'),
    '#email2_subtitle2#': getEmailValue('emails.nostalgia.second_subtitle'),
    '#email2_data1#': getEmailValue('emails.nostalgia.data_points.first.text'),
    '#email2_datatag1#': getEmailValue('emails.nostalgia.data_points.first.metric'),
    '#email2_data2#': getEmailValue('emails.nostalgia.data_points.second.text'),
    '#email2_datatag2#': getEmailValue('emails.nostalgia.data_points.second.metric'),

    '#email3_subject#': getEmailValue('emails.social_proof.subject_line'),
    '#email3_preheader#': getEmailValue('emails.social_proof.preheader'),
    '#email3_paragraph1#': getEmailValue('emails.social_proof.first_paragraph'),
    '#email3_title2#': getEmailValue('emails.social_proof.second_title'),
    '#email3_subtitle2#': getEmailValue('emails.social_proof.second_subtitle'),
    '#email3_data1#': getEmailValue('emails.social_proof.data_points.first.text'),
    '#email3_datatag1#': getEmailValue('emails.social_proof.data_points.first.metric'),
    '#email3_data2#': getEmailValue('emails.social_proof.data_points.second.text'),
    '#email3_datatag2#': getEmailValue('emails.social_proof.data_points.second.metric'),

    '#email1_mission#': getEmailValue('missions.general'),
    '#email1_mission_on_product#': getEmailValue('missions.product_focus'),
    
    '#brand#': data.brand.name
  };

  // Apply all replacements
  Object.entries(replacements).forEach(([placeholder, value]) => {
    if (value !== undefined && value !== '') {
      templateString = replaceAllOccurrences(templateString, placeholder, value);
    }
  });

  // Parse back to object with error handling
  try {
    return JSON.parse(templateString);
  } catch (error) {
    console.error('Error parsing final template:', error);
    console.error('Template string:', templateString);
    throw new Error('Failed to parse template after replacements');
  }
};

export { replacePlaceholders };
