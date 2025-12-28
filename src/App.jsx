import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, RotateCcw, Pause, Volume2, VolumeX, Music, Trophy, ArrowLeft, Timer, Users, Info, ArrowRight, Sun, Cloud, Star, X, MapPin, Flag, ChevronLeft } from 'lucide-react';

/**
 * UEFA CHAMPONG LEAGUE: ULTRA EDITION (Holiday Release Candidate)
 * - LOGIC: Rival faces you in PRACTICE/PRO. Randoms in EASY/MEDIUM/HARD.
 * - LOGIC: Opponents rotate to ensure variety in campaign mode.
 * - UI: Team names fit in scoreboard (scaled down).
 * - UI: Timer is always digital RED.
 * - FIX: Timer overflow (0:-2) permanently fixed.
 */

// --- Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const FIELD_MARGIN_Y = 60; 
const FIELD_MARGIN_X = 80; 

const FIELD_TOP = FIELD_MARGIN_Y;
const FIELD_BOTTOM = CANVAS_HEIGHT - FIELD_MARGIN_Y;
const FIELD_LEFT = FIELD_MARGIN_X;
const FIELD_RIGHT = CANVAS_WIDTH - FIELD_MARGIN_X;

const FIELD_HEIGHT = FIELD_BOTTOM - FIELD_TOP;
const FIELD_WIDTH = FIELD_RIGHT - FIELD_LEFT;

const PLAYER_RADIUS = 30;
const FAN_RADIUS = 9;
const BALL_RADIUS = 12;
const POST_RADIUS = 8;
const GOAL_SPAN = 170; 
const MATCH_DURATION = 90;

const MAX_SPEED_CAP = 22; 
const MAX_PLAYER_VELOCITY = 18; 

// --- Character Database ---
const CHARACTERS = {
  MESSI:    { id: 'MESSI',    name: 'MESSI',    number: '10', team: 'INTER MIAMI', color: '#F47374', secondary: '#111111', text: 'white', rival: 'RONALDO' },
  RONALDO:  { id: 'RONALDO',  name: 'RONALDO',  number: '7',  team: 'AL NASSR',    color: '#FFFF00', secondary: '#0057B7', text: 'black', rival: 'MESSI' },
  MBAPPE:   { id: 'MBAPPE',   name: 'MBAPPE',   number: '9',  team: 'REAL MADRID', color: '#FFFFFF', secondary: '#FEBE10', text: 'black', rival: 'DEMBELE' },
  HAALAND:  { id: 'HAALAND',  name: 'HAALAND',  number: '9',  team: 'MAN CITY',    color: '#6CABDD', secondary: '#1C2C5B', text: 'black', rival: 'KANE' },
  PALMER:   { id: 'PALMER',   name: 'PALMER',   number: '20', team: 'CHELSEA',      color: '#034694', secondary: '#FFFFFF', text: 'white', rival: 'VLAHOVIC' },
  VLAHOVIC: { id: 'VLAHOVIC', name: 'VLAHOVIC', number: '9',  team: 'JUVENTUS',    color: '#000000', secondary: '#FFFFFF', text: 'white', rival: 'PALMER' },
  DEMBELE:  { id: 'DEMBELE',  name: 'DEMBELE',  number: '10', team: 'PSG',          color: '#004170', secondary: '#DA291C', text: 'white', rival: 'MBAPPE' },
  KANE:     { id: 'KANE',     name: 'KANE',     number: '9',  team: 'BAYERN',       color: '#DC052D', secondary: '#FFFFFF', text: 'white', rival: 'HAALAND' }
};

const CHAT_PHRASES = {
  MESSI:    { score: "Qué mirás bobo? 😂", concede: "FIFA help me! 😭" },
  RONALDO:  { score: "Siuuuuuu 🔥", concede: "Unfair! 😡" },
  MBAPPE:   { score: "Hala Madrid 👑", concede: "Not fast enough..." },
  HAALAND:  { score: "Robot Mode 🤖", concede: "System Error ⚠️" },
  PALMER:   { score: "Ice Cold 🥶", concede: "Just a scratch." },
  VLAHOVIC: { score: "Fino Alla Fine 🦓", concede: "Mamma Mia!" },
  DEMBELE:  { score: "Allez Paris! ⚡", concede: "Sacre Bleu!" },
  KANE:     { score: "Mia San Mia 🍺", concede: "No trophy again? 😢" }
};

const REF_PHRASES = ["Play on!", "Clean tackle!", "I'm watching you!", "No foul!", "Keep moving!", "VAR check...", "Nice weather eh?"];
const FAN_CHEERS = ["YAYYY! 😀", "GOAL! ⚽", "WOOO!", "LET'S GO!", "LEGEND! 🌟"];
const FAN_BOOS = ["BOOO! 😡", "NOOO!", "UNFAIR!", "REF!!!", "WHAT?!"];

const DIFFICULTY = {
  PRACTICE: { id: 'PRACTICE', aiSpeed: 0, error: 0, startSpeed: 8, maxSpeed: 10, label: "Warm Up", next: 'EASY', desc: "AI Stands Still" },
  EASY:     { id: 'EASY',     aiSpeed: 3.0, error: 90, startSpeed: 6,  maxSpeed: 10, label: "Rookie", next: 'MEDIUM', desc: "For Beginners" }, 
  MEDIUM:   { id: 'MEDIUM',   aiSpeed: 4.5, error: 60, startSpeed: 8,  maxSpeed: 14, label: "Semi-Pro", next: 'HARD', desc: "Good Challenge" },
  HARD:     { id: 'HARD',     aiSpeed: 6.0, error: 35, startSpeed: 10, maxSpeed: 16, label: "Professional", next: 'PRO', desc: "Skilled AI" },
  PRO:      { id: 'PRO',      aiSpeed: 8.0, error: 10, startSpeed: 13, maxSpeed: 20, label: "Legend", next: null, desc: "Master Class" }
};

const STADIUMS = [
    { id: 'CHASE',      name: 'Chase Stadium',       c1: '#4a9c59', c2: '#52a862', bg: '#1a050f', stand: '#F47374', pattern: 'PLAIN',     desc: 'Inter Miami Home' },
    { id: 'AL_AWWAL',   name: 'Al-Awwal Park',       c1: '#eab308', c2: '#ca8a04', bg: '#1e1b02', stand: '#0057B7', pattern: 'CIRCLES',   desc: 'Al Nassr Home' },
    { id: 'BERNABEU',   name: 'Santiago Bernabéu',   c1: '#114a26', c2: '#1a6e3a', bg: '#0f172a', stand: '#334155', pattern: 'CHECKERED', desc: 'Real Madrid Home' },
    { id: 'ETIHAD',     name: 'Etihad Stadium',      c1: '#2e8b57', c2: '#3cb371', bg: '#0c1d2e', stand: '#6CABDD', pattern: 'CIRCLES',   desc: 'Man City Home' },
    { id: 'STAMFORD',   name: 'Stamford Bridge',     c1: '#1e3a8a', c2: '#1e40af', bg: '#020617', stand: '#034694', pattern: 'STRIPES_H', desc: 'Chelsea Home' },
    { id: 'ALLIANZ_J',  name: 'Allianz Stadium',     c1: '#1f2937', c2: '#374151', bg: '#000000', stand: '#FFFFFF', pattern: 'STRIPES_V', desc: 'Juventus Home' },
    { id: 'PARC',       name: 'Parc des Princes',    c1: '#064e3b', c2: '#065f46', bg: '#020420', stand: '#DA291C', pattern: 'CHECKERED', desc: 'PSG Home' },
    { id: 'ALLIANZ_B',  name: 'Allianz Arena',       c1: '#7f1d1d', c2: '#991b1b', bg: '#2a0202', stand: '#DC052D', pattern: 'STRIPES_V', desc: 'Bayern Home' }
];

