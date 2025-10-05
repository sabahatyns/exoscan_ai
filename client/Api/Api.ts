// src/api/api.js

const BASE_URL = "http://127.0.0.1:8000"; // your FastAPI backend URL

// Helper function for making POST requests
async function postRequest(endpoint, data) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// --- Kepler Prediction ---
export async function predictKepler(formData) {
  return await postRequest("/predict/kepler", formData);
}

// --- TESS Prediction ---
export async function predictTess(formData) {
  return await postRequest("/predict/tess", formData);
}

// --- Combined Prediction ---
export async function predictBoth(formData) {
  return await postRequest("/predict/both", formData);
}

// --- LLM Ask Endpoint ---
export async function askLLM(query) {
  return await postRequest("/ask", { query });
}
