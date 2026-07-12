"use client";

import { useState, useMemo, useEffect } from "react";
import { useMaintenanceStore, useVehicleStore } from "@/stores";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/form-elements";
import type { MaintenanceLog, MaintenanceType } from "@/types";
import { Plus, Wrench, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { format } from "date-fns";

const typeOptions: { value: MaintenanceType; label: string }[] = [
  { value: "preventive", label: "Preventive" },
  { value: "corrective", label: "Corrective" },
  { value: "emergency", label: "Emergency" },
  { value: "inspection", label: "Inspection" },
];

const emptyLog: Omit<MaintenanceLog, "id"> = {
  vehicleId: "",
  type: "preventive",
  description: "",
  cost: 0,
  date: new Date().toISOString().split("T")[0],
  completedDate: null,
  mechanic: "",
  partsReplaced: [],
  status: "scheduled",
};

export default function MaintenancePage() {
  const { logs, addLog, completeMaintenance, fetchAll } = useMaintenanceStore();
  const { vehicles, fetchAll: fetchVehicles } = useVehicleStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyLog);
  const [partsInput, setPartsInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { fetchAll(); fetchVehicles(); }, [fetchAll, fetchVehicles]);

  const getVehicle = (id: string) => vehicles.find((v) => v.id === id);

  const filtered = useMemo(() => {
    return logs
      .filter((l) => statusFilter === "all" || l.status === statusFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, statusFilter]);

  const activeCount = logs.filter((l) => l.status === "in_progress").length;
  const scheduledCount = logs.filter((l) => l.status === "scheduled").length;
  const completedCount = logs.filter((l) => l.status === "completed").length;

  const handleSave = () => {
    if (!form.vehicleId || !form.description) return;
    const log: MaintenanceLog = {
      ...form,
      id: `mnt-${Date.now()}`,
      partsReplaced: partsInput.split(",").map((p) => p.trim()).filter(Boolean),
    };
    addLog(log);
    setShowModal(false);
    setForm(emptyLog);
    setPartsInput("");
  };

  const typeIcons: Record<MaintenanceType, React.ElementType> = {
    preventive: Clock,
    corrective: Wrench,
    emergency: AlertTriangle,
    inspection: CheckCircle,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Maintenance Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {activeCount} IN PROGRESS • {scheduledCount} SCHEDULED • {completedCount} COMPLETED
          </p>
        </div>
        <Button onClick={() => { setForm(emptyLog); setShowModal(true); }}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Entry
        </Button>
      </div>

      <div className="hazard-divider" />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {["all", "in_progress", "scheduled", "completed"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              "px-3 py-1.5 rounded-sm text-xs font-display uppercase tracking-wider transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              statusFilter === status
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {status === "all" ? "All" : status.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Maintenance cards */}
      <div className="space-y-3">
        {filtered.map((log, i) => {
          const vehicle = getVehicle(log.vehicleId);
          const TypeIcon = typeIcons[log.type];

          return (
            <div
              key={log.id}
              className={cn(
                "bg-card border border-border rounded-sm p-4 animate-stagger-in",
                log.status === "in_progress" && "border-l-[3px] border-l-primary"
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-sm shrink-0",
                    log.status === "completed" ? "bg-status-available/10 text-status-available" :
                    log.status === "in_progress" ? "bg-primary/10 text-primary" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    <TypeIcon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono-data text-sm font-bold text-foreground">{vehicle?.regNumber || "—"}</span>
                      <StatusBadge status={log.status} />
                      <span className={cn(
                        "text-[0.6rem] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm",
                        log.type === "emergency" ? "bg-destructive/10 text-destructive" :
                        log.type === "corrective" ? "bg-primary/10 text-primary" :
                        "bg-secondary text-muted-foreground"
                      )}>
                        {log.type}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-1">{log.description}</p>
                  </div>
                </div>
                {log.status === "in_progress" && (
                  <Button size="sm" onClick={() => completeMaintenance(log.id)} className="shrink-0">
                    <CheckCircle className="h-3 w-3" aria-hidden="true" />
                    Mark Complete
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs ml-0 sm:ml-11">
                <div>
                  <p className="font-display uppercase tracking-wider text-muted-foreground text-[0.6rem]">Date</p>
                  <p className="mono-data text-foreground mt-0.5">{format(new Date(log.date), "dd MMM yyyy")}</p>
                </div>
                <div>
                  <p className="font-display uppercase tracking-wider text-muted-foreground text-[0.6rem]">Mechanic</p>
                  <p className="text-foreground mt-0.5">{log.mechanic}</p>
                </div>
                <div>
                  <p className="font-display uppercase tracking-wider text-muted-foreground text-[0.6rem]">Cost</p>
                  <p className="mono-data text-foreground mt-0.5">${log.cost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-display uppercase tracking-wider text-muted-foreground text-[0.6rem]">Parts</p>
                  <p className="text-foreground mt-0.5">{log.partsReplaced.length > 0 ? log.partsReplaced.join(", ") : "—"}</p>
                </div>
              </div>

              {log.completedDate && (
                <div className="sm:ml-11 mt-2 text-xs text-status-available font-mono">
                  Completed: {format(new Date(log.completedDate), "dd MMM yyyy")}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-card border border-border rounded-sm p-16 text-center">
            <Wrench className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No maintenance records match the filter.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="New Maintenance Entry"
        description="Log a new maintenance event. Vehicle status will update to IN SHOP."
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Vehicle"
            value={form.vehicleId}
            onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            options={[
              { value: "", label: "Select vehicle..." },
              ...vehicles.map((v) => ({
                value: v.id,
                label: `${v.regNumber} — ${v.make} ${v.model}`,
              })),
            ]}
          />
          <Select
            label="Maintenance Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as MaintenanceType })}
            options={typeOptions}
          />
          <div className="col-span-2">
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the maintenance work..."
            />
          </div>
          <Input
            label="Cost ($)"
            type="text"
            inputMode="decimal"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Input
            label="Mechanic / Shop"
            value={form.mechanic}
            onChange={(e) => setForm({ ...form, mechanic: e.target.value })}
            placeholder="Jake's Heavy Duty Repair"
          />
          <Input
            label="Parts Replaced (comma-separated)"
            value={partsInput}
            onChange={(e) => setPartsInput(e.target.value)}
            placeholder="Oil Filter, Brake Pads"
          />
        </div>

        {form.vehicleId && (
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-sm text-xs text-primary flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Vehicle status will be changed to <strong>IN SHOP</strong> upon saving.
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Entry</Button>
        </div>
      </Modal>
    </div>
  );
}
