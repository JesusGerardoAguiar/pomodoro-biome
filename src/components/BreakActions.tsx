import { getActionLabel } from "../lib/biome-visuals";

interface BreakActionsProps {
  unlockedActions: string[];
  onAction: (actionName: string) => void;
  disabled: boolean;
}

export function BreakActions({ unlockedActions, onAction, disabled }: BreakActionsProps) {
  if (unlockedActions.length === 0) {
    return <p className="break-actions-empty">Keep completing sessions to unlock actions here.</p>;
  }

  return (
    <div className="break-actions">
      {unlockedActions.map((action) => (
        <button key={action} disabled={disabled} onClick={() => onAction(action)}>
          {getActionLabel(action)}
        </button>
      ))}
    </div>
  );
}
