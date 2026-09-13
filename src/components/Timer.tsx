import { useEffect, useRef, useState } from "react";
import { formatTime } from "../lib/time";

interface TimerProps {
  durationSeconds: number;
  isRunning: boolean;
  onToggle: () => void;
  onComplete: () => void;
}

export function Timer({ durationSeconds, isRunning, onToggle, onComplete }: TimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setRemaining(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="timer">
      <div className="timer-display">{formatTime(remaining)}</div>
      <button onClick={onToggle}>{isRunning ? "Pause" : "Start"}</button>
    </div>
  );
}
