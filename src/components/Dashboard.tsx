import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, RefreshCw } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { dashboardService } from "../services/dashboardService";
import { DashboardStats, MonthlyData, PieData, RecentTransaction } from "../types/index";

const COLORS = ["#10B981", "#EF4444"];

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, monthlyDataRes, pieDataRes, transactionsRes] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getMonthlyData(),
        dashboardService.getPieData(),
        dashboardService.getRecentTransactions(4)
      ]);

      setStats(statsData ?? null);
      setMonthlyData(monthlyDataRes ?? []);
      setPieData(pieDataRes ?? []);
      setRecentTransactions(transactionsRes ?? []);
    } catch (err: any) {
      console.error("Error loading dashboard:", err);
      setError(err.response?.data?.message || err.message || "Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value?: number | null) => {
    const safeValue = value ?? 0;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(safeValue);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatPercentage = (value?: number | null) => {
    if (value == null) return "0%";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  // Loader
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-gray-600">Cargando dashboard...</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-600 text-center">
          <p className="font-semibold">Error al cargar el dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel Principal</h1>
          <p className="text-gray-600">Resumen de tu situación financiera</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Actualizar datos"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo Actual</CardTitle>
            <Wallet className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{formatCurrency(stats?.currentBalance)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.currentBalance == null ? "No configurado" : "Actualizado hoy"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.monthlyIncome)}</div>
            <p className="text-xs text-gray-500 mt-1">{formatPercentage(stats?.incomeChange)} vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Gastos del Mes</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats?.monthlyExpenses)}</div>
            <p className="text-xs text-gray-500 mt-1">{formatPercentage(stats?.expenseChange)} vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ahorro</CardTitle>
            <PiggyBank className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats?.savingsPercentage?.toFixed(1) ?? "0"}%</div>
            <p className="text-xs text-gray-500 mt-1">Del total de ingresos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">No hay datos disponibles</div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico (Últimos 5 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" />
                  <Bar dataKey="gastos" fill="#EF4444" name="Gastos" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">No hay datos disponibles</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions?.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.type === "ingreso" ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {item.type === "ingreso" ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      item.type === "ingreso" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {item.type === "ingreso" ? "+" : "-"}
                    {formatCurrency(Math.abs(item.amount))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No hay transacciones recientes</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
