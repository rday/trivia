// lib/impact/sound.js
ig.baked=true;ig.module('impact.sound').defines(function(){ig.SoundManager=ig.Class.extend({clips:{},volume:1,channels:4,format:'mp3',init:function(){this.format=ig.$new('audio').canPlayType('audio/mpeg')?'mp3':'ogg';},load:function(path,multiChannel,loadCallback){if(this.clips[path]){if(multiChannel&&this.clips[path].length<this.channels){for(var i=this.clips[path].length;i<this.channels;i++){this.clips[path].push(this.clips[path][0].cloneNode(true));}}
return this.clips[path][0];}
var realPath=path.match(/^(.*)\.\w+$/)[1]+'.'+this.format+ig.nocache;var clip=ig.$new('audio');if(loadCallback){clip.addEventListener('canplaythrough',function(ev){this.removeEventListener('canplaythrough',arguments.callee,false)
loadCallback(path,true,ev);},false);clip.addEventListener('error',function(ev){loadCallback(path,true,ev);},false);}
clip.autobuffer=true;clip.preload='auto';clip.src=realPath;clip.load();this.clips[path]=[clip];if(multiChannel){for(var i=1;i<this.channels;i++){this.clips[path].push(clip.cloneNode(true));}}
return clip;},get:function(path){var channels=this.clips[path];for(var i=0,clip;clip=channels[i++];){if(clip.paused||clip.ended){if(clip.ended){clip.currentTime=0;}
return clip;}}
channels[0].pause();channels[0].currentTime=0;return channels[0];}});ig.Music=ig.Class.extend({tracks:[],currentTrack:null,currentIndex:0,random:false,_volume:1,_loop:false,_fadeInterval:0,_fadeTimer:null,_endedCallbackBound:null,init:function(){this._endedCallbackBound=this._endedCallback.bind(this);if(Object.defineProperty){Object.defineProperty(this,"volume",{get:this.getVolume.bind(this),set:this.setVolume.bind(this)});Object.defineProperty(this,"loop",{get:this.getLooping.bind(this),set:this.setLooping.bind(this)});}
else if(this.__defineGetter__){this.__defineGetter__('volume',this.getVolume.bind(this));this.__defineSetter__('volume',this.setVolume.bind(this));this.__defineGetter__('loop',this.getLooping.bind(this));this.__defineSetter__('loop',this.setLooping.bind(this));}},add:function(music){if(!ig.Sound.enabled){return;}
var path=music instanceof ig.Sound?music.path:music;var track=ig.soundManager.load(path,false);track.loop=this._loop;track.volume=this._volume;track.addEventListener('ended',this._endedCallbackBound,false);this.tracks.push(track);if(!this.currentTrack){this.currentTrack=track;}},next:function(){if(!this.tracks.length){return;}
this.stop();this.currentIndex=this.random?(Math.random()*this.tracks.length).floor():(this.currentIndex+1)%this.tracks.length;this.currentTrack=this.tracks[this.currentIndex];this.play();},pause:function(){if(!this.currentTrack){return;}
this.currentTrack.pause();},stop:function(){if(!this.currentTrack){return;}
this.currentTrack.pause();this.currentTrack.currentTime=0;},play:function(){if(!this.currentTrack){return;}
this.currentTrack.play();},getLooping:function(){return this._loop;},setLooping:function(l){this._loop=l;for(var i in this.tracks){this.tracks[i].loop=l;}},getVolume:function(){return this._volume;},setVolume:function(v){this._volume=v.limit(0,1);for(var i in this.tracks){this.tracks[i].volume=this._volume;}},fadeOut:function(time){if(!this.currentTrack){return;}
clearInterval(this._fadeInterval);this.fadeTimer=new ig.Timer(time);this._fadeInterval=setInterval(this._fadeStep.bind(this),50);},_fadeStep:function(){var v=this.fadeTimer.delta().map(-this.fadeTimer.target,0,1,0).limit(0,1)*this._volume;if(v<=0.01){this.stop();this.currentTrack.volume=this._volume;clearInterval(this._fadeInterval);}
else{this.currentTrack.volume=v;}},_endedCallback:function(){if(this._loop){this.play();}
else{this.next();}}});ig.Sound=ig.Class.extend({path:'',volume:1,currentClip:null,multiChannel:true,init:function(path,multiChannel){this.path=path;this.multiChannel=(multiChannel!==false);this.load();},load:function(loadCallback){if(!ig.Sound.enabled){if(loadCallback){loadCallback(this.path,true);}
return;}
if(ig.ready){ig.soundManager.load(this.path,this.multiChannel,loadCallback);}
else{ig.addResource(this);}},play:function(){if(!ig.Sound.enabled){return;}
this.currentClip=ig.soundManager.get(this.path);this.currentClip.volume=ig.soundManager.volume*this.volume;this.currentClip.play();},stop:function(){if(this.currentClip){this.currentClip.pause();this.currentClip.currentTime=0;}}});ig.Sound.enabled=true;});
