import { apiClient } from './api';
import { SavingsGoal } from '../types';

// Definimos el DTO de envío (lo que mandamos al backend)
interface CreateGoalDTO {
  name: string;
  targetAmount: number;
  endDate: string;
  priority: string;
  frequency?: string;
  startDate?: string; 
}

export const savingsService = {
  // Obtener todas las metas (GET /api/v1/savings-goals/all/{userId})
  async getSavingsGoals(userId: number): Promise<SavingsGoal[]> {
    // apiClient.get ya devuelve los datos directamente, no es necesario acceder a .data
    return await apiClient.get<SavingsGoal[]>(`/savings-goals/all/${userId}`);
  },

  // Crear meta (POST /api/v1/savings-goals/{userId})
  async createSavingsGoal(userId: number, goal: CreateGoalDTO): Promise<SavingsGoal> {
    return await apiClient.post<SavingsGoal>(`/savings-goals/${userId}`, goal);
  },

  // Actualizar meta (PUT /api/v1/savings-goals/{idGoal}/{userId})
  async updateSavingsGoal(idGoal: number, userId: number, goal: Partial<SavingsGoal>): Promise<SavingsGoal> {
    return await apiClient.put<SavingsGoal>(`/savings-goals/${idGoal}/${userId}`, goal);
  },

  // Eliminar meta (DELETE /api/v1/savings-goals/{idGoal}/{userId})
  async deleteSavingsGoal(idGoal: number, userId: number): Promise<void> {
    await apiClient.delete(`/savings-goals/${idGoal}/${userId}`);
  },

  // Abonar dinero (POST /api/v1/savings-goals/{idGoal}/{userId}/add)
  async addToSavingsGoal(idGoal: number, userId: number, amount: number): Promise<SavingsGoal> {
    return await apiClient.post<SavingsGoal>(
      `/savings-goals/${idGoal}/${userId}/add`,
      { amount } 
    );
  },

  // Retirar dinero (POST /api/v1/savings-goals/{idGoal}/{userId}/withdraw)
  async withdrawFromSavingsGoal(idGoal: number, userId: number, amount: number): Promise<SavingsGoal> {
    return await apiClient.post<SavingsGoal>(
      `/savings-goals/${idGoal}/${userId}/withdraw`,
      { amount }
    );
  }
};