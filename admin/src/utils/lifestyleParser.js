// Utility function to parse lifestyle API response
export const parseLifestyleApiResponse = (apiResponse) => {
  if (!apiResponse) return { lifestyle: '', medications: [] };

  const text = typeof apiResponse === 'string' ? apiResponse : JSON.stringify(apiResponse);
  
  const result = {
    lifestyle: '',
    medications: []
  };

  // Parse lifestyle recommendations
  const lifestyleMatch = text.match(/Lifestyle Recommendations:\s*([\s\S]*?)(?=Recommended Ayurvedic Medicines:|Additional Wellness Tips:|$)/i);
  const additionalTipsMatch = text.match(/Additional Wellness Tips:\s*([\s\S]*?)$/i);
  
  if (lifestyleMatch || additionalTipsMatch) {
    let lifestyleText = '';
    
    if (lifestyleMatch) {
      const recommendations = lifestyleMatch[1].trim();
      if (recommendations) {
        lifestyleText += recommendations;
      }
    }
    
    // Add additional wellness tips if found
    if (additionalTipsMatch) {
      const additionalTips = additionalTipsMatch[1].trim();
      if (additionalTips) {
        if (lifestyleText) lifestyleText += '\n\n';
        lifestyleText += additionalTips;
      }
    }
    
    result.lifestyle = lifestyleText;
  }

  // Parse medications from the text format
  const medicationMatch = text.match(/Recommended Ayurvedic Medicines:\s*([\s\S]*?)(?=Additional Wellness Tips:|$)/i);
  
  if (medicationMatch) {
    const medicationText = medicationMatch[1].trim();
    const medicationLines = medicationText.split('\n').filter(line => line.trim());
    
    medicationLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && trimmedLine.match(/^\d+\./)) {
        // Parse medication line: "1. Ashwagandha: 1 tsp with warm milk at bedtime."
        const match = trimmedLine.match(/^\d+\.\s*([^:]+):\s*(.+)$/);
        if (match) {
          const name = match[1].trim();
          const instruction = match[2].trim();
          
          // Try to extract dosage, frequency, timing from instruction
          const dosageMatch = instruction.match(/(\d+\/?\d*\s*(?:tsp|tbsp|gm|mg|drops?|capsules?))/i);
          const timingMatch = instruction.match(/(?:at\s+)?(bedtime|morning|evening|after meals|before meals|twice daily|daily)/i);
          
          result.medications.push({
            name: name,
            dosage: dosageMatch ? dosageMatch[1] : '1 tsp',
            frequency: timingMatch && timingMatch[0].includes('twice') ? 'Twice daily' : 'Once daily',
            timing: timingMatch ? timingMatch[1] : 'As directed',
            duration: '1 month',
            instructions: instruction
          });
        }
      }
    });
  }

  return result;
};