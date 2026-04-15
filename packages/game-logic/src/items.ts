import { InputFlag } from "@my-beat/shared-types/messages";
import { ITEM_PICKUP_RANGE } from "@my-beat/shared-types/game-config";
import type { SimPlayerState, SimItemState, PickupEvent } from "./types";

export function processPickups(
  players: Map<string, SimPlayerState>,
  items: SimItemState[],
): { items: SimItemState[]; pickups: PickupEvent[] } {
  const pickups: PickupEvent[] = [];
  let remaining = [...items];

  for (const [, player] of players) {
    if (!(player.inputFlags & InputFlag.PICKUP)) continue;

    const nearestIdx = remaining.findIndex((item) => {
      const dx = player.x - item.x;
      const dy = player.y - item.y;
      return Math.sqrt(dx * dx + dy * dy) <= ITEM_PICKUP_RANGE;
    });

    if (nearestIdx !== -1) {
      const item = remaining[nearestIdx];
      pickups.push({
        playerId: player.id,
        itemId: item.id,
        itemType: item.itemId,
      });
      remaining.splice(nearestIdx, 1);
    }
  }

  return { items: remaining, pickups };
}
