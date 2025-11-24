import axios from 'axios';

const API_KEY = 'b973c7ca178790420b1b57f2e3ee0149'; // !! COLOQUE SUA CHAVE AQUI !!
const API_BASE_URL = 'https://api.themoviedb.org/3';

const tmdbClient = axios.create({
  baseURL: API_BASE_URL,
  params: {
    api_key: API_KEY,
    language: 'pt-BR'
  }
});

export const getSeriesDetails = (seriesId) => tmdbClient.get(`/tv/${seriesId}`);
export const searchSeries = (query) => tmdbClient.get('/search/tv', { params: { query } });
export const getImageUrl = (path) => path ? `https://image.tmdb.org/t/p/w500${path}` : 'https://placehold.co/500x750/1f2937/ffffff?text=Sem+Imagem';
export const getBackdropUrl = (path) => path ? `https://image.tmdb.org/t/p/w1280${path}` : 'https://placehold.co/1280x720/111827/ffffff?text=Sem+Imagem';