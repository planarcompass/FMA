import { Mrpas } from 'mrpas'
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
	this.fov = Mrpas;
	
    this.lights.enable();
	this.lights.setAmbientColor(0x222034);
	//this.lights.setAmbientColor(0xffffff);
	this.map = this.make.tilemap({ key: 'testMap' });
	const tiles = this.map.addTilesetImage('Test', 'sprites');
	this.groundLayer = this.map.createLayer(0, tiles, 0, 0).setPipeline('Light2D');
	this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
	
	// using a BlankDynamicLayer for procedural dungeon generation
		//this.groundLayer = this.map.createBlankDynamicLayer('Ground', tileset)

		// generate ground tile layer procedurally...

	this.fov = new Mrpas(this.map.width, this.map.height, (x, y) => {
		const tile = this.groundLayer.getTileAt(x, y);
		return tile && !tile.collides;
	})
		
	this.cursorGraphic = this.add.image(0, 0, 'sprites', 'cursor_green.png');
	this.cursorGraphic.setOrigin(0,0);
	this.spawnpoints = [];
	this.fovObjects = [];
	this.fovLights = [];
	this.convertObjects();
	let spawn = this.spawnpoints[this.registry.get('spawn')];
	this.player = new Player({
      scene: this,
      x: 0, 
      y: 0,
    });
	
	this.player.light = this.lights.addLight(this.player.x, this.player.y, 192, 0xfbf236);
	this.player.torch = true;
	const player = this.player;
	this.input.keyboard.on('keydown-T', event =>
        {
            if (this.player.torch == true)
			{
				this.player.torch = false;
				this.canUpdateFOV = true;
				player.light.setRadius(96);
				player.light.setIntensity(.5);
				player.light.setColor(0x639bff);
			} else {
				this.player.torch = true;
				this.canUpdateFOV = true;
				player.light.setRadius(192);
				player.light.setIntensity(1);
				player.light.setColor(0xfbf236);
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
	this.playerCord = {};
	this.playerCord.x = this.player.x;
	this.playerCord.y = this.player.y;
	this.canUpdateFOV = true;
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
	if (this.canUpdateFOV) {	
		this.computeFOV();
		this.playerCord.x = this.player.x;
		this.playerCord.y = this.player.y;
		this.fovObjects.forEach((fovObject) => {
			let fovTile = this.groundLayer.getTileAt(this.map.worldToTileX(fovObject.x), this.map.worldToTileX(fovObject.y));
			if (fovTile.alpha < 1) {
				if (fovObject.seen) {
					fovObject.alpha = .25;
				} else {
				fovObject.alpha = 0;
				}
			} else {
				fovObject.alpha = 1;
				fovObject.seen = true;
			}
		});
		this.fovLights.forEach((fovLight) => {
			let fovTile = this.groundLayer.getTileAt(this.map.worldToTileX(fovLight.x), this.map.worldToTileX(fovLight.y));
			if (fovTile.alpha < 1) {
				if (fovLight.seen) {
					fovLight.setIntensity(.5);
				} else {
				fovLight.setIntensity(0);
				}
			} else {
				fovLight.setIntensity(1);
				fovLight.seen = true;
			}	
		});
			
		this.canUpdateFOV = false;
	}	
	const distance = Phaser.Math.Distance.Between(this.playerCord.x, this.playerCord.y, this.player.x, this.player.y);
	if (distance >= 32) {
		this.canUpdateFOV = true;
	}
	
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
			lampSprite.seen = false;
			this.fovObjects.push(lampSprite);
			lampSprite.setOrigin(0,0);
			lampSprite.setPipeline('Light2D');
			let lampLight = this.lights.addLight(object.x + 16, object.y -16, 192 , 0xfbf236);
			this.fovLights.push(lampLight);
		  }
		  		  if (object.type === 'wall') {
			let wall = this.add.image(object.x, object.y -32, 'sprites', 'dungeonWallStoneGrey1.png');
			wall.seen = false;
			//this.fovObjects.push(wall);
			wall.setOrigin(0,0);
			wall.setPipeline('Light2D');
          }
		if (object.type === 'windowWest') {
		
			let window1 = this.lights.addLight(object.x, object.y + 16, 192, 0xcbdbfc);
		
			let window2 = this.lights.addLight(object.x + 48, object.y + 16, 96, 0xcbdbfc);
			let window3 = this.lights.addLight(object.x + 80, object.y + 16, 48, 0xcbdbfc);
			let window4 = this.lights.addLight(object.x + 112, object.y + 16, 24, 0xcbdbfc);
			this.fovLights.push(window1);
			this.fovLights.push(window2);
			this.fovLights.push(window3);
			this.fovLights.push(window4);
			
          }
		  
		  if (object.type === 'windowEast') {
			
			let window1 = this.lights.addLight(object.x, object.y + 16, 192, 0xcbdbfc);
		
			let window2 = this.lights.addLight(object.x - 16, object.y + 16, 96, 0xcbdbfc);
			let window3 = this.lights.addLight(object.x - 48, object.y + 16, 48, 0xcbdbfc);
			let window4 = this.lights.addLight(object.x - 80, object.y + 16, 24, 0xcbdbfc);
			this.fovLights.push(window1);
			this.fovLights.push(window2);
			this.fovLights.push(window3);
			this.fovLights.push(window4);
		  }
			
			
      
      }); 
  }

computeFOV()
{
	if (!this.fov || !this.map || !this.groundLayer || !this.player)
	{
		return
	}

	// get camera view bounds
	const camera = this.cameras.main
	const bounds = new Phaser.Geom.Rectangle(
		0,
		0,
		this.map.worldToTileX(this.map.widthInPixels) + 2,
		this.map.worldToTileX(this.map.heightInPixels) + 3
	)

	// set all tiles within camera view to invisible
	for (let y = bounds.y; y < bounds.y + bounds.height; y++)
	{
		for (let x = bounds.x; x < bounds.x + bounds.width; x++)
		{
			if (y < 0 || y >= this.map.height || x < 0 || x >= this.map.width)
			{
				continue
			}

			const tile = this.groundLayer.getTileAt(x, y)
			if (!tile)
			{
				continue
			}
			if (tile.seen){
				tile.alpha = .5;
			} else {
				tile.alpha = 0
			}
		}
	}

	// get player's position
	const px = this.map.worldToTileX(this.player.x)
	const py = this.map.worldToTileY(this.player.y)
	
	// compute fov from player's position
	let visDist;
	if (this.player.torch) {
		visDist = 12;
	} else {
		visDist = 6;
	}
	
	this.fov.compute(
		px,
		py,
		visDist,
		(x, y) => {
			const tile = this.groundLayer.getTileAt(x, y)
			if (!tile)
			{
				return false
			}
			return tile.alpha > 0
		},
		(x, y) => {
			const tile = this.groundLayer.getTileAt(x, y)
			if (!tile)
			{
				return
			}
			tile.alpha = 1
			tile.seen = true;
			}
		)
	}

}
  