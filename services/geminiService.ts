
import { GoogleGenAI, Type } from "@google/genai";
import { InspectionAlert } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeIrregularities = async (
  totalBuildings: number,
  irregularities: InspectionAlert[],
  artesianWellsCount: number
) => {
  
  const investigatingCount = irregularities.filter(i => i.status === 'investigating').length;
  const openCount = irregularities.filter(i => i.status === 'open').length;

  const prompt = `
    Aja como um Diretor de Operações de uma concessionária de águas em Cuiabá (NotCat System).
    
    DADOS DO CENÁRIO:
    - Total de Imóveis Mapeados: ${totalBuildings}
    - Irregularidades (Gatos) Detectados: ${irregularities.length}
    - Em Investigação de Campo: ${investigatingCount}
    - Pendentes de Ação: ${openCount}
    - Poços Artesianos Legais: ${artesianWellsCount}
    
    OBJETIVO:
    Gerar um relatório executivo tático. O foco é a eficiência das equipes de campo e regularização.
    Se houver muitas irregularidades, sugira "Blitz em Bairros". Se houver poucos, sugira "Inspeção Cirúrgica".
    
    FORMATO JSON OBRIGATÓRIO:
    - summary: Resumo executivo (max 200 caracteres).
    - recommendations: Lista de 3 ações táticas para a equipe de campo.
    - riskLevel: "Crítico", "Alto", "Moderado" ou "Baixo".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            riskLevel: { type: Type.STRING }
          },
          required: ["summary", "recommendations", "riskLevel"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      summary: "Sistema de IA temporariamente indisponível para análise estratégica.",
      recommendations: ["Proceder com protocolo padrão de varredura.", "Verificar integridade dos dados."],
      riskLevel: "Indeterminado"
    };
  }
};
