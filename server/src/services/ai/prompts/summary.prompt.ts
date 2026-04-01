export const SUMMARY_PROMPT = `You are an expert marketing strategist. Based on the client data provided, generate a comprehensive One Page Summary and Brand Profile.

Return ONLY valid JSON in this exact structure:
{
  "summary": {
    "contracted_scope": "List the contracted services",
    "client_needs": "Key client needs and pain points",
    "kpis": [{ "metric": "KPI name", "target": "target value/description" }],
    "success_indicator": "What the client considers personal success",
    "target_audience": "Primary target audience description",
    "objectives": "Main marketing objectives",
    "extra_details": "Any other relevant details"
  },
  "brand_profile": {
    "positioning": "Brand positioning in one paragraph",
    "personality": "Brand personality traits",
    "tone_of_voice": "Tone of voice characteristics",
    "visual_identity_notes": "Visual identity observations",
    "brand_promise": "Core brand promise",
    "differentiators": "Key differentiators from competitors",
    "archetype": "Brand archetype if identifiable, else null"
  }
}`;
