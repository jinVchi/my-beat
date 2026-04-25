// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Preloader extends Phaser.Scene {
  constructor() {
    super("Preloader");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // background
    this.add.image(512, 384, "background");

    // progressBar
    const progressBar = this.add.rectangle(512, 384, 468, 32);
    progressBar.isFilled = true;
    progressBar.fillColor = 14737632;
    progressBar.isStroked = true;

    this.progressBar = progressBar;

    this.events.emit("scene-awake");
  }

  private progressBar!: Phaser.GameObjects.Rectangle;

  /* START-USER-CODE */

  // Write your code here
  init() {
    this.editorCreate();

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(
      this.progressBar.x - this.progressBar.width / 2 + 4,
      this.progressBar.y,
      4,
      28,
      0xffffff,
    );

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    // Use the 'pack' file to load in any assets you need for this scene
    this.load.pack("preload", "assets/preload-asset-pack.json");
    this.load.spritesheet("player-fighter", "assets/sprites/player-sheet.png", {
      frameWidth: 96,
      frameHeight: 96,
      margin: 12,
      spacing: 20,
    });
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.
    this.createPlayerAnimations();

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start("MainMenu");
  }

  private createPlayerAnimations() {
    if (this.anims.exists("player-idle")) return;

    this.anims.create({
      key: "player-idle",
      frames: this.anims.generateFrameNumbers("player-fighter", {
        frames: [0, 14],
      }),
      frameRate: 4,
      repeat: -1,
    });

    this.anims.create({
      key: "player-walk",
      frames: this.anims.generateFrameNumbers("player-fighter", {
        frames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      }),
      frameRate: 14,
      repeat: -1,
    });

    this.anims.create({
      key: "player-attack",
      frames: this.anims.generateFrameNumbers("player-fighter", {
        frames: [12, 13],
      }),
      frameRate: 12,
      repeat: 0,
    });

    this.anims.create({
      key: "player-hit",
      frames: this.anims.generateFrameNumbers("player-fighter", {
        frames: [15],
      }),
      frameRate: 1,
      repeat: 0,
    });

    this.anims.create({
      key: "player-ko",
      frames: this.anims.generateFrameNumbers("player-fighter", {
        frames: [16],
      }),
      frameRate: 1,
      repeat: 0,
    });
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
