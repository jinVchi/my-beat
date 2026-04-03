// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { EventBus } from "../EventBus";
import { REGIONS, type RegionInfo } from "@my-beat/shared-types/game-config";
import { setSelectedRegion } from "../state/region-store";
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

    this.add
      .text(512, 340, "Select Region", {
        align: "center",
        color: "#a0a0b0",
        fontFamily: "Arial Black",
        fontSize: "22px",
      })
      .setOrigin(0.5, 0.5);

    const spacing = 140;
    const startX = 512 - spacing;

    REGIONS.forEach((region, i) => {
      const x = startX + i * spacing;
      const btn = this.add
        .text(x, 420, `${region.id}\n${region.label}`, {
          align: "center",
          color: "#ffffff",
          fontFamily: "Arial Black",
          fontSize: "24px",
          stroke: "#000000",
          strokeThickness: 5,
        })
        .setOrigin(0.5, 0.5)
        .setInteractive({ useHandCursor: true });

      btn.on("pointerover", () => btn.setStyle({ color: "#ffff00" }));
      btn.on("pointerout", () => btn.setStyle({ color: "#ffffff" }));
      btn.on("pointerdown", () => this.selectRegion(region));
    });

    EventBus.emit("current-scene-ready", this);
  }

  selectRegion(region: RegionInfo) {
    setSelectedRegion(region);
    this.scene.start("Game");
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
export { MainMenu };
