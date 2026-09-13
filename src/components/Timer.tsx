import { useEffect, useRef, useState } from "react";
import { formatTime, secondsUntil } from "../lib/time";
import { updateTrayTitle } from "../lib/tauri-commands";

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
  // Wall-clock timestamp the countdown should hit zero at. Anchoring to a
  // fixed end time (rather than decrementing a counter per tick) means the
  // displayed value is always correct even if setInterval ticks get
  // throttled or skipped entirely while the window is minimized/unfocused.
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    setRemaining(durationSeconds);
    endTimeRef.current = null;
  }, [durationSeconds]);

  useEffect(() => {
    if (!isRunning) {
      endTimeRef.current = null;
      return;
    }

    if (endTimeRef.current === null) {
      endTimeRef.current = Date.now() + remaining * 1000;
    }
    const endTime = endTimeRef.current;

    const tick = () => {
      const secondsLeft = secondsUntil(endTime);
      setRemaining(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(interval);
        endTimeRef.current = null;
        onCompleteRef.current();
      }
    };

    const interval = setInterval(tick, 1000);
    tick();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  useEffect(() => {
    updateTrayTitle(formatTime(remaining));
  }, [remaining]);

  useEffect(() => {
    return () => {
      updateTrayTitle(null);
    };
  }, []);

  return (
    <div className="timer">
      <div className="timer-display">{formatTime(remaining)}</div>
      <button onClick={onToggle}>{isRunning ? "Pause" : "Start"}</button>
    </div>
  );
}
