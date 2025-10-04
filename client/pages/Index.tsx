import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Activity,
  Bot,
  Gauge,
  LineChart,
  Loader2,
  Rocket,
  Target,
  UploadCloud,
} from "lucide-react";

const MODEL_OPTIONS = [
  { value: "RF", label: "Random Forest" },
  { value: "DNN", label: "Deep Neural Network" },
  { value: "SVM", label: "Support Vector Machine" },
];

const formatBytes = (bytes: number) => {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
};

const formatMetricValue = (value: number | null) => {
  if (value === null) return "—";
  return `${value.toFixed(2)}%`;
};

const formatRecords = (count: number) => count.toLocaleString();

export default function Index() {
  const [recordCount, setRecordCount] = useState(0);
  const [datasetName, setDatasetName] = useState("No dataset loaded");
  const [datasetSize, setDatasetSize] = useState(0);
  const [model, setModel] = useState(MODEL_OPTIONS[0].value);
  const [epochs, setEpochs] = useState(48);
  const [learningRate, setLearningRate] = useState(0.001);
  const [testSplit, setTestSplit] = useState(20);
  const [isTraining, setIsTraining] = useState(false);
  const [metrics, setMetrics] = useState({
    accuracy: null as number | null,
    precision: null as number | null,
    recall: null as number | null,
  });
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);
  const [analysisResponse, setAnalysisResponse] = useState(
    "Awaiting training run. Upload telemetry and launch classification to generate insights."
  );
  const [analysisQuestion, setAnalysisQuestion] = useState("");

  const timeouts = useRef<number[]>([]);

  const clearQueued = () => {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    timeouts.current = [];
  };

  const queueTimeout = (fn: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      fn();
      timeouts.current = timeouts.current.filter((id) => id !== timeoutId);
    }, delay);

    timeouts.current.push(timeoutId);
  };

  useEffect(() => () => clearQueued(), []);

  const appendLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setLogEntries((prev) => {
      const next = [...prev, `[${timestamp}] ${message}`];
      return next.slice(-30);
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setDatasetName(file.name);
    setDatasetSize(file.size);

    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      const hasHeader = lines.length > 1;
      const rows = hasHeader ? lines.length - 1 : lines.length;
      setRecordCount(rows);
      appendLog(`Ingested ${formatRecords(rows)} telemetry records from ${file.name}.`);
    } catch (error) {
      console.error("Failed to read dataset", error);
      appendLog("Dataset parsing failed. Please verify file encoding.");
    }
  };

  const handleAsk = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = analysisQuestion.trim();
    if (!question) return;

    const modelLabel = MODEL_OPTIONS.find((option) => option.value === model)?.label ??
      "Selected Model";

    if (metrics.accuracy === null) {
      setAnalysisResponse(
        `${modelLabel} has not been trained yet. Launch a training run to generate analytical insights.`
      );
    } else {
      setAnalysisResponse(
        `${modelLabel} is performing at ${formatMetricValue(
          metrics.accuracy
        )} accuracy with ${formatMetricValue(metrics.precision)} precision and ${formatMetricValue(
          metrics.recall
        )} recall. Based on ${formatRecords(
          recordCount || 0
        )} records, focus should shift toward improving signal-to-noise handling in the next epoch sweep.`
      );
    }

    setAnalysisQuestion("");
    appendLog(`Analyst query received: "${question}"`);
  };

  const startTraining = () => {
    if (isTraining) return;
    clearQueued();

    const modelLabel = MODEL_OPTIONS.find((option) => option.value === model)?.label ??
      "Selected Model";

    setIsTraining(true);
    setLogEntries([]);
    appendLog(`Initializing ${modelLabel} pipeline (epochs: ${epochs}, lr: ${learningRate}).`);

    if (recordCount === 0) {
      appendLog("No dataset detected. Using synthetic Kepler calibration set.");
    }

    const intermediateMetrics = [
      { delay: 700, accuracy: 48.6, precision: 42.1, recall: 51.4 },
      { delay: 1500, accuracy: 73.2, precision: 70.8, recall: 68.9 },
      { delay: 2300, accuracy: 88.4, precision: 84.6, recall: 82.1 },
    ];

    const finalMetrics = {
      accuracy: 92 + Math.random() * 4,
      precision: 89 + Math.random() * 5,
      recall: 87 + Math.random() * 5,
    };

    const trainingSteps = [
      { delay: 400, message: "Streaming stellar flux differentials..." },
      { delay: 1100, message: "Computing transit features and detrending stellar noise..." },
      { delay: 1750, message: `Calibrating split ratio at ${testSplit}% holdout.` },
      { delay: 2600, message: "Running ensemble voting across architectures..." },
      { delay: 3400, message: "Evaluating holdout set and generating confidence bands..." },
      { delay: 4100, message: "Training complete. Emitting classification artifacts." },
    ];

    intermediateMetrics.forEach((entry) => {
      queueTimeout(() => {
        setMetrics(entry);
        appendLog("Epoch milestone reached. Metrics updated.");
      }, entry.delay);
    });

    trainingSteps.forEach((step) => {
      queueTimeout(() => appendLog(step.message), step.delay);
    });

    queueTimeout(() => {
      setMetrics(finalMetrics);
      setIsTraining(false);
      setLastRunAt(new Date());
      appendLog("Model convergence achieved. Predictions ready for review.");

      const response = `ExoScan confirms anomaly-rich cadence: accuracy ${formatMetricValue(
        finalMetrics.accuracy
      )}, precision ${formatMetricValue(finalMetrics.precision)}, recall ${formatMetricValue(
        finalMetrics.recall
      )}. Signal profile suggests ${modelLabel.toLowerCase()} will generalize well on new Kepler-like sectors.`;
      setAnalysisResponse(response);
    }, 4600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute inset-0 bg-neon-grid" />
          <div className="absolute -top-48 -left-32 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-secondary/35 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 xl:px-12">
          <header className="flex flex-col gap-6 pb-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                ExoScan AI: Automated Exoplanet Discovery
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-foreground/70 sm:text-base">
                Responsive mission control for classifying exoplanet candidates with neon-infused clarity. Upload stellar telemetry, tune hyperparameters, and deploy rapid classifications powered by ExoScan AI.
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-primary/40 bg-card/70 px-5 py-4 shadow-neon">
              <div className="grid place-items-center rounded-full bg-primary/20 p-3 text-primary">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                {/* <p className="text-xs uppercase tracking-wide text-foreground/60">Mission Status</p>
                <p className="text-lg font-semibold text-primary">Ready for launch</p> */}
              </div>
            </div>
          </header>

          <main className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section className="space-y-8">
              <div className="rounded-3xl border border-primary/40 bg-card/70 p-8 shadow-neon">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold text-primary">Data Intake</h2>
                    <label
                      htmlFor="dataset-upload"
                      className="group relative flex h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-5 text-center transition hover:border-primary/70 hover:bg-primary/10"
                    >
                      <UploadCloud className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                          Upload Telemetry (CSV, JSON)
                        </p>
                        <p className="text-xs text-foreground/60">Drop raw light curves or click to browse</p>
                      </div>
                      <span className="text-xs font-medium uppercase tracking-widest text-primary">Data Loaded: {formatRecords(recordCount)} records</span>
                      <input
                        id="dataset-upload"
                        type="file"
                        accept=".csv,.json,.txt"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground/70">
                      <p className="font-medium text-primary">Active Dataset</p>
                      <p className="truncate text-foreground/80">{datasetName}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-foreground/60">
                        <span>Size: {formatBytes(datasetSize)}</span>
                        <span>Records: {formatRecords(recordCount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                      <label htmlFor="model" className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                        Model Architecture
                      </label>
                      <div className="relative">
                        <select
                          id="model"
                          value={model}
                          onChange={(event) => setModel(event.target.value)}
                          className="w-full appearance-none rounded-xl border border-secondary/60 bg-secondary/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-secondary outline-none backdrop-blur transition focus:border-secondary focus:ring-2 focus:ring-secondary/60"
                        >
                          {MODEL_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value} className="bg-card text-foreground">
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-secondary/80">
                          ▾
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-foreground/60">
                          <span>Epochs</span>
                          <span className="text-secondary">{epochs}</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={100}
                          value={epochs}
                          onChange={(event) => setEpochs(Number(event.target.value))}
                          className="mt-3 w-full accent-secondary"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-foreground/60">
                          <span>Learning Rate</span>
                          <span className="text-secondary">{learningRate}</span>
                        </div>
                        <input
                          type="number"
                          step={0.0005}
                          min={0.0005}
                          max={1}
                          value={learningRate}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setLearningRate((previous) => (Number.isFinite(value) ? value : previous));
                          }}
                          className="mt-3 w-full rounded-xl border border-secondary/60 bg-secondary/5 px-4 py-3 text-sm font-semibold tracking-[0.3em] text-secondary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/60"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-foreground/60">
                          <span>Test Split Ratio</span>
                          <span className="text-secondary">{testSplit}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={50}
                          value={testSplit}
                          onChange={(event) => setTestSplit(Number(event.target.value))}
                          className="mt-3 w-full accent-secondary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={startTraining}
                    disabled={isTraining}
                    className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-neon-gradient px-6 py-4 text-sm font-bold uppercase tracking-[0.4em] text-gray-900 shadow-neon transition hover:shadow-lg hover:shadow-secondary/30 disabled:cursor-not-allowed disabled:opacity-80"
                  >
                    {isTraining ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Activity className="h-5 w-5" />
                    )}
                    <span>Start Training &amp; Classify</span>
                  </button>
                </div>
              </div>

              <div className="grid gap-8 rounded-3xl border border-secondary/40 bg-card/70 p-8 shadow-neon-inset lg:grid-cols-2">
                <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">Signal Plot</p>
                    <LineChart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-6 h-48 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10" />
                  <p className="mt-4 text-[0.7rem] uppercase tracking-[0.3em] text-foreground/50">
                    Orbit Feature Space (placeholder)
                  </p>
                </div>
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-secondary">Live Training Log</h3>
                    <p className="text-xs uppercase tracking-[0.35em] text-foreground/50">Real-time pipeline telemetry</p>
                  </div>
                  <div className="flex-1 overflow-hidden rounded-2xl border border-secondary/50 bg-secondary/10">
                    <div className="h-48 overflow-y-auto bg-black/40 px-5 py-4 font-mono text-xs leading-relaxed text-emerald-400 shadow-inner">
                      {logEntries.length === 0 ? (
                        <p className="text-emerald-400/70">Awaiting training events...</p>
                      ) : (
                        logEntries.map((entry, index) => <p key={index}>{entry}</p>)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-8">
              <div className="rounded-3xl border border-primary/40 bg-card/70 p-7 shadow-neon">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-primary">Performance Metrics</h2>
                  <Gauge className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-6 grid gap-4">
                  <MetricCard label="Accuracy" value={formatMetricValue(metrics.accuracy)} icon={<Target className="h-5 w-5" />} />
                  <MetricCard label="Precision" value={formatMetricValue(metrics.precision)} icon={<Activity className="h-5 w-5" />} />
                  <MetricCard label="Recall" value={formatMetricValue(metrics.recall)} icon={<Gauge className="h-5 w-5" />} />
                </div>
                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs uppercase tracking-[0.35em] text-foreground/50">
                  {lastRunAt ? (
                    <div className="space-y-1 text-[0.7rem]">
                      <p>Last Sync: {lastRunAt.toLocaleString()}</p>
                      <p>Dataset Footprint: {formatBytes(datasetSize)}</p>
                    </div>
                  ) : (
                    <p>Awaiting first training cycle</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-secondary/40 bg-card/70 p-7 shadow-neon">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-secondary">AI Analyst</h2>
                  <Bot className="h-5 w-5 text-secondary" />
                </div>
                <div className="mt-5 grid gap-5">
                  <div className="h-40 overflow-y-auto rounded-2xl border border-secondary/40 bg-black/30 px-5 py-4 text-sm leading-relaxed text-secondary/80 shadow-inner">
                    {analysisResponse}
                  </div>
                  <form onSubmit={handleAsk} className="space-y-3">
                    <label htmlFor="analyst-question" className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">
                      Ask ExoScan
                    </label>
                    <textarea
                      id="analyst-question"
                      value={analysisQuestion}
                      onChange={(event) => setAnalysisQuestion(event.target.value)}
                      rows={3}
                      placeholder="e.g., How confident is the model about TRAPPIST-1e?"
                      className="w-full resize-none rounded-2xl border border-secondary/50 bg-secondary/10 px-4 py-3 text-sm text-secondary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/60"
                    />
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-secondary/60 bg-secondary px-4 py-3 text-xs font-bold uppercase tracking-[0.4em] text-secondary-foreground transition hover:border-secondary"
                    >
                      <span>Ask</span>
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

type MetricCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
};

const MetricCard = ({ label, value, icon }: MetricCardProps) => (
  <div className="flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 px-4 py-5 text-primary">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
    </div>
    <div className="rounded-full border border-primary/40 bg-primary/10 p-3 text-primary">{icon}</div>
  </div>
);
