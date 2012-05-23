ig.module(
    'test'
)
.requires(
    'impact.game',
    'impact.entity',
    'impact.collision-map',
    'impact.background-map',
    'impact.font'
)
.defines(function(){

PigEntity = ig.Entity.extend({

    image: new ig.Image('images/pig.png'),
    size: {x:this.image.x,y:this.image.y},
    name: 'pig',
    init: function( x, y, settings ) {
        // Call the parent constructor
        this.parent( x, y, settings );
    },
});

// The actual Game Source
TriviaGame = ig.Game.extend({
    init: function() {            
        ig.system.smoothPositioning = false;
        ig.input.bind(ig.KEY.MOUSE1, 'shoot');
        ig.input.bindTouch('#canvas', 'shoot');
        this.background = new ig.Image('images/field.jpg');
        this.background.draw(0,0);
        this.sites = new ig.Image('images/sites.png');
        this.sites = new ig.Image('images/sites.png');
    },
    draw: function() {
        if( ig.input.state('shoot') ) {
            console.log(ig.input.mouse.x + ':' + ig.input.mouse.y);
            if( ig.input.mouse.x < 50 && ig.input.mouse.y < 50 )
                alert('yo');
        } else {
            this.background.draw(0,0);
            this.sites.draw(ig.input.mouse.x-122, ig.input.mouse.y-122);
        }
    },
   });
// Start the game - 30fps, 64x96 pixels, scaled up 5x
ig.main('#canvas', TestGame, 30, 800, 600 );
}); 
