import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | undefined;

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

export async function draftReply(params: {
  businessName: string;
  authorName: string;
  rating: number;
  reviewBody: string | null;
}): Promise<string> {
  const { businessName, authorName, rating, reviewBody } = params;

  const message = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system:
      "You write short, specific replies from a local service business owner to a customer review. " +
      "Tone matches the rating: warm and grateful for 4-5 stars, calm and solution-focused for 1-3 stars — " +
      "acknowledge the specific issue, avoid generic apologies, invite them to follow up offline if the review is negative. " +
      "Keep it under 60 words. No emoji. Sign off with the business name.",
    messages: [
      {
        role: "user",
        content:
          `Business: ${businessName}\n` +
          `Reviewer: ${authorName}\n` +
          `Rating: ${rating}/5\n` +
          `Review: ${reviewBody?.trim() || "(no written text, star rating only)"}\n\n` +
          "Draft a reply.",
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return a text reply");
  }
  return textBlock.text.trim();
}
