import Phaser from 'phaser';
import { GridEngine, GridEngineHeadless } from "grid-engine";

import Preload from './scenes/Preload';
import Level from './scenes/Level';


const config = {
    type: Phaser.AUTO,
    parent: 'FMA',
    pixelArt: true,
    clearBeforeRender: false,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'phaser-example',
        width: 1024,
        height: 576
    },
	maxLights: 80,
    //physics: {
        //default: 'arcade'
    //},
	scene: [
		Preload,
		Level
		],
		plugins: {
    scene: [
      {
        key: "gridEngine",
        plugin: GridEngine,
        mapping: "gridEngine",
      },
    ]
  },
};

const game = new Phaser.Game(config);
