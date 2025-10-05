// src/api/api.ts

const BASE_URL = "http://127.0.0.1:8000"; // your FastAPI backend URL

// 🧩 Define generic types for request/response data
type JsonData = Record<string, any>;

// Helper function for making POST requests
async function postRequest<T>(endpoint: string, data: JsonData): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// 🧠 Optional: define expected backend response types
interface PredictionResponse {
  model: string;
  prediction: string;
  confidence: number;
}

interface LLMResponse {
  answer: string;
}

// --- Kepler Prediction ---
export async function predictKepler(formData: JsonData): Promise<PredictionResponse> {
  return await postRequest<PredictionResponse>("/predict/kepler", formData);
}

// --- TESS Prediction ---
export async function predictTess(formData: JsonData): Promise<PredictionResponse> {
  return await postRequest<PredictionResponse>("/predict/tess", formData);
}

// --- Combined Prediction ---
export async function predictBoth(formData: JsonData): Promise<PredictionResponse> {
  return await postRequest<PredictionResponse>("/predict/both", formData);
}

// --- LLM Ask Endpoint ---
export async function askLLM(query: string): Promise<LLMResponse> {
  return await postRequest<LLMResponse>("/ask", { query });
}
