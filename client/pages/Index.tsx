import React, { useEffect, useRef, useState } from "react";
import { Activity, Bot, Loader2 } from "lucide-react";
import { predictKepler, predictTess, predictBoth, askLLM } from "../Api/Api";

const MODEL_OPTIONS = [
  { value: "K", label: "Kepler" },
  { value: "T", label: "Tess" },
  { value: "B", label: "Both" },
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
  const [loading, setLoading] = useState(false);
  const [analysisResponse, setAnalysisResponse] = useState(
    "Awaiting training run. Upload telemetry and launch classification to generate insights.",
  );
  const [analysisQuestion, setAnalysisQuestion] = useState("");

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
  const handleAsk = async (e) => {
    e.preventDefault();
    if (!analysisQuestion.trim()) return;

    const res = await askLLM(analysisQuestion);
    setAnalysisResponse(JSON.stringify(res, null, 2));
    setAnalysisQuestion("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 xl:px-12">
          <header className="flex flex-col gap-6 pb-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                ExoScan AI: Automated Exoplanet Discovery
              </h1>
              <p className="max-w-2xl text-sm text-foreground/70">
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

                <div className="mt-5 grid gap-5">
                  <div className="h-40 overflow-y-auto rounded-2xl border border-secondary/40 bg-black/30 px-5 py-4 text-sm leading-relaxed text-secondary/80 shadow-inner">
                    {analysisResponse}
                  </div>

                  <form onSubmit={handleAsk} className="space-y-3">
                    <textarea
                      value={analysisQuestion}
                      onChange={(e) => setAnalysisQuestion(e.target.value)}
                      rows={3}
                      placeholder="e.g., How confident is the model about TRAPPIST-1e?"
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
    </div>
  );
}
