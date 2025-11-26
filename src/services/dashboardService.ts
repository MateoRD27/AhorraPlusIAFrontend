import { apiClient } from './api';
import { 
  DashboardStats, 
  MonthlyData, 
  PieData, 
  RecentTransaction,
  ApiResponse 
} from '../types/index';
import { AxiosResponse } from 'axios';

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response: AxiosResponse<ApiResponse<DashboardStats>> = await apiClient.get('/dashboard/stats');
    
    console.log('🔍 Response completo:', response);
    console.log('🔍 response.data:', response.data);
    console.log('🔍 response.data.data:', response.data.data);
    
    // Si tu backend devuelve { success: true, data: {...} }
    if (response.data.data) {
      return response.data.data;
    }
    
    // Si tu backend devuelve directamente {...}
    return response.data as any;
  },

  async getMonthlyData(): Promise<MonthlyData[]> {
    const response: AxiosResponse<ApiResponse<MonthlyData[]>> = await apiClient.get('/dashboard/monthly-data');
    
    console.log('🔍 Monthly response.data:', response.data);
    console.log('🔍 Monthly response.data.data:', response.data.data);
    
    if (response.data.data) {
      return response.data.data;
    }
    
    return response.data as any;
  },

  async getPieData(): Promise<PieData[]> {
    const response: AxiosResponse<ApiResponse<PieData[]>> = await apiClient.get('/dashboard/pie-data');
    
    console.log('🔍 Pie response.data:', response.data);
    console.log('🔍 Pie response.data.data:', response.data.data);
    
    if (response.data.data) {
      return response.data.data;
    }
    
    return response.data as any;
  },

  async getRecentTransactions(limit: number = 4): Promise<RecentTransaction[]> {
    const response: AxiosResponse<ApiResponse<RecentTransaction[]>> = await apiClient.get(
      `/dashboard/recent-transactions?limit=${limit}`
    );
    
    console.log('🔍 Transactions response.data:', response.data);
    console.log('🔍 Transactions response.data.data:', response.data.data);
    
    if (response.data.data) {
      return response.data.data;
    }
    
    return response.data as any;
  }
};