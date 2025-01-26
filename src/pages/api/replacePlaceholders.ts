const getNestedValue = (obj: any, path: string) => {
  // Handle array indices in path (e.g., "questions[0].text")
  const parts = path.split('.');
  return parts.reduce((acc, part) => {
    if (part.includes('[') && part.includes(']')) {
      const arrayName = part.split('[')[0];
      const index = parseInt(part.split('[')[1].split(']')[0]);
      return acc?.[arrayName]?.[index];
    }
    return acc?.[part];
  }, obj);
};

const replaceAllOccurrences = (str: string, searchValue: string, replaceValue: string): string => {
  // Create an array of possible escape variations
  const searchPatterns = [
    searchValue,                              // Original
    searchValue.replace(/"/g, '\\"'),         // With escaped quotes
    searchValue.replace(/"/g, '\\\\"'),       // With double escaped quotes
    JSON.stringify(searchValue).slice(1, -1)  // JSON stringified version without quotes
  ];

  let result = str;
  // Replace all variations
  searchPatterns.forEach(pattern => {
    const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, replaceValue);
  });
  
  return result;
};

const replacePlaceholders = (template: any, data: any) => {
  // Convert template to string for global replacement
  let templateString = JSON.stringify(template);

  // Helper function to safely get email data
  const getEmailValue = (path: string) => {
    const value = getNestedValue(data.emails, path);
    return value !== undefined ? value : '';
  };

  // Define mappings with correct paths
  const replacements = {
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

    // Email replacements - note we're now using getEmailValue helper
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
    
    // Brand name replacement
    '#brand#': getNestedValue(data, 'brand.name') || ''
  };

  // Replace all occurrences of each placeholder
  Object.entries(replacements).forEach(([placeholder, value]) => {
    if (value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        // Handle array values
        templateString = replaceAllOccurrences(
          templateString,
          placeholder,
          JSON.stringify(value)
        );
      } else {
        // Handle string values - don't add extra quotes
        templateString = replaceAllOccurrences(
          templateString,
          placeholder,
          value.toString()
        );
      }
    }
  });

  // Parse back to object
  try {
    return JSON.parse(templateString);
  } catch (error) {
    console.error('Error parsing final template:', error);
    console.error('Template string:', templateString);
    throw error;
  }
};

export { replacePlaceholders };