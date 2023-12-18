export default class Player extends Phaser.GameObjects.Sprite {
  constructor(config) 
  {
    super(config.scene, config.x, config.y, 'sprites', 'mage.png');
    //config.scene.physics.world.enable(this);
    this.scene = config.scene;
	this.setOrigin(0,0);
	this.setPipeline('Light2D');
    this.scene.add.existing(this);
  }
  update(time, delta) 
  {
   
  }

  
}
