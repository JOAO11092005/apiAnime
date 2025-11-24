import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { searchSeries, getSeriesDetails, getImageUrl } from '../api/tmdb';
import { Zap, Search, Link as LinkIcon, Save, ArrowLeft } from 'lucide-react'; 

const AddAnimePage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedAnime, setSelectedAnime] = useState(null); 
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const [linkType, setLinkType] = useState('pattern');
    const [linkTemplate, setLinkTemplate] = useState('');
    const [sPadding, setSPadding] = useState(2);
    const [ePadding, setEPadding] = useState(2);
    // NOVO ESTADO: Controla se a contagem do episódio é sequencial
    const [isSequential, setIsSequential] = useState(false); 
    const [individualLinks, setIndividualLinks] = useState({});
    const [tmdbDetails, setTmdbDetails] = useState(null); 

    useEffect(() => {
        if (selectedAnime) {
            const fetchDetails = async () => {
                try {
                    const response = await getSeriesDetails(selectedAnime.id); 
                    setTmdbDetails(response.data);
                } catch (error) {
                    setMessage("Não foi possível carregar os detalhes das temporadas do anime.");
                }
            };
            fetchDetails();
        }
    }, [selectedAnime]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;
        setIsLoading(true);
        setResults([]);
        try {
            const response = await searchSeries(query);
            setResults(response.data.results);
        } catch (error) {
            setMessage('Falha ao buscar animes.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleIndividualLinkChange = (season, episode, value) => {
        setIndividualLinks(prev => ({
            ...prev,
            [season]: { ...prev[season], [episode]: value }
        }));
    };

    const handleAddAnime = async (e) => {
        e.preventDefault();
        if (!tmdbDetails) {
            setMessage("Detalhes do anime não carregados. Tente novamente.");
            return;
        }
        setIsLoading(true);
        setMessage('');

        const generatedLinks = {};
        let hasLinks = false;

        if (linkType === 'pattern') {
            if (!linkTemplate) {
                setMessage('O template do link é obrigatório.');
                setIsLoading(false);
                return;
            }
            // NOVA LÓGICA DE CONTADOR SEQUENCIAL
            let episodeCounter = 0;
            // Filtra as temporadas válidas e as percorre
            tmdbDetails.seasons
                .filter(s => s.season_number > 0 && s.episode_count > 0)
                .forEach(season => {
                    generatedLinks[season.season_number] = {};
                    for (let epNum = 1; epNum <= season.episode_count; epNum++) {
                        episodeCounter++;
                        
                        // O número do episódio usado no link depende da configuração sequencial
                        const epToFormat = isSequential ? episodeCounter : epNum;

                        const formattedSeason = String(season.season_number).padStart(sPadding, '0');
                        // Usa o número do episódio correto (sequencial ou por temporada)
                        const formattedEpisode = String(epToFormat).padStart(ePadding, '0');
                        
                        // O template de URL original já usa {e}, então a substituição funciona
                        const finalUrl = linkTemplate.replace('{s}', formattedSeason).replace('{e}', formattedEpisode);
                        generatedLinks[season.season_number][epNum] = finalUrl;
                    }
                });
            hasLinks = true; 
        } else { // 'individual'
            const hasIndividualLinks = Object.values(individualLinks).some(season => 
                Object.values(season).some(link => link && link.trim() !== '')
            );
            if (!hasIndividualLinks) {
                setMessage('Você deve adicionar pelo menos um link de episódio individual.');
                setIsLoading(false);
                return;
            }
            Object.assign(generatedLinks, individualLinks); 
            hasLinks = true;
        }

        if (!hasLinks) {
            setMessage("Nenhum link foi gerado ou inserido.");
            setIsLoading(false);
            return;
        }

        try {
            await addDoc(collection(db, 'animes'), {
                tmdbId: selectedAnime.id,
                title: selectedAnime.name,
                posterPath: selectedAnime.poster_path,
                links: generatedLinks 
            });
            setMessage('Anime e todos os links foram salvos com sucesso no Firebase!');
            setTimeout(() => navigate('/'), 2500);
        } catch (error) {
            setMessage('Falha ao adicionar o anime.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 className="page-title"><Zap size={32} className="page-icon" /> Adicionar Novo Anime</h1>
            <div className="page-title-separator" />
            {!selectedAnime ? (
                <>
                    <form onSubmit={handleSearch} className="search-form">
                        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Digite o nome do anime..." className="search-input" />
                        <button type="submit" disabled={isLoading} className="button"><Search size={20} />{isLoading ? 'Buscando...' : 'Buscar Anime'}</button>
                    </form>
                        {isLoading && <p className="loading-message">Procurando animes...</p>}
                    <div className="search-results">
                        {results.map((anime) => (
                            <div key={anime.id} className="result-item" onClick={() => setSelectedAnime(anime)}>
                                <img src={getImageUrl(anime.poster_path)} alt={anime.name} />
                                <h3>{anime.name}</h3>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="add-form-container">
                    <div className="selected-series-header">
                        <img src={getImageUrl(selectedAnime.poster_path)} alt={selectedAnime.name} />
                        <h2>Anime Selecionado: {selectedAnime.name}</h2>
                    </div>
                    <form onSubmit={handleAddAnime}>
                        <div className="link-type-selector">
                            <label><input type="radio" name="linkType" value="pattern" checked={linkType === 'pattern'} onChange={() => setLinkType('pattern')} /> Usar um **Padrão de Link**</label>
                            <label><input type="radio" name="linkType" value="individual" checked={linkType === 'individual'} onChange={() => setLinkType('individual')} /> **Links Individuais**</label>
                        </div>
                        {linkType === 'pattern' && (
                            <div className="form-section">
                                <h3><LinkIcon size={20} /> Configuração do Padrão de Link</h3>
                                <p>Use <strong>{'{s}'}</strong> para **Temporada** e <strong>{'{e}'}</strong> para **Episódio** no seu template de URL.</p>
                                <input type="text" value={linkTemplate} onChange={(e) => setLinkTemplate(e.target.value)} placeholder="Ex: https://.../Anime.S{s}E{e}.mkv" className="form-input" required />
                                
                                {/* NOVA OPÇÃO DE CONTROLE DE SEQUENCIALIDADE */}
                                <div className="checkbox-option">
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={isSequential} 
                                            onChange={(e) => setIsSequential(e.target.checked)} 
                                        /> 
                                        **Contagem Sequencial de Episódios** (O <strong>{'{e}'}</strong> continuará contando entre temporadas. Ex: T1E39, T2E40)
                                    </label>
                                </div>
                                {/* FIM DA NOVA OPÇÃO */}

                                <div className="padding-options">
                                    {/* O padding de temporada continua sendo usado para {s} */}
                                    <label>Formato Temporada (S):<select value={sPadding} onChange={(e) => setSPadding(Number(e.target.value))}><option value={1}>1</option><option value={2}>01</option><option value={3}>001</option></select></label>
                                    {/* O padding de episódio agora é usado para {e}, seja ele sequencial ou por temporada */}
                                    <label>Formato Episódio (E):<select value={ePadding} onChange={(e) => setEPadding(Number(e.target.value))}><option value={1}>1</option><option value={2}>01</option><option value={3}>001</option></select></label>
                                </div>
                            </div>
                        )}
                        {linkType === 'individual' && tmdbDetails && (
                            <div className="form-section">
                                <h3><LinkIcon size={20} /> Links Individuais por Episódio</h3>
                                {tmdbDetails.seasons.filter(s => s.season_number > 0 && s.episode_count > 0).map(season => (
                                    <div key={season.id} className="season-input-group">
                                        <h4>Temporada: {season.name} ({season.episode_count} episódios)</h4>
                                        {Array.from({ length: season.episode_count }, (_, i) => i + 1).map(epNum => (
                                            <div key={epNum} className="individual-link-input">
                                                <label>Episódio {epNum}</label>
                                                <input 
                                                type="text" 
                                                placeholder={`URL para T${season.season_number}E${epNum}`} 
                                                onChange={(e) => handleIndividualLinkChange(season.season_number, epNum, e.target.value)} 
                                                value={individualLinks[season.season_number]?.[epNum] || ''} 
                                                className={individualLinks[season.season_number]?.[epNum] ? 'filled' : ''} 
                                            />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="form-actions">
                            <button type="submit" disabled={isLoading || !tmdbDetails} className="button"><Save size={20} />{isLoading ? 'Salvando...' : 'Adicionar Anime ao Catálogo'}</button>
                            <button 
                                type="button" 
                                onClick={() => { 
                                    setSelectedAnime(null); 
                                    setTmdbDetails(null); 
                                    setIndividualLinks({}); 
                                }} 
                                className="button-secondary"
                            >
                                <ArrowLeft size={20} />Buscar Outro
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {message && <p className="info-message">{message}</p>}
        </div>
    );
};

export default AddAnimePage;