import { defineStore } from 'pinia';

export const useAudioStore = defineStore('audio', {
  state: () => {
    // Load saved volume from localStorage on store initialization
    const savedVolume = parseFloat(localStorage.getItem('audioVolume'));
    const initialVolume = (savedVolume !== null && !isNaN(savedVolume)) ? savedVolume : 1.0;
    
    return {
      // Audio playback state
      isPlaying: false,
      currentTrack: null,
      currentTime: 0,
      duration: 0,
      volume: initialVolume,
      playbackRate: 1.0,
      shuffle: false,
      repeat: 'off', // 'off', 'all', 'one'
      
      // Audio context
      audioContext: null,
      analyserNode: null,
      sourceNode: null,
      
      // Track info
      title: 'No song playing',
      artist: '',
      album: '',
      albumArt: null,
      bpm: null,
      key: null,
      gain: 0, // dB gain
      
      // Queue
      queue: [],
      currentIndex: -1
    };
  },

  getters: {
    hasNext: (state) => state.currentIndex < state.queue.length - 1,
    hasPrevious: (state) => state.currentIndex > 0,
    currentQueueItem: (state) => {
      if (state.currentIndex >= 0 && state.currentIndex < state.queue.length) {
        return state.queue[state.currentIndex];
      }
      return null;
    }
  },

  actions: {
    setPlaying(playing) {
      this.isPlaying = playing;
    },
    
    setCurrentTrack(track) {
      this.currentTrack = track;
      if (track) {
        this.title = track.title || 'Unknown';
        this.artist = track.artist || '';
      }
    },
    
    setTime(current, duration) {
      this.currentTime = current;
      this.duration = duration;
    },
    
    setVolume(volume) {
      this.volume = volume;
    },
    
    setPlaybackRate(rate) {
      this.playbackRate = rate;
    },
    
    setShuffle(shuffle) {
      this.shuffle = shuffle;
    },
    
    setRepeat(repeat) {
      this.repeat = repeat;
    },
    
    setAudioContext(context) {
      this.audioContext = context;
    },
    
    setAnalyserNode(analyser) {
      this.analyserNode = analyser;
    },
    
    setSourceNode(source) {
      this.sourceNode = source;
    },
    
    setAlbumArt(art) {
      this.albumArt = art;
    },
    
    setTitle(title) {
      this.title = title;
    },
    
    setArtist(artist) {
      this.artist = artist;
    },
    
    setBPM(bpm) {
      this.bpm = bpm;
    },
    
    setKey(key) {
      this.key = key;
    },
    
    setGain(gain) {
      this.gain = gain;
    },
    
    setQueue(queue) {
      this.queue = queue;
    },
    
    setCurrentIndex(index) {
      this.currentIndex = index;
    },
    
    addToQueue(track) {
      this.queue.push(track);
    },
    
    removeFromQueue(index) {
      this.queue.splice(index, 1);
      if (index < this.currentIndex) {
        this.currentIndex--;
      }
    }
  }
});

