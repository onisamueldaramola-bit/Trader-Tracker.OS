export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { image, pair, timeframe } = req.body || {};

    if (!image) {
      return res.status(400).json({
        error: "No chart image was provided."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OpenAI API key is not configured."
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `
You are the chart-analysis engine for Trader Tracker OS.

Analyze ONLY information that is actually visible in the supplied TradingView screenshot.

Pair: ${pair || "Unknown"}
Timeframe: ${timeframe || "Unknown"}

Do not invent prices, indicators, levels, patterns, or market data.

Return JSON only using this structure:

{
  "decision": "SETUP | WAIT | NO_TRADE",
  "trend": "BULLISH | BEARISH | SIDEWAYS | UNCLEAR",
  "market_structure": "",
  "support": [],
  "resistance": [],
  "liquidity": [],
  "setup": "",
  "direction": "BUY | SELL | NONE",
  "entry": null,
  "stop_loss": null,
  "take_profit_1": null,
  "take_profit_2": null,
  "risk_reward": null,
  "reason": "",
  "invalidation": "",
  "data_quality": "GOOD | LIMITED | POOR",
  "missing_information": []
}

If the screenshot does not provide enough information for a responsible setup, use WAIT or NO_TRADE and leave unavailable numerical values as null.
                `
              },
              {
                type: "input_image",
                image_url: image
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenAI request failed."
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: "Server error.",
      details: error.message
    });
  }
}
