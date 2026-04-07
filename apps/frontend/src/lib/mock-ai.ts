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
    return "Não foi possível gerar o resumo: nenhuma transcrição ou nota disponível para esta sessão.";
  }

  // Generate a contextual summary based on available content
  const clientMessages = transcript.filter((t) => t.speaker === "client");
  const themes = extractThemes(notes, clientMessages);

  return `RESUMO DA SESSÃO

Temas Principais Discutidos:
${themes.map((t) => `• ${t}`).join("\n")}

Observações Clínicas:
${hasNotes ? summarizeNotes(notes) : "Nenhuma nota clínica registrada para esta sessão."}

Apresentação do Paciente:
${hasTranscript ? summarizeTranscript(clientMessages) : "Nenhuma transcrição disponível para análise detalhada."}

Acompanhamento Recomendado:
• Continuar monitorando o progresso nos temas identificados
• Revisar as estratégias de enfrentamento discutidas na sessão
• Agendar próxima consulta dentro do prazo recomendado`;
}

function extractThemes(notes: string, clientMessages: TranscriptEntry[]): string[] {
  const themes: string[] = [];

  // Look for common therapy themes in the content
  const content = (notes + " " + clientMessages.map((m) => m.content).join(" ")).toLowerCase();

  if (content.includes("anxiety") || content.includes("anxious") || content.includes("worry")) {
    themes.push("Gerenciamento de ansiedade e estratégias de enfrentamento");
  }
  if (
    content.includes("work") ||
    content.includes("office") ||
    content.includes("job") ||
    content.includes("manager")
  ) {
    themes.push("Estresse no trabalho e limites profissionais");
  }
  if (content.includes("sensory") || content.includes("noise") || content.includes("overwhelm")) {
    themes.push("Processamento sensorial e adaptação ao ambiente");
  }
  if (
    content.includes("breath") ||
    content.includes("chest") ||
    content.includes("somatic") ||
    content.includes("physical")
  ) {
    themes.push("Sintomas somáticos e consciência corporal");
  }
  if (
    content.includes("relationship") ||
    content.includes("family") ||
    content.includes("partner")
  ) {
    themes.push("Relacionamentos interpessoais e comunicação");
  }

  if (themes.length === 0) {
    themes.push("Exploração terapêutica geral");
    themes.push("Avaliação contínua e construção de vínculo");
  }

  return themes.slice(0, 4);
}

function summarizeNotes(notes: string): string {
  // Take first meaningful paragraph or sentence
  const sentences = notes.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  if (sentences.length > 0) {
    return sentences[0].trim() + ".";
  }
  return "Observações clínicas documentadas nas notas da sessão.";
}

function summarizeTranscript(clientMessages: TranscriptEntry[]): string {
  if (clientMessages.length === 0) {
    return "Participação verbal limitada registrada.";
  }

  if (clientMessages.length >= 3) {
    return "O paciente participou ativamente do diálogo da sessão, demonstrando disposição para explorar as questões apresentadas. As respostas verbais indicaram processamento emocional e desenvolvimento de autoconhecimento.";
  }

  return "O paciente participou da sessão com engajamento moderado.";
}
