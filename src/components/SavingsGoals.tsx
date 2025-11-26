import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Target, Plus, Calendar, TrendingUp, ArrowUpCircle, ArrowDownCircle, Trash2, PartyPopper, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { savingsService } from "../services/savingsService";
import { useAuth } from "../hooks/useAuth"; // Hook para obtener el usuario
import type { SavingsGoal } from "../types";

export function SavingsGoals() {
  const { user } = useAuth(); // Obtenemos el usuario autenticado
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [transactionDialog, setTransactionDialog] = useState<{ open: boolean; goalId: number | null; type: 'deposit' | 'withdraw' | null }>({
    open: false,
    goalId: null,
    type: null,
  });
  const [transactionAmount, setTransactionAmount] = useState("");
  const [celebrationDialog, setCelebrationDialog] = useState<{ open: boolean; goalName: string }>({
    open: false,
    goalName: "",
  });
  
  // Formulario
  const [formData, setFormData] = useState({
    name: "",
    target: "",
    deadline: "",
    priority: "MEDIUM", // Valor por defecto compatible con backend
  });

  const userId = user?.id ? Number(user.id) : 0;

  // Cargar metas al iniciar
  useEffect(() => {
    if (userId) {
      loadGoals();
    }
  }, [userId]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await savingsService.getSavingsGoals(userId);
      setGoals(data);
    } catch (error) {
      console.error("Error cargando metas:", error);
      toast.error("Error al cargar las metas de ahorro");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      await savingsService.createSavingsGoal(userId, {
        name: formData.name,
        targetAmount: parseFloat(formData.target),
        endDate: formData.deadline, // Mapeamos deadline del form a endDate del DTO
        priority: formData.priority,
        startDate: new Date().toISOString().split('T')[0], // Fecha de hoy
        frequency: 'MONTHLY' // Valor por defecto
      });

      toast.success("Meta de ahorro creada exitosamente");
      setFormData({ name: "", target: "", deadline: "", priority: "MEDIUM" });
      setIsOpen(false);
      loadGoals(); // Recargar lista
    } catch (error) {
      console.error("Error creando meta:", error);
      toast.error("Error al crear la meta");
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionDialog.goalId || !transactionDialog.type || !userId) return;
    
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    try {
      let updatedGoal;
      if (transactionDialog.type === 'deposit') {
        updatedGoal = await savingsService.addToSavingsGoal(transactionDialog.goalId, userId, amount);
        toast.success(`Abono exitoso a "${updatedGoal.name}"`);
        
        // Verificar si se completó (el backend cambia el estado)
        if (updatedGoal.status === 'COMPLETED') {
           setTimeout(() => {
             setCelebrationDialog({ open: true, goalName: updatedGoal.name });
           }, 500);
        }
      } else {
        updatedGoal = await savingsService.withdrawFromSavingsGoal(transactionDialog.goalId, userId, amount);
        toast.success(`Retiro exitoso de "${updatedGoal.name}"`);
      }

      setTransactionAmount("");
      setTransactionDialog({ open: false, goalId: null, type: null });
      loadGoals(); // Recargar datos frescos del backend
    } catch (error: any) {
      console.error("Error en transacción:", error);
      // Mostrar mensaje de error del backend si existe (ej: fondos insuficientes)
      const msg = error.response?.data?.message || "Error al procesar la transacción";
      toast.error(msg);
    }
  };

  const handleDeleteGoal = async (goalId: number, goalName: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la meta "${goalName}"?`)) return;

    try {
      await savingsService.deleteSavingsGoal(goalId, userId);
      toast.success(`Meta "${goalName}" eliminada`);
      loadGoals();
    } catch (error) {
      console.error("Error eliminando meta:", error);
      toast.error("Error al eliminar la meta");
    }
  };

  const openTransactionDialog = (goalId: number, type: 'deposit' | 'withdraw') => {
    setTransactionDialog({ open: true, goalId, type });
    setTransactionAmount("");
  };

  // --- Helpers Visuales ---
  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (deadline: string) => {
    if (!deadline) return 0;
    const today = new Date();
    const target = new Date(deadline);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "text-red-600 bg-red-100";
      case "MEDIUM": return "text-yellow-600 bg-yellow-100";
      case "LOW": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const selectedGoal = goals.find(g => g.idGoal === transactionDialog.goalId);

  if (loading && goals.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Metas de Ahorro</h1>
          <p className="text-gray-600">Define y alcanza tus objetivos financieros</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus size={20} className="mr-2" />
              Nueva Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Meta de Ahorro</DialogTitle>
              <DialogDescription>
                Define tu objetivo de ahorro y establece un plazo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la meta</Label>
                <Input
                  id="name"
                  placeholder="Ej: Vacaciones, Auto nuevo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Monto objetivo</Label>
                <Input
                  id="target"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Fecha límite</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="LOW">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                Crear Meta
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog para transacciones */}
      <Dialog open={transactionDialog.open} onOpenChange={(open) => !open && setTransactionDialog({ open: false, goalId: null, type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionDialog.type === 'deposit' ? 'Ingresar Dinero' : 'Retirar Dinero'}
            </DialogTitle>
            <DialogDescription>
              {selectedGoal && (
                <>
                  Meta: {selectedGoal.name} (Disponible: ${selectedGoal.currentAmount.toFixed(2)})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransaction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Monto a {transactionDialog.type === 'deposit' ? 'ingresar' : 'retirar'}
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
            
            {/* Mensajes de ayuda */}
            {selectedGoal && transactionDialog.type === 'deposit' && (
              <p className="text-sm text-gray-600">
                Falta para completar: ${Math.max(0, selectedGoal.targetAmount - selectedGoal.currentAmount).toFixed(2)}
              </p>
            )}

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setTransactionDialog({ open: false, goalId: null, type: null })}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className={`flex-1 ${
                  transactionDialog.type === 'deposit' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {transactionDialog.type === 'deposit' ? 'Ingresar' : 'Retirar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de celebración */}
      <Dialog open={celebrationDialog.open} onOpenChange={(open) => !open && setCelebrationDialog({ open: false, goalName: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-green-600">¡Felicidades!</DialogTitle>
            <DialogDescription className="text-center text-lg">
              ¡Has completado la meta de ahorro "{celebrationDialog.goalName}"!
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <PartyPopper size={80} className="text-yellow-500 animate-bounce" />
          </div>
          <Button 
            type="button" 
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setCelebrationDialog({ open: false, goalName: "" })}
          >
            ¡Genial!
          </Button>
        </DialogContent>
      </Dialog>

      {/* Lista de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
          const daysRemaining = getDaysRemaining(goal.endDate);
          const isCompleted = goal.status === 'COMPLETED' || goal.currentAmount >= goal.targetAmount;
          
          return (
            <Card key={goal.idGoal} className={`hover:shadow-lg transition-shadow ${isCompleted ? 'border-green-200 bg-green-50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Target className={isCompleted ? "text-green-600" : "text-indigo-600"} size={20} />
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                      onClick={() => handleDeleteGoal(goal.idGoal, goal.name)}
                      title="Eliminar meta"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Progreso</span>
                    <span className="text-sm font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-600">Actual</p>
                    <p className="text-green-600 font-semibold">${goal.currentAmount.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="text-gray-400" size={16} />
                  <div className="text-right">
                    <p className="text-gray-600">Objetivo</p>
                    <p className="text-indigo-600 font-semibold">${goal.targetAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                  <Calendar size={16} />
                  <span>
                    {isCompleted 
                      ? "¡Meta Completada!" 
                      : daysRemaining > 0 
                        ? `${daysRemaining} días restantes`
                        : "Plazo vencido"
                    }
                  </span>
                </div>

                <div className="pt-2">
                  {!isCompleted && (
                    <p className="text-sm text-gray-600 mb-3">Falta: ${(goal.targetAmount - goal.currentAmount).toFixed(2)}</p>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => openTransactionDialog(goal.idGoal, 'deposit')}
                    >
                      <ArrowUpCircle size={16} className="mr-1" />
                      Ingresar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => openTransactionDialog(goal.idGoal, 'withdraw')}
                      disabled={goal.currentAmount === 0}
                    >
                      <ArrowDownCircle size={16} className="mr-1" />
                      Retirar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {goals.length === 0 && !loading && (
          <div className="col-span-full text-center py-10 text-gray-500">
            No tienes metas registradas. ¡Crea una para empezar a ahorrar!
          </div>
        )}
      </div>
    </div>
  );
}