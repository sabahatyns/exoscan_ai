import React, { useEffect, useRef, useState } from "react";
import { Activity, Bot, Loader2 } from "lucide-react";
import { predictKepler, predictTess, predictBoth, askLLM } from "../Api/Api";
import keplerXGBoost from "./keppler_xgboost_confusion_matrix.png";
import keplerRF from "./keppler-rf-confusion-matrix.png";
import tessXGBoost from "./tess_xgboost_confusion_matrix.png";

const MODEL_OPTIONS = [
  { value: "K", label: "Kepler" },
  { value: "T", label: "Tess" },
  { value: "B", label: "Both" },
];

const MODEL_OPTIONS_2 = [
  { value: "K_XGB", label: "Kepler XGBoost" },
  { value: "K_RF", label: "Kepler Random Forest" },
  { value: "T_XGB", label: "Tess XGBoost" },
];
const KEPLER_FIELDS: Record<string, string> = {
  koi_period: "",
  koi_duration: "",
  koi_depth: "",
  koi_ror: "",
  koi_prad: "",
  koi_incl: "",
  koi_insol: "",
  koi_dor: "",
  koi_max_sngle_ev: "",
  koi_max_mult_ev: "",
  koi_model_snr: "",
  koi_smet: "",
  koi_fwm_stat_sig: "",
  koi_dicco_msky: "",
  koi_dikco_msky: "",
};

const TESS_FIELDS: Record<string, string> = {
  ra: "",
  dec: "",
  st_pmra: "",
  st_pmdec: "",
  pl_tranmid: "",
  pl_orbper: "",
  pl_trandurh: "",
  pl_trandep: "",
  pl_rade: "",
  pl_insol: "",
  pl_eqt: "",
  st_tmag: "",
  st_dist: "",
  st_teff: "",
  st_logg: "",
  st_rad: "",
};

