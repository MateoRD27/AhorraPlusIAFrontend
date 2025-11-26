import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Target, Plus, Calendar, TrendingUp, ArrowUpCircle, ArrowDownCircle, Trash2, PartyPopper, Loader2, Wallet, Lock } from "lucide-react";
import { toast } from "sonner";
import { savingsService } from "../services/savingsService";
import { transactionService } from "../services/transactionService";
import { useAuth } from "../hooks/useAuth";
import type { SavingsGoal } from "../types";

export function SavingsGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState(0);
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
  
  const [formData, setFormData] = useState({
    name: "",
    target: "",
    deadline: "",
    priority: "MEDIUM",
  });

  const userId = user?.id ? Number(user.id) : 0;

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadGoals(), loadBalance()]);
    setLoading(false);
  };

  const loadGoals = async () => {
    try {
      const data = await savingsService.getSavingsGoals(userId);
      setGoals(data);
    } catch (error) {
      console.error("Error cargando metas:", error);
    }
  };

  const loadBalance = async () => {
    try {
      const balance = await transactionService.getBalance(userId);
      setUserBalance(balance);
    } catch (error) {
      console.error("Error cargando saldo:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      await savingsService.createSavingsGoal(userId, {
        name: formData.name,
        targetAmount: parseFloat(formData.target),
        endDate: formData.deadline,
        priority: formData.priority,
        startDate: new Date().toISOString().split('T')[0],
        frequency: 'MONTHLY'
      });

      toast.success("Meta creada. ¡Ahorra para completarla!");
      setFormData({ name: "", target: "", deadline: "", priority: "MEDIUM" });
      setIsOpen(false);
      loadGoals(); 
    } catch (error) {
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

    // Validación visual: Saldo insuficiente
    if (transactionDialog.type === 'deposit' && amount > userBalance) {
        toast.error(`Saldo insuficiente. Dispones de: $${userBalance.toFixed(2)}`);
        return;
    }

    try {
      let updatedGoal;
      if (transactionDialog.type === 'deposit') {
        updatedGoal = await savingsService.addToSavingsGoal(transactionDialog.goalId, userId, amount);
        toast.success(`Ahorro registrado (Descontado de tu saldo)`);
        
        if (updatedGoal.status === 'COMPLETED') {
           setTimeout(() => {
             setCelebrationDialog({ open: true, goalName: updatedGoal.name });
           }, 500);
        }
      } else {
        updatedGoal = await savingsService.withdrawFromSavingsGoal(transactionDialog.goalId, userId, amount);
        toast.success(`Retiro exitoso (Agregado a tu saldo)`);
      }

      setTransactionAmount("");
      setTransactionDialog({ open: false, goalId: null, type: null });
      await loadData(); // Refrescar metas y saldo

    } catch (error: any) {
      const msg = error.response?.data?.message || "Error en la transacción";
      toast.error(msg);
    }
  };

  const handleDeleteGoal = async (goalId: number, goalName: string, status: string) => {
    const isCompleted = status === 'COMPLETED';
    const message = isCompleted 
      ? `¿Eliminar meta "${goalName}"? Al estar completada, el dinero se considera gastado en el objetivo y NO volverá a tu saldo.`
      : `¿Eliminar meta "${goalName}"? El dinero ahorrado se reembolsará a tu saldo disponible.`;

    if (!window.confirm(message)) return;

    try {
      await savingsService.deleteSavingsGoal(goalId, userId);
      toast.success(isCompleted ? "Meta eliminada (Objetivo cumplido)" : "Meta eliminada y fondos reembolsados");
      await loadData();
    } catch (error) {
      toast.error("Error al eliminar la meta");
    }
  };

  const openTransactionDialog = (goalId: number, type: 'deposit' | 'withdraw') => {
    setTransactionDialog({ open: true, goalId, type });
    setTransactionAmount("");
  };

  // Helpers
  const calculateProgress = (current: number, target: number) => target === 0 ? 0 : Math.min((current / target) * 100, 100);
  
  const getDaysRemaining = (deadline: string) => {
    if (!deadline) return 0;
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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

  if (loading && goals.length === 0) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Metas de Ahorro</h1>
          <p className="text-gray-600">El dinero ahorrado aquí se descuenta de tu saldo disponible.</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2 text-gray-600">
                <Wallet size={20} className="text-indigo-600"/>
                <span className="text-sm font-medium">Disponible:</span>
            </div>
            <span className="text-lg font-bold text-green-600">${userBalance.toFixed(2)}</span>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus size={20} className="mr-2" /> Nueva Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Meta de Ahorro</DialogTitle>
              <DialogDescription>Define tu objetivo. Recuerda que las metas de prioridad Alta bloquean retiros.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" placeholder="Ej: Laptop Nueva" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Monto Objetivo</Label>
                <Input id="target" type="number" step="0.01" value={formData.target} onChange={(e) => setFormData({ ...formData, target: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Fecha Límite</Label>
                <Input id="deadline" type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">Alta (Bloquea retiros)</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="LOW">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Crear Meta</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={transactionDialog.open} onOpenChange={(open) => !open && setTransactionDialog({ open: false, goalId: null, type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{transactionDialog.type === 'deposit' ? 'Abonar a Meta' : 'Retirar de Meta'}</DialogTitle>
            <DialogDescription>
              {selectedGoal && (
                <div className="mt-2 p-3 bg-slate-50 rounded text-sm space-y-1">
                  <p className="flex justify-between"><span>Meta:</span> <strong>{selectedGoal.name}</strong></p>
                  <p className="flex justify-between"><span>Ahorrado:</span> <span className="text-indigo-600">${selectedGoal.currentAmount.toFixed(2)}</span></p>
                  <p className="flex justify-between border-t pt-1 mt-1"><span>Tu Disponible:</span> <span className="text-green-600">${userBalance.toFixed(2)}</span></p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransaction} className="space-y-4">
            <Input 
              type="number" 
              step="0.01" 
              min="0.01" 
              placeholder="0.00" 
              value={transactionAmount} 
              onChange={(e) => setTransactionAmount(e.target.value)} 
              required 
              autoFocus 
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setTransactionDialog({ open: false, goalId: null, type: null })}>Cancelar</Button>
              <Button type="submit" className={`flex-1 ${transactionDialog.type === 'deposit' ? 'bg-green-600' : 'bg-red-600'}`}>
                {transactionDialog.type === 'deposit' ? 'Ahorrar' : 'Retirar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={celebrationDialog.open} onOpenChange={(open) => !open && setCelebrationDialog({ open: false, goalName: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-green-600">¡Objetivo Logrado!</DialogTitle>
            <DialogDescription className="text-center">Has completado "{celebrationDialog.goalName}".</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4"><PartyPopper size={64} className="text-yellow-500 animate-bounce" /></div>
          <Button className="w-full bg-indigo-600" onClick={() => setCelebrationDialog({ open: false, goalName: "" })}>¡Excelente!</Button>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
          const isCompleted = goal.status === 'COMPLETED';
          const isHighPriority = goal.priority === 'HIGH';
          // Bloquear retiro si es Alta prioridad y NO está completa, o si no tiene dinero
          const canWithdraw = goal.currentAmount > 0 && (!isHighPriority || isCompleted);

          return (
            <Card key={goal.idGoal} className={`transition-all hover:shadow-md ${isCompleted ? 'border-green-200 bg-green-50/50' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Target className={isCompleted ? "text-green-600" : "text-indigo-600"} size={20} />
                    <CardTitle className="text-lg line-clamp-1">{goal.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getPriorityColor(goal.priority)}`}>{goal.priority}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-red-600" onClick={() => handleDeleteGoal(goal.idGoal, goal.name, goal.status || 'ACTIVE')}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1 text-xs text-gray-500">
                    <span>Progreso</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex justify-between items-end text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Ahorrado</p>
                    <p className="font-bold text-gray-900">${goal.currentAmount.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs">Meta</p>
                    <p className="font-medium text-gray-700">${goal.targetAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 h-8 text-xs" onClick={() => openTransactionDialog(goal.idGoal, 'deposit')}>
                      <ArrowUpCircle size={14} className="mr-1" /> Ahorrar
                    </Button>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-1"> 
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full border-red-200 text-red-700 hover:bg-red-50 h-8 text-xs" 
                              onClick={() => openTransactionDialog(goal.idGoal, 'withdraw')}
                              disabled={!canWithdraw}
                            >
                              {isHighPriority && !isCompleted ? <Lock size={12} className="mr-1"/> : <ArrowDownCircle size={14} className="mr-1"/>} 
                              Retirar
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {!canWithdraw && (
                          <TooltipContent>
                            <p>{goal.currentAmount <= 0 ? "Sin fondos" : "Bloqueado por prioridad Alta"}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}