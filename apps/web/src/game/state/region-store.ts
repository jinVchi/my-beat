import type { RegionInfo } from "@my-beat/shared-types/game-config";

let selected: RegionInfo | null = null;

export function setSelectedRegion(region: RegionInfo): void {
  selected = region;
}

export function getSelectedRegion(): RegionInfo | null {
  return selected;
}
