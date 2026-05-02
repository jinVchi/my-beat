import type { ItemId, StageId } from "@my-beat/shared-types/game-config";

export type SimPlayerState = {
  id: string;
  x: number;
  y: number;
  facingRight: boolean;
  health: number;
  isAttacking: boolean;
  attackTimer: number;
  attackCooldownTimer: number;
  inputFlags: number;
};

export type SimEnemyState = {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isDead: boolean;
  isWarning: boolean;
  isAttacking: boolean;
  warningTimer: number;
  attackTimer: number;
  attackCooldownTimer: number;
};

export type SimItemState = {
  id: string;
  itemId: ItemId;
  x: number;
  y: number;
};

export type RoomState = {
  tick: number;
  stageId: StageId;
  players: Map<string, SimPlayerState>;
  enemies: SimEnemyState[];
  items: SimItemState[];
};

export type PickupEvent = {
  playerId: string;
  itemId: string;
  itemType: ItemId;
};

export type TickResult = {
  state: RoomState;
  pickups: PickupEvent[];
};
