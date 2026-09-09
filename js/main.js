const config = {
  type: Phaser.AUTO,
  width: ERIS.W,
  height: ERIS.H,
  parent: 'game-canvas-container',
  backgroundColor: '#0a0014',
  pixelArt: false,
  antialias: true,
  fps: { target: 60, forceSetTimeOut: false },
  banner: false,
  render: { powerPreference: 'high-performance', antialias: true, roundPixels: false },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: ERIS.GRAVITY }, debug: false, fps: 60, fixedStep: true },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
  audio: { disableWebAudio: false },
  scene: [
    BootScene, TitleScene, MenuScene, MissionSelect, OptionsScene,
    BriefingScene, PlayScene, CompleteScene, ContinueScene,
    GameOverScene, EndingScene, CreditsScene,
  ],
};

window.addEventListener('load', () => {
  window.erisGame = new Phaser.Game(config);
});
