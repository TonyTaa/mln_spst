import axios from 'axios';
import gameDatabase from '../../db.json';

const LOCAL_SAVES_KEY = 'politicalEconomyRpgSaves';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const api = apiBaseUrl
  ? axios.create({
      baseURL: apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    })
  : null;

const clone = (value) => JSON.parse(JSON.stringify(value));

const readLocalSaves = () => {
  try {
    const storedSaves = window.localStorage.getItem(LOCAL_SAVES_KEY);
    if (storedSaves) {
      const parsedSaves = JSON.parse(storedSaves);
      if (Array.isArray(parsedSaves)) return parsedSaves;
    }
  } catch (error) {
    console.warn('Could not read local save games:', error);
  }

  return clone(gameDatabase.savegames || []);
};

const writeLocalSaves = (saves) => {
  window.localStorage.setItem(LOCAL_SAVES_KEY, JSON.stringify(saves));
};

const getLocalCollection = (collectionName) => clone(gameDatabase[collectionName] || []);

const runWithLocalFallback = async (remoteRequest, localRequest) => {
  if (!api) return localRequest();

  try {
    const response = await remoteRequest();
    return response.data;
  } catch (error) {
    console.warn(`Game API unavailable (${error.message}). Using local data instead.`);
    return localRequest();
  }
};

const findSaveIndex = (saves, id) => saves.findIndex((save) => String(save.id) === String(id));

export const apiService = {
  getClasses: () => runWithLocalFallback(
    () => api.get('/classes'),
    () => getLocalCollection('classes'),
  ),

  getMonsters: () => runWithLocalFallback(
    () => api.get('/monsters'),
    () => getLocalCollection('monsters'),
  ),

  getBosses: () => runWithLocalFallback(
    () => api.get('/bosses'),
    () => getLocalCollection('bosses'),
  ),

  getStages: () => runWithLocalFallback(
    () => api.get('/stages'),
    () => getLocalCollection('stages'),
  ),

  getQuestions: (params = {}) => runWithLocalFallback(
    () => api.get('/questions', { params }),
    () => getLocalCollection('questions').filter((question) => (
      Object.entries(params).every(([key, value]) => String(question[key]) === String(value))
    )),
  ),

  getItems: () => runWithLocalFallback(
    () => api.get('/items'),
    () => getLocalCollection('items'),
  ),

  getQuests: () => runWithLocalFallback(
    () => api.get('/quests'),
    () => getLocalCollection('quests'),
  ),

  getSaveGames: () => runWithLocalFallback(
    () => api.get('/savegames'),
    () => clone(readLocalSaves()),
  ),

  getSaveGameById: (id) => runWithLocalFallback(
    () => api.get(`/savegames/${id}`),
    () => {
      const save = readLocalSaves().find((entry) => String(entry.id) === String(id));
      if (!save) throw new Error(`Save game ${id} was not found.`);
      return clone(save);
    },
  ),

  createSaveGame: (saveData) => runWithLocalFallback(
    () => api.post('/savegames', saveData),
    () => {
      const saves = readLocalSaves();
      const maxId = saves.reduce((largestId, save) => {
        const numericId = Number(save.id);
        return Number.isFinite(numericId) ? Math.max(largestId, numericId) : largestId;
      }, 0);
      const newSave = { ...clone(saveData), id: maxId + 1 };
      writeLocalSaves([...saves, newSave]);
      return clone(newSave);
    },
  ),

  updateSaveGame: (id, saveData) => runWithLocalFallback(
    () => api.put(`/savegames/${id}`, saveData),
    () => {
      const saves = readLocalSaves();
      const saveIndex = findSaveIndex(saves, id);
      if (saveIndex === -1) throw new Error(`Save game ${id} was not found.`);

      const updatedSave = { ...clone(saveData), id: saves[saveIndex].id };
      saves[saveIndex] = updatedSave;
      writeLocalSaves(saves);
      return clone(updatedSave);
    },
  ),

  deleteSaveGame: (id) => runWithLocalFallback(
    () => api.delete(`/savegames/${id}`),
    () => {
      const saves = readLocalSaves();
      const saveIndex = findSaveIndex(saves, id);
      if (saveIndex === -1) throw new Error(`Save game ${id} was not found.`);

      const [deletedSave] = saves.splice(saveIndex, 1);
      writeLocalSaves(saves);
      return clone(deletedSave);
    },
  ),
};

export default apiService;
