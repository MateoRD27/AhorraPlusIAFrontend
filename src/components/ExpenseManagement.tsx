import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Alert, AlertDescription } from "./ui/alert";
import { Plus, Edit, Trash2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { transactionService } from "../services/transactionService";
import type { Expense, ExpenseFormData, User } from "../types";
import { authService } from "../services/authService";

export function ExpenseManagement() {

  const [currentUser, setCurrentUser] = useState<User | null>(null); 

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: "",
    method: "",
    date: "",
    description: "",
  });
  const [showWarning, setShowWarning] = useState(false);

  // Cargar usuario al montar el componente
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error cargando usuario:", error);
      }
    };
    loadUser();
  }, []);

  // Cargar datos solo cuando ya tenemos el usuario
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const [expensesData, balance] = await Promise.all([
        transactionService.getExpenses(currentUser.id),
        transactionService.getBalance(currentUser.id)
      ]);
      setExpenses(expensesData);
      setAvailableBalance(balance);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    setFormData({ ...formData, amount: value });
    if (parseFloat(value) > availableBalance) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) return; // seguridad

    if (!formData.amount || !formData.method || !formData.date) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    if (parseFloat(formData.amount) > availableBalance) {
      toast.error("El gasto supera tu saldo disponible");
      return;
    }

    setSubmitting(true);

    try {
      const expenseData = {
        amount: parseFloat(formData.amount),
        method: formData.method,
        date: formData.date,
        description: formData.description,
      };

      if (editingId) {
        await transactionService.updateExpense(editingId, currentUser.id, expenseData);
        toast.success("Gasto actualizado exitosamente");
        setEditingId(null);
      } else {
        await transactionService.createExpense(currentUser.id, expenseData);
        toast.success("Gasto registrado exitosamente");
      }

      setFormData({ amount: "", method: "", date: "", description: "" });
      setShowWarning(false);
      await loadData();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error(editingId ? "Error al actualizar el gasto" : "Error al registrar el gasto");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.idExpense);
    setFormData({
      amount: expense.amount.toString(),
      method: expense.method,
      date: expense.date,
      description: expense.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ amount: "", method: "", date: "", description: "" });
    setShowWarning(false);
  };

  const handleDelete = async (idExpense: number) => {
    if (!currentUser) return;

    if (!window.confirm("¿Estás seguro de eliminar este gasto?")) {
      return;
    }

    try {
      await transactionService.deleteExpense(idExpense, currentUser.id);
      toast.success("Gasto eliminado");
      await loadData();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Error al eliminar el gasto");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Gastos</h1>
          <p className="text-gray-600">Registra y controla tus gastos</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Saldo disponible</p>
          <p className="text-2xl font-bold text-green-600">${availableBalance.toFixed(2)}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={loading}
            className="mt-2"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={20} />
              {editingId ? "Editar Gasto" : "Registrar Gasto"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  required
                  disabled={submitting}
                />
                {showWarning && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 text-sm">
                      Este gasto supera tu saldo disponible (${availableBalance.toFixed(2)})
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Método de Pago *</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value: string) => setFormData({ ...formData, method: value })}
                  required
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                    <SelectItem value="TARJETA_CREDITO">Tarjeta de Crédito</SelectItem>
                    <SelectItem value="TARJETA_DEBITO">Tarjeta de Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Descripción del gasto"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleSubmit}
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Actualizar Gasto" : "Registrar Gasto"}
                </Button>
                {editingId && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCancelEdit}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gastos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay gastos registrados
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.idExpense}>
                      <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell>{expense.method}</TableCell>
                      <TableCell>{expense.description || "-"}</TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        -${expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {expense.overlimit && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            Sobrecupo
                          </span>
                        )}
                        {expense.anomalous && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Anómalo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(expense)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(expense.idExpense)}
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </Button>
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