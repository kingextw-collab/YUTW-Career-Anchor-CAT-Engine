import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ClipboardCheck, Timer, AlertCircle, BarChart3, RefreshCw, Trophy } from "lucide-react";
import { getNextQuestion } from "./services/geminiService";
import { CATResponse, ANCHOR_MAP, ThetaScores } from "./types";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { cn } from "./lib/utils";

export default function App() {
  const [step, setStep] = useState<"welcome" | "testing" | "loading" | "results">("welcome");
  const [currentResponse, setCurrentResponse] = useState<CATResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const startTest = async () => {
    setStep("loading");
    try {
      const response = await getNextQuestion([]);
      setCurrentResponse(response);
      setHistory([{ role: "user", parts: [{ text: "請開始執行「職涯錨定適性測驗」。請先提供第一道 I/O 校正題 (Q01)。" }] }, { role: "model", parts: [{ text: JSON.stringify(response) }] }]);
      setStep("testing");
      setStartTime(Date.now());
    } catch (err: any) {
      console.error("Diagnostic start error:", err);
      setError(`無法啟動測驗：${err.message || "請檢查 API 金鑰或網路連線。"}`);
      setStep("welcome");
    }
  };

  const handleAnswer = async (score: number) => {
    const latency = (Date.now() - startTime) / 1000;
    setStep("loading");
    try {
      const nextResponse = await getNextQuestion(history, { score, latency });
      
      if (nextResponse.is_finished) {
        setCurrentResponse(nextResponse);
        setStep("results");
      } else {
        setCurrentResponse(nextResponse);
        const newHistory = [
          ...history,
          { role: "user", parts: [{ text: `Score: ${score}, Latency: ${latency}` }] },
          { role: "model", parts: [{ text: JSON.stringify(nextResponse) }] }
        ];
        setHistory(newHistory);
        setStep("testing");
        setStartTime(Date.now());
      }
    } catch (err: any) {
      console.error("Answer submission error:", err);
      setError(`通訊發生錯誤：${err.message || "正在重試..."}`);
      setStep("testing"); 
    }
  };

  const restart = () => {
    setStep("welcome");
    setCurrentResponse(null);
    setHistory([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header Section */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 w-8 h-8 rounded flex items-center justify-center text-white font-bold">A</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">Career Anchor CAT Engine</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Version 2.4 • Dynamic Adaptation Active</p>
          </div>
        </div>
        <div className="hidden sm:flex gap-6">
          <div className="text-right">
            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Analysis Status</p>
            <p className="text-sm font-semibold text-indigo-600">
              {step === "results" ? "Final Convergence" : currentResponse?.current_state.analysis_tag || "Standby"}
            </p>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div className="text-right">
            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">System Engine</p>
            <p className="text-sm font-semibold text-emerald-600 uppercase flex items-center gap-1.5 justify-end">
              <span className={cn("w-2 h-2 rounded-full", step === "loading" ? "bg-amber-500 animate-pulse" : "bg-emerald-500")}></span>
              {step === "loading" ? "Processing" : "Calibrated"}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-slate-50">
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center"
            >
              <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 mb-8">
                <ClipboardCheck size={40} />
              </div>
              <div className="text-center space-y-6 mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 font-sans">
                  職涯錨定適性診斷
                </h2>
                <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
                  基於 Schein 職涯錨定理論，結合 AI 動態適性演算法 (Computerized Adaptive Testing)，為您精準定位核心職涯發展價值。
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 mb-8 w-full max-w-md">
                  <AlertCircle size={20} />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-12">
                {[
                  { icon: <Timer />, title: "反應時耗監測", desc: "偵測作答猶豫度，校正社會期許偏誤。" },
                  { icon: <RefreshCw />, title: "動態適性出題", desc: "隨表現即時調整題庫，長度動態收斂。" },
                  { icon: <BarChart3 />, title: "隱性衝突探測", desc: "透過衝突矩陣題型，挖掘真實價值取捨。" }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-indigo-600 mb-3">{item.icon}</div>
                    <h3 className="font-bold text-slate-800 mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <button
                id="start-button"
                onClick={startTest}
                className="group relative inline-flex items-center gap-2 bg-slate-900 px-10 py-4 rounded-xl text-white font-bold text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
              >
                開始測驗 START DIAGNOSTIC
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {(step === "testing" || step === "loading") && currentResponse && (
            <motion.div
              key="testing-layout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-[1240px] mx-auto p-6 flex flex-col md:flex-row gap-6 h-full"
            >
              {/* Left Column: Diagnostic Interface */}
              <div className="flex-[1.8] flex flex-col">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 flex-1 flex flex-col relative overflow-hidden">
                  {step === "loading" && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
                      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest animate-pulse">Computing Theta...</p>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-12">
                    <div className="bg-slate-100 px-3 py-1 rounded text-[10px] font-mono font-bold text-slate-500 tracking-wider">
                      QUESTION ID: {currentResponse.question_id}
                    </div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                      Questions Active: <span className="text-slate-700">{currentResponse.current_state.questions_completed + 1}</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <h2 className="text-2xl md:text-3xl font-medium leading-relaxed text-slate-800 mb-12">
                      {currentResponse.question_text}
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleAnswer(score)}
                          className="h-24 border-2 border-slate-100 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-2 group shadow-sm bg-white"
                        >
                          <span className="text-xl font-black text-slate-400 group-hover:text-indigo-600">{score}</span>
                          <span className="text-[9px] uppercase font-bold text-slate-400 group-hover:text-indigo-500 tracking-tighter">
                            {score === 1 ? "非常不符" : score === 6 ? "非常符合" : (score <= 3 ? "不符合" : "符合")}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-32 sm:w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, ((currentResponse.current_state.questions_completed + 1) / 24) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">PROG: {currentResponse.current_state.questions_completed + 1} / 24 MAX</span>
                    </div>
                    <p className="hidden sm:block text-[10px] uppercase font-bold text-slate-400 italic">
                      * System records latency offset for bias correction
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Dashboard */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">
                    Theta Distribution (θ)
                  </h3>
                  <div className="space-y-4 flex-1">
                    {Object.entries(currentResponse.current_state.theta_scores)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([key, val]) => (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-700">{key} ({ANCHOR_MAP[key as keyof ThetaScores].name.split("(")[0].trim()})</span>
                            <span className={cn((val as number) >= 0 ? "text-indigo-600" : "text-rose-500")}>
                                {(val as number) >= 0 ? "+" : ""}{(val as number).toFixed(2)}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                            <div 
                              className={cn("h-full transition-all duration-700", (val as number) >= 0 ? "bg-indigo-500" : "bg-rose-400")}
                              style={{ width: `${Math.min(100, Math.max(5, (Math.abs(val as number) / 5) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-50 text-center">
                    <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter italic">Values update in real-time based on W_rt weighting</p>
                  </div>
                </div>

                {/* Metrics Console */}
                <div className="bg-slate-900 rounded-xl shadow-xl p-6 text-white flex flex-col gap-5">
                  <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                    Engine Metrics Console
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">T_io Constant</p>
                      <p className="text-lg font-mono text-emerald-400">{currentResponse.current_state.T_io_constant?.toFixed(2) || "0.00"}s</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Z_latency</p>
                      <p className="text-lg font-mono text-indigo-400">---</p>
                    </div>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Latent Signal Status</span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[8px] font-bold uppercase border border-emerald-500/20">Operational</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={cn("h-1 flex-1 rounded-full", i <= 2 ? "bg-indigo-500/60" : "bg-slate-700")}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "results" && currentResponse && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-[1100px] mx-auto p-6 space-y-8"
            >
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 mb-6 shadow-inner">
                  <Trophy size={40} />
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900 mb-2">職涯錨定鑑定報告</h2>
                <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">Diagnostic Results Converged Under CAT v2.4</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                    <div className="flex flex-col items-center">
                      <h3 className="w-full text-sm font-black text-slate-400 uppercase tracking-widest mb-8 text-left border-b border-slate-50 pb-2">
                          Psychometric Radar Profile
                      </h3>
                      <div className="w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={Object.entries(currentResponse.current_state.theta_scores).map(([key, val]) => ({
                            subject: key,
                            A: Math.max(0, (val as number) + 5),
                          }))}>
                            <PolarGrid stroke="#f1f5f9" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 800 }} />
                            <Radar
                              name="Career Anchor"
                              dataKey="A"
                              stroke="#4f46e5"
                              fill="#4f46e5"
                              fillOpacity={0.15}
                              strokeWidth={3}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-50">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Quantitative Dimensional Analysis (θ)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        {Object.entries(currentResponse.current_state.theta_scores)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([key, val]) => {
                            const anchor = ANCHOR_MAP[key as keyof ThetaScores];
                            const normalizedVal = Math.min(100, Math.max(0, ((val as number) + 3) / 6 * 100)); // Map -3 to +3 range roughly
                            return (
                              <div key={key} className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-end">
                                  <span className="text-xs font-bold text-slate-700">{anchor.name.split("(")[0]}</span>
                                  <span className={cn("text-xs font-mono font-bold", (val as number) > 0 ? "text-indigo-600" : "text-slate-400")}>
                                    {(val as number) > 0 ? "+" : ""}{(val as number).toFixed(2)}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                  <div 
                                    className={cn("h-full transition-all duration-1000", (val as number) > 1.5 ? "bg-indigo-600" : (val as number) > 0 ? "bg-indigo-400" : "bg-slate-200")} 
                                    style={{ width: `${normalizedVal}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">
                        AI Interpretative Analysis
                    </h3>
                    <p className="text-slate-700 leading-relaxed text-lg italic whitespace-pre-wrap">
                      "{currentResponse.final_analysis || "根據受測者之反應潛伏期與衝突矩陣之數據建模，您的職涯錨定在特定領域展現出高度的結晶化直覺..."}"
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-2xl shadow-indigo-100 flex flex-col gap-8 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                     <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Deep Anchors</h3>
                     <div className="space-y-10">
                       {Object.entries(currentResponse.current_state.theta_scores)
                         .sort(([, a], [, b]) => (b as number) - (a as number))
                         .slice(0, 2)
                         .map(([key, _]) => {
                           const anchor = ANCHOR_MAP[key as keyof ThetaScores];
                           return (
                             <div key={key} className="space-y-3">
                               <div className="flex items-center gap-3">
                                 <span className="text-3xl font-black text-indigo-500">{key}</span>
                                 <div className="h-px flex-1 bg-slate-800"></div>
                               </div>
                               <div className="text-2xl font-bold text-slate-100 leading-tight">{anchor.name.split("(")[0]}</div>
                               <div className="text-slate-400 text-xs leading-relaxed font-medium uppercase tracking-wider">{anchor.desc}</div>
                             </div>
                           );
                         })
                       }
                     </div>
                   </div>

                   <button
                    onClick={restart}
                    className="w-full flex items-center justify-center gap-3 py-5 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                   >
                     <RefreshCw size={18} />
                     Restart Engine
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Bar */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-wider shrink-0">
        <div className="flex gap-6 uppercase">
          <span>CAT ENGINE: v2.4.01-STABLE</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">SESSION_ID: {history.length > 0 ? "ACTIVE" : "STANDBY"}</span>
        </div>
        <div className="flex gap-6 uppercase">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> JSON_FEED: NOMINAL</span>
          <span className="hidden sm:inline">COORD: 25.0330, 121.5654</span>
        </div>
      </footer>
    </div>
  );
}
