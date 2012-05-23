ig.module(
    'test.entities.fieldentity'
)
.requires(
    'impact.entity'
)
.defines(function(){
FieldEntity = ig.Entity.extend({

    size: {x:800,y:600},
    animSheet: new ig.AnimationSheet('images/field.jpg', 800, 600),
    name: 'field',
    init: function( x, y, settings ) {
        // Call the parent constructor
        this.parent( x, y, settings );
        this.addAnim('idle', 1, [0]);
        this.collides(ig.Entity.COLLIDES.NEVER);
    }
});
}); 
