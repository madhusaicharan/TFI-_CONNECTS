'use strict';

const Movie = require('../models/Movie');

/**
 * AI Chat & RAG Retrieval Service for TFI_CONNECTS
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Retrieve up to 8 matching movies from MongoDB using $text search or top ratings.
 * 2. Send retrieved context + query to Anthropic API (claude-sonnet-5).
 * 3. Enforce strict Zero-Hallucination policy (only recommend context movies).
 */

class AIChatService {
  /**
   * Perform RAG Context Retrieval against MongoDB
   * @param {string} userQuery
   * @returns {Promise<Array>} List of up to 8 lean movie objects
   */
  async retrieveContext(userQuery) {
    if (!userQuery || typeof userQuery !== 'string') {
      userQuery = '';
    }

    const cleanQuery = userQuery.trim();

    try {
      let movies = [];

      if (cleanQuery.length > 1) {
        // Perform MongoDB $text search sorted by relevance score
        movies = await Movie.find(
          { $text: { $search: cleanQuery } },
          { score: { $meta: 'textScore' } }
        )
          .sort({ score: { $meta: 'textScore' } })
          .limit(8)
          .select('id title genres rating overview year releaseYear director poster')
          .lean();
      }

      // Fallback: If $text search returns less than 4 movies, top up with top-rated popular movies
      if (!movies || movies.length < 4) {
        const topMovies = await Movie.find({})
          .sort({ rating: -1, _id: -1 })
          .limit(8)
          .select('id title genres rating overview year releaseYear director poster')
          .lean();

        const existingIds = new Set(movies.map(m => String(m.id || m._id)));
        topMovies.forEach(m => {
          if (movies.length < 8 && !existingIds.has(String(m.id || m._id))) {
            movies.push(m);
          }
        });
      }

      return movies.map(m => ({
        id: m.id,
        title: m.title,
        genres: Array.isArray(m.genres) ? m.genres.join(', ') : (m.genres || 'Classic'),
        rating: m.rating || 'N/A',
        year: m.year || m.releaseYear || '2024',
        director: m.director || 'Unknown',
        overview: m.overview || m.description || 'No overview available.'
      }));
    } catch (err) {
      console.error('[AIChatService] MongoDB retrieval error:', err.message);
      // Fallback retrieval without text index if text index is rebuilding
      const fallback = await Movie.find({})
        .limit(8)
        .select('id title genres rating overview year releaseYear director')
        .lean();
      
      return fallback.map(m => ({
        id: m.id,
        title: m.title,
        genres: Array.isArray(m.genres) ? m.genres.join(', ') : 'Classic',
        rating: m.rating || 'N/A',
        year: m.year || m.releaseYear || '2024',
        director: m.director || 'Unknown',
        overview: m.overview || 'No overview available.'
      }));
    }
  }

  /**
   * Main Chat Execution using Anthropic API (claude-sonnet-5)
   * @param {string} userQuery
   * @param {Array} history - Previous conversation messages [{ role: 'user'|'assistant', content: string }]
   */
  async chatWithAI(userQuery, history = []) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

    // 1. Retrieve RAG context (Capped at 8 movies)
    const contextMovies = await this.retrieveContext(userQuery);

    const contextText = contextMovies.length > 0
      ? contextMovies.map((m, i) => `${i + 1}. Title: "${m.title}" (Year: ${m.year}, Rating: ${m.rating}/10, Genres: [${m.genres}], Director: ${m.director})\n   Overview: ${m.overview}`).join('\n\n')
      : 'No movies found in database context.';

    // System prompt enforcing strict zero-hallucination policy
    const systemPrompt = `You are the official TFI_CONNECTS AI Cinema Assistant — an expert guide for Telugu cinema lovers.

CRITICAL OPERATIONAL RULES:
1. You have been provided with an EXCLUSIVE CONTEXT list of movies from our MongoDB database below.
2. You MUST ONLY recommend or discuss movies present in the CONTEXT LIST below.
3. NEVER fabricate, invent, or suggest external movie titles, release dates, or facts not in the context list.
4. If no movie in the context list matches the user's request, state that honestly and suggest the closest available title from the list.
5. Keep your tone enthusiastic, engaging, concise, and helpful. Wrap movie titles in quotes or bold (e.g. **RRR** or "**Peddi**").

RETRIEVED MONGODB MOVIE CONTEXT:
${contextText}`;

    // Format message history for Anthropic API
    const formattedMessages = [];
    if (Array.isArray(history)) {
      history.slice(-6).forEach(msg => {
        if (msg && (msg.role === 'user' || msg.role === 'assistant') && msg.content) {
          formattedMessages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }

    // Add current user query
    formattedMessages.push({
      role: 'user',
      content: userQuery
    });

    // 2. Call Anthropic API if key is present
    if (apiKey && apiKey.trim() !== '' && !apiKey.includes('your_anthropic_api_key')) {
      try {
        console.log(`[AIChatService] Invoking Anthropic API (${model})...`);
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 500,
            system: systemPrompt,
            messages: formattedMessages
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.content && data.content[0] && data.content[0].text) {
            return {
              reply: data.content[0].text,
              retrievedCount: contextMovies.length,
              source: 'ANTHROPIC_LLM'
            };
          }
        } else {
          const errBody = await res.text();
          console.warn(`[AIChatService] Anthropic API HTTP ${res.status}:`, errBody);
        }
      } catch (apiErr) {
        console.error('[AIChatService] Anthropic API fetch error:', apiErr.message);
      }
    }

    // 3. Fallback RAG Engine Response if API key is not configured or rate-limited
    console.log('[AIChatService] Generating structured RAG context response (local LLM fallback engine)...');
    let fallbackReply = `🎬 **TFI_CONNECTS Movie Recommendations for "${userQuery}":**\n\n`;

    if (contextMovies.length > 0) {
      fallbackReply += `Here are top matches from our verified database:\n\n`;
      contextMovies.slice(0, 4).forEach((m, idx) => {
        fallbackReply += `${idx + 1}. **${m.title}** (${m.year}) — ⭐ ${m.rating}/10\n   *Genres:* ${m.genres}\n   ${m.overview.slice(0, 140)}...\n\n`;
      });
      fallbackReply += `💡 *Tip: Click on any movie card in TFI_CONNECTS for official HD trailers, cast profiles, and streaming platforms!*`;
    } else {
      fallbackReply = `I checked our TFI_CONNECTS database for "${userQuery}", but couldn't find a direct match in our active catalog. Try searching for popular genres like Action, Romance, or Drama!`;
    }

    return {
      reply: fallbackReply,
      retrievedCount: contextMovies.length,
      source: 'RAG_CONTEXT_ENGINE'
    };
  }
}

module.exports = new AIChatService();
