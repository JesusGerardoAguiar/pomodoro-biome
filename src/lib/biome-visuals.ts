import stage0 from "../assets/biome/stage-0-seed.png";
import stage1 from "../assets/biome/stage-1-sprout.png";
import stage2 from "../assets/biome/stage-2-young-plant.png";
import stage3 from "../assets/biome/stage-3-growing-plant.png";
import stage4 from "../assets/biome/stage-4-mature-plant.png";
import stage5 from "../assets/biome/stage-5-blooming.png";
import stage6 from "../assets/biome/stage-6-thriving-ecosystem.png";

export interface StageInfo {
  name: string;
  color: string;
  image: string;
}

export const STAGE_INFO: StageInfo[] = [
  { name: "Seed", color: "#3d3223", image: stage0 },
  { name: "Sprout", color: "#4a5c2e", image: stage1 },
  { name: "Young Plant", color: "#4f6b2f", image: stage2 },
  { name: "Growing Plant", color: "#548238", image: stage3 },
  { name: "Mature Plant", color: "#5a9440", image: stage4 },
  { name: "Blooming", color: "#6bab4a", image: stage5 },
  { name: "Thriving Ecosystem", color: "#7fc25a", image: stage6 },
];

export function getStageInfo(stage: number): StageInfo {
  const index = Math.min(Math.max(stage, 0), STAGE_INFO.length - 1);
  return STAGE_INFO[index];
}