// --- AUDIO ENGINE ---
class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.crowdNode = null;
    this.isPlayingMusic = false;
  }
  
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.3; 
      this.musicGain.connect(this.masterGain);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
    }
    this.resume();
  }
  
  playSFX(type) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    const createNoise = (duration) => {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        return buffer;
    };

    if (type === 'cheer') {
        const noise = this.ctx.createBufferSource();
        noise.buffer = createNoise(2.0);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, t);
        filter.frequency.linearRampToValueAtTime(3000, t + 1.0); 
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 2.0);
        noise.connect(filter); filter.connect(gain); gain.connect(this.sfxGain);
        noise.start();
        
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(80, t+1);
        const hGain = this.ctx.createGain();
        hGain.gain.setValueAtTime(0.3, t);
        hGain.gain.linearRampToValueAtTime(0, t+1);
        osc.connect(hGain); hGain.connect(this.sfxGain);
        osc.start(); osc.stop(t+1);

    } else if (type === 'boo') {
        const noise = this.ctx.createBufferSource();
        noise.buffer = createNoise(1.5);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 400; 
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.5);
        gain.gain.linearRampToValueAtTime(0, t + 1.5);
        noise.connect(filter); filter.connect(gain); gain.connect(this.sfxGain);
        noise.start();

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(80, t); osc.frequency.linearRampToValueAtTime(60, t+1.5);
        const gGain = this.ctx.createGain();
        gGain.gain.value = 0.2; gGain.gain.linearRampToValueAtTime(0, t+1.5);
        osc.connect(gGain); gGain.connect(this.sfxGain);
        osc.start(); osc.stop(t+1.5);

    } else if (type === 'kick') {
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.sfxGain);
      osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
      gain.gain.setValueAtTime(0.7, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.start(t); osc.stop(t + 0.15);
    } else if (type === 'post') {
      const osc = this.ctx.createOscillator(); osc.type = 'triangle';
      const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.sfxGain);
      osc.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.6, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t); osc.stop(t + 0.3);
    } else if (type === 'whistle') {
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.sfxGain);
      osc.frequency.setValueAtTime(2500, t);
      const lfo = this.ctx.createOscillator(); lfo.frequency.value = 50;
      const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 300;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency); lfo.start();
      gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.6, t + 0.05); gain.gain.linearRampToValueAtTime(0, t + 0.6);
      osc.start(t); osc.stop(t + 0.6);
    } else if (type === 'warning') {
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.type = 'triangle'; osc.frequency.setValueAtTime(400, t);
        gain.gain.setValueAtTime(0.3, t); gain.gain.linearRampToValueAtTime(0, t+0.5);
        osc.start(t); osc.stop(t+0.5);
    }
  }

  startCrowd() {
    if (!this.ctx || this.crowdNode) return;
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate*2, this.ctx.sampleRate);
    const d = b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.5;
    const n = this.ctx.createBufferSource(); n.buffer=b; n.loop=true;
    const f = this.ctx.createBiquadFilter(); f.frequency.value=600;
    const g = this.ctx.createGain(); g.gain.value=0.08;
    n.connect(f); f.connect(g); g.connect(this.sfxGain); n.start();
    this.crowdNode = {noise:n, filter:f, gain:g};
  }
  
  swellCrowd() {
      if(!this.crowdNode) return; const t=this.ctx.currentTime;
      this.crowdNode.gain.gain.setValueAtTime(0.08, t); this.crowdNode.gain.gain.linearRampToValueAtTime(0.6, t+0.5); this.crowdNode.gain.gain.linearRampToValueAtTime(0.08, t+3);
  }
  
  stopCrowd() { if(this.crowdNode) { this.crowdNode.noise.stop(); this.crowdNode=null; } }

  startMusic() { 
      if (!this.ctx || this.isPlayingMusic) return; 
      this.isPlayingMusic = true; 
      
      const chords = [ [261.63, 329.63, 392.00], [349.23, 440.00, 523.25], [392.00, 493.88, 587.33], [261.63, 329.63, 392.00] ];
      let chordIndex = 0;
      const playChord = () => {
          if (!this.isPlayingMusic) return;
          const t = this.ctx.currentTime;
          const chord = chords[chordIndex];
          chord.forEach(freq => {
              const osc = this.ctx.createOscillator(); osc.type = 'sawtooth'; 
              const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 800;
              const gain = this.ctx.createGain();
              gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.05, t + 1.0); gain.gain.linearRampToValueAtTime(0, t + 3.8);
              osc.connect(filter); filter.connect(gain); gain.connect(this.musicGain);
              osc.frequency.value = freq; osc.detune.value = Math.random() * 10 - 5;
              osc.start(t); osc.stop(t + 4.0);
          });
          chordIndex = (chordIndex + 1) % chords.length;
          this.anthemInterval = setTimeout(playChord, 4000);
      };
      playChord();
  }
  stopMusic() { this.isPlayingMusic = false; if (this.anthemInterval) clearTimeout(this.anthemInterval); }
  toggleMute(m) { if(this.masterGain) this.masterGain.gain.value = m ? 0 : 1; }
  toggleMusicMute(m) { if(this.musicGain) this.musicGain.gain.value = m ? 0 : 0.3; }
}

const audioManager = new AudioManager();

// --- COMPONENTS ---

// FIX: Scoreboard CSS tweaked to fit longer names
const Scoreboard = ({ scores, timerColor, isGoldenGoal, timerDisplay, timerRef, p1Char, p2Char }) => (
  <div className="w-full max-w-4xl bg-gradient-to-b from-neutral-800 to-neutral-900 border-b-4 border-black rounded-b-xl flex justify-between items-center px-6 py-2 mb-2 shadow-2xl relative z-10 mx-auto transform hover:scale-[1.01] transition-transform">
      <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col items-end w-full overflow-hidden">
              <div className="text-lg font-black italic text-white tracking-wider truncate w-full text-right">{p1Char.team}</div>
              <div className="text-xs font-bold text-gray-400 truncate w-full text-right">{p1Char.name}</div>
          </div>
          <div className="h-12 w-16 bg-black rounded flex items-center justify-center border border-neutral-700 shrink-0">
              <span className="text-4xl font-black text-white font-mono">{scores.p1}</span>
          </div>
      </div>
      <div className="px-8 flex flex-col items-center">
         <div className="bg-black px-6 py-1 rounded text-3xl font-mono font-bold border-2 border-neutral-700 flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{color: timerColor}}>
              <Timer size={24} className={isGoldenGoal ? "text-yellow-400 animate-pulse" : "text-neutral-500"} /> 
              <span ref={timerRef}>{isGoldenGoal ? "GOLDEN" : timerDisplay}</span>
          </div>
          <div className="text-[10px] font-bold text-neutral-500 mt-1 tracking-widest">OFFICIAL MATCH TIME</div>
      </div>
      <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="h-12 w-16 bg-black rounded flex items-center justify-center border border-neutral-700 shrink-0">
              <span className="text-4xl font-black text-white font-mono">{scores.p2}</span>
          </div>
          <div className="flex flex-col items-start w-full overflow-hidden">
              <div className="text-lg font-black italic text-white tracking-wider truncate w-full text-left">{p2Char.team}</div>
              <div className="text-xs font-bold text-gray-400 truncate w-full text-left">{p2Char.name}</div>
          </div>
      </div>
  </div>
);

