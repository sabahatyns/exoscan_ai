import React, { useEffect, useRef, useState } from "react";
import { Activity, Bot, Loader2 } from "lucide-react";
import { predictKepler, predictTess, predictBoth, askLLM } from "../Api/Api";

const MODEL_OPTIONS = [
  { value: "K", label: "Kepler" },
  { value: "T", label: "Tess" },
  { value: "B", label: "Both" },
];

// --- Field definitions ---
const KEPLER_FIELDS = {
  koi_period: 0,
  koi_duration: 0,
  koi_depth: 0,
  koi_ror: 0,
  koi_prad: 0,
  koi_incl: 0,
  koi_insol: 0,
  koi_dor: 0,
  koi_max_sngle_ev: 0,
  koi_max_mult_ev: 0,
  koi_model_snr: 0,
  koi_smet: 0,
  koi_fwm_stat_sig: 0,
  koi_dicco_msky: 0,
  koi_dikco_msky: 0,
};

const TESS_FIELDS = {
  ra: 0,
  dec: 0,
  st_pmra: 0,
  st_pmdec: 0,
  pl_tranmid: 0,
  pl_orbper: 0,
  pl_trandurh: 0,
  pl_trandep: 0,
  pl_rade: 0,
  pl_insol: 0,
  pl_eqt: 0,
  st_tmag: 0,
  st_dist: 0,
  st_teff: 0,
  st_logg: 0,
  st_rad: 0,
};

export default function Index() {
  const [model, setModel] = useState(MODEL_OPTIONS[0].value);
const [inputs, setInputs] = useState<Record<string, number>>({});
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
  }, [model]);

  // 🧩 input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  // 🧩 predict function
  const handlePredict = async () => {
    setLoading(true);
    try {
      let data;
      if (model === "K") data = await predictKepler(inputs);
      else if (model === "T") data = await predictTess(inputs);
      else if (model === "B") data = await predictBoth(inputs);

      setResult(data);
    } catch (error) {
      console.error("Prediction Error:", error);
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
                        type="number"
                        name={key}
                        value={inputs[key]}
                        onChange={handleChange}
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
