import * as Phaser from "phaser";

const SCENE_W = 360;
const SCENE_H = 600;
const BALL_R = 18;
const GOAL_TOP = 20;
const GOAL_HEIGHT = 100;
const GOAL_WIDTH = 260;
const GOAL_LEFT = (SCENE_W - GOAL_WIDTH) / 2;
const GOAL_RIGHT = GOAL_LEFT + GOAL_WIDTH;
const GOAL_BOTTOM = GOAL_TOP + GOAL_HEIGHT;
const BALL_START_X = SCENE_W / 2;
const BALL_START_Y = SCENE_H - 85;
const CROSSHAIR_MARGIN = 12;
const CHARGE_TIME_MS = 1000;
const MIN_VELOCITY = 280;
const MAX_VELOCITY = 520;
const POWER_BAR_X = SCENE_W / 2;
const POWER_BAR_Y = SCENE_H - 60;
const POWER_BAR_W = 200;
const POWER_BAR_H = 12;
const KEEPER_REACTION_DELAY_MIN = 80;
const KEEPER_REACTION_DELAY_MAX = 200;
const KEEPER_SPEED = 220;

export default class PenaltyScene extends Phaser.Scene {
  private ball!: Phaser.Physics.Arcade.Image;
  private crosshair!: Phaser.GameObjects.Image;
  private keeper!: Phaser.GameObjects.Image;
  private powerBarBg!: Phaser.GameObjects.Graphics;
  private powerBarFill!: Phaser.GameObjects.Graphics;
  private isCharging = false;
  private chargeStartTime = 0;
  private shotInProgress = false;

  constructor() {
    super({ key: "PenaltyScene" });
  }

  preload() {
    // Crear textura de mira (crosshair)
    const crosshairSize = 24;
    const chGraphics = this.add.graphics();
    chGraphics.setVisible(false);
    chGraphics.lineStyle(2, 0xef4444, 1);
    chGraphics.strokeCircle(crosshairSize / 2, crosshairSize / 2, 8);
    chGraphics.lineBetween(crosshairSize / 2, 2, crosshairSize / 2, crosshairSize / 2 - 6);
    chGraphics.lineBetween(crosshairSize / 2, crosshairSize / 2 + 6, crosshairSize / 2, crosshairSize - 2);
    chGraphics.lineBetween(2, crosshairSize / 2, crosshairSize / 2 - 6, crosshairSize / 2);
    chGraphics.lineBetween(crosshairSize / 2 + 6, crosshairSize / 2, crosshairSize - 2, crosshairSize / 2);
    chGraphics.fillStyle(0xfbbf24, 0.9);
    chGraphics.fillCircle(crosshairSize / 2, crosshairSize / 2, 3);
    chGraphics.generateTexture("crosshair", crosshairSize, crosshairSize);
    chGraphics.destroy();

    // Crear textura de pelota programáticamente
    const ballGraphics = this.add.graphics();
    ballGraphics.setVisible(false);
    ballGraphics.fillStyle(0xf5f5dc, 1); // beige/blanco
    ballGraphics.fillCircle(BALL_R, BALL_R, BALL_R - 2);
    ballGraphics.lineStyle(2, 0x1e293b);
    ballGraphics.strokeCircle(BALL_R, BALL_R, BALL_R - 2);
    // Pentágonos estilizados (simplificado: líneas negras)
    ballGraphics.lineStyle(1.5, 0x1e293b);
    ballGraphics.strokeCircle(BALL_R, BALL_R, BALL_R * 0.6);
    ballGraphics.generateTexture("ball", BALL_R * 2, BALL_R * 2);
    ballGraphics.destroy();

    // Crear textura del portero (figura estilizada)
    const kw = 56;
    const kh = 70;
    const keeperGraphics = this.add.graphics();
    keeperGraphics.setVisible(false);
    keeperGraphics.fillStyle(0x1e293b, 1);
    keeperGraphics.fillRect(kw / 2 - 6, 20, 12, 35);
    keeperGraphics.fillRect(kw / 2 - 18, 22, 10, 28);
    keeperGraphics.fillRect(kw / 2 + 8, 22, 10, 28);
    keeperGraphics.fillStyle(0x22c55e, 1);
    keeperGraphics.fillRect(kw / 2 - 14, 18, 28, 22);
    keeperGraphics.fillStyle(0xfde68a, 1);
    keeperGraphics.fillCircle(kw / 2, 12, 10);
    keeperGraphics.fillStyle(0xffffff, 1);
    keeperGraphics.fillCircle(kw / 2 - 4, 10, 4);
    keeperGraphics.fillCircle(kw / 2 + 4, 10, 4);
    keeperGraphics.fillStyle(0x1e293b, 1);
    keeperGraphics.fillCircle(kw / 2 - 3, 10, 2);
    keeperGraphics.fillCircle(kw / 2 + 5, 10, 2);
    keeperGraphics.generateTexture("keeper", kw, kh);
    keeperGraphics.destroy();
  }