export default function Index() {
  const [model, setModel] = useState(MODEL_OPTIONS[0].value);
  const [inputs, setInputs] = useState<Record<string, string>>({}); // store strings
  const [result, setResult] = useState(null);
  const [visualModel, setVisualModel] = useState(MODEL_OPTIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [analysisResponse, setAnalysisResponse] = useState(
    "Awaiting training run...",
  );
  const [analysisQuestion, setAnalysisQuestion] = useState("");
  // Add this at the top of your component
  const [llmResponse, setLLMResponse] = useState<LLMResponse | null>(null);

  // 🧩 when model changes, reset inputs accordingly
  useEffect(() => {
    if (model === "K") setInputs(KEPLER_FIELDS);
    else if (model === "T") setInputs(TESS_FIELDS);
    else if (model === "B") setInputs({ ...KEPLER_FIELDS, ...TESS_FIELDS });
    setResult(null);
    setErrorMessage("");
  }, [model]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value })); // keep typed value as string
  };

  const [errorMessage, setErrorMessage] = useState(""); // New state for error

  const handlePredict = async () => {
    setLoading(true);
    setErrorMessage(""); // Reset previous errors

    // Validate inputs
    const invalidFields = Object.entries(inputs).filter(
      ([_, value]) => isNaN(Number(value)) || value === "",
    );

    if (invalidFields.length > 0) {
      setLoading(false);
      setErrorMessage(`Invalid input in fields`);
      return;
    }

    // Convert to numbers
    const payload = Object.fromEntries(
      Object.entries(inputs).map(([k, v]) => [k, parseFloat(v)]),
    );

    try {
      let data;
      if (model === "K") data = await predictKepler(payload);
      else if (model === "T") data = await predictTess(payload);
      else if (model === "B") data = await predictBoth(payload);

      setResult(data);
    } catch (error) {
      console.error("Prediction Error:", error);
      setErrorMessage("Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Ask LLM function
  type LLMResponse = {
    model: string;
    features_used: Record<string, number | string>;
    prediction: string;
    confidence: number;
  };
  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!analysisQuestion.trim()) {
      alert("Type something in the field to get an answer");
      return;
    }

    try {
      const res = (await askLLM(analysisQuestion)) as unknown as LLMResponse;

      // Filter out features with zero/empty value
      const filteredFeatures: Record<string, number | string> = {};
      Object.entries(res.features_used).forEach(([key, value]) => {
        if (value !== 0 && value !== "" && value !== "0") {
          filteredFeatures[key] = value;
        }
      });

      const formattedResponse: LLMResponse = {
        model: res.model,
        features_used: filteredFeatures,
        prediction: res.prediction,
        confidence: res.confidence,
      };

      setLLMResponse(formattedResponse); // <-- set state here
      setAnalysisQuestion("");
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    }
  };

  const getImage = () => {
    switch (visualModel) {
      case "K_XGB":
        return keplerXGBoost;
      case "K_RF":
        return keplerRF;
      case "T_XGB":
        return tessXGBoost;
      default:
        return null;
    }
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 xl:px-12">
          <header className="flex flex-col gap-6 pb-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 lg:w-1/2">
              <h1
                className="text-6xl font-semibold tracking-tight text-foreground"
                style={{ color: "#09d4efff" }}
              >
                ExoScan AI
                <br />
                <span
                  className="text-4xl font-semibold"
                  style={{ color: "#FA47D9" }}
                >
                  Automated Exoplanet Discovery
                </span>
              </h1>
              <p className="text-xl text-foreground/70">
                Classify exoplanet candidates with clarity. Choose model and
                provide input data.
              </p>
            </div>
          </header>

          <main className="grid gap-10 lg:grid-cols-[2fr,1fr]">
            {/* Left Section */}
            <section className="space-y-8">
              <div className="rounded-3xl border border-primary/40 bg-card/70 p-8 shadow-neon">
                {/* Model Selector */}
                <div className="mb-6">
                  <label className="block text-sm mb-2 text-foreground/70">
                    Select Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-black text-white rounded-xl border border-secondary/60 bg-secondary/10 px-4 py-3 text-sm"
                  >
                    {MODEL_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Fields */}
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  {Object.keys(inputs).map((key) => (
                    <div key={key} className="flex flex-col">
                      <label className="text-xs text-foreground/60 mb-1">
                        {key}
                      </label>
                      <input
                        type="text" // allow numbers or strings
                        name={key}
                        value={inputs[key]}
                        onChange={handleChange}
                        placeholder="Type here"
                        className="rounded-lg border border-secondary/50 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-secondary/40 outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Predict Button */}
                <div className="mt-6">
                  <button
                    onClick={handlePredict}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-neon-gradient px-6 py-4 text-sm font-bold uppercase tracking-widest text-gray-900 shadow-neon"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Activity className="h-5 w-5" />
                    )}
                    <span>Predict</span>
                  </button>
                </div>

                {/* Result Display */}
                {result && (
                  <div className="mt-6 bg-secondary/10 p-4 rounded-xl">
                    <h3 className="font-semibold mb-2 text-secondary">
                      Result:
                    </h3>
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(result.prediction, null, 2)}
                    </pre>
                  </div>
                )}
                {errorMessage && (
                  <div className="mb-4 text-red-500 text-sm font-medium">
                    {errorMessage}
                  </div>
                )}
              </div>
            </section>

            {/* Right Section */}
            <aside className="space-y-8">
              <div className="rounded-3xl border border-secondary/40 bg-card/70 p-7 shadow-neon">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-secondary">
                    AI Analyst
                  </h2>
                  <Bot className="h-5 w-5 text-secondary" />
                </div>

                <div className="mt-5 grid gap-5 no-scrollbar">
                  <div className="h-80 overflow-y-auto no-scrollbar rounded-2xl border border-secondary/40 bg-black/30 px-5 py-4 text-sm leading-relaxed text-secondary/80 shadow-inner">
                    {llmResponse ? (
                      <>
                        <p>
                          <strong>Model:</strong> {llmResponse.model}
                        </p>

                        {llmResponse.features_used &&
                          Object.keys(llmResponse.features_used).length > 0 && (
                            <>
                              <p className="mt-2">
                                <strong>Features Used:</strong>
                              </p>
                              <ul className="ml-4 list-disc">
                                {Object.entries(llmResponse.features_used)
                                  .filter(
                                    ([_, value]) =>
                                      value !== 0 &&
                                      value !== "" &&
                                      value !== "0",
                                  )
                                  .map(([key, value]) => (
                                    <li key={key}>
                                      {key}: {value}
                                    </li>
                                  ))}
                              </ul>
                            </>
                          )}

                        <p className="mt-2">
                          <strong>Prediction:</strong> {llmResponse.prediction}
                        </p>
                        <p>
                          <strong>Confidence:</strong> {llmResponse.confidence}
                        </p>
                      </>
                    ) : (
                      <p>{analysisResponse}</p> // fallback message like "Awaiting input..."
                    )}
                  </div>

                  <form onSubmit={handleAsk} className="space-y-3">
                    <textarea
                      value={analysisQuestion}
                      onChange={(e) => setAnalysisQuestion(e.target.value)}
                      rows={3}
                      placeholder={`e.g., Model: kepler, Features: koi_period=12.5, koi_depth=3.2`}
                      className="w-full resize-none rounded-2xl border border-secondary/50 bg-secondary/10 px-4 py-3 text-sm text-secondary outline-none focus:ring-2 focus:ring-secondary/60"
                    />
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-xs font-bold uppercase tracking-widest text-secondary-foreground hover:opacity-90"
                    >
                      Ask
                    </button>
                  </form>
                </div>
              </div>
            </aside>
          </main>
        </div>
      </div>

      {/* ---------- Model Visualization Section ---------- */}
       <section className="mt-16 rounded-3xl border border-primary/40 bg-card/70 p-8 shadow-neon">
      <h2 className="text-2xl font-semibold text-foreground mb-4">
        Model Visualization
      </h2>

      {/* Model selector */}
      <div className="mb-6">
        <label className="block text-sm mb-2 text-foreground/70">
          Select Model
        </label>
        <select
          value={visualModel}
          onChange={(e) => setVisualModel(e.target.value)}
          className="w-full bg-black text-white rounded-xl border border-secondary/60 bg-secondary/10 px-4 py-3 text-sm"
        >
          {MODEL_OPTIONS_2.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Image display */}
   <div className="w-full h-64 flex items-center justify-center border border-secondary/50 rounded-xl bg-black/20 p-4">
  <img src={getImage()} alt="Selected Model" className="max-h-full object-contain" />
</div>

    </section>
    </div>
  );
}
