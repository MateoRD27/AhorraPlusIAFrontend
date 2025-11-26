import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Trash2, Loader2, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { transactionService } from "../services/transactionService";
import { useAuth } from "../hooks/useAuth";
import type { Income, IncomeFormData } from "../types";

export function IncomeManagement() {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [formData, setFormData] = useState<IncomeFormData>({
    amount: "",
    source: "",
    date: "",
    description: "",
  });

  const userId = user?.id ? Number(user.id) : 0;

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadIncomes(), loadBalance()]);
    setLoading(false);
  };

  const loadIncomes = async () => {
    try {
      const data = await transactionService.getIncomes(userId);
      setIncomes(data);
    } catch (error) {
      console.error("Error loading incomes:", error);
    }
  };

  const loadBalance = async () => {
    try {
      const balance = await transactionService.getBalance(userId);
      setUserBalance(balance);
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.source || !formData.date) {
      toast.error("Completa los campos requeridos");
      return;
    }

    setSubmitting(true);
    try {
      const incomeData = {
        amount: parseFloat(formData.amount),
        source: formData.source,
        date: formData.date,
        description: formData.description,
      };

      if (editingId) {
        await transactionService.updateIncome(editingId, userId, incomeData);
        toast.success("Ingreso actualizado.");
      } else {
        await transactionService.createIncome(userId, incomeData);
        toast.success("Ingreso registrado.");
      }

      setEditingId(null);
      setFormData({ amount: "", source: "", date: "", description: "" });
      await loadData();
    } catch (error) {
      toast.error("Error al guardar el ingreso");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (income: Income) => {
    setEditingId(income.idIncome);
    setFormData({
      amount: income.amount.toString(),
      source: income.source,
      date: income.date,
      description: income.description || "",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ amount: "", source: "", date: "", description: "" });
  };

  const handleDelete = async (idIncome: number) => {
    if (!window.confirm("¿Eliminar este ingreso? Se descontará de tu saldo.")) return;
    try {
      await transactionService.deleteIncome(idIncome, userId);
      toast.success("Ingreso eliminado.");
      await loadData();
    } catch (error) {
      toast.error("Error al eliminar.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Ingresos</h1>
          <p className="text-gray-600">Registra y administra tus ingresos</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2 text-gray-600">
                <Wallet size={20} className="text-green-600"/>
                <span className="text-sm font-medium">Saldo Actual:</span>
            </div>
            <span className="text-lg font-bold text-green-600">${userBalance.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={20} /> {editingId ? "Editar Ingreso" : "Registrar Ingreso"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Monto *</Label>
                <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Fuente *</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })} required>
                  <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Salario">Salario</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                    <SelectItem value="Negocio">Negocio</SelectItem>
                    <SelectItem value="Otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Button onClick={handleSubmit} className="w-full bg-green-600 hover:bg-green-700" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Actualizar" : "Guardar"}
                </Button>
                {editingId && <Button variant="outline" className="w-full" onClick={handleCancelEdit}>Cancelar</Button>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Ingresos Recientes</CardTitle>
                <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {incomes.length === 0 ? <div className="text-center py-8 text-gray-500">No hay registros</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomes.map((income) => (
                    <TableRow key={income.idIncome}>
                      <TableCell>{new Date(income.date).toLocaleDateString()}</TableCell>
                      <TableCell>{income.source}</TableCell>
                      <TableCell>{income.description || "-"}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">+${income.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(income)}><Edit size={16} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(income.idIncome)}><Trash2 size={16} className="text-red-600" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}