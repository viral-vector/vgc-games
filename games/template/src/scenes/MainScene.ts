import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload(): void {
    this.load.setBaseURL('https://labs.phaser.io');
    this.load.image('logo', 'assets/sprites/phaser3-logo.png');
  }

  create(): void {
    const logo = this.add.image(400, 150, 'logo');
    this.add
      .text(400, 500, 'Welcome to the VGC Phaser Template', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#f1faee'
      })
      .setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: logo,
      y: 450,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }
}
