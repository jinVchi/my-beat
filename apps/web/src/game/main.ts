import Boot from "./scenes/Boot";
import GameOver from "./scenes/GameOver";
import MainGame from "./scenes/Game";
import Game2 from "./scenes/Game2";
import MainMenu from "./scenes/MainMenu";
import Preloader from "./scenes/Preloader";
import { AUTO, Game } from "phaser";

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  backgroundColor: "#0a0a0a",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [Boot, Preloader, MainMenu, MainGame, Game2, GameOver],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
