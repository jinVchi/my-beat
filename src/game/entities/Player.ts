import Phaser from 'phaser';

const PLAYER_SPEED = 200;
const ATTACK_DURATION = 200;
const ATTACK_COOLDOWN = 400;
const ATTACK_DAMAGE = 25;
const ATTACK_RANGE_X = 60;
const ATTACK_RANGE_Y = 30;

const BODY_WIDTH = 40;
const BODY_HEIGHT = 64;

export default class Player extends Phaser.GameObjects.Container {
    body!: Phaser.Physics.Arcade.Body;

    private bodyRect: Phaser.GameObjects.Rectangle;
    private label: Phaser.GameObjects.Text;
    private facingRight = true;
    private directionIndicator: Phaser.GameObjects.Triangle;

    private keys!: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
        J: Phaser.Input.Keyboard.Key;
    };

    isAttacking = false;
    private attackCooldownTimer = 0;
    attackHitbox: Phaser.GameObjects.Rectangle | null = null;

    health = 100;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.bodyRect = scene.add.rectangle(0, 0, BODY_WIDTH, BODY_HEIGHT, 0x3399ff);
        this.bodyRect.setStrokeStyle(2, 0xffffff);
        this.add(this.bodyRect);

        this.directionIndicator = scene.add.triangle(
            BODY_WIDTH / 2 + 6, 0,
            0, -6, 0, 6, 10, 0,
            0xffff00
        );
        this.add(this.directionIndicator);

        this.label = scene.add.text(0, -BODY_HEIGHT / 2 - 14, 'PLAYER', {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(0.5, 0.5);
        this.add(this.label);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(BODY_WIDTH, BODY_HEIGHT);
        this.body.setOffset(-BODY_WIDTH / 2, -BODY_HEIGHT / 2);

        this.keys = scene.input.keyboard!.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            J: Phaser.Input.Keyboard.KeyCodes.J,
        }) as typeof this.keys;

        this.setSize(BODY_WIDTH, BODY_HEIGHT);
    }

    update(_time: number, delta: number) {
        if (this.attackCooldownTimer > 0) {
            this.attackCooldownTimer -= delta;
        }

        this.handleMovement();
        this.handleAttack();
        this.updateDirectionIndicator();
    }

    private handleMovement() {
        let vx = 0;
        let vy = 0;

        if (this.keys.A.isDown) {
            vx = -PLAYER_SPEED;
            this.facingRight = false;
        } else if (this.keys.D.isDown) {
            vx = PLAYER_SPEED;
            this.facingRight = true;
        }

        if (this.keys.W.isDown) {
            vy = -PLAYER_SPEED;
        } else if (this.keys.S.isDown) {
            vy = PLAYER_SPEED;
        }

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            const factor = Math.SQRT1_2;
            vx *= factor;
            vy *= factor;
        }

        this.body.setVelocity(vx, vy);
    }

    private handleAttack() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.J) && !this.isAttacking && this.attackCooldownTimer <= 0) {
            this.performAttack();
        }
    }

    private performAttack() {
        this.isAttacking = true;
        this.attackCooldownTimer = ATTACK_COOLDOWN;

        this.bodyRect.setFillStyle(0x66ccff);

        const hitboxX = this.facingRight ? ATTACK_RANGE_X : -ATTACK_RANGE_X;
        this.attackHitbox = this.scene.add.rectangle(
            this.x + hitboxX, this.y,
            50, ATTACK_RANGE_Y * 2,
            0xffff00, 0.5
        );
        this.scene.physics.add.existing(this.attackHitbox, false);

        this.scene.time.delayedCall(ATTACK_DURATION, () => {
            if (this.attackHitbox) {
                this.attackHitbox.destroy();
                this.attackHitbox = null;
            }
            this.isAttacking = false;
            this.bodyRect.setFillStyle(0x3399ff);
        });
    }

    private updateDirectionIndicator() {
        if (this.facingRight) {
            this.directionIndicator.setPosition(BODY_WIDTH / 2 + 6, 0);
            this.directionIndicator.setTo(0, -6, 0, 6, 10, 0);
        } else {
            this.directionIndicator.setPosition(-BODY_WIDTH / 2 - 6, 0);
            this.directionIndicator.setTo(10, -6, 10, 6, 0, 0);
        }
    }

    getAttackDamage(): number {
        return ATTACK_DAMAGE;
    }
}
