// ai.js — DeepSeek streaming client

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

/**
 * Build the user prompt from the three picked cards.
 * @param {Array<{card: {name: string}, reversed: boolean, position: string}>} pickedCards
 * @returns {string}
 */
function buildPrompt(pickedCards) {
  const cardLines = pickedCards.map(({ card, reversed, position }) => {
    const orientation = reversed ? 'reversed' : 'upright';
    return `- ${position}: ${card.name} (${orientation})`;
  }).join('\n');

  return `You are a tarot reader. Interpret the following three-card spread:\n\n${cardLines}\n\nProvide a thoughtful, insightful reading in Markdown format.`;
}

/**
 * Call the DeepSeek chat completions endpoint with streaming.
 *
 * @param {Array<{card: {id, name, type, img}, reversed: boolean, position: string}>} pickedCards
 * @param {string} token - DeepSeek API key
 * @param {(text: string) => void} onChunk - called with each streamed text chunk
 * @param {() => void} onDone - called when the stream ends
 * @param {(err: Error) => void} onError - called on fetch or stream failure
 * @returns {Promise<void>}
 */
export async function getInterpretation(pickedCards, token, onChunk, onDone, onError) {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: true,
        messages: [
          { role: 'user', content: buildPrompt(pickedCards) },
        ],
      }),
    });

    if (!response.ok) {
      const err = new Error(`API request failed with status ${response.status}`);
      console.error(err);
      onError(err);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const text = parsed?.choices?.[0]?.delta?.content;
            if (text) {
              onChunk(text);
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    onDone();
  } catch (err) {
    console.error(err);
    onError(err);
  }
}
