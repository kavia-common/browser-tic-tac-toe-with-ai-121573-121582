//
// OpenAI trash-talk generator service for the Tic Tac Toe app
//

// PUBLIC_INTERFACE
/**
 * Generate a playful, family-friendly trash-talking message for the game.
 * Reads the API key securely from environment variables at build time.
 *
 * @param {Object} context - Game context to provide to the AI.
 * @param {Array<string|null>} context.board - Current board state, an array of 9 slots with 'X', 'O', or null.
 * @param {Object} context.lastMove - Last move details.
 * @param {number} context.lastMove.index - Square index (0-8) where the last move was played.
 * @param {string} context.lastMove.player - 'X' or 'O' representing the player who just played.
 * @param {string|null} context.winner - Winner symbol ('X' or 'O') if exists, otherwise null.
 * @param {boolean} context.isDraw - Whether the game reached a draw.
 * @param {string} context.nextPlayer - The next player to play ('X' or 'O').
 * @returns {Promise<string>} The AI-generated trash talk text.
 */
export async function generateTrashTalk(context) {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const model = process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini";

  // If no API key is configured, gracefully return a friendly message.
  if (!apiKey) {
    return "🤖 AI banter unavailable (missing API key). Set REACT_APP_OPENAI_API_KEY to spice things up!";
  }

  // Safety: Bound the request with a timeout so UI doesn't hang.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const systemPrompt =
      "You are a witty, playful, and family-friendly game commentator for a Tic Tac Toe match. " +
      "After each move, you provide a short (1-2 sentences) trash-talking message in a fun, upbeat tone. " +
      "No profanity, hate, or insults against real people—keep it light and humorous. " +
      "Feel free to use emojis. If the game is over, congratulate the winner or tease about the draw.";

    const userPrompt = `Here is the current game context as JSON:
${JSON.stringify(context, null, 2)}
Write a short, fun, family-friendly trash-talking comment about the last move and current state. Keep it under 35 words.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        max_tokens: 80,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    clearTimeout(timeout);

    if (!res.ok) {
      let detail = "";
      try {
        const err = await res.json();
        detail = err?.error?.message ? ` (${err.error.message})` : "";
      } catch {
        // ignore parse error
      }
      throw new Error(`OpenAI request failed with status ${res.status}${detail}`);
    }

    const data = await res.json();
    const text =
      data?.choices?.[0]?.message?.content?.trim() ||
      "🤖 I'm speechless... but in a totally intimidating way!";

    return text;
  } catch (err) {
    if (err?.name === "AbortError") {
      return "⏳ My circuits needed a breather—try that move again!";
    }
    // Generic fallback for any other error
    return "⚠️ My wit got tangled in the wires—couldn't fetch banter this time.";
  }
}
