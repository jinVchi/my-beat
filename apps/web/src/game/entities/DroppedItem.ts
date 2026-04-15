import Phaser from "phaser";

const ITEM_COLORS: Record<string, number> = {
  item_a: 0xffd700,
  item_b: 0x00ffff,
  item_c: 0xff00ff,
};

const ITEM_LABELS: Record<string, string> = {
  item_a: "A",
  item_b: "B",
  item_c: "C",
};

export default class DroppedItem extends Phaser.GameObjects.Container {
  serverId: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    itemId: string,
    serverId: string,
  ) {
    super(scene, x, y);
    this.serverId = serverId;

    const color = ITEM_COLORS[itemId] ?? 0xffffff;
    const label = ITEM_LABELS[itemId] ?? "?";

    const bg = scene.add.rectangle(0, 0, 24, 24, color);
    bg.setStrokeStyle(2, 0xffffff);
    this.add(bg);

    const text = scene.add
      .text(0, 0, label, {
        fontSize: "14px",
        color: "#000000",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);
    this.add(text);

    scene.add.existing(this);
    this.setSize(24, 24);

    scene.tweens.add({
      targets: this,
      y: y - 6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
