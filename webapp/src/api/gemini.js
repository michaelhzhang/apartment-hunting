const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function estimateSqFt(apiKey, base64Image, mimeType) {
  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            text: 'This is a floor plan of an apartment. Estimate the total square footage of the apartment. Return ONLY a single integer number, nothing else.',
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('No response from Gemini');

  // Extract the first number that looks like a reasonable sq ft (3-5 digits)
  const match = text.match(/\b(\d{3,5})\b/);
  if (!match) throw new Error(`Could not parse square footage from: "${text}"`);
  const num = parseInt(match[1], 10);

  return num;
}