const GoalOverlay = ({ text }) => {
    if (!text) return null;
    return (
        <div className="absolute top-10 w-full flex justify-center z-50 pointer-events-none">
            <div className="flex gap-2 text-7xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-tighter italic">
                {text.split('').map((char, i) => (
                    <span key={i} className="animate-bounce" style={{animationDuration: '1s', animationDelay: `${i * 0.1}s`}}>
                        {char}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default function UEFAChampongUltra() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const timerRef = useRef(null); 
  const noisePatternRef = useRef(null);

  // --- Game State ---
  const state = useRef({
    ball: { x: 0, y: 0, dx: 0, dy: 0, speed: 0 },
    p1: { x: 0, y: 0, prevX: 0, prevY: 0, score: 0, char: CHARACTERS.MESSI },
    p2: { x: 0, y: 0, prevX: 0, prevY: 0, score: 0, char: CHARACTERS.RONALDO },
    config: { difficulty: 'MEDIUM', stadium: STADIUMS[0] },
    mouseTarget: { x: 100, y: CANVAS_HEIGHT/2 },
    referee: { x: CANVAS_WIDTH/2, y: FIELD_TOP - 15, dialog: null, dialogTimer: 0 }, 
    roundState: 'IDLE',
    countdownTimer: 0,
    dropY: 0,
    timeLeft: MATCH_DURATION,
    isGoldenGoal: false,
    goalTimer: 0, 
    frameCount: 0,
    isPlaying: false,
    isPaused: false,
    fans: [],
    photographers: [],
    particles: [],
    shake: 0,
    scorer: null, 
    chatBubbles: { p1: "", p2: "" }
  });

  const [uiView, setUiView] = useState('MENU');
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [timerDisplay, setTimerDisplay] = useState("90:00");
  
  // FIX: Default timer color is RED (#EF4444) to match digital style requested
  const [timerColor, setTimerColor] = useState("#EF4444"); 
  const [overlayText, setOverlayText] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  // --- Fan & Photographer Generation ---
  useEffect(() => {
    const createNoisePattern = () => {
        const size = 128;
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        const cx = c.getContext('2d');
        cx.fillStyle = 'rgba(0,0,0,0)';
        cx.fillRect(0,0,size,size);
        for(let i=0; i<size; i+=2) {
            for(let j=0; j<size; j+=2) {
                if(Math.random() > 0.8) {
                    cx.fillStyle = `rgba(255,255,255, ${Math.random() * 0.05})`; 
                    cx.fillRect(i, j, 1, 1);
                } else if(Math.random() > 0.8) {
                    cx.fillStyle = `rgba(0,0,0, ${Math.random() * 0.05})`; 
                    cx.fillRect(i, j, 1, 1);
                }
            }
        }
        return c;
    }
    noisePatternRef.current = createNoisePattern();

    const fans = [];
    const createFanSection = (minY, maxY, count) => {
        for(let i=0; i<count; i++) {
            fans.push({
                x: Math.random() * CANVAS_WIDTH,
                y: minY + Math.random() * (maxY - minY),
                team: Math.random() > 0.5 ? 'p1' : 'p2',
                baseY: 0, offset: Math.random() * 100, speed: 0.05 + Math.random()*0.1,
                dialog: null, dialogTimer: 0
            });
        }
    };
    createFanSection(0, FIELD_MARGIN_Y - 20, 200); 
    createFanSection(CANVAS_HEIGHT - FIELD_MARGIN_Y + 20, CANVAS_HEIGHT, 200); 
    state.current.fans = fans;

    const photogs = [];
    const addPhotog = (x, y) => photogs.push({ x, y, flashTimer: 0 });
    for(let y=FIELD_TOP + 10; y<FIELD_BOTTOM; y+=40) {
        addPhotog(15, y + Math.random()*10);
        addPhotog(35, y + Math.random()*10);
    }
    for(let y=FIELD_TOP + 10; y<FIELD_BOTTOM; y+=40) {
        addPhotog(CANVAS_WIDTH-15, y + Math.random()*10);
        addPhotog(CANVAS_WIDTH-35, y + Math.random()*10);
    }
    state.current.photographers = photogs;
  }, []);

  const ensureAudio = () => { audioManager.init(); audioManager.startMusic(); audioManager.startCrowd(); };

  const createSparks = (x, y, color, count = 15) => {
    for (let i = 0; i < count; i++) {
      state.current.particles.push({
        x, y, vx: (Math.random()-0.5)*(count), vy: (Math.random()-0.5)*(count),
        life: 1.0, color, size: Math.random()*3+2
      });
    }
  };

  const endGame = () => { state.current.isPlaying = false; setUiView('GAMEOVER'); };

  const startRound = () => {
    const s = state.current;
    s.roundState = 'COUNTDOWN'; 
    s.countdownTimer = 60; 
    s.ball.x = CANVAS_WIDTH/2; s.ball.y = -50; s.dropY = CANVAS_HEIGHT/2;
    s.ball.dx = 0; s.ball.dy = 0; s.ball.speed = 0;
  };

  const launchBall = () => {
    const s = state.current;
    const diff = DIFFICULTY[s.config.difficulty];
    const speed = diff.startSpeed || 8; 
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const dirY = (Math.random()*2-1) * 0.7;
    const len = Math.sqrt(dirX*dirX + dirY*dirY);
    s.ball.dx = (dirX/len)*speed; s.ball.dy = (dirY/len)*speed; s.ball.speed = speed;
  };

  const scorePoint = (scorer) => {
    const s = state.current;
    s[scorer].score++;
    setScores({p1: s.p1.score, p2: s.p2.score});
    setOverlayText("GOALLL!!!");
    
    const p1Name = s.p1.char.name;
    const p2Name = s.p2.char.name;
    const getPhrase = (name, type) => CHAT_PHRASES[name] ? CHAT_PHRASES[name][type] : (type === 'score' ? 'YES!' : 'NO!');

    if (scorer === 'p1') { 
        s.chatBubbles.p1 = getPhrase(p1Name, 'score'); s.chatBubbles.p2 = getPhrase(p2Name, 'concede'); 
        audioManager.playSFX('cheer');
    } else { 
        s.chatBubbles.p2 = getPhrase(p2Name, 'score'); s.chatBubbles.p1 = getPhrase(p1Name, 'concede'); 
        audioManager.playSFX('boo');
    }

    s.roundState = 'CELEBRATION'; s.scorer = scorer; s.goalTimer = 120; s.ball.speed = 0; s.ball.dx = 0; s.ball.dy = 0;
    
    if(scorer === 'p1') { audioManager.swellCrowd(); audioManager.playSFX('horn'); s.fans.forEach(f => { if(f.team === 'p1') f.baseY = -20; }); }
    else { audioManager.playSFX('boo'); audioManager.playSFX('horn'); s.fans.forEach(f => { if(f.team === 'p2') f.baseY = -20; }); }
    
    s.photographers.forEach(p => { if(Math.random() > 0.3) p.flashTimer = Math.floor(Math.random() * 20) + 5; });

    s.fans.forEach(f => {
        if (Math.random() < 0.1) { 
            f.dialogTimer = 120; 
            if (f.team === scorer) { f.dialog = FAN_CHEERS[Math.floor(Math.random() * FAN_CHEERS.length)]; } 
            else { f.dialog = FAN_BOOS[Math.floor(Math.random() * FAN_BOOS.length)]; }
        }
    });
  };

  const initMatch = (diff) => {
    const s = state.current;
    s.config.difficulty = diff;
    s.p1.score = 0; s.p2.score = 0; s.timeLeft = MATCH_DURATION; s.isGoldenGoal = false; s.ball.speed = 0; 
    setScores({p1:0, p2:0}); 
    setTimerColor("#EF4444"); // Reset to red
    if(timerRef.current) timerRef.current.innerText = "90:00"; 
    startRound();
  };

  // --- LOGIC: DIFFERENT OPPONENT FOR NEXT MATCH ---
  const startNextMatch = (diff) => {
      // 1. If Next is PRO, we fight the Rival
      if (diff === 'PRO') {
         const rivalId = state.current.p1.char.rival;
         state.current.p2.char = CHARACTERS[rivalId];
      } else {
        // 2. Otherwise, pick someone random who isn't P1 and isn't the previous opponent
        const p1Id = state.current.p1.char.id;
        const currentP2Id = state.current.p2.char.id;
        
        const opponents = Object.values(CHARACTERS).filter(c => c.id !== p1Id && c.id !== currentP2Id);
        // Fallback (rare)
        const pool = opponents.length > 0 ? opponents : Object.values(CHARACTERS).filter(c => c.id !== p1Id);
        
        const randomOp = pool[Math.floor(Math.random() * pool.length)];
        state.current.p2.char = randomOp;
      }
      
      initMatch(diff);
      state.current.isPlaying = true; state.current.isPaused = false; setUiView('PLAYING'); update(); 
  };

  const checkCircleCollision = (ball, player, difficulty) => {
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const minDist = BALL_RADIUS + PLAYER_RADIUS;

    if (dist < minDist) {
      let nx = dx / dist; let ny = dy / dist; if (dist === 0) { nx = 1; ny = 0; }
      const pen = minDist - dist;
      ball.x += nx * pen; ball.y += ny * pen;
      let pVx = player.x - player.prevX; let pVy = player.y - player.prevY;
      pVx = Math.max(-MAX_PLAYER_VELOCITY, Math.min(MAX_PLAYER_VELOCITY, pVx));
      pVy = Math.max(-MAX_PLAYER_VELOCITY, Math.min(MAX_PLAYER_VELOCITY, pVy));
      const dvx = ball.dx - pVx; const dvy = ball.dy - pVy;
      const velAlongNormal = dvx * nx + dvy * ny;
      if (velAlongNormal > 0) return false;
      const restitution = 1.05; const j = -(1 + restitution) * velAlongNormal;
      ball.dx += j * nx; ball.dy += j * ny;
      ball.dx += pVx * 0.4; ball.dy += pVy * 0.4; 
      const currentSpeed = Math.sqrt(ball.dx*ball.dx + ball.dy*ball.dy);
      const settings = DIFFICULTY[difficulty];
      let finalSpeed = Math.max(currentSpeed, settings.startSpeed || 5);
      finalSpeed = Math.min(finalSpeed, MAX_SPEED_CAP);
      if (currentSpeed > 0) { ball.dx = (ball.dx / currentSpeed) * finalSpeed; ball.dy = (ball.dy / currentSpeed) * finalSpeed; ball.speed = finalSpeed; }
      const isHardSmash = currentSpeed > 10;
      state.current.shake = isHardSmash ? 8 : 4;
      audioManager.playSFX('kick', isHardSmash ? 1.5 : 1);
      createSparks(ball.x, ball.y, '#FFD700', isHardSmash ? 25 : 10);
      return true;
    }
    return false;
  };

  const checkPostCollision = (px, py) => {
    const s = state.current;
    const dx = s.ball.x - px; 
    const dy = s.ball.y - py;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const minDist = BALL_RADIUS + POST_RADIUS;

    if (dist < minDist) {
       const nx = dx / dist; 
       const ny = dy / dist;
       const overlap = minDist - dist;
       
       s.ball.x += nx * overlap; 
       s.ball.y += ny * overlap;

       const dot = s.ball.dx * nx + s.ball.dy * ny;
       if (dot < 0) {
           s.ball.dx = s.ball.dx - 2 * dot * nx; 
           s.ball.dy = s.ball.dy - 2 * dot * ny;
           s.ball.speed *= 0.85; s.ball.dx *= 0.85; s.ball.dy *= 0.85;
           audioManager.playSFX('post'); 
           s.shake = 5; 
           createSparks(px, py, '#FFF');
       }
       return true;
    }
    return false;
  };

  const moveBall = () => { 
      const s = state.current; 
      s.ball.x += s.ball.dx; s.ball.y += s.ball.dy; 
      if (Math.abs(s.ball.dx) < 0.5 && Math.abs(s.ball.dy) > 2) {
          s.ball.dx += (Math.random() > 0.5 ? 2.0 : -2.0);
      }
  };

  const updateAI = () => {
    const s = state.current;
    if (s.roundState !== 'PLAYING') return;
    const ai = DIFFICULTY[s.config.difficulty];
    if (ai.id === 'PRACTICE') {
        const targetX = FIELD_RIGHT - 60; const targetY = CANVAS_HEIGHT / 2;
        s.p2.x += (targetX - s.p2.x) * 0.1; s.p2.y += (targetY - s.p2.y) * 0.1; return;
    }
    
    let targetY = s.ball.y;
    const timeToReach = (s.p2.x - s.ball.x) / (s.ball.dx || 1); 
    const canPredict = ai.id === 'MEDIUM' || ai.id === 'HARD' || ai.id === 'PRO';
    if (s.ball.dx > 0 && canPredict) { 
        let predictedY = s.ball.y + (s.ball.dy * timeToReach);
        while (predictedY < FIELD_TOP || predictedY > FIELD_BOTTOM) {
            if (predictedY < FIELD_TOP) predictedY = FIELD_TOP + (FIELD_TOP - predictedY);
            if (predictedY > FIELD_BOTTOM) predictedY = FIELD_BOTTOM - (predictedY - FIELD_BOTTOM);
        }
        const error = Math.sin(s.frameCount * 0.05) * ai.error;
        targetY = predictedY + error;
    } else { targetY = s.ball.y; }
    if (targetY < CANVAS_HEIGHT/2) targetY -= 10; else targetY += 10;

    const dy = targetY - s.p2.y;
    let moveStep = Math.min(Math.abs(dy), ai.aiSpeed);
    if (Math.abs(dy) < 20) moveStep *= 0.5;

    s.p2.y += Math.sign(dy) * moveStep;

    let targetX = FIELD_RIGHT - 60; 
    if ((ai.id === 'HARD' || ai.id === 'PRO') && s.ball.x > CANVAS_WIDTH * 0.4) { targetX = Math.min(FIELD_RIGHT - 20, s.ball.x + 30); }
    if (ai.id === 'MEDIUM' && s.ball.x > FIELD_RIGHT - 200) { targetX = Math.min(FIELD_RIGHT - 20, s.ball.x + 40); }
    if (s.ball.x > FIELD_RIGHT - 100 && (s.ball.y < FIELD_TOP + 100 || s.ball.y > FIELD_BOTTOM - 100)) {
        if (Math.abs(s.ball.y - s.p2.y) < 60) { targetX = FIELD_RIGHT - 150; targetY = CANVAS_HEIGHT / 2; }
    }
    const dx = targetX - s.p2.x;
    const moveStepX = Math.min(Math.abs(dx), ai.aiSpeed * 0.9);
    s.p2.x += Math.sign(dx) * moveStepX;

    const minX = CANVAS_WIDTH/2 + PLAYER_RADIUS; const maxX = FIELD_RIGHT - PLAYER_RADIUS;
    s.p2.x = Math.max(minX, Math.min(maxX, s.p2.x));
    s.p2.y = Math.max(FIELD_TOP+PLAYER_RADIUS, Math.min(FIELD_BOTTOM-PLAYER_RADIUS, s.p2.y));
  };

  const updateParticles = () => {
    const s = state.current;
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.05;
      if (p.life <= 0) s.particles.splice(i, 1);
    }
  };

  const checkCollisions = () => {
    const s = state.current;
    if (s.ball.y - BALL_RADIUS < FIELD_TOP) { s.ball.y = FIELD_TOP + BALL_RADIUS; s.ball.dy *= -1; audioManager.playSFX('kick'); } 
    else if (s.ball.y + BALL_RADIUS > FIELD_BOTTOM) { s.ball.y = FIELD_BOTTOM - BALL_RADIUS; s.ball.dy *= -1; audioManager.playSFX('kick'); }
    checkCircleCollision(s.ball, s.p1, s.config.difficulty);
    checkCircleCollision(s.ball, s.p2, s.config.difficulty);
    const gTop = CANVAS_HEIGHT/2 - GOAL_SPAN/2; const gBot = CANVAS_HEIGHT/2 + GOAL_SPAN/2;
    checkPostCollision(FIELD_LEFT + POST_RADIUS, gTop); checkPostCollision(FIELD_LEFT + POST_RADIUS, gBot);
    checkPostCollision(FIELD_RIGHT - POST_RADIUS, gTop); checkPostCollision(FIELD_RIGHT - POST_RADIUS, gBot);
    
    if (s.ball.x < FIELD_LEFT) {
      if (s.ball.y > gTop + BALL_RADIUS && s.ball.y < gBot - BALL_RADIUS) {
          scorePoint('p2');
      }
      else if (s.ball.x < FIELD_LEFT - BALL_RADIUS) {
          s.ball.x = FIELD_LEFT + BALL_RADIUS; s.ball.dx = Math.abs(s.ball.dx); audioManager.playSFX('post'); 
      }
    }
    if (s.ball.x > FIELD_RIGHT) {
       if (s.ball.y > gTop + BALL_RADIUS && s.ball.y < gBot - BALL_RADIUS) {
           scorePoint('p1');
       }
       else if (s.ball.x > FIELD_RIGHT + BALL_RADIUS) {
           s.ball.x = FIELD_RIGHT - BALL_RADIUS; s.ball.dx = -Math.abs(s.ball.dx); audioManager.playSFX('post'); 
       }
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = state.current;
    const stadium = s.config.stadium || STADIUMS[0];

    ctx.save();
    ctx.translate((Math.random()-0.5)*s.shake, (Math.random()-0.5)*s.shake);

    ctx.fillStyle = stadium.bg || '#111'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#cc5500'; 
    ctx.fillRect(0, FIELD_TOP, FIELD_LEFT, FIELD_HEIGHT);
    ctx.fillRect(FIELD_RIGHT, FIELD_TOP, FIELD_MARGIN_X, FIELD_HEIGHT);
    
    if(noisePatternRef.current) {
        ctx.fillStyle = ctx.createPattern(noisePatternRef.current, 'repeat');
        ctx.globalAlpha = 0.4;
        ctx.fillRect(0, FIELD_TOP, FIELD_LEFT, FIELD_HEIGHT);
        ctx.fillRect(FIELD_RIGHT, FIELD_TOP, FIELD_MARGIN_X, FIELD_HEIGHT);
        ctx.globalAlpha = 1.0;
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    for(let i=10; i < FIELD_LEFT; i+=20) {
        ctx.beginPath(); ctx.moveTo(i, FIELD_TOP); ctx.lineTo(i, FIELD_BOTTOM); ctx.stroke();
    }
    for(let i=FIELD_RIGHT + 10; i < CANVAS_WIDTH; i+=20) {
        ctx.beginPath(); ctx.moveTo(i, FIELD_TOP); ctx.lineTo(i, FIELD_BOTTOM); ctx.stroke();
    }

    const grad = ctx.createLinearGradient(0, FIELD_TOP, 0, FIELD_BOTTOM);
    grad.addColorStop(0, stadium.c1); grad.addColorStop(1, stadium.c2);
    ctx.fillStyle = grad; ctx.fillRect(FIELD_LEFT, FIELD_TOP, FIELD_WIDTH, FIELD_HEIGHT);
    
    ctx.globalCompositeOperation = 'source-over';
    
    const drawStripe = (x, y, w, h) => {
        const stripeGrad = ctx.createLinearGradient(x, y, x, y+h);
        stripeGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
        stripeGrad.addColorStop(1, 'rgba(255,255,255,0.02)');
        ctx.fillStyle = stripeGrad;
        ctx.fillRect(x, y, w, h);
    };

    if (stadium.pattern === 'STRIPES_H') { 
        for(let i=FIELD_LEFT; i<FIELD_RIGHT; i+=100) drawStripe(i, FIELD_TOP, 50, FIELD_HEIGHT); 
    } 
    else if (stadium.pattern === 'STRIPES_V') { 
        for(let i=FIELD_TOP; i<FIELD_BOTTOM; i+=80) drawStripe(FIELD_LEFT, i, FIELD_WIDTH, 40); 
    } 
    else if (stadium.pattern === 'CHECKERED') { 
        for(let i=FIELD_LEFT; i<FIELD_RIGHT; i+=100) { 
            for(let j=FIELD_TOP; j<FIELD_BOTTOM; j+=80) { 
                if (((i/100)%2 === 0 && (j/80)%2 === 0) || ((i/100)%2 !== 0 && (j/80)%2 !== 0)) {
                    drawStripe(i, j, 50, 40);
                }
            } 
        } 
    } 
    else if (stadium.pattern === 'CIRCLES') { 
        ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=50; 
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 100, 0, Math.PI*2); ctx.stroke(); 
    }

    if(noisePatternRef.current) {
        ctx.fillStyle = ctx.createPattern(noisePatternRef.current, 'repeat');
        ctx.globalAlpha = 0.2; 
        ctx.fillRect(FIELD_LEFT, FIELD_TOP, FIELD_WIDTH, FIELD_HEIGHT);
        ctx.globalAlpha = 1.0;
    }

    ctx.fillStyle = stadium.stand || '#222'; ctx.fillRect(0, 0, CANVAS_WIDTH, FIELD_TOP); ctx.fillRect(0, FIELD_BOTTOM, CANVAS_WIDTH, FIELD_MARGIN_Y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 10, CANVAS_WIDTH, 15); ctx.fillRect(0, 35, CANVAS_WIDTH, 15); ctx.fillRect(0, FIELD_BOTTOM + 10, CANVAS_WIDTH, 15); ctx.fillRect(0, FIELD_BOTTOM + 35, CANVAS_WIDTH, 15);

    s.photographers.forEach(p => {
        ctx.fillStyle = '#333'; 
        ctx.beginPath(); ctx.arc(p.x, p.y + 5, 6, 0, Math.PI*2); ctx.fill();
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("📷", p.x, p.y);

        if (s.roundState === 'PLAYING' && Math.random() < 0.005) p.flashTimer = 5;
        
        if (p.flashTimer > 0) { 
            const opacity = p.flashTimer / 5;
            ctx.save();
            ctx.translate(p.x, p.y - 5);
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`; 
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); 
            ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
            ctx.moveTo(0, -12); ctx.lineTo(0, 12);
            ctx.stroke();
            ctx.restore();
            p.flashTimer--; 
        }
    });

    s.fans.forEach((f) => {
       const bounce = Math.sin(s.frameCount * f.speed + f.offset) * 3;
       let jump = 0; if (f.baseY < 0) { f.baseY += 1; jump = f.baseY; }
       const y = f.y + bounce + jump;
       const char = f.team === 'p1' ? s.p1.char : s.p2.char;
       ctx.save(); ctx.translate(f.x, y); 
       ctx.fillStyle = char.color; ctx.beginPath(); ctx.arc(0,0, FAN_RADIUS, 0, Math.PI*2); ctx.fill();
       
       ctx.fillStyle = char.text || 'white'; 
       ctx.font = "bold 9px sans-serif";
       ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
       ctx.fillText(char.number, 0, 1);

       if (f.dialog && f.dialogTimer > 0) {
           f.dialogTimer--;
           if (f.dialogTimer === 0) f.dialog = null;
           else {
               const isTopSide = f.y < CANVAS_HEIGHT / 2;
               ctx.font = "bold 10px sans-serif"; 
               const metrics = ctx.measureText(f.dialog);
               const w = metrics.width + 12; 
               
               const bubbleY = isTopSide ? 18 : -28; 
               const textY = isTopSide ? 26 : -20;
               const tailYStart = isTopSide ? 12 : -12;
               const tailYEnd = isTopSide ? 8 : -8;

               ctx.fillStyle = "white"; 
               ctx.beginPath(); 
               ctx.roundRect(-w/2, bubbleY, w, 16, 5); 
               ctx.fill();
               
               ctx.beginPath();
               ctx.moveTo(0, tailYStart); 
               ctx.lineTo(-3, tailYEnd); 
               ctx.lineTo(3, tailYEnd); 
               ctx.fill();

               ctx.fillStyle = "black"; 
               ctx.fillText(f.dialog, 0, textY);
           }
       }
       ctx.restore();
    });

    ctx.save(); ctx.translate(s.referee.x, s.referee.y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 15, 8, 4, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(0,0, 12, 0, Math.PI*2); ctx.fillStyle='white'; ctx.fill();
    ctx.strokeStyle='black'; ctx.lineWidth=2; for(let i=-10; i<10; i+=4) { ctx.beginPath(); ctx.moveTo(i, -10); ctx.lineTo(i, 10); ctx.stroke(); }
    const leg = Math.sin(s.frameCount * 0.3) * 5;
    ctx.strokeStyle='black'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-3, 8); ctx.lineTo(-3 + leg, 18); ctx.stroke(); ctx.beginPath(); ctx.moveTo(3, 8); ctx.lineTo(3 - leg, 18); ctx.stroke();
    
    if (s.referee.dialog && s.referee.dialogTimer > 0) {
        s.referee.dialogTimer--;
        if (s.referee.dialogTimer === 0) s.referee.dialog = null;
        else {
            ctx.font = "bold 11px sans-serif";
            const textMetrics = ctx.measureText(s.referee.dialog);
            const w = textMetrics.width + 16; 
            const h = 24;
            const bubbleY = -45;

            ctx.fillStyle = "white"; ctx.strokeStyle="black"; ctx.lineWidth=1;
            ctx.beginPath(); 
            ctx.roundRect(-w/2, bubbleY, w, h, 6); 
            ctx.fill(); ctx.stroke();

            ctx.beginPath(); ctx.moveTo(0, bubbleY + h); ctx.lineTo(-4, bubbleY + h + 6); ctx.lineTo(4, bubbleY + h + 6); ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = "black"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(s.referee.dialog, 0, bubbleY + h/2 + 1);
        }
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
    ctx.strokeRect(FIELD_LEFT, FIELD_TOP, FIELD_WIDTH, FIELD_HEIGHT);
    ctx.beginPath(); ctx.moveTo(CANVAS_WIDTH/2, FIELD_TOP); ctx.lineTo(CANVAS_WIDTH/2, FIELD_BOTTOM); ctx.stroke();
    ctx.beginPath(); ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 60, 0, Math.PI*2); ctx.stroke();
    ctx.strokeRect(FIELD_LEFT, CANVAS_HEIGHT/2 - 120, 100, 240); ctx.strokeRect(FIELD_RIGHT - 100, CANVAS_HEIGHT/2 - 120, 100, 240);

    const drawFlag = (x, y) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = '#DDD';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -25); ctx.stroke();
        
        const wave = Math.sin(s.frameCount * 0.1) * 3;
        ctx.fillStyle = '#EF4444'; 
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.quadraticCurveTo(10, -25 + wave, 20, -20); 
        ctx.quadraticCurveTo(10, -15 + wave, 0, -15); 
        ctx.fill();
        ctx.restore();
    };

    drawFlag(FIELD_LEFT, FIELD_TOP);
    drawFlag(FIELD_RIGHT, FIELD_TOP);
    drawFlag(FIELD_LEFT, FIELD_BOTTOM);
    drawFlag(FIELD_RIGHT, FIELD_BOTTOM);

    const goalTop = CANVAS_HEIGHT/2 - GOAL_SPAN/2; const goalBot = CANVAS_HEIGHT/2 + GOAL_SPAN/2;
    const drawGoalNet = (isLeft) => {
       const postX = isLeft ? FIELD_LEFT : FIELD_RIGHT; const backX = isLeft ? FIELD_LEFT - 30 : FIELD_RIGHT + 30; 
       
       ctx.fillStyle = 'rgba(0,0,0,0.5)';
       ctx.beginPath();
       ctx.moveTo(postX, goalTop); ctx.lineTo(backX, goalTop + 10);
       ctx.lineTo(backX, goalBot - 10); ctx.lineTo(postX, goalBot);
       ctx.fill();

       ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath();
       for(let y = goalTop; y <= goalBot; y += 10) { ctx.moveTo(postX, y); ctx.lineTo(backX, y); }
       const steps = 4; for(let i=0; i<=steps; i++) { const x = postX + (backX - postX) * (i/steps); ctx.moveTo(x, goalTop); ctx.lineTo(x, goalBot); }
       ctx.stroke(); ctx.strokeStyle = 'white'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(postX, goalTop); ctx.lineTo(backX, goalTop + 10); ctx.lineTo(backX, goalBot - 10); ctx.lineTo(postX, goalBot); ctx.stroke();
    };
    drawGoalNet(true); drawGoalNet(false);

    ctx.fillStyle = '#EEE'; 
    ctx.beginPath(); ctx.arc(FIELD_LEFT + POST_RADIUS, goalTop, POST_RADIUS, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(FIELD_LEFT + POST_RADIUS, goalBot, POST_RADIUS, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(FIELD_RIGHT - POST_RADIUS, goalTop, POST_RADIUS, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(FIELD_RIGHT - POST_RADIUS, goalBot, POST_RADIUS, 0, Math.PI*2); ctx.fill();

    s.particles.forEach(p => { ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); });
    ctx.globalAlpha = 1.0;
    
    const drawPlayer = (p, chat) => {
      let visualY = p.y; let bobX = 0;
      if (s.roundState === 'CELEBRATION') { bobX = Math.sin(s.frameCount * 0.8) * 2; visualY = p.y + Math.sin(s.frameCount * 0.4) * 10; }
      ctx.save(); ctx.translate(p.x + bobX, visualY);
      
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(0, PLAYER_RADIUS + 5, PLAYER_RADIUS, PLAYER_RADIUS/3, 0, 0, Math.PI*2); ctx.fill();

      const isMoving = (Math.abs(p.x - p.prevX) > 0.1 || Math.abs(p.y - p.prevY) > 0.1) && s.roundState !== 'CELEBRATION';
      ctx.strokeStyle = p.char.color; ctx.lineWidth = 6; ctx.lineCap = 'round';
      if (isMoving) {
          const l1 = Math.sin(s.frameCount * 0.5) * 8; ctx.beginPath(); ctx.moveTo(-6, 15); ctx.lineTo(-8 - l1, 30); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(6, 15); ctx.lineTo(8 + l1, 30); ctx.stroke();
      }
      
      ctx.beginPath(); ctx.arc(0,0, PLAYER_RADIUS, 0, Math.PI*2); ctx.fillStyle=p.char.color; ctx.fill();
      ctx.lineWidth=3; ctx.strokeStyle='white'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0, PLAYER_RADIUS-6, 0, Math.PI*2); ctx.strokeStyle=p.char.secondary; ctx.stroke();
      ctx.fillStyle='white'; ctx.strokeStyle='black'; ctx.lineWidth=3;
      ctx.textAlign='center'; ctx.textBaseline='middle'; 
      ctx.font="bold 20px sans-serif"; ctx.strokeText(p.char.number, 0, -4); ctx.fillText(p.char.number, 0, -4);    
      ctx.font="bold 8px sans-serif"; ctx.strokeText(p.char.name, 0, 12); ctx.fillText(p.char.name, 0, 12);      
      ctx.restore();

      if (s.roundState === 'CELEBRATION' && chat) {
          ctx.save(); ctx.translate(p.x, p.y); 
          ctx.font = "bold 14px sans-serif";
          const metrics = ctx.measureText(chat);
          const width = metrics.width + 60; const height = 36;
          const bx = -width/2; const by = -PLAYER_RADIUS - 45;
          ctx.fillStyle = 'white'; 
          ctx.beginPath(); ctx.roundRect(bx, by, width, height, 12); ctx.fill();
          ctx.beginPath(); ctx.moveTo(-6, by+height); ctx.lineTo(0, by+height+10); ctx.lineTo(6, by+height); ctx.fill();
          ctx.fillStyle = 'black'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(chat, 0, by + height/2 + 2);
          ctx.restore();
      }
    };
    drawPlayer(s.p1, s.chatBubbles.p1); drawPlayer(s.p2, s.chatBubbles.p2);

    ctx.translate(s.ball.x, s.ball.y); 
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, BALL_RADIUS + 5, BALL_RADIUS, BALL_RADIUS/3, 0, 0, Math.PI*2); ctx.fill();
    
    ctx.rotate(s.frameCount * 0.1 * s.ball.speed); 
    ctx.beginPath(); ctx.arc(0,0, BALL_RADIUS, 0, Math.PI*2); ctx.fillStyle='white'; ctx.fill();
    for(let i=0; i<5; i++) { let a = (i*2*Math.PI)/5; ctx.beginPath(); ctx.arc(Math.cos(a)*7, Math.sin(a)*7, 4, 0, Math.PI*2); ctx.fillStyle = i % 2 === 0 ? s.p1.char.color : s.p2.char.color; ctx.fill(); }
    ctx.restore();

    if (s.roundState === 'COUNTDOWN' && overlayText) {
       ctx.font = "900 120px sans-serif"; ctx.fillStyle = "yellow"; ctx.strokeStyle = "black"; ctx.lineWidth = 6;
       ctx.textAlign = "center"; ctx.textBaseline = "middle";
       ctx.strokeText(overlayText, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
       ctx.fillText(overlayText, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    }
  };

  const update = useCallback(() => {
    const s = state.current;
    if (!s.isPlaying || s.isPaused) {
      if (s.isPlaying) draw();
      if (s.isPlaying) animationRef.current = requestAnimationFrame(update);
      return;
    }
    s.frameCount++;
    if(s.shake > 0) s.shake *= 0.9;

    const rSpeed = 1.5;
    if (s.referee.y <= FIELD_TOP-5 && s.referee.x < FIELD_RIGHT+5) s.referee.x += rSpeed;
    else if (s.referee.x >= FIELD_RIGHT+5 && s.referee.y < FIELD_BOTTOM+5) s.referee.y += rSpeed;
    else if (s.referee.y >= FIELD_BOTTOM+5 && s.referee.x > FIELD_LEFT-5) s.referee.x -= rSpeed;
    else if (s.referee.x <= FIELD_LEFT-5 && s.referee.y > FIELD_TOP-5) s.referee.y -= rSpeed;
    
    if (s.roundState === 'PLAYING' && !s.referee.dialog && Math.random() < 0.002) {
        s.referee.dialog = REF_PHRASES[Math.floor(Math.random() * REF_PHRASES.length)];
        s.referee.dialogTimer = 90; 
    }

    if (s.goalTimer > 0) {
        s.goalTimer--;
        if (s.goalTimer === 0) {
            setOverlayText(""); s.scorer = null; s.chatBubbles = { p1: "", p2: "" };
            if (s.isGoldenGoal) endGame(); else startRound();
        }
        draw();
        animationRef.current = requestAnimationFrame(update);
        return;
    }

    if (s.roundState === 'PLAYING') {
        const smoothSpeed = 0.3; 
        s.p1.x += (s.mouseTarget.x - s.p1.x) * smoothSpeed;
        s.p1.y += (s.mouseTarget.y - s.p1.y) * smoothSpeed;
        s.p1.y = Math.max(FIELD_TOP+PLAYER_RADIUS, Math.min(FIELD_BOTTOM-PLAYER_RADIUS, s.p1.y));
        s.p1.x = Math.max(FIELD_LEFT+PLAYER_RADIUS, Math.min(CANVAS_WIDTH/2-PLAYER_RADIUS, s.p1.x));
    }

    if (s.roundState === 'COUNTDOWN') {
      s.countdownTimer--;
      if (s.ball.y < s.dropY) s.ball.y += (s.dropY - s.ball.y) * 0.15;
      const lerp = (a, b, t) => (1 - t) * a + t * b;
      const speed = 0.15; 
      s.p1.x = lerp(s.p1.x, FIELD_LEFT + 100, speed); s.p1.y = lerp(s.p1.y, CANVAS_HEIGHT/2, speed);
      s.p2.x = lerp(s.p2.x, FIELD_RIGHT - 100, speed); s.p2.y = lerp(s.p2.y, CANVAS_HEIGHT/2, speed);
      s.mouseTarget.x = s.p1.x; s.mouseTarget.y = s.p1.y;
      s.p1.prevX = s.p1.x; s.p1.prevY = s.p1.y; s.p2.prevX = s.p2.x; s.p2.prevY = s.p2.y;

      if (s.countdownTimer > 40) setOverlayText("3");
      else if (s.countdownTimer > 20) setOverlayText("2");
      else if (s.countdownTimer > 0) setOverlayText("1");
      else {
        setOverlayText(""); s.roundState = 'PLAYING';
        s.p1.prevX = s.p1.x; s.p1.prevY = s.p1.y; 
        audioManager.playSFX('whistle'); launchBall();
      }
    } else if (s.roundState === 'PLAYING') {
      if (!s.isGoldenGoal && s.config.difficulty !== 'PRACTICE') {
        s.timeLeft -= 1/60;
        
        // FIX: Timer Clamping for Safari/Glitch safety
        const displayTime = Math.max(0, s.timeLeft);
        let seconds = Math.floor(displayTime);
        let centis = Math.floor((displayTime % 1) * 100);
        
        if (timerRef.current) {
            timerRef.current.innerText = `${seconds.toString().padStart(2,'0')}:${centis.toString().padStart(2,'0')}`;
        }
        
        if (s.timeLeft < 10) { 
             // already handled by default state, but good for pulse
            if(s.frameCount % 60 === 0) audioManager.playSFX('warning'); 
        }
        if (s.isGoldenGoal) {
            setTimerColor("#FACC15"); 
        }

        if (s.timeLeft <= 0) {
          if (s.p1.score === s.p2.score) { 
              s.isGoldenGoal = true; 
              audioManager.playSFX('whistle'); 
              setOverlayText("GOLDEN GOAL!");
              setTimerColor("#FACC15");
              if (timerRef.current) timerRef.current.innerText = "GOLDEN";
          }
          else { endGame(); }
        }
      }
      moveBall(); checkCollisions(); updateAI();
    }

    if (s.roundState === 'PLAYING') {
      s.p1.prevX = s.p1.x; s.p1.prevY = s.p1.y; s.p2.prevX = s.p2.x; s.p2.prevY = s.p2.y;
    }
    updateParticles();
    draw();
    animationRef.current = requestAnimationFrame(update);
  }, []);

  const handleInput = (x, y) => {
    const s = state.current;
    if (s.roundState === 'CELEBRATION') return; 
    const constrainedY = Math.max(FIELD_TOP+PLAYER_RADIUS, Math.min(FIELD_BOTTOM-PLAYER_RADIUS, y));
    const constrainedX = Math.max(FIELD_LEFT+PLAYER_RADIUS, Math.min(CANVAS_WIDTH/2-PLAYER_RADIUS, x));
    s.mouseTarget.x = constrainedX; s.mouseTarget.y = constrainedY;
  };
  const handleMouse = (e) => { if(!canvasRef.current || !state.current.isPlaying) return; const r = canvasRef.current.getBoundingClientRect(); handleInput((e.clientX - r.left)*(CANVAS_WIDTH/r.width), (e.clientY - r.top)*(CANVAS_HEIGHT/r.height)); };
  const handleTouch = (e) => { if(!canvasRef.current || !state.current.isPlaying) return; const r = canvasRef.current.getBoundingClientRect(); handleInput((e.touches[0].clientX - r.left)*(CANVAS_WIDTH/r.width), (e.touches[0].clientY - r.top)*(CANVAS_HEIGHT/r.height)); };
  
  // --- LOGIC: OPPONENT SELECTION ---
  const startGame = (d) => { 
      if(animationRef.current) cancelAnimationFrame(animationRef.current); 
      
      const p1Id = state.current.p1.char.id;

      // 1. PRACTICE or PRO = RIVAL (Story Mode / Training)
      if (d === 'PRACTICE' || d === 'PRO') {
         const rivalId = state.current.p1.char.rival;
         state.current.p2.char = CHARACTERS[rivalId];
      } 
      // 2. EASY / MEDIUM / HARD = RANDOM OPPONENT (Campaign Variety)
      else {
         const opponents = Object.values(CHARACTERS).filter(c => c.id !== p1Id);
         const randomOp = opponents[Math.floor(Math.random() * opponents.length)];
         state.current.p2.char = randomOp;
      }

      initMatch(d); 
      state.current.isPlaying = true; state.current.isPaused = false; setUiView('PLAYING'); update(); 
  };
  
  const selectChar = (k) => { 
      state.current.p1.char = CHARACTERS[k]; 
      // Note: P2 is now set in startGame based on Difficulty
      setUiView('STADIUM_SELECT'); 
  };
  
  const selectStadium = (s) => { state.current.config.stadium = STADIUMS[s]; setUiView('DIFFICULTY'); };
  
  useEffect(() => { const r = () => { if(containerRef.current && canvasRef.current) { canvasRef.current.width=CANVAS_WIDTH; canvasRef.current.height=CANVAS_HEIGHT; draw(); }}; window.addEventListener('resize', r); r(); return () => window.removeEventListener('resize', r); }, []);
  const getCurrentDiff = () => DIFFICULTY[state.current.config.difficulty];
  const nextDiffKey = getCurrentDiff().next;

  // -- UI HELPERS --
  
  const AudioControls = () => (
      <div className="absolute top-4 right-4 z-[100] flex gap-3">
            <button onClick={() => { setIsMuted(!isMuted); audioManager.toggleMute(!isMuted); }} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition border border-white/20 shadow-lg group hover:scale-110">
                {isMuted ? <VolumeX size={20}/> : <Volume2 size={20} className="group-hover:scale-110 transition"/>}
            </button>
            <button onClick={() => { setIsMusicMuted(!isMusicMuted); audioManager.toggleMusicMute(!isMusicMuted); }} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition border border-white/20 shadow-lg group hover:scale-110">
                <Music size={20} className={!isMusicMuted && audioManager.isPlayingMusic ? "text-yellow-400 animate-pulse" : "group-hover:scale-110 transition"} />
            </button>
      </div>
  );

  const MenuScreen = () => {
      const allChars = Object.values(CHARACTERS);
      const leftSide = allChars.slice(0, 4);
      const rightSide = allChars.slice(4, 8);

      return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-black flex flex-col items-center justify-start pt-10 overflow-hidden animate-in fade-in duration-700 z-50">
            <div className="absolute inset-0 z-0">
                {[...Array(30)].map((_, i) => (
                    <Star key={i} size={Math.random() * 20 + 10} className="absolute text-white/20 animate-pulse" style={{
                        top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDuration: `${Math.random() * 3 + 2}s`
                    }} />
                ))}
            </div>

            <h1 className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400 mb-4 z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{fontFamily: "'Fredoka One', cursive"}}>
                UEFA CHAMPONG
            </h1>
            <h2 className="text-2xl font-bold tracking-[0.5em] text-blue-300 mb-8 z-10">LEAGUE OFFICIAL GAME</h2>

            <div className="relative w-full max-w-6xl h-96 flex items-end justify-center perspective-1000 z-10 mb-8">
                <div className="absolute bottom-0 w-[120%] h-32 bg-emerald-900/50 blur-xl transform rotate-x-60"></div>
                
                <div className="flex gap-4 mb-16 mr-12 items-end">
                    {leftSide.map((char, i) => (
                        <div key={char.id} className="flex flex-col items-center group relative transform transition hover:scale-110" style={{animation: `bounce ${2 + i * 0.2}s infinite`}}>
                            <div className="w-16 h-16 transform rotate-45 border-4 border-white shadow-lg flex items-center justify-center relative overflow-hidden bg-neutral-900" style={{borderColor: char.color}}>
                                <div className="absolute inset-0 opacity-80" style={{backgroundColor: char.color}}></div>
                                <div className="transform -rotate-45 z-10 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black drop-shadow-md" style={{color: char.text || 'white'}}>{char.number}</span>
                                </div>
                                <div className="absolute top-0 w-full h-1/2 bg-white/20 pointer-events-none"></div>
                            </div>
                            <div className="bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded mt-4">{char.name}</div>
                        </div>
                    ))}
                </div>

                <div className="relative z-20 mx-4 group cursor-pointer animate-[bounce_4s_infinite]">
                    <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full"></div>
                    <Trophy size={160} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] transform transition group-hover:scale-110 duration-300" strokeWidth={1} fill="rgba(253, 224, 71, 0.2)" />
                </div>

                <div className="flex gap-4 mb-16 ml-12 items-end">
                    {rightSide.map((char, i) => (
                        <div key={char.id} className="flex flex-col items-center group relative transform transition hover:scale-110" style={{animation: `bounce ${2.5 + i * 0.2}s infinite`}}>
                            <div className="w-16 h-16 transform rotate-45 border-4 border-white shadow-lg flex items-center justify-center relative overflow-hidden bg-neutral-900" style={{borderColor: char.color}}>
                                <div className="absolute inset-0 opacity-80" style={{backgroundColor: char.color}}></div>
                                <div className="transform -rotate-45 z-10 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black drop-shadow-md" style={{color: char.text || 'white'}}>{char.number}</span>
                                </div>
                                <div className="absolute top-0 w-full h-1/2 bg-white/20 pointer-events-none"></div>
                            </div>
                            <div className="bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded mt-4">{char.name}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-4 w-72 z-20">
                <button onClick={() => { ensureAudio(); setUiView('CHAR_SELECT'); }} className="group relative overflow-hidden btn-primary py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-xl font-black italic transform -skew-x-6 hover:scale-105 transition flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(37,99,235,0.5)] border border-blue-400 animate-pulse hover:animate-none">
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                    <Play fill="white" size={24} /> KICK OFF
                </button>
                <button onClick={() => { ensureAudio(); setUiView('HOW_TO'); }} className="py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-blue-100 font-bold transform -skew-x-6 hover:text-white transition hover:scale-105">CONTROLS</button>
                <button onClick={() => { ensureAudio(); setUiView('CREDITS'); }} className="py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-blue-100 font-bold transform -skew-x-6 hover:text-white transition hover:scale-105">CREDITS</button>
            </div>
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-2 font-sans text-white select-none overflow-hidden relative">
      <style>{`
        @keyframes floatCloud {
            0% { transform: translateX(-100%) translateY(0px); }
            50% { transform: translateX(50vw) translateY(-20px); }
            100% { transform: translateX(100vw) translateY(0px); }
        }
        @keyframes rotateSun {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes confetti {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes starball {
            0% { transform: rotate(0deg) scale(0.8); }
            50% { transform: rotate(180deg) scale(1.1); }
            100% { transform: rotate(360deg) scale(0.8); }
        }
        .cloud-1 { animation: floatCloud 45s linear infinite; }
        .cloud-2 { animation: floatCloud 35s linear infinite; animation-delay: -15s; }
        .cloud-3 { animation: floatCloud 55s linear infinite; animation-delay: -25s; }
        .sun-spin { animation: rotateSun 60s linear infinite; }
        /* Custom Scrollbar for Selection Screens */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { bg: #000; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
      
      {uiView === 'MENU' && <AudioControls />}

      {(uiView === 'PLAYING' || uiView === 'GAMEOVER' || uiView === 'STADIUM_SELECT' || uiView === 'DIFFICULTY' || uiView === 'CHAR_SELECT') && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-white"></div>
            <div className="absolute top-10 right-20 text-yellow-300 sun-spin"><Sun size={120} fill="#FDE047" strokeWidth={0} className="drop-shadow-[0_0_40px_rgba(253,224,21,0.8)]"/></div>
            
            <div className="absolute top-20 left-0 text-white/80 cloud-1 opacity-80"><Cloud size={100} fill="white"/></div>
            <div className="absolute top-40 left-0 text-white/60 cloud-2 opacity-60"><Cloud size={80} fill="white"/></div>
            <div className="absolute top-10 left-0 text-white/40 cloud-3 opacity-70"><Cloud size={120} fill="white"/></div>
            
            <div className="absolute bottom-0 w-full h-1/3 bg-emerald-900/20 backdrop-blur-sm rounded-t-[50%] scale-150 translate-y-20"></div>
        </div>
      )}

      {(uiView === 'PLAYING' || uiView === 'GAMEOVER') && (
        <Scoreboard 
            scores={scores} 
            timerColor={timerColor} 
            isGoldenGoal={state.current.isGoldenGoal} 
            timerDisplay={timerDisplay} 
            timerRef={timerRef}
            p1Char={state.current.p1.char}
            p2Char={state.current.p2.char}
        />
      )}

      <div className="relative z-10 w-full max-w-5xl px-4 py-8 flex justify-center">
          <div ref={containerRef} className={`relative w-full max-w-4xl aspect-[4/3] bg-black rounded-lg shadow-2xl overflow-hidden border-4 border-neutral-800 ring-1 ring-white/10 ${uiView === 'MENU' ? 'hidden' : ''}`}>
            
            {uiView === 'PLAYING' && <AudioControls />}

            <canvas ref={canvasRef} onMouseMove={handleMouse} onTouchMove={handleTouch} className="w-full h-full object-contain cursor-none touch-none" />
            
            {uiView === 'PLAYING' && (
                <div className="absolute top-4 left-4 z-40 flex gap-2">
                    <button onClick={() => { state.current.isPlaying = false; setOverlayText(""); setUiView('MENU'); }} className="px-6 py-2 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md border border-red-500/30 rounded-full text-white font-black italic shadow-lg flex items-center gap-2 transition-all hover:scale-105 z-50 group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition"/> EXIT
                    </button>
                </div>
            )}

            {overlayText === "GOALLL!!!" && <GoalOverlay text={overlayText} />}
            
            {uiView === 'CHAR_SELECT' && ( 
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center animate-in slide-in-from-right z-50"> 
                    <h2 className="text-4xl font-black mb-8 italic">SELECT PLAYER</h2> 
                    <div className="grid grid-cols-2 gap-4 px-8 w-full max-w-2xl overflow-y-auto max-h-[70%] p-4 pr-2"> 
                        {Object.keys(CHARACTERS).map(k => ( 
                            <button key={k} onClick={() => selectChar(k)} className="group relative h-28 bg-neutral-800 hover:bg-neutral-700 border-2 border-neutral-600 hover:border-white rounded-xl overflow-hidden transition-all hover:scale-105"> 
                                <div className="absolute inset-0 opacity-40 group-hover:opacity-60" style={{backgroundColor: CHARACTERS[k].color}}></div> 
                                <div className="relative z-10 flex items-center justify-between px-6 h-full"> 
                                    <div className="flex flex-col items-start"><span className="text-4xl font-black text-white" style={{color: CHARACTERS[k].text || 'white'}}>{CHARACTERS[k].number}</span><span className="text-xs font-bold text-white opacity-70">{CHARACTERS[k].team}</span></div> 
                                    <span className="text-2xl font-black italic text-white">{CHARACTERS[k].name}</span> 
                                </div> 
                            </button> 
                        ))} 
                    </div> 
                    <button onClick={() => setUiView('MENU')} className="mt-8 text-neutral-400 font-bold hover:text-white flex gap-2"><ArrowLeft/> BACK</button> 
                </div> 
            )}
            
            {uiView === 'STADIUM_SELECT' && ( 
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center animate-in slide-in-from-right z-50"> 
                    <h2 className="text-4xl font-black mb-8 italic">SELECT STADIUM</h2> 
                    <div className="flex flex-col gap-4 w-96 overflow-y-auto max-h-[60%] pr-2"> 
                        {STADIUMS.map((s, i) => ( 
                            <button key={s.id} onClick={() => selectStadium(i)} className="group p-4 border-l-8 border-emerald-500 text-left transition-all hover:translate-x-2 bg-neutral-800/50 hover:bg-neutral-800 relative overflow-hidden shrink-0"> 
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/50 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <div className="text-xl font-black italic">{s.name}</div> 
                                        <div className="text-xs text-gray-400 font-bold">{s.desc}</div> 
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-4 h-4 rounded-full border border-white" style={{background: s.c1}}></div>
                                        <div className="w-4 h-4 rounded-full border border-white" style={{background: s.c2}}></div>
                                    </div>
                                </div>
                            </button> 
                        ))} 
                    </div> 
                    <button onClick={() => setUiView('CHAR_SELECT')} className="mt-8 text-neutral-400 font-bold hover:text-white flex gap-2"><ArrowLeft/> BACK</button> 
                </div> 
            )}

            {uiView === 'DIFFICULTY' && ( 
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center animate-in slide-in-from-right z-50"> 
                    <h2 className="text-4xl font-black mb-8 italic">DIFFICULTY</h2> 
                    <div className="flex flex-col gap-4 w-72"> 
                        {Object.keys(DIFFICULTY).map(d => ( 
                            <button key={d} onClick={() => startGame(d)} className={`p-4 border-l-8 text-left transition-all hover:translate-x-2 bg-neutral-800/50 hover:bg-neutral-800 ${d==='PRO'?'border-red-600':d==='HARD'?'border-orange-500':d==='MEDIUM'?'border-yellow-500':'border-green-500'}`}> 
                                <div className="text-xl font-black italic">{DIFFICULTY[d].label}</div> 
                                <div className="text-xs text-gray-400 font-bold">{DIFFICULTY[d].desc}</div> 
                            </button> 
                        ))} 
                    </div> 
                    <div className="mt-8 flex gap-4">
                        <button onClick={() => setUiView('STADIUM_SELECT')} className="px-6 py-3 bg-neutral-800 text-white font-bold rounded flex items-center gap-2 hover:bg-neutral-700 transition">
                             <ChevronLeft size={18}/> BACK
                        </button>
                    </div> 
                </div> 
            )}
            
            {uiView === 'CREDITS' && ( 
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in zoom-in-95 text-center z-50 p-8"> 
                    <div className="relative z-10 bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 p-12 rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 blur-[50px]"></div>
                        <Users className="w-20 h-20 text-indigo-400 mb-6 mx-auto animate-bounce relative z-10"/> 
                        <h2 className="text-3xl font-black italic mb-2 tracking-[0.2em] text-indigo-200">DEVELOPED BY</h2> 
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-indigo-400 mb-4 drop-shadow-lg">Nhat Nam Do</div> 
                        <div className="text-lg text-indigo-300/80 font-mono mb-8 tracking-widest">namdok2k3@gmail.com</div> 
                        <div className="flex justify-center gap-4 mb-8">
                            <Star className="text-yellow-400 animate-pulse delay-75" size={24} fill="currentColor"/>
                            <Star className="text-yellow-400 animate-pulse delay-150" size={32} fill="currentColor"/>
                            <Star className="text-yellow-400 animate-pulse delay-300" size={24} fill="currentColor"/>
                        </div>
                        <button onClick={() => setUiView('MENU')} className="px-10 py-3 bg-white text-indigo-950 font-black italic rounded-full hover:scale-105 transition hover:bg-blue-50 shadow-xl flex items-center gap-2 mx-auto group">
                            <X size={20} className="group-hover:rotate-90 transition-transform"/> CLOSE
                        </button> 
                    </div>
                </div> 
            )}
            
            {uiView === 'HOW_TO' && ( 
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in zoom-in-95 p-8 z-50"> 
                    <div className="relative z-10 bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-500/30 p-10 rounded-[2rem] shadow-2xl max-w-xl w-full">
                        <Info className="w-16 h-16 text-yellow-400 mb-6 mx-auto animate-pulse"/> 
                        <h2 className="text-5xl font-black italic mb-8 tracking-widest text-center text-white drop-shadow-md">GAME RULES</h2> 
                        <div className="space-y-6 text-xl text-blue-100 font-medium"> 
                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition"><div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shrink-0">1</div> <p>Move your mouse to control the player.</p></div>
                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition"><div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shrink-0">2</div> <p>You can roam freely in your half.</p></div>
                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition"><div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shrink-0">3</div> <p>Hit ball with the side for angles.</p></div>
                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition"><div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shrink-0">4</div> <p>Score more goals in 90s to win.</p></div>
                        </div> 
                        <button onClick={() => setUiView('MENU')} className="mt-10 w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black italic rounded-xl transition shadow-lg text-xl flex justify-center items-center gap-2 group">
                            <span className="group-hover:translate-x-1 transition-transform">GOT IT!</span> <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform"/>
                        </button> 
                    </div>
                </div> 
            )}
            
            {uiView === 'GAMEOVER' && ( 
                <div className={`absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in-95 z-50 overflow-hidden ${scores.p1 > scores.p2 ? "bg-indigo-950" : "bg-black/95"}`}> 
                   
                    {scores.p1 > scores.p2 && (
                        <div className="absolute inset-0">
                            <div className="absolute inset-0 opacity-20">
                                {[...Array(8)].map((_, i) => (
                                    <Star key={i} size={400} fill="white" className="absolute text-white animate-[starball_20s_linear_infinite]" 
                                          style={{ top: '50%', left: '50%', marginLeft: -200, marginTop: -200, animationDelay: `-${i * 2.5}s`, opacity: 0.1 }} />
                                ))}
                            </div>
                            {[...Array(50)].map((_, i) => (
                                <div key={i} className="absolute w-3 h-3 bg-yellow-400 rounded-sm" 
                                     style={{ 
                                         left: `${Math.random()*100}%`, top: '-10%', 
                                         animation: `confetti ${Math.random()*3+2}s linear infinite`,
                                         backgroundColor: ['#FFD700', '#C0C0C0', '#ffffff', '#3b82f6'][Math.floor(Math.random()*4)]
                                     }}></div>
                            ))}
                        </div>
                    )}

                    <div className="relative z-10 flex flex-col items-center">
                        {scores.p1 > scores.p2 ? (
                            <>
                                <Trophy size={120} className="text-yellow-400 drop-shadow-[0_0_50px_rgba(253,224,21,0.8)] mb-6 animate-bounce" fill="#FDE047" strokeWidth={1} />
                                <h2 className="text-7xl font-black italic mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-xl tracking-tighter">CHAMPIONS!</h2>
                            </>
                        ) : (
                            <h2 className="text-6xl font-black italic mb-2 text-white">FULL TIME</h2>
                        )}
                        
                        <div className="text-8xl font-black text-white mb-8 font-mono bg-black/50 px-8 py-2 rounded-xl backdrop-blur-md border border-white/20">
                            {scores.p1} - {scores.p2}
                        </div>
                        
                        <div className="flex gap-4"> 
                            <button onClick={() => { setOverlayText(""); setUiView('MENU'); }} className="px-8 py-3 bg-white/10 border border-white/20 text-white font-bold rounded hover:bg-white/20 transition backdrop-blur-md">MENU</button> 
                            <button onClick={() => startGame(state.current.config.difficulty)} className="px-8 py-3 bg-white text-black font-bold rounded flex items-center gap-2 hover:bg-gray-200 transition shadow-lg"><RotateCcw size={20}/> REPLAY {DIFFICULTY[state.current.config.difficulty].id}</button> 
                            {scores.p1 > scores.p2 && nextDiffKey && ( 
                                <button onClick={() => startNextMatch(nextDiffKey)} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded flex items-center gap-2 hover:scale-105 transition shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-green-400"> 
                                    NEXT MATCH <ArrowRight size={20}/> 
                                </button> 
                            )} 
                        </div>
                    </div>
                </div> 
            )}
            
            {state.current.isPaused && uiView === 'PLAYING' && ( <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-50"> <h2 className="text-6xl font-black mb-4">PAUSED</h2> <button onClick={() => { state.current.isPaused = false; }} className="px-8 py-3 bg-white text-black font-bold rounded-full mb-4">RESUME</button> <button onClick={() => { state.current.isPlaying = false; setOverlayText(""); setUiView('MENU'); }} className="text-red-500 font-bold">QUIT</button> </div> )}
          </div>
      </div>

      {uiView === 'MENU' && <MenuScreen />}
    </div>
  );
}