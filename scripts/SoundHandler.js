class SoundHandler {
    game;
    constructor(game) {
        this.game = game;
        this.sounds = {};
        this.music = {};
        this.currentMusic = null;
        this._volume = 1;
    }

    get volume() {
        return this._volume;
    }
    set volume(volume) {
        this._volume = volume;
        for (let sound in this.sounds) {
            this.sounds[sound].volume = volume;
        }
        for (let music in this.music) {
            this.music[music].audio.volume = volume * this.music[music].volume;
        }
    }

    addSound(name, src) {
        return new Promise((resolve, reject) => {
            let sound = new Audio(src);
            this.sounds[name] = sound;
            sound.preload = 'auto';
            this.game.events.trigger('sound-adding', name, sound)
            sound.addEventListener('canplaythrough', () => {
                this.game.events.trigger('sound-added', name, sound)
                resolve();
            }, { once: true });
        });
    }
    addMusic(name, src, start=0) {
        return new Promise((resolve, reject) => {
            let music = new Audio(src);
            music.preload = 'auto';
            this.music[name] = {
                name: name,
                audio: music,
                start: start,
                volume: 0.4,
            }
            music.volume = this.music[name].volume;
            this.game.events.trigger('sound-adding', name, music)
            music.addEventListener('canplaythrough', () => {
                this.game.events.trigger('sound-added', name, music)
                resolve();
            }, { once: true });
            music.addEventListener('ended', () => {  // only fires when ends naturally
                let start = this.music[name].start;
                console.log('music ended, looping at', start);
                music.currentTime = start;
                music.play();
            });
        });
    }

    pause() {
        if(this.currentMusic && this.music[this.currentMusic]) {
            this.music[this.currentMusic].audio.pause();
        }
    }
    resume() {
        if(this.currentMusic && this.music[this.currentMusic]) {
            this.music[this.currentMusic].audio.play();
        }
    }

    play(name, starttime=0) {
        //this.sounds[name].play();
        // clone sound, so we can play multiple at once
        if (! this.sounds[name]) {
            console.error("Sound not found: " + name);
            return;
        }
        let clone = this.sounds[name].cloneNode();
        clone.volume = this.volume;
        clone.currentTime = starttime;
        clone.play();
        setTimeout(() => {
            clone.remove();
        }, clone.duration + 400);
    }
    stop(name) {
        this.sounds[name].pause();
        this.sounds[name].currentTime = 0;
    }
    stopAllSound() {
        for (let sound in this.sounds) {
            this.stop(sound);
        }
    }

    playMusic(name) {
        if (name == this.currentMusic) { 
            return;
        }
        this.stopAllMusic();
        this.currentMusic = name;
        let music = this.music[name];
        if (music) {
            if (! music.start) {
                music.audio.loop = true;
            }
            music.audio.volume = this.volume * music.volume;
            music.audio.play();
        }
    }
    stopMusic(name) {
        if (this.currentMusic == name) {
            this.currentMusic = null;
        }
        let music = this.music[name];
        if (music) {
            this.music[name].audio.pause();
            this.music[name].audio.currentTime = 0;
        }
    }
    stopAllMusic() {
        this.currentMusic = null;
        for (let music in this.music) {
            this.stopMusic(music);
        }
    }

    stopAll() {
        this.stopAllSound();
        this.stopAllMusic();
    }
}