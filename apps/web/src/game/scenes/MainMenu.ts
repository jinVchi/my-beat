// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { EventBus } from "../EventBus";
/* END-USER-IMPORTS */

export default class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    this.add.image(512, 384, "background");
    this.events.emit("scene-awake");
  }

  /* START-USER-CODE */

  create() {
    this.editorCreate();

    this.add
      .text(512, 260, "My Beat'em up", {
        align: "center",
        color: "#ffffff",
        fontFamily: "Arial Black",
        fontSize: "48px",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5, 0.5);

    const startBtn = this.add
      .text(512, 420, "Start Game", {
        align: "center",
        color: "#ffffff",
        fontFamily: "Arial Black",
        fontSize: "32px",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    startBtn.on("pointerover", () => startBtn.setStyle({ color: "#ffff00" }));
    startBtn.on("pointerout", () => startBtn.setStyle({ color: "#ffffff" }));
    startBtn.on("pointerdown", () => this.scene.start("Game"));

    EventBus.emit("current-scene-ready", this);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
export { MainMenu };
