interface ProgressBarProps {
  current: number;
  previousThreshold: number;
  nextThreshold: number;
}

export function ProgressBar({ current, previousThreshold, nextThreshold }: ProgressBarProps) {
  const span = nextThreshold - previousThreshold;
  const progressed = current - previousThreshold;
  const percent = span <= 0 ? 100 : Math.min(100, Math.max(0, (progressed / span) * 100));

  return (
    <div className="progress-bar-track">
      <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      <span className="progress-bar-label">
        {current} / {nextThreshold} pomodoros
      </span>
    </div>
  );
}
