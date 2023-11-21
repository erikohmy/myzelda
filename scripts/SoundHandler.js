class SoundHandler {
    game;
    constructor(game) {
        this.game = game;
        this.sounds = {};
        this.music = {};
        this.currentMusic = null;
    }

    addSound(name, src) {
        return new Promise((resolve, reject) => {
            let sound = new Audio(src);
            this.sounds[name] = sound;
            console.log('adding sound', name)
            sound.addEventListener('canplaythrough', () => {
                resolve();
            }, { once: true });
        });
    }
    addMusic(name, src, start=0) {
        return new Promise((resolve, reject) => {
            let music = new Audio(src);
            this.music[name] = {
                name: name,
                audio: music,
                start: start,
                volume: 0.4,
            }
            music.volume = this.music[name].volume;
            console.log('adding music', name)
            music.addEventListener('canplaythrough', () => {
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

    play(name) {
        this.sounds[name].play();
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