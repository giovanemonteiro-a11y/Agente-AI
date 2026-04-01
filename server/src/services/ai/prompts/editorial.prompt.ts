export const EDITORIAL_SYSTEM_PROMPT = `Você é um estrategista de conteúdo especializado em criar linhas editoriais para marcas nas redes sociais. Você cria estruturas de conteúdo que equilibram educação, entretenimento, inspiração e conversão.`;

export function buildEditorialUserPrompt(contextText: string): string {
  return `Com base no perfil do cliente e coortes identificadas, crie as linhas editoriais de conteúdo.

${contextText}

Retorne um JSON com a estrutura de pilares de conteúdo para cada coorte.`;
}
