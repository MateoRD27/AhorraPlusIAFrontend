import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Loader2, RefreshCw, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { transactionService } from "../services/transactionService";
import type { Income, IncomeFormData, User } from "../types";
import { authService } from "../services/authService";

export function IncomeManagement() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<IncomeFormData>({
    amount: "",
    source: "",
    date: "",
    description: "",
  });

  // Cargar usuario al inicio
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

  // Cargar ingresos cuando ya hay usuario
  useEffect(() => {
    if (currentUser) {
      loadIncomes();
    }
  }, [currentUser]);

  const loadIncomes = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const data = await transactionService.getIncomes(currentUser.id);
      setIncomes(data);
    } catch (error) {
      console.error("Error loading incomes:", error);
      toast.error("Error al cargar los ingresos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!formData.amount || !formData.source || !formData.date) {
      toast.error("Por favor completa todos los campos requeridos");
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
        await transactionService.updateIncome(editingId, currentUser.id, incomeData);
        toast.success("Ingreso actualizado exitosamente");
        setEditingId(null);
      } else {
        await transactionService.createIncome(currentUser.id, incomeData);
        toast.success("Ingreso registrado exitosamente");
      }

      setFormData({ amount: "", source: "", date: "", description: "" });
      await loadIncomes();
    } catch (error) {
      console.error("Error saving income:", error);
      toast.error(editingId ? "Error al actualizar el ingreso" : "Error al registrar el ingreso");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ amount: "", source: "", date: "", description: "" });
  };

  const handleDelete = async (idIncome: number) => {
    if (!currentUser) return;

    if (!window.confirm("¿Estás seguro de eliminar este ingreso?")) return;

    try {
      await transactionService.deleteIncome(idIncome, currentUser.id);
      toast.success("Ingreso eliminado");
      await loadIncomes();
    } catch (error) {
      console.error("Error deleting income:", error);
      toast.error("Error al eliminar el ingreso");
    }
  };

  // Pantalla mientras carga el usuario
  if (!currentUser) {
    return (
      <div className="flex justify-center items-center py-12 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3">Cargando usuario...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Ingresos</h1>
          <p className="text-gray-600">Registra y administra tus ingresos</p>
        </div>

        <Button variant="outline" size="sm" onClick={loadIncomes} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={20} />
              {editingId ? "Editar Ingreso" : "Registrar Ingreso"}
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
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Fuente *</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, source: value })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Salario">Salario</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                    <SelectItem value="Inversiones">Inversiones</SelectItem>
                    <SelectItem value="Negocio">Negocio</SelectItem>
                    <SelectItem value="Beca">Beca</SelectItem>
                    <SelectItem value="Familia">Familia</SelectItem>
                    <SelectItem value="Otros">Otros</SelectItem>
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
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Descripción del ingreso"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Actualizar Ingreso" : "Registrar Ingreso"}
                </Button>

                {editingId && (
                  <Button variant="outline" className="w-full" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos Recientes</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : incomes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay ingresos registrados</div>
            ) : (
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
                      <TableCell className="text-right font-semibold text-green-600">
                        +${income.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(income)}>
                            <Edit size={16} />
                          </Button>

                          <Button variant="ghost" size="sm" onClick={() => handleDelete(income.idIncome)}>
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
