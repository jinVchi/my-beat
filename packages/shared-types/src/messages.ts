import type { StageId } from "./game-config";

// --- Input flags (bitfield) ---
export const InputFlag = {
  UP: 1,
  DOWN: 2,
  LEFT: 4,
  RIGHT: 8,
  ATTACK: 16,
  PICKUP: 32,
  HEAVY_ATTACK: 64,
  JUMP: 128,
} as const;

export const AttackType = {
  LIGHT: 1,
  HEAVY: 2,
} as const;

export type AttackType = (typeof AttackType)[keyof typeof AttackType];

// --- Client → Server messages ---
export const ClientMsgType = {
  JOIN_ROOM: 1,
  PLAYER_INPUT: 2,
  PING: 3,
} as const;

export type ClientJoinRoom = {
  type: typeof ClientMsgType.JOIN_ROOM;
  roomId: string;
};

export type ClientPlayerInput = {
  type: typeof ClientMsgType.PLAYER_INPUT;
  seq: number;
  inputFlags: number;
};

export type ClientPing = {
  type: typeof ClientMsgType.PING;
  t: number;
};

export type ClientMessage = ClientJoinRoom | ClientPlayerInput | ClientPing;

// --- Wire state types ---
export type PlayerState = {
  id: string;
  x: number;
  y: number;
  facingRight: boolean;
  health: number;
  isAttacking: boolean;
  attackType: AttackType | null;
  attackTimer: number;
  isJumping: boolean;
  jumpOffset: number;
};

export type EnemyState = {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isDead: boolean;
  isWarning: boolean;
  isAttacking: boolean;
  warningTimer: number;
};

export type ItemState = {
  id: string;
  itemId: string;
  x: number;
  y: number;
};

export type GameSnapshot = {
  tick: number;
  stageId: StageId;
  players: PlayerState[];
  enemies: EnemyState[];
  items: ItemState[];
};

// --- Server → Client messages ---
export const ServerMsgType = {
  ROOM_JOINED: 1,
  GAME_SNAPSHOT: 2,
  PONG: 3,
  PLAYER_JOINED: 4,
  PLAYER_LEFT: 5,
} as const;

export type ServerRoomJoined = {
  type: typeof ServerMsgType.ROOM_JOINED;
  playerId: string;
  snapshot: GameSnapshot;
};

export type ServerGameSnapshot = {
  type: typeof ServerMsgType.GAME_SNAPSHOT;
  snapshot: GameSnapshot;
  lastProcessedInput: Record<string, number>;
};

export type ServerPong = {
  type: typeof ServerMsgType.PONG;
  clientT: number;
  serverT: number;
};

export type ServerPlayerJoined = {
  type: typeof ServerMsgType.PLAYER_JOINED;
  player: PlayerState;
};

export type ServerPlayerLeft = {
  type: typeof ServerMsgType.PLAYER_LEFT;
  playerId: string;
};

export type ServerMessage =
  | ServerRoomJoined
  | ServerGameSnapshot
  | ServerPong
  | ServerPlayerJoined
  | ServerPlayerLeft;
