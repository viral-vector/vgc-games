import Phaser from 'phaser';
import {
  registerAdSceneEvents,
  showRewardedVideo,
  type RewardPayload
} from '@vgc/ad-service';
import {
  advanceDifficulty,
  createDifficultyState,
  getScoreIncrement,
  getSpawnDelay,
  type DifficultyState
} from '../game/difficulty';
import { trackError, trackEvent } from '../analytics';

enum RunnerState {
  Waiting,
  Running,
  GameOver,
  ShowingAd
}

type RewardEventPayload = {
  placementId?: string;
  reward: RewardPayload;
};

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private scoreText!: Phaser.GameObjects.Text;
  private bestScoreText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private rewardText!: Phaser.GameObjects.Text;
  private state: RunnerState = RunnerState.Waiting;
  private score = 0;
  private bestScore = 0;
  private jumps = 0;
  private readonly maxJumps = 2;
  private difficulty: DifficultyState = createDifficultyState();
  private spawnTimer?: Phaser.Time.TimerEvent;
  private unregisterAds?: () => void;

  constructor() {
    super('MainScene');
  }

  preload(): void {
    this.createSolidTexture('runner-player', 32, 32, 0xf72585);
    this.createSolidTexture('runner-ground', 32, 32, 0x2a9d8f);
    this.createSolidTexture('runner-obstacle', 32, 48, 0xffb703);
  }

  create(): void {
    this.unregisterAds = registerAdSceneEvents(this);
    this.events.on('ad.rewarded.reward', this.handleAdReward, this);
    this.events.on('ad.rewarded.opened', this.handleAdOpened, this);

    this.physics.world.setBounds(0, 0, 800, 600);

    this.createBackground();
    this.createGround();
    this.createPlayer();
    this.createObstacles();
    this.createHud();
    this.registerInput();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);

    this.setState(RunnerState.Waiting);
    this.setStatus('Tap or press SPACE to watch a boost ad and start running.');
  }

  update(_time: number, delta: number): void {
    if (this.state !== RunnerState.Running) {
      return;
    }

    if (this.player.body?.blocked.down || this.player.body?.touching.down) {
      this.jumps = 0;
    }

    this.difficulty = advanceDifficulty(this.difficulty, delta);

    this.obstacles.children.iterate((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite | null;
      if (!sprite || !sprite.body) {
        return false;
      }

      sprite.setVelocityX(-this.difficulty.speed);

      if (sprite.x < -50) {
        sprite.destroy();
      }

      return undefined;
    });

    this.score += getScoreIncrement(delta, this.difficulty.speed);
    this.updateScoreTexts();
  }

  private createSolidTexture(key: string, width: number, height: number, color: number): void {
    if (this.textures.exists(key)) {
      return;
    }

    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(color, 1);
    gfx.fillRect(0, 0, width, height);
    gfx.generateTexture(key, width, height);
    gfx.destroy();
  }

  private createBackground(): void {
    this.add.rectangle(400, 300, 800, 600, 0x1d3557).setDepth(-5);
    this.add.rectangle(400, 520, 820, 160, 0x1b4332).setDepth(-4);
  }

  private createGround(): void {
    this.ground = this.physics.add.staticGroup();
    const ground = this.ground.create(400, 560, 'runner-ground') as Phaser.Physics.Arcade.Sprite;
    ground.setScale(26, 2).refreshBody();
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(150, 480, 'runner-player');
    this.player.setDepth(1);
    this.player.setBounce(0);
    this.player.setCollideWorldBounds(true);
    this.player.setDragX(0);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 32).setOffset(2, 0);

    this.physics.add.collider(this.player, this.ground);
  }

  private createObstacles(): void {
    this.obstacles = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.physics.add.collider(this.player, this.obstacles, this.handlePlayerCrash, undefined, this);
  }

  private createHud(): void {
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#f1faee'
    };

    this.scoreText = this.add.text(24, 24, 'Score: 0', textStyle).setDepth(10);
    this.bestScoreText = this.add.text(24, 56, 'Best: 0', textStyle).setDepth(10);

    this.statusText = this.add
      .text(400, 200, '', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#f1faee',
        align: 'center',
        wordWrap: { width: 640 }
      })
      .setOrigin(0.5, 0.5)
      .setDepth(10);

    this.rewardText = this.add
      .text(400, 140, '', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffd166'
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0);
  }

  private registerInput(): void {
    this.input.keyboard?.on('keydown-SPACE', this.handleKeyDown, this);
    this.input.keyboard?.on('keydown-UP', this.handleKeyDown, this);
    this.input.on('pointerdown', this.handlePointerDown, this);
  }

  private handleKeyDown(): void {
    this.handlePrimaryAction();
  }

  private handlePointerDown(): void {
    this.handlePrimaryAction();
  }

  private handlePrimaryAction(): void {
    if (this.state === RunnerState.Running) {
      this.jump();
      return;
    }

    if (this.state === RunnerState.Waiting || this.state === RunnerState.GameOver) {
      void this.beginRunWithAd();
    }
  }

  private jump(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body | undefined;
    if (!body) {
      return;
    }

    if (body.blocked.down || body.touching.down) {
      this.jumps = 0;
    }

    if (this.jumps >= this.maxJumps) {
      return;
    }

    body.setVelocityY(-520);
    this.jumps += 1;

    this.tweens.add({
      targets: this.player,
      scaleY: 0.92,
      duration: 80,
      yoyo: true
    });
  }

  private async beginRunWithAd(): Promise<void> {
    if (this.state === RunnerState.ShowingAd) {
      return;
    }

    this.setState(RunnerState.ShowingAd);
    this.setStatus('Collecting sponsor boost…');
    await this.safeShowRewardedAd('runner-level-start');
    this.resetRun();
    this.setState(RunnerState.Running);
    this.setStatus('Jump over obstacles! Double jump to recover.');
    trackEvent('run_started', { placement_id: 'runner-level-start' });
  }

  private resetRun(): void {
    this.score = 0;
    this.difficulty = createDifficultyState();
    this.jumps = 0;
    this.player.clearTint();
    this.player.setPosition(150, 480);
    this.player.setVelocity(0, 0);
    this.player.setAngle(0);

    this.obstacles.clear(true, true);
    this.scheduleNextObstacle();
    this.updateScoreTexts();
  }

  private scheduleNextObstacle(): void {
    this.spawnTimer?.remove();

    const delay = getSpawnDelay(Math.floor(this.score));
    this.spawnTimer = this.time.addEvent({
      delay,
      callback: () => {
        this.spawnObstacle();
        this.scheduleNextObstacle();
      }
    });
  }

  private spawnObstacle(): void {
    if (this.state !== RunnerState.Running) {
      return;
    }

    const obstacle = this.obstacles.create(850, 520, 'runner-obstacle') as Phaser.Physics.Arcade.Sprite | null;
    if (!obstacle) {
      return;
    }

    obstacle.setOrigin(0.5, 1);
    const body = obstacle.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setVelocityX(-this.difficulty.speed);
  }

  private handlePlayerCrash(): void {
    if (this.state !== RunnerState.Running) {
      return;
    }

    this.stopRun();
    this.player.setTint(0xe63946);

    const normalizedScore = Math.floor(this.score);
    this.bestScore = Math.max(this.bestScore, this.score);

    this.updateScoreTexts();

    this.setState(RunnerState.GameOver);
    this.setStatus('Crashed! Watch an ad to revive and try again.');
    trackEvent('run_crashed', { score: normalizedScore });

    void this.presentEndAd();
  }

  private stopRun(): void {
    this.spawnTimer?.remove();
    this.spawnTimer = undefined;

    this.obstacles.children.iterate((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite | null;
      sprite?.setVelocityX(0);
      return undefined;
    });
  }

  private async presentEndAd(): Promise<void> {
    this.setState(RunnerState.ShowingAd);
    this.setStatus('Thanks to our sponsor! Watch the ad to continue.');
    await this.safeShowRewardedAd('runner-level-end');
    trackEvent('run_revived', { placement_id: 'runner-level-end' });
    this.player.clearTint();
    this.setState(RunnerState.Waiting);
    this.setStatus('Tap or press SPACE to start the next run.');
  }

  private async safeShowRewardedAd(placementId: string): Promise<void> {
    try {
      await showRewardedVideo({ placementId });
      trackEvent('ad_shown', { placement_id: placementId });
    } catch (error) {
      console.warn('Failed to display rewarded ad', error);
      trackError('ad_failed', {
        placement_id: placementId,
        message: error instanceof Error ? error.message : 'unknown'
      });
    }
  }

  private handleAdReward(payload: RewardEventPayload): void {
    const bonus = payload.reward?.amount ?? 0;
    if (!bonus) {
      return;
    }

    this.score += bonus;
    this.updateScoreTexts();
    this.flashReward(`+${bonus} ${payload.reward.type}`);
    trackEvent('reward_claimed', {
      amount: bonus,
      reward_type: payload.reward?.type,
      placement_id: payload.placementId
    });
  }

  private flashReward(message: string): void {
    this.rewardText.setText(message);
    this.rewardText.setAlpha(0);
    this.tweens.add({
      targets: this.rewardText,
      alpha: { from: 0, to: 1 },
      y: { from: 140, to: 120 },
      duration: 220,
      yoyo: true,
      hold: 600,
      onComplete: () => {
        this.rewardText.setAlpha(0);
        this.rewardText.setY(140);
      }
    });
  }

  private updateScoreTexts(): void {
    this.scoreText.setText(`Score: ${Math.floor(this.score)}`);
    this.bestScoreText.setText(`Best: ${Math.floor(this.bestScore)}`);
  }

  private setStatus(message: string): void {
    this.statusText.setText(message);
  }

  private setState(next: RunnerState): void {
    this.state = next;
  }

  private cleanup(): void {
    this.unregisterAds?.();
    this.events.off('ad.rewarded.reward', this.handleAdReward, this);
    this.events.off('ad.rewarded.opened', this.handleAdOpened, this);
    this.input.keyboard?.off('keydown-SPACE', this.handleKeyDown, this);
    this.input.keyboard?.off('keydown-UP', this.handleKeyDown, this);
    this.input.off('pointerdown', this.handlePointerDown, this);
    this.spawnTimer?.remove();
  }

  private handleAdOpened({ placementId }: { placementId?: string }): void {
    trackEvent('ad_opened', { placement_id: placementId });
  }
}
