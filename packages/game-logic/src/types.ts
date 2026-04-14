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

export type RoomState = {
  tick: number;
  players: Map<string, SimPlayerState>;
  enemies: SimEnemyState[];
};