  create() {
    const goalBottom = GOAL_BOTTOM;

    // 1. Fondo de césped (gradiente verde)
    const grass = this.add.graphics();
    grass.fillGradientStyle(0x166534, 0x166534, 0x14532d, 0x14532d, 1);
    grass.fillRect(0, 0, SCENE_W, SCENE_H);
    grass.setDepth(-10);

    // 2. Portería (dibujada con graphics)
    const goalGraphics = this.add.graphics();
    goalGraphics.lineStyle(4, 0xffffff, 1);
    goalGraphics.strokeRect(GOAL_LEFT, GOAL_TOP, GOAL_WIDTH, GOAL_HEIGHT);
    // Red
    goalGraphics.lineStyle(1, 0xffffff, 0.3);
    for (let i = 12; i < GOAL_WIDTH; i += 12) {
      goalGraphics.lineBetween(GOAL_LEFT + i, goalBottom, GOAL_LEFT + i, GOAL_TOP);
    }
    for (let j = 12; j < GOAL_HEIGHT; j += 12) {
      goalGraphics.lineBetween(GOAL_LEFT, goalBottom - j, GOAL_LEFT + GOAL_WIDTH, goalBottom - j);
    }
    goalGraphics.setDepth(0);

    // Línea de gol
    const lineGraphics = this.add.graphics();
    lineGraphics.lineStyle(6, 0xffffff, 1);
    lineGraphics.lineBetween(0, goalBottom, SCENE_W, goalBottom);
    lineGraphics.setDepth(1);

    // Portero parado en la línea de portería
    const keeperCenterX = GOAL_LEFT + GOAL_WIDTH / 2;
    const keeperY = goalBottom;
    this.keeper = this.add.image(keeperCenterX, keeperY, "keeper");
    this.keeper.setOrigin(0.5, 1);
    this.keeper.setDepth(5);

    // 3. Pelota con física Arcade (sin gravedad cuando está en el punto penal)
    this.ball = this.physics.add.image(BALL_START_X, BALL_START_Y, "ball");
    this.ball.setCircle(BALL_R - 2);
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(0);
    this.ball.setDamping(true);
    this.ball.setDrag(0.98);
    this.ball.setMaxVelocity(600);
    this.ball.setDepth(10);
    this.ball.body!.setAllowGravity(false);

    // Gravedad (se activa solo cuando la pelota es pateada)
    this.physics.world.gravity.y = 300;

    // Círculo del punto penal (decorativo)
    const spotGraphics = this.add.graphics();
    spotGraphics.lineStyle(2, 0xffffff, 0.8);
    spotGraphics.strokeCircle(SCENE_W / 2, BALL_START_Y + 28, 38);
    spotGraphics.setDepth(0);

    // 4. Mira de apuntado (sigue el ratón/dedo, restringida al área de la portería)
    const aimCenterX = GOAL_LEFT + GOAL_WIDTH / 2;
    const aimCenterY = GOAL_TOP + GOAL_HEIGHT / 2;
    this.crosshair = this.add.image(aimCenterX, aimCenterY, "crosshair");
    this.crosshair.setDepth(20);

    const minX = GOAL_LEFT + CROSSHAIR_MARGIN;
    const maxX = GOAL_RIGHT - CROSSHAIR_MARGIN;
    const minY = GOAL_TOP + CROSSHAIR_MARGIN;
    const maxY = GOAL_BOTTOM - CROSSHAIR_MARGIN;

    const updateCrosshair = (pointer: Phaser.Input.Pointer) => {
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;
      const clampedX = Phaser.Math.Clamp(worldX, minX, maxX);
      const clampedY = Phaser.Math.Clamp(worldY, minY, maxY);
      this.crosshair.setPosition(clampedX, clampedY);
    };

    this.input.on("pointermove", updateCrosshair);
    this.input.on("pointerdown", updateCrosshair);

    // 5. Barra de potencia (visible solo al cargar)
    this.powerBarBg = this.add.graphics();
    this.powerBarFill = this.add.graphics();
    this.powerBarBg.setDepth(25);
    this.powerBarFill.setDepth(26);
    this.powerBarBg.setVisible(false);
    this.powerBarFill.setVisible(false);

    // 6. Sistema de disparo: mantener presionado para cargar, soltar para disparar
    this.input.on("pointerdown", () => {
      if (this.canShoot()) {
        this.isCharging = true;
        this.chargeStartTime = this.time.now;
        this.powerBarBg.setVisible(true);
        this.powerBarFill.setVisible(true);
      }
    });

    this.input.on("pointerup", () => {
      if (this.isCharging) {
        const power = this.getChargePower();
        this.shootTowardCrosshair(power);
        this.isCharging = false;
        this.powerBarBg.setVisible(false);
        this.powerBarFill.setVisible(false);
      }
    });
  }

