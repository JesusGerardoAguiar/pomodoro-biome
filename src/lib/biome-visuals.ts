export interface StageInfo {
  name: string;
  color: string;
  emoji: string;
}

export const STAGE_INFO: StageInfo[] = [
  { name: "Seed", color: "#3d3223", emoji: "\u{1FAD8}" },
  { name: "Sprout", color: "#4a5c2e", emoji: "\u{1F331}" },
  { name: "Young Plant", color: "#4f6b2f", emoji: "\u{1F33F}" },
  { name: "Growing Plant", color: "#548238", emoji: "\u{1F33E}" },
  { name: "Mature Plant", color: "#5a9440", emoji: "\u{1F333}" },
  { name: "Blooming", color: "#6bab4a", emoji: "\u{1F338}" },
  { name: "Thriving Ecosystem", color: "#7fc25a", emoji: "\u{1F30D}" },
];

export function getStageInfo(stage: number): StageInfo {
  const index = Math.min(Math.max(stage, 0), STAGE_INFO.length - 1);
  return STAGE_INFO[index];
}

export const ACTION_LABELS: Record<string, string> = {
  plant_seed: "Plant a Seed",
  water_plant: "Water the Plant",
  add_nutrients: "Add Nutrients",
  tend_ecosystem: "Tend the Ecosystem",
};

export function getActionLabel(actionName: string): string {
  return ACTION_LABELS[actionName] ?? actionName;
}
