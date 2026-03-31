import Phaser from "phaser";
import { WORLD_WIDTH } from "@my-beat/shared-types/game-config";

/** Top-right × control to leave the battle scene (fixed depth above gameplay). */
export function addCornerQuitButton(scene: Phaser.Scene, onQuit: () => void): void {
  const margin = 14;
  const btn = scene.add
    .text(WORLD_WIDTH - margin, margin, "×", {
      fontFamily: "Arial Black",
      fontSize: "44px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
    })
    .setOrigin(1, 0)
    .setDepth(10_000)
    .setInteractive({ useHandCursor: true });

  btn.on("pointerover", () => btn.setStyle({ color: "#ff8888" }));
  btn.on("pointerout", () => btn.setStyle({ color: "#ffffff" }));
  btn.on("pointerdown", () => onQuit());
}
