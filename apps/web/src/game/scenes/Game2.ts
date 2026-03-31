import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { addCornerQuitButton } from "../ui/corner-quit";

export default class Game2 extends Phaser.Scene {
  constructor() {
    super("Game2");
  }

  create() {
    this.add
      .text(512, 384, "STAGE 2\n(Coming Soon)", {
        fontSize: "32px",
        color: "#aaaaff",
        fontFamily: "Arial Black",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5, 0.5);

    addCornerQuitButton(this, () => this.changeScene());
    EventBus.emit("current-scene-ready", this);
  }

  changeScene() {
    this.scene.start("GameOver");
  }
}
