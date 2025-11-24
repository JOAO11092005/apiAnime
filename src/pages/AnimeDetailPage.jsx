import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Assumindo que o arquivo firebase.js/jsx exporta 'db'
import { getSeriesDetails, getBackdropUrl } from '../api/tmdb'; // Assumindo funções TMDB
import { PlayCircle, Film, Zap } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';

const AnimeDetailPage = () => {
  const { id } = useParams();
  const [animeData, setAnimeData] = useState(null); 
  const [tmdbData, setTmdbData] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingUrl, setPlayingUrl] = useState(null);
  // Estado para guardar a informação do episódio sendo reproduzido
  const [currentEpisodeInfo, setCurrentEpisodeInfo] = useState(''); 

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const animeDocRef = doc(db, 'animes', id);
        const animeDocSnap = await getDoc(animeDocRef);
        
        if (!animeDocSnap.exists()) throw new Error('Anime não encontrado no banco de dados.');
        
        const firebaseData = animeDocSnap.data();
        setAnimeData(firebaseData);
        
        if (!firebaseData.tmdbId) throw new Error('ID do TMDB não encontrado para este anime.');
        
        const tmdbResponse = await getSeriesDetails(firebaseData.tmdbId);
        setTmdbData(tmdbResponse.data);
      } catch (err) {
        console.error("❌ Erro ao buscar dados do anime:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [id]);

  const getEpisodeUrl = (seasonNumber, episodeNumber) => {
    if (!animeData || !animeData.links) {
      return null;
    }
    const seasonKey = String(seasonNumber);
    const episodeKey = String(episodeNumber);
    const seasonLinks = animeData.links[seasonKey];
    if (seasonLinks) {
      return seasonLinks[episodeKey] || null;
    }
    return null;
  };
  
  // NOVA FUNÇÃO: Inicia a reprodução e define as informações do episódio
  const handlePlayEpisode = (seasonNumber, epNum) => {
    const url = getEpisodeUrl(seasonNumber, epNum);
    if (!url) return;
    
    // Constrói a string de informação do episódio
    const episodeTitle = tmdbData.name || 'Anime';
    const seasonName = tmdbData.seasons.find(s => s.season_number === selectedSeason)?.name || `T${selectedSeason}`;

    setCurrentEpisodeInfo(`${episodeTitle} - ${seasonName} | EP ${epNum}`);
    setPlayingUrl(url);
  };
  
  if (loading) return <div className="loading-message">Carregando detalhes do anime...</div>;
  if (error) return <div className="error-message">Erro ao carregar anime: {error}</div>;
  if (!animeData || !tmdbData) return <div className="info-message">Dados do anime não encontrados.</div>;

  const seasons = tmdbData.seasons.filter(s => s.season_number > 0 && s.episode_count > 0);
  const currentSeasonDetails = seasons.find(s => s.season_number === selectedSeason);

  return (
    <div className="series-detail-page">
      {playingUrl && (
          <VideoPlayer 
              url={playingUrl} 
              onClose={() => setPlayingUrl(null)} 
              episodeInfo={currentEpisodeInfo} // Passa a info do episódio para o Player
          />
      )}
      
      <header className="series-detail-header">
        <img src={getBackdropUrl(tmdbData.backdrop_path)} alt={`Cenário de ${tmdbData.name}`} className="backdrop-image"/>
        <div className="backdrop-gradient"></div>
        <div className="header-info container"> {/* Adicionado container para centralizar */}
          <div className="header-tags">
            {tmdbData.genres?.slice(0, 3).map(g => <span key={g.id} className="genre-tag">{g.name}</span>)}
            <span className="info-tag">{tmdbData.number_of_seasons} T.</span>
          </div>
          <h1><Zap size={48} /> {tmdbData.name}</h1>
          <p>Lançamento: {tmdbData.first_air_date?.split('-')[0]} • Status: {tmdbData.status}</p>
          <button 
              className="watch-button"
              onClick={() => handlePlayEpisode(selectedSeason, 1)} // Tenta reproduzir o EP 1 da temporada selecionada
              disabled={!getEpisodeUrl(selectedSeason, 1)}
          >
            <PlayCircle size={24} /> Assistir {currentSeasonDetails ? currentSeasonDetails.name : 'Temporada'}
          </button>
        </div>
      </header>

      <div className="container">
        <section className="series-overview"> {/* Removida a classe 'anime-card-style' desnecessária */}
          <h2>Sinopse do Anime</h2>
          <p>{tmdbData.overview || "Sinopse não disponível."}</p>
        </section>

        <section className="episodes-section">
          <h2>Lista de Episódios</h2>
          <div className="season-selector-wrapper">
            <select value={selectedSeason} onChange={(e) => setSelectedSeason(Number(e.target.value))} className="season-selector">
            {seasons.map(season => <option key={season.id} value={season.season_number}>{season.name}</option>)}
          </select>
          </div>

          <div className="episodes-grid">
            {currentSeasonDetails && Array.from({ length: currentSeasonDetails.episode_count }, (_, i) => i + 1).map(epNum => {
              const url = getEpisodeUrl(selectedSeason, epNum);

              return (
                <button 
                    key={epNum} 
                    onClick={() => handlePlayEpisode(selectedSeason, epNum)} // Usa a nova função
                    disabled={!url} 
                    className="episode-button" 
                    title={url ? `Assistir episódio ${epNum}` : 'Link indisponível'}
                >
                  <Film className="episode-icon" />
                  <div>
                    <span className="episode-number">Episódio {epNum}</span>
                    <div className="episode-action">
                      <PlayCircle className="play-icon" />
                      <span>{url ? 'Assistir Agora' : 'Link Ausente'}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AnimeDetailPage;