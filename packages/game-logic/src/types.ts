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
};

export type RoomState = {
  tick: number;
  players: Map<string, SimPlayerState>;
  enemies: SimEnemyState[];
};
