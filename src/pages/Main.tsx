import { useEffect, useState } from "react";
import { Timer } from "../components/Timer";
import { BiomeView } from "../components/BiomeView";
import { ProgressBar } from "../components/ProgressBar";
import { getBiomeState, endSession } from "../lib/tauri-commands";
import { isTauriRuntime } from "../lib/browser-mock-backend";
import type { BiomeState } from "../lib/types";

// Mirrors src-tauri/src/progression.rs::STAGE_THRESHOLDS
const STAGE_THRESHOLDS = [0, 3, 6, 9, 12, 15, 18];

const SESSION_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

type Phase = "idle" | "working" | "break";

export function Main() {
  const [biome, setBiome] = useState<BiomeState | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    getBiomeState().then(setBiome);
  }, []);

  if (!biome) {
    return <div className="loading">Loading your biome...</div>;
  }

  const nextThreshold =
    STAGE_THRESHOLDS[Math.min(biome.current_stage + 1, STAGE_THRESHOLDS.length - 1)];
  const previousThreshold = STAGE_THRESHOLDS[biome.current_stage];

  function handleStartWork() {
    setPhase("working");
    setIsRunning(true);
  }

  async function handleWorkComplete() {
    setIsRunning(false);
    const updated = await endSession(25);
    setBiome(updated);
    setPhase("break");
    setIsRunning(true);
  }

  function handleBreakComplete() {
    setIsRunning(false);
    setPhase("idle");
  }

  return (
    <div className="main">
      {!isTauriRuntime() && (
        <p className="preview-banner">Browser preview — progress here won't sync with the desktop app</p>
      )}
      <BiomeView stage={biome.current_stage} />
      <ProgressBar
        current={biome.total_sessions}
        previousThreshold={previousThreshold}
        nextThreshold={nextThreshold}
      />
      <p className="session-count">{biome.total_sessions} Pomodoros completed</p>

      {phase === "idle" && <button onClick={handleStartWork}>Start Session</button>}

      {phase === "working" && (
        <>
          <h2>Focus Session</h2>
          <Timer
            durationSeconds={SESSION_SECONDS}
            isRunning={isRunning}
            onToggle={() => setIsRunning((r) => !r)}
            onComplete={handleWorkComplete}
          />
        </>
      )}

      {phase === "break" && (
        <>
          <h2>Break time</h2>
          <Timer
            durationSeconds={BREAK_SECONDS}
            isRunning={isRunning}
            onToggle={() => setIsRunning((r) => !r)}
            onComplete={handleBreakComplete}
          />
        </>
      )}
    </div>
  );
}