  update() {
    if (this.isCharging) {
      const power = this.getChargePower();
      this.updatePowerBar(power);
    }
    const v = this.ball.body?.velocity;
    if (v && this.ball.y < BALL_START_Y && v.y > 0) {
      this.ball.setVelocity(v.x, 0);
    }
    if (this.shotInProgress && v) {
      const speed = Math.hypot(v.x, v.y);
      const inGoalX = this.ball.x >= GOAL_LEFT + BALL_R && this.ball.x <= GOAL_RIGHT - BALL_R;
      const inGoalY = this.ball.y >= GOAL_TOP && this.ball.y <= GOAL_BOTTOM + BALL_R;
      if (inGoalX && inGoalY && speed < 15) {
        this.shotInProgress = false;
        this.finishShot("goal");
        return;
      }
      if (this.ball.y > SCENE_H + 30 || this.ball.x < -30 || this.ball.x > SCENE_W + 30 || (this.ball.y > GOAL_BOTTOM + 50 && !inGoalX && speed < 8)) {
        this.shotInProgress = false;
        this.finishShot("saved");
      }
    }
  }

  private finishShot(result: "goal" | "saved") {
    this.game.events.emit("penalty-result", result);
    this.resetBall();
  }

  private canShoot(): boolean {
    const v = this.ball.body?.velocity;
    if (!v) return false;
    const speed = Math.hypot(v.x, v.y);
    return speed < 5;
  }

  private getChargePower(): number {
    const elapsed = this.time.now - this.chargeStartTime;
    const power = Math.min((elapsed / CHARGE_TIME_MS) * 100, 100);
    return power;
  }

  private updatePowerBar(powerPercent: number) {
    const halfW = POWER_BAR_W / 2;
    const halfH = POWER_BAR_H / 2;

    this.powerBarBg.clear();
    this.powerBarBg.fillStyle(0x1e293b, 0.9);
    this.powerBarBg.fillRoundedRect(POWER_BAR_X - halfW, POWER_BAR_Y - halfH, POWER_BAR_W, POWER_BAR_H, 4);
    this.powerBarBg.lineStyle(2, 0xffffff, 0.6);
    this.powerBarBg.strokeRoundedRect(POWER_BAR_X - halfW, POWER_BAR_Y - halfH, POWER_BAR_W, POWER_BAR_H, 4);

    this.powerBarFill.clear();
    const fillW = (POWER_BAR_W * Math.max(0, powerPercent)) / 100;
    if (fillW > 0) {
      this.powerBarFill.fillStyle(0x22c55e, 0.95);
      this.powerBarFill.fillRoundedRect(POWER_BAR_X - halfW, POWER_BAR_Y - halfH, fillW, POWER_BAR_H, 4);
    }
  }

  private shootTowardCrosshair(powerPercent: number) {
    this.ball.setPosition(BALL_START_X, BALL_START_Y);
    this.ball.body!.setAllowGravity(true);
    this.shotInProgress = true;
    const targetX = this.crosshair.x;
    const targetY = this.crosshair.y;
    const dx = targetX - BALL_START_X;
    const dy = targetY - BALL_START_Y;
    const dist = Math.hypot(dx, dy) || 1;
    const magnitude = MIN_VELOCITY + ((MAX_VELOCITY - MIN_VELOCITY) * powerPercent) / 100;
    const vx = (dx / dist) * magnitude;
    const vy = (dy / dist) * magnitude;
    this.ball.setVelocity(vx, vy);

    this.moveKeeperToTarget(targetX, targetY);
  }

  private moveKeeperToTarget(targetX: number, _targetY: number) {
    const keeperHalfW = 28;
    const keeperY = GOAL_BOTTOM;
    const clampedX = Phaser.Math.Clamp(targetX, GOAL_LEFT + keeperHalfW, GOAL_RIGHT - keeperHalfW);

    const distance = Math.abs(this.keeper.x - clampedX);
    const duration = (distance / KEEPER_SPEED) * 1000;
    const delay = Phaser.Math.Between(KEEPER_REACTION_DELAY_MIN, KEEPER_REACTION_DELAY_MAX);

    this.tweens.killTweensOf(this.keeper);
    this.time.delayedCall(delay, () => {
      this.tweens.add({
        targets: this.keeper,
        x: clampedX,
        duration,
        ease: "Sine.easeOut",
      });
    });
  }

  getBall(): Phaser.Physics.Arcade.Image {
    return this.ball;
  }

  resetBall() {
    this.ball.setVelocity(0, 0);
    this.ball.setPosition(BALL_START_X, BALL_START_Y);
    this.ball.body!.setAllowGravity(false);
    this.tweens.killTweensOf(this.keeper);
    const keeperCenterX = GOAL_LEFT + GOAL_WIDTH / 2;
    const keeperY = GOAL_BOTTOM;
    this.keeper.setPosition(keeperCenterX, keeperY);
  }

  kickBall(vx: number, vy: number) {
    this.ball.setVelocity(vx, vy);
  }
}
