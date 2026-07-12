"use client";

import { useState, useMemo } from "react";
import { useFuelExpenseStore, useVehicleStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/form-elements";
import type { FuelEntry, ExpenseEntry } from "@/types";
import { Fuel, Receipt, DollarSign } from "lucide-react";
import { cn } from "@/lib/cn";
import { format } from "date-fns";

const expenseCategories: { value: ExpenseEntry["category"]; label: string }[] = [
  { value: "toll", label: "Toll" },
  { value: "insurance", label: "Insurance" },
  { value: "repair", label: "Repair" },
  { value: "fine", label: "Fine" },
  { value: "parking", label: "Parking" },
  { value: "other", label: "Other" },
];

export default function FuelExpensesPage() {
  const { fuelEntries, expenses, addFuelEntry, addExpense } = useFuelExpenseStore();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const [activeTab, setActiveTab] = useState<"fuel" | "expenses" | "summary">("fuel");
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [fuelForm, setFuelForm] = useState<Omit<FuelEntry, "id" | "totalCost">>({
    vehicleId: "",
    tripId: null,
    date: new Date().toISOString().split("T")[0],
    liters: 0,
    costPerLiter: 1.5,
    odometerReading: 0,
    station: "",
  });

  const [expenseForm, setExpenseForm] = useState<Omit<ExpenseEntry, "id">>({
    vehicleId: "",
    tripId: null,
    date: new Date().toISOString().split("T")[0],
    category: "toll",
    description: "",
    amount: 0,
    receiptUrl: null,
  });

  const getVehicle = (id: string) => vehicles.find((v) => v.id === id);

  const totalFuelCost = useMemo(
    () => fuelEntries.reduce((sum, e) => sum + e.totalCost, 0),
    [fuelEntries]
  );
  const totalExpenseCost = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const vehicleCosts = useMemo(() => {
    return vehicles
      .filter((v) => v.status !== "retired")
      .map((v) => ({
        vehicle: v,
        fuel: fuelEntries.filter((e) => e.vehicleId === v.id).reduce((s, e) => s + e.totalCost, 0),
        expenses: expenses.filter((e) => e.vehicleId === v.id).reduce((s, e) => s + e.amount, 0),
      }))
      .filter((vc) => vc.fuel > 0 || vc.expenses > 0)
      .sort((a, b) => (b.fuel + b.expenses) - (a.fuel + a.expenses));
  }, [vehicles, fuelEntries, expenses]);

  const handleFuelSave = () => {
    if (!fuelForm.vehicleId) return;
    addFuelEntry({
      ...fuelForm,
      id: `fuel-${Date.now()}`,
      totalCost: fuelForm.liters * fuelForm.costPerLiter,
    });
    setShowFuelModal(false);
  };

  const handleExpenseSave = () => {
    if (!expenseForm.vehicleId || !expenseForm.description) return;
    addExpense({ ...expenseForm, id: `exp-${Date.now()}` });
    setShowExpenseModal(false);
  };

  const tabs = [
    { key: "fuel" as const, label: "Fuel Entries", icon: Fuel },
    { key: "expenses" as const, label: "Expenses", icon: Receipt },
    { key: "summary" as const, label: "Cost Summary", icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Fuel & Expenses
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            TOTAL FUEL: ${totalFuelCost.toLocaleString()} • TOTAL EXPENSES: ${totalExpenseCost.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowFuelModal(true)} variant="secondary">
            <Fuel className="h-4 w-4" aria-hidden="true" />
            Add Fuel
          </Button>
          <Button onClick={() => setShowExpenseModal(true)}>
            <Receipt className="h-4 w-4" aria-hidden="true" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="hazard-divider" />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-display uppercase tracking-wider transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fuel Entries Tab */}
      {activeTab === "fuel" && (
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">DATE</th>
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">VEHICLE</th>
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden sm:table-cell">LITERS</th>
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden md:table-cell">$/LITER</th>
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">TOTAL</th>
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden lg:table-cell">STATION</th>
                </tr>
              </thead>
              <tbody>
                {fuelEntries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry, i) => {
                    const vehicle = getVehicle(entry.vehicleId);
                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-border/50 table-row-hover animate-manifest-print"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <td className="px-4 py-2.5">
                          <span className="mono-data text-xs text-foreground">{format(new Date(entry.date), "dd MMM")}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="mono-data font-semibold text-foreground">{vehicle?.regNumber || "—"}</span>
                        </td>
                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          <span className="mono-data text-xs text-muted-foreground">{entry.liters} L</span>
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <span className="mono-data text-xs text-muted-foreground">${entry.costPerLiter.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="mono-data font-semibold text-foreground">${entry.totalCost.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-2.5 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{entry.station}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === "expenses" && (
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">DATE</th>
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">VEHICLE</th>
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">CATEGORY</th>
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden sm:table-cell">DESCRIPTION</th>
                  <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {expenses
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry, i) => {
                    const vehicle = getVehicle(entry.vehicleId);
                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-border/50 table-row-hover animate-manifest-print"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <td className="px-4 py-2.5">
                          <span className="mono-data text-xs text-foreground">{format(new Date(entry.date), "dd MMM")}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="mono-data font-semibold text-foreground">{vehicle?.regNumber || "—"}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[0.65rem] font-display uppercase tracking-wider text-muted-foreground">{entry.category}</span>
                        </td>
                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{entry.description}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="mono-data font-semibold text-foreground">${entry.amount.toFixed(2)}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-sm p-3 sm:p-4 border-l-[3px] border-l-primary">
              <p className="text-[0.6rem] sm:text-[0.65rem] font-display uppercase tracking-wider text-muted-foreground">Total Fuel Cost</p>
              <p className="mono-data text-xl sm:text-2xl font-bold text-foreground mt-1">${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-card border border-border rounded-sm p-3 sm:p-4 border-l-[3px] border-l-status-on-trip">
              <p className="text-[0.6rem] sm:text-[0.65rem] font-display uppercase tracking-wider text-muted-foreground">Total Expenses</p>
              <p className="mono-data text-xl sm:text-2xl font-bold text-foreground mt-1">${totalExpenseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-card border border-border rounded-sm p-3 sm:p-4 border-l-[3px] border-l-status-available">
              <p className="text-[0.6rem] sm:text-[0.65rem] font-display uppercase tracking-wider text-muted-foreground">Total Operational Cost</p>
              <p className="mono-data text-xl sm:text-2xl font-bold text-foreground mt-1">${(totalFuelCost + totalExpenseCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Per-vehicle breakdown */}
          <div className="bg-card border border-border rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                Cost by Vehicle
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">VEHICLE</th>
                    <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden sm:table-cell">MAKE</th>
                    <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">FUEL</th>
                    <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">EXPENSES</th>
                    <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleCosts.map((vc, i) => (
                    <tr
                      key={vc.vehicle.id}
                      className="border-b border-border/50 table-row-hover animate-manifest-print"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="px-4 py-2.5">
                        <span className="mono-data font-semibold text-foreground">{vc.vehicle.regNumber}</span>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground">{vc.vehicle.make} {vc.vehicle.model}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="mono-data text-xs text-muted-foreground">${vc.fuel.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="mono-data text-xs text-muted-foreground">${vc.expenses.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="mono-data font-semibold text-foreground">${(vc.fuel + vc.expenses).toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fuel Entry Modal */}
      <Modal
        open={showFuelModal}
        onClose={() => setShowFuelModal(false)}
        title="Add Fuel Entry"
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Vehicle"
            value={fuelForm.vehicleId}
            onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
            options={[
              { value: "", label: "Select vehicle..." },
              ...vehicles.filter((v) => v.status !== "retired").map((v) => ({
                value: v.id,
                label: `${v.regNumber} — ${v.make}`,
              })),
            ]}
          />
          <Input
            label="Date"
            type="date"
            value={fuelForm.date}
            onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })}
          />
          <Input
            label="Liters"
            type="text"
            inputMode="decimal"
            value={fuelForm.liters}
            onChange={(e) => setFuelForm({ ...fuelForm, liters: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Cost per Liter ($)"
            type="text"
            inputMode="decimal"
            value={fuelForm.costPerLiter}
            onChange={(e) => setFuelForm({ ...fuelForm, costPerLiter: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Odometer Reading"
            type="text"
            inputMode="numeric"
            value={fuelForm.odometerReading}
            onChange={(e) => setFuelForm({ ...fuelForm, odometerReading: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Station"
            value={fuelForm.station}
            onChange={(e) => setFuelForm({ ...fuelForm, station: e.target.value })}
            placeholder="Pilot Travel Center"
          />
        </div>
        <div className="mt-4 p-3 bg-secondary/50 rounded-sm flex items-center justify-between">
          <span className="text-xs font-display uppercase tracking-wider text-muted-foreground">Total Cost</span>
          <span className="mono-data text-lg font-bold text-foreground">
            ${(fuelForm.liters * fuelForm.costPerLiter).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="secondary" onClick={() => setShowFuelModal(false)}>Cancel</Button>
          <Button onClick={handleFuelSave}>Save Entry</Button>
        </div>
      </Modal>

      {/* Expense Entry Modal */}
      <Modal
        open={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="Add Expense"
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Vehicle"
            value={expenseForm.vehicleId}
            onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}
            options={[
              { value: "", label: "Select vehicle..." },
              ...vehicles.filter((v) => v.status !== "retired").map((v) => ({
                value: v.id,
                label: `${v.regNumber} — ${v.make}`,
              })),
            ]}
          />
          <Select
            label="Category"
            value={expenseForm.category}
            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseEntry["category"] })}
            options={expenseCategories}
          />
          <Input
            label="Date"
            type="date"
            value={expenseForm.date}
            onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
          />
          <Input
            label="Amount ($)"
            type="text"
            inputMode="decimal"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
          />
          <div className="col-span-2">
            <Textarea
              label="Description"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              placeholder="Indiana Toll Road - Chicago to Michigan"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="secondary" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
          <Button onClick={handleExpenseSave}>Save Expense</Button>
        </div>
      </Modal>
    </div>
  );
}
