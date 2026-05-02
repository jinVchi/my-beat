import Phaser from "phaser";

/** Top-right control to leave the battle scene (fixed depth above gameplay). */
export function addCornerQuitButton(scene: Phaser.Scene, onQuit: () => void): void {
  const margin = 14;
  const btn = scene.add
    .text(scene.scale.width - margin, margin, "X", {
      fontFamily: "Arial Black",
      fontSize: "44px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
    })
    .setOrigin(1, 0)
    .setScrollFactor(0)
    .setDepth(10_000)
    .setInteractive({ useHandCursor: true });

  btn.on("pointerover", () => btn.setStyle({ color: "#ff8888" }));
  btn.on("pointerout", () => btn.setStyle({ color: "#ffffff" }));
  btn.on("pointerdown", () => onQuit());
}
