import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getSeriesDetails, getImageUrl } from '../api/tmdb';
import { Zap, Link as LinkIcon, Save, XCircle } from 'lucide-react';

const EditAnimePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [animeData, setAnimeData] = useState(null); 
    const [tmdbDetails, setTmdbDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    
    const [linkType, setLinkType] = useState('individual');
    const [linkTemplate, setLinkTemplate] = useState('');
    const [sPadding, setSPadding] = useState(2);
    const [ePadding, setEPadding] = useState(2);
    const [individualLinks, setIndividualLinks] = useState({});

    useEffect(() => {
        const fetchAnimeData = async () => {
            setIsLoading(true);
            const docRef = doc(db, 'animes', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setAnimeData(data);
                setIndividualLinks(data.links || {}); 

                try {
                    const response = await getSeriesDetails(data.tmdbId);
                    setTmdbDetails(response.data);
                } catch (error) {
                    setMessage("Não foi possível carregar os detalhes das temporadas do TMDB.");
                }
            } else {
                setMessage("Anime não encontrado no banco de dados.");
            }
            setIsLoading(false);
        };

        fetchAnimeData();
    }, [id]);

    const handleIndividualLinkChange = (season, episode, value) => {
        setIndividualLinks(prev => ({
            ...prev,
            [season]: { ...prev[season], [episode]: value }
        }));
    };

    const handleUpdateAnime = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        const generatedLinks = {};
        
        if (linkType === 'pattern') {
            if (!linkTemplate) {
                setMessage('O template do link é obrigatório no modo Padrão.');
                setIsLoading(false);
                return;
            }
            tmdbDetails.seasons
                .filter(s => s.season_number > 0 && s.episode_count > 0)
                .forEach(season => {
                    generatedLinks[season.season_number] = {};
                    for (let epNum = 1; epNum <= season.episode_count; epNum++) {
                        const formattedSeason = String(season.season_number).padStart(sPadding, '0');
                        const formattedEpisode = String(epNum).padStart(ePadding, '0');
                        const finalUrl = linkTemplate.replace('{s}', formattedSeason).replace('{e}', formattedEpisode);
                        generatedLinks[season.season_number][epNum] = finalUrl;
                    }
                });
        } else { // 'individual'
            Object.assign(generatedLinks, individualLinks);
        }

        try {
            const docRef = doc(db, 'animes', id);
            await updateDoc(docRef, {
                links: generatedLinks 
            });
            setMessage('Links do anime atualizados com sucesso! 🚀');
            setTimeout(() => navigate(`/anime/${id}`), 2000); 
        } catch (error) {
            setMessage('Falha ao atualizar o anime.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading) return <div className="loading-message">Carregando dados do anime...</div>;
    if (!animeData || !tmdbDetails) return <div className="error-message">{message}</div>;

    return (
        <div className="container">
            <h1 className="page-title"><Zap size={32} /> Editar Links do Anime</h1>
            <div className="page-title-separator" />

            <div className="add-form-container">
                <div className="selected-series-header">
                    <img src={getImageUrl(animeData.posterPath)} alt={animeData.title} />
                    <h2>{animeData.title}</h2>
                </div>
                <form onSubmit={handleUpdateAnime}>
                    
                    <div className="link-type-selector">
                        <label><input type="radio" name="linkType" value="pattern" checked={linkType === 'pattern'} onChange={() => setLinkType('pattern')} /> **Padrão de URL**</label>
                        <label><input type="radio" name="linkType" value="individual" checked={linkType === 'individual'} onChange={() => setLinkType('individual')} /> **Links Individuais**</label>
                    </div>
                    
                    {linkType === 'pattern' && (
                       <div className="form-section">
                         <h3><LinkIcon size={20} /> Configuração do Padrão</h3>
                         <p>O **novo padrão** substituirá todos os links existentes.</p>
                         <input type="text" value={linkTemplate} onChange={(e) => setLinkTemplate(e.target.value)} placeholder="Ex: https://.../Anime.S{s}E{e}.mkv" className="form-input" required={linkType === 'pattern'} />
                         <div className="padding-options">
                             <label>Formato Temporada (S):<select value={sPadding} onChange={(e) => setSPadding(Number(e.target.value))}><option value={1}>1</option><option value={2}>01</option><option value={3}>001</option></select></label>
                             <label>Formato Episódio (E):<select value={ePadding} onChange={(e) => setEPadding(Number(e.target.value))}><option value={1}>1</option><option value={2}>01</option><option value={3}>001</option></select></label>
                         </div>
                       </div>
                    )}
                    
                    {linkType === 'individual' && tmdbDetails && (
                        <div className="form-section">
                            <h3><LinkIcon size={20} /> Editar Links por Episódio</h3>
                            {tmdbDetails.seasons.filter(s => s.season_number > 0 && s.episode_count > 0).map(season => (
                                <div key={season.id} className="season-input-group">
                                    <h4>Temporada: {season.name}</h4>
                                    {Array.from({ length: season.episode_count }, (_, i) => i + 1).map(epNum => (
                                        <div key={epNum} className="individual-link-input">
                                            <label>Episódio {epNum}</label>
                                            
                                            <input 
                                              type="text" 
                                              placeholder={`URL para T${season.season_number}E${epNum}`} 
                                              value={individualLinks[season.season_number]?.[epNum] || ''}
                                              onChange={(e) => handleIndividualLinkChange(season.season_number, epNum, e.target.value)} 
                                              className={individualLinks[season.season_number]?.[epNum] ? 'filled' : ''} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="form-actions">
                        <button type="submit" disabled={isLoading || !tmdbDetails} className="button"><Save size={20} />{isLoading ? 'Salvando...' : 'Salvar Alterações'}</button>
                        <button type="button" onClick={() => navigate(`/anime/${id}`)} className="button-secondary"><XCircle size={20} /> Cancelar</button>
                    </div>
                </form>
                 {message && <p className="info-message">{message}</p>}
            </div>
        </div>
    );
};

export default EditAnimePage;