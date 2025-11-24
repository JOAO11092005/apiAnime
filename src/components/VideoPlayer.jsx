import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { 
    Play, Pause, Volume2, VolumeX, Volume1, 
    Maximize, Minimize, Settings, Loader, 
    Rewind, FastForward, SkipForward, ArrowLeft
} from 'lucide-react';
import './player.css';

const VideoPlayer = ({ url, onClose, title, episodeInfo }) => {
  const videoRef = useRef(null);
  const playerWrapperRef = useRef(null);
  const hlsRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Efeito principal para carregar o vídeo HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };

    cleanup();

    if (url && url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => console.log("A reprodução automática foi bloqueada pelo navegador."));
          setIsLoading(false);
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                console.error('Erro fatal no HLS:', data);
            }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(() => console.log("A reprodução automática foi bloqueada pelo navegador."));
          setIsLoading(false);
        });
      }
    } else {
      video.src = url;
      setIsLoading(false);
    }

    return cleanup;
  }, [url]);

  const formatTime = (time) => {
    if (isNaN(time) || time < 0) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const togglePlayPause = useCallback(() => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
    } else {
      videoRef.current?.pause();
    }
  }, []);

  const seek = useCallback((seconds) => {
    if(videoRef.current) {
        videoRef.current.currentTime += seconds;
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      playerWrapperRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * duration;
    videoRef.current.currentTime = newTime;
  };
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if(videoRef.current) {
        videoRef.current.volume = newVolume;
        videoRef.current.muted = newVolume === 0;
    }
    localStorage.setItem('videoPlayerVolume', newVolume.toString());
  };

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted;
    }
  }, []);

  const handlePlaybackRateChange = (rate) => {
    if(videoRef.current) {
        videoRef.current.playbackRate = rate;
        setPlaybackRate(rate);
        setIsSettingsOpen(false);
    }
  };
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const savedVolume = localStorage.getItem('videoPlayerVolume');
    if (savedVolume !== null) {
        video.volume = parseFloat(savedVolume);
    }

    const updateUI = () => {
      setProgress((video.currentTime / video.duration) * 100);
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
      setIsPlaying(!video.paused);
      setVolume(video.volume);
      setIsMuted(video.muted);
      setIsLoading(false);
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);

    video.addEventListener('timeupdate', updateUI);
    video.addEventListener('loadedmetadata', updateUI);
    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));
    video.addEventListener('volumechange', updateUI);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('timeupdate', updateUI);
      video.removeEventListener('loadedmetadata', updateUI);
      video.removeEventListener('play', () => setIsPlaying(true));
      video.removeEventListener('pause', () => setIsPlaying(false));
      video.removeEventListener('volumechange', updateUI);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  useEffect(() => {
    const wrapper = playerWrapperRef.current;
    const showControls = () => {
        setAreControlsVisible(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) {
                setAreControlsVisible(false);
                setIsSettingsOpen(false);
            }
        }, 3500);
    };
    
    wrapper?.addEventListener('mousemove', showControls);
    wrapper?.addEventListener('mouseleave', () => { 
        if (isPlaying) {
            setAreControlsVisible(false);
            setIsSettingsOpen(false);
        }
    });

    return () => {
      wrapper?.removeEventListener('mousemove', showControls);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.target.tagName === 'INPUT') return;
        switch (e.key.toLowerCase()) {
            case ' ': e.preventDefault(); togglePlayPause(); break;
            case 'f': toggleFullscreen(); break;
            case 'm': toggleMute(); break;
            case 'arrowright': seek(10); break;
            case 'arrowleft': seek(-10); break;
            default: break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, toggleFullscreen, toggleMute, seek]);

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const ICON_SIZE = 24;

  // Renderização do Componente
  return (
    <div className="player-overlay" onClick={onClose}>
      <div className="player-content" onClick={(e) => e.stopPropagation()}>
        <div 
          className={`player-wrapper ${!areControlsVisible && isPlaying ? 'hide-cursor' : ''}`} 
          ref={playerWrapperRef}
          onDoubleClick={toggleFullscreen}
        >
          <video ref={videoRef} onClick={togglePlayPause} preload="metadata" />

          {isLoading && <div className="player-loader"><Loader size={50} /></div>}

          {/* Botão de voltar no canto superior esquerdo */}
          <button className={`player-back-button ${areControlsVisible ? 'visible' : ''}`} onClick={onClose} aria-label="Voltar">
            <ArrowLeft size={ICON_SIZE + 4} />
          </button>
          
          <div className={`player-bottom-controls-container ${areControlsVisible ? 'visible' : ''}`}>
            {/* Barra de Progresso */}
            <div className="progress-bar__wrapper">
              <input type="range" min="0" max="100" value={isNaN(progress) ? 0 : progress} className="progress-bar" onChange={handleProgressChange} style={{'--progress-percent': `${isNaN(progress) ? 0 : progress}%`}}/>
              <div className="time-info">
                <span className="current-time">{formatTime(currentTime)}</span>
                <span className="duration-time">{formatTime(duration)}</span>
              </div>
            </div>
            
            <div className="controls">
              <div className="controls__left">
                <button className="control-button" onClick={togglePlayPause} aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}>
                    {isPlaying ? <Pause size={ICON_SIZE} /> : <Play size={ICON_SIZE} />}
                </button>
                <button className="control-button" onClick={() => seek(-10)} aria-label="Retroceder"><Rewind size={ICON_SIZE} /></button>
                <button className="control-button" onClick={() => seek(10)} aria-label="Avançar"><FastForward size={ICON_SIZE} /></button>
                
                <div className="volume__container">
                  <button className="control-button" onClick={toggleMute} aria-label={isMuted ? 'Ativar som' : 'Desativar som'}>
                    <VolumeIcon size={ICON_SIZE} />
                  </button>
                  <div className="volume__popup">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      className="volume__slider"
                      onChange={handleVolumeChange}
                      style={{'--volume-percent': `${(isMuted ? 0 : volume) * 100}%`}}
                    />
                  </div>
                </div>
              </div>

              <div className="controls__right">
                {/* Botão de Próximo Episódio */}
                <button className="control-button" aria-label="Próximo Episódio">
                  <SkipForward size={ICON_SIZE} />
                </button>

                <div className="settings__container">
                    <button className="control-button" onClick={() => setIsSettingsOpen(!isSettingsOpen)} aria-label="Configurações"><Settings size={ICON_SIZE} /></button>
                    {isSettingsOpen && (
                        <div className="settings__menu">
                            <h4>Velocidade</h4>
                            {[0.5, 1, 1.5, 2].map(rate => (
                                <button key={rate} className={playbackRate === rate ? 'active' : ''} onClick={() => handlePlaybackRateChange(rate)}>
                                    {rate === 1 ? 'Normal' : `${rate}x`}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button className="control-button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'}>
                    {isFullscreen ? <Minimize size={ICON_SIZE} /> : <Maximize size={ICON_SIZE} />}
                </button>
                
                {/* Informação do Episódio */}
                {episodeInfo && <span className="episode-info">{episodeInfo}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;