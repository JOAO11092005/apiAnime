import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AnimeCard from '../components/AnimeCard';
import { Trash2, ShieldAlert, Wifi, Zap } from 'lucide-react';

const HomePage = () => {
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [animeToDelete, setAnimeToDelete] = useState(null);

  const [showApiModal, setShowApiModal] = useState(false);

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        const animesCollection = collection(db, 'animes');
        const animesSnapshot = await getDocs(animesCollection);
        const fetchedAnimes = animesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnimeList(fetchedAnimes);
      } catch (err) {
        console.error("Erro ao buscar animes do Firebase:", err);
        setError('Não foi possível carregar os animes.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnimes();
  }, []);

  const handleDeleteClick = (anime) => {
    setAnimeToDelete(anime);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!animeToDelete) return;
    try {
      await deleteDoc(doc(db, 'animes', animeToDelete.id));
      setAnimeList(prevList => prevList.filter(s => s.id !== animeToDelete.id));
    } catch (err) {
      console.error("Erro ao deletar o anime:", err);
      setError("Falha ao deletar o anime.");
    } finally {
      setShowConfirmModal(false);
      setAnimeToDelete(null);
    }
  };

  if (loading) return <div className="loading-message">Carregando animes...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="container">
      {/* Modal de Confirmação de Exclusão */}
      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <ShieldAlert size={48} className="confirm-modal-icon" />
            <h2>Confirmar Exclusão</h2>
            <p>Você tem certeza que deseja apagar o anime <strong>"{animeToDelete?.title}"</strong>? Esta ação não pode ser desfeita.</p>
            <div className="confirm-modal-buttons">
              <button onClick={() => setShowConfirmModal(false)} className="button-secondary">Cancelar</button>
              <button onClick={confirmDelete} className="button-danger">Sim, Apagar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para exibir os Endpoints da API */}
      {showApiModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal api-modal-content">
            <Wifi size={48} className="confirm-modal-icon" />
            <h2>Endpoints da API de Animes</h2>
            <p>Use as seguintes URLs para acessar os dados dos animes a partir de outro site. A URL base será fornecida pela Vercel após o deploy.</p>
            <div className="api-endpoints">
              <div className="api-endpoint">
                <strong>Listar todos os animes (GET):</strong>
                <code>https://SUA-URL-DO-VERCEL.vercel.app/animes</code>
              </div>
              <div className="api-endpoint">
                <strong>Buscar um anime por ID (GET):</strong>
                <code>https://SUA-URL-DO-VERCEL.vercel.app/animes/:id</code>
              </div>
            </div>
            <div className="confirm-modal-buttons">
              <button onClick={() => setShowApiModal(false)} className="button">Fechar</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title"><Zap size={32} className="page-icon" /> Animes Disponíveis</h1>

        <button onClick={() => setShowApiModal(true)} className="button-secondary api-button">
          <Wifi size={16} />
          Acessar API
        </button>
      </div>
      <div className="page-title-separator" /> 

      {animeList.length > 0 ? (
        <div className="series-grid">
          {animeList.map(anime =>
            <AnimeCard
              key={anime.id}
              anime={anime}
              onDelete={() => handleDeleteClick(anime)}
            />
          )}
        </div>
      ) : (
        <p className="info-message">Nenhum anime foi adicionado ainda.</p>
      )}
    </div>
  );
};

export default HomePage;