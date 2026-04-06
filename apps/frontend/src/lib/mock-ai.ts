import type { TranscriptEntry } from "./types/therapy";

export async function generateSummary(
  transcript: TranscriptEntry[],
  notes: string,
): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Extract some content for a realistic-feeling summary
  const hasTranscript = transcript.length > 0;
  const hasNotes = notes.trim().length > 0;

  if (!hasTranscript && !hasNotes) {
    return "Unable to generate summary: No transcript or notes available for this session.";
  }

  // Generate a contextual summary based on available content
  const clientMessages = transcript.filter((t) => t.speaker === "client");
  const themes = extractThemes(notes, clientMessages);

  return `SESSION SUMMARY

Key Themes Discussed:
${themes.map((t) => `• ${t}`).join("\n")}

Clinical Observations:
${hasNotes ? summarizeNotes(notes) : "No clinical notes recorded for this session."}

Patient Presentation:
${hasTranscript ? summarizeTranscript(clientMessages) : "No transcript available for detailed analysis."}

Recommended Follow-up:
• Continue monitoring progress on identified themes
• Review coping strategies discussed in session
• Schedule next appointment within recommended timeframe`;
}

function extractThemes(notes: string, clientMessages: TranscriptEntry[]): string[] {
  const themes: string[] = [];

  // Look for common therapy themes in the content
  const content = (notes + " " + clientMessages.map((m) => m.content).join(" ")).toLowerCase();

  if (content.includes("anxiety") || content.includes("anxious") || content.includes("worry")) {
    themes.push("Anxiety management and coping strategies");
  }
  if (
    content.includes("work") ||
    content.includes("office") ||
    content.includes("job") ||
    content.includes("manager")
  ) {
    themes.push("Workplace stress and professional boundaries");
  }
  if (content.includes("sensory") || content.includes("noise") || content.includes("overwhelm")) {
    themes.push("Sensory processing and environmental adaptation");
  }
  if (
    content.includes("breath") ||
    content.includes("chest") ||
    content.includes("somatic") ||
    content.includes("physical")
  ) {
    themes.push("Somatic symptoms and body awareness");
  }
  if (
    content.includes("relationship") ||
    content.includes("family") ||
    content.includes("partner")
  ) {
    themes.push("Interpersonal relationships and communication");
  }

  if (themes.length === 0) {
    themes.push("General therapeutic exploration");
    themes.push("Continued assessment and rapport building");
  }

  return themes.slice(0, 4);
}

function summarizeNotes(notes: string): string {
  // Take first meaningful paragraph or sentence
  const sentences = notes.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  if (sentences.length > 0) {
    return sentences[0].trim() + ".";
  }
  return "Clinical observations documented in session notes.";
}

function summarizeTranscript(clientMessages: TranscriptEntry[]): string {
  if (clientMessages.length === 0) {
    return "Limited verbal participation recorded.";
  }

  if (clientMessages.length >= 3) {
    return "Patient engaged actively in session dialogue, demonstrating willingness to explore presenting concerns. Verbal responses indicated emotional processing and insight development.";
  }

  return "Patient participated in session with moderate engagement.";
}
