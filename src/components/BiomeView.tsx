import { getStageInfo } from "../lib/biome-visuals";

interface BiomeViewProps {
  stage: number;
}

export function BiomeView({ stage }: BiomeViewProps) {
  const info = getStageInfo(stage);

  return (
    <div className="biome-view" style={{ backgroundColor: info.color }}>
      <img className="biome-sprite" src={info.image} alt={info.name} />
      <span className="biome-name">{info.name}</span>
    </div>
  );
}
