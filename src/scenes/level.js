import Player from './sprites/player';
export default class Level extends Phaser.Scene {
  constructor() 
  {
    super({
      key: 'Level'
    });
  }

  create() 
  {
    this.lights.enable().setAmbientColor(0x000000);
	this.map = this.make.tilemap({ key: 'testMap' });
	const tiles = this.map.addTilesetImage('Test', 'sprites');
	const layer = this.map.createLayer(0, tiles, 0, 0).setPipeline('Light2D');
	this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
	this.cursorGraphic = this.add.image(0, 0, 'sprites', 'cursor_green.png');
	this.cursorGraphic.setOrigin(0,0);
	this.spawnpoints = [];
	this.convertObjects();
	let spawn = this.spawnpoints[this.registry.get('spawn')];
	this.player = new Player({
      scene: this,
      x: 0, 
      y: 0,
    });
	
	this.player.light = this.lights.addLight(this.player.x, this.player.y, 192, 0xf7ce55);
	let torch = true;
	const player = this.player;
	this.input.keyboard.on('keydown-T', event =>
        {
            if (torch == true)
			{
				torch = false;
				player.light.setRadius(96);
				player.light.setIntensity(.5);
				player.light.setColor(0xb5d4ea);
			} else {
				torch = true;
				player.light.setRadius(192);
				player.light.setIntensity(1);
				player.light.setColor(0xf7ce55);
			}
        });
	
	const spawnX = spawn.x/32;
	const gridEngineConfig = {
    characters: [
      {
        id: "player",
        sprite: this.player,
		startPosition: { x: spawn.x/32, y: spawn.y/32},
		CharLayer: "ground"
      },
    ],
	numberOfDirections: 8,
	  };

	this.gridEngine.create(
		this.map, // Phaser.Tilemaps.Tilemap
		gridEngineConfig,
	);
	this.cameras.main.centerOn(this.player.x, this.player.y);
  
	this.input.keyboard.on('keydown-S', event =>
        {
            this.cameras.main.scrollY += 32;
        });
	this.input.keyboard.on('keydown-W', event =>
        {
            this.cameras.main.scrollY -= 32;
        });
	this.input.keyboard.on('keydown-D', event =>
        {
            this.cameras.main.scrollX += 32;
        });
	this.input.keyboard.on('keydown-A', event =>
        {
            this.cameras.main.scrollX -= 32;
        });
	this.input.keyboard.on('keydown-Q', event =>
        {
            this.cameras.main.centerOn(this.player.x, this.player.y);
        });
	this.input.on('pointerdown', function (pointer)
		{
			let moveToX = Phaser.Math.FloorTo((pointer.x + this.cameras.main.scrollX)/32);
			let moveToY = Phaser.Math.FloorTo((pointer.y+ this.cameras.main.scrollY)/32);
			this.gridEngine.moveTo("player", { x: moveToX, y: moveToY });
        }, this);

	this.hudText = this.add.text(800, 10, 'WASD to move camera \n Q to center on player \n T to toggle torch', { color: '#00ff00', align: 'right' });

    
  }

  update (time, delta) 
  {
	this.player.update(time, delta);
	this.player.light.setPosition(this.player.x, this.player.y);
	this.hudText.setPosition(800 + this.cameras.main.scrollX, 10 + this.cameras.main.scrollY);
    let cleanCursorX = Phaser.Math.FloorTo((this.input.activePointer.x + this.cameras.main.scrollX)/32)*32;
	let cleanCursorY = Phaser.Math.FloorTo((this.input.activePointer.y + this.cameras.main.scrollY)/32)*32;
	this.cursorGraphic.setPosition(cleanCursorX, cleanCursorY);
  }
  convertObjects ()
  {
	  //objects in map are checked by type(assigned in object layer in Tiled) and the appopriate extended sprite is created
    const objects = this.map.getObjectLayer('objects'); //find the object layer in the tilemap named 'objects'
    let regName
    objects.objects.forEach(
      (object) => {
        //create a series of points in our spawnpoints array
        if (object.type === 'spawn') {
          this.spawnpoints[object.name] = {
            x: object.x,
            y: object.y-32
          }
        }
		if (object.type === 'lamp') {
			let lampSprite = this.add.image(object.x, object.y -32, 'sprites', 'lamp.png');
			lampSprite.setOrigin(0,0);
			lampSprite.setPipeline('Light2D');
			this.lights.addLight(object.x + 16, object.y -16, 192 , 0xf7ce55);
          }
		if (object.type === 'windowWest') {
		
			this.lights.addLight(object.x, object.y + 16, 192);
		
			this.lights.addLight(object.x + 48, object.y + 16, 96);
			this.lights.addLight(object.x + 80, object.y + 16, 48);
			this.lights.addLight(object.x + 112, object.y + 16, 24);
		
          }
		  
		  if (object.type === 'windowEast') {
			console.log(object.properties);
			this.lights.addLight(object.x, object.y + 16, 192);
		
			this.lights.addLight(object.x - 16, object.y + 16, 96);
			this.lights.addLight(object.x - 48, object.y + 16, 48);
			this.lights.addLight(object.x - 80, object.y + 16, 24);
		  }
			
			
      
      }); 
  }
}
  