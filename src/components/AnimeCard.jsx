import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Assumindo que esta função está disponível
import { getImageUrl } from '../api/tmdb'; 
import { Trash2, Edit } from 'lucide-react';

// ATUALIZAÇÃO E CORREÇÃO: Função renomeada para AnimeCard e adição de verificação de segurança.
const AnimeCard = ({ anime, onDelete }) => {
    
    // Verificação de segurança: Se o prop 'anime' não existir, não renderiza e evita o erro.
    if (!anime) {
        console.warn("AnimeCard recebeu um prop 'anime' indefinido ou nulo e não será renderizado.");
        return null; 
    }
    
    const navigate = useNavigate();

    return (
        // Link para a página de detalhes do anime
        <div className="series-card">
            {/* O erro ocorria aqui se 'anime' fosse undefined */}
            <Link to={`/anime/${anime.id}`} className="series-card-link-wrapper">
                <div className="series-card-image-wrapper">
                    {/* Imagem do poster, se existir */}
                    {anime.posterPath ? (
                        <img 
                            src={getImageUrl(anime.posterPath)} 
                            alt={anime.title} 
                            className="series-card-image"
                        />
                    ) : (
                        <div className="series-card-image-placeholder">No Image</div>
                    )}
                    <div className="series-card-gradient"></div>
                    <h3 className="series-card-title">{anime.title}</h3>
                </div>
            </Link>

            {/* Overlay de botões de Ação */}
            <div className="card-buttons-overlay">
                {/* Botão de Edição */}
                <button 
                    onClick={() => navigate(`/anime/editar/${anime.id}`)}
                    className="edit-button" 
                    title="Editar Links"
                >
                    <Edit size={16} />
                </button>
                
                {/* Botão de Deleção (abre o modal no HomePage) */}
                <button 
                    onClick={onDelete} 
                    className="delete-button" 
                    title="Deletar Anime"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default AnimeCard;