function GameConfig() {
    if( this.config == null ) this.config = {}
}

GameConfig.prototype.get = function(index) {
        if( !this.config[index] ) {
            this.config[index] = $.cookie(index);
        }
        return this.config[index];
    };

GameConfig.prototype.set = function(index, value) {
        this.config[index] = value;
        $.cookie(index, value, {path: "/"});
};

var config = new GameConfig();

