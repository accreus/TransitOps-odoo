"use client";

import { useState, useMemo } from "react";
import { useTripStore, useVehicleStore, useDriverStore } from "@/stores";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/form-elements";
import type { Trip, TripStatus } from "@/types";
import { Plus, Pencil, Send, CheckCircle, XCircle, ArrowRight, Filter } from "lucide-react";
import { cn } from "@/lib/cn";

const statusOptions = ["All Status", "draft", "dispatched", "in_transit", "completed", "cancelled"];

const tripSteps: { key: TripStatus; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "dispatched", label: "Dispatched" },
  { key: "in_transit", label: "In Transit" },
  { key: "completed", label: "Completed" },
];

const emptyTrip: Omit<Trip, "id" | "tripNumber" | "createdAt"> = {
  vehicleId: "",
  driverId: "",
  source: "",
  destination: "",
  status: "draft",
  cargoDescription: "",
  cargoWeightKg: 0,
  scheduledDeparture: "",
  actualDeparture: null,
  scheduledArrival: "",
  actualArrival: null,
  distanceKm: 0,
  fuelUsedLiters: 0,
  revenue: 0,
};

export default function TripsPage() {
  const { trips, addTrip, updateTrip, removeTrip, dispatchTrip, completeTrip, cancelTrip } = useTripStore();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const drivers = useDriverStore((s) => s.drivers);

  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [form, setForm] = useState(emptyTrip);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showDispatch, setShowDispatch] = useState<Trip | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const availableVehicles = useMemo(
    () => vehicles.filter((v) => v.status !== "in_shop" && v.status !== "retired"),
    [vehicles]
  );

  const availableDrivers = useMemo(
    () => drivers.filter((d) => d.status === "available"),
    [drivers]
  );

  const filtered = useMemo(() => {
    return trips
      .filter((t) => statusFilter === "All Status" || t.status === statusFilter)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [trips, statusFilter]);

  const getVehicle = (id: string) => vehicles.find((v) => v.id === id);
  const getDriver = (id: string) => drivers.find((d) => d.id === id);

  const openAdd = () => {
    setEditingTrip(null);
    setForm(emptyTrip);
    setShowModal(true);
  };

  const openEdit = (t: Trip) => {
    setEditingTrip(t);
    setForm({ ...t });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.source || !form.destination) return;
    const tripNumber = `TMP-2026-${String(trips.length + 143).padStart(4, "0")}`;
    if (editingTrip) {
      updateTrip(editingTrip.id, form);
    } else {
      addTrip({
        ...form,
        id: `trp-${Date.now()}`,
        tripNumber,
        createdAt: new Date().toISOString(),
      });
    }
    setShowModal(false);
  };

  const getStepIndex = (status: TripStatus) => {
    return tripSteps.findIndex((s) => s.key === status);
  };

  const selectedVehicle = form.vehicleId ? vehicles.find((v) => v.id === form.vehicleId) : null;
  const weightExceedsMax = selectedVehicle && form.cargoWeightKg > selectedVehicle.maxLoadKg;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Trip Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {filtered.length} TRIPS
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Trip
        </Button>
      </div>

      <div className="hazard-divider" />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-44">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions.map((s) => ({ value: s, label: s === "All Status" ? s : s.replace("_", " ").toUpperCase() }))}
          />
        </div>
      </div>

      {/* Trip Cards */}
      <div className="space-y-3">
        {filtered.map((trip, i) => {
          const vehicle = getVehicle(trip.vehicleId);
          const driver = getDriver(trip.driverId);
          const currentStep = getStepIndex(trip.status);

          return (
            <div
              key={trip.id}
              className="bg-card border border-border rounded-sm p-3 sm:p-4 animate-stagger-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mono-data font-bold text-foreground text-sm sm:text-base">{trip.tripNumber}</span>
                    <StatusBadge status={trip.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs sm:text-sm text-muted-foreground">
                    <span className="truncate max-w-[120px] sm:max-w-none">{trip.source}</span>
                    <ArrowRight className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
                    <span className="truncate max-w-[120px] sm:max-w-none">{trip.destination}</span>
                    <span className="text-muted-foreground/60 hidden sm:inline">•</span>
                    <span className="mono-data text-xs hidden sm:inline">{trip.distanceKm} km</span>
                  </div>
                  <span className="mono-data text-xs text-muted-foreground sm:hidden mt-0.5 block">{trip.distanceKm} km</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap shrink-0">
                  {trip.status === "draft" && (
                    <Button size="sm" onClick={() => setShowDispatch(trip)}>
                      <Send className="h-3 w-3" aria-hidden="true" />
                      <span className="hidden sm:inline">Dispatch</span>
                      <span className="sm:hidden">Send</span>
                    </Button>
                  )}
                  {trip.status === "in_transit" && (
                    <Button size="sm" onClick={() => completeTrip(trip.id, trip.fuelUsedLiters, trip.revenue)}>
                      <CheckCircle className="h-3 w-3" aria-hidden="true" />
                      Done
                    </Button>
                  )}
                  {(trip.status === "draft" || trip.status === "dispatched") && (
                    <Button size="sm" variant="destructive" onClick={() => cancelTrip(trip.id)}>
                      <XCircle className="h-3 w-3" aria-hidden="true" />
                      Cancel
                    </Button>
                  )}
                  <button
                    onClick={() => openEdit(trip)}
                    className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={`Edit trip ${trip.tripNumber}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Lifecycle stepper */}
              {trip.status !== "cancelled" && (
                <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                  {tripSteps.map((step, si) => (
                    <div key={step.key} className="flex items-center gap-1 shrink-0">
                      <div
                        className={cn(
                          "flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-sm text-[0.55rem] sm:text-[0.65rem] font-display font-bold uppercase tracking-wider whitespace-nowrap",
                          si <= currentStep
                            ? "bg-primary/10 text-primary border border-primary/30"
                            : "bg-secondary text-muted-foreground border border-border"
                        )}
                      >
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          si < currentStep ? "bg-primary" : si === currentStep ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                        )} aria-hidden="true" />
                        {step.label}
                      </div>
                      {si < tripSteps.length - 1 && (
                        <div className={cn(
                          "w-3 sm:w-4 h-px shrink-0",
                          si < currentStep ? "bg-primary" : "bg-border"
                        )} aria-hidden="true" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Details row */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                <div>
                  <p className="font-display uppercase tracking-wider text-muted-foreground text-[0.6rem]">Vehicle</p>
                  <p className="mono-data text-foreground mt-0.5 truncate">{vehicle?.regNumber || "—"}</p>
                </div>
                <div>
                  <p className="font-display uppercase tracking-wider text-muted-foreground text-[0.6rem]">Driver</p>
                  <p className="text-foreground mt-0.5 truncate">{driver?.name || "—"}</p>
                </div>
                <div>
                  <p className="font-display uppercase tracking-wider text-muted-foreground text-[0.6rem]">Cargo</p>
                  <p className="text-foreground mt-0.5 truncate">{trip.cargoDescription || "—"}</p>
                </div>
                <div>
                  <p className="font-display uppercase tracking-wider text-muted-foreground text-[0.6rem]">Weight</p>
                  <p className={cn("mono-data mt-0.5 truncate", trip.cargoWeightKg > (vehicle?.maxLoadKg || Infinity) ? "text-destructive" : "text-foreground")}>
                    {trip.cargoWeightKg.toLocaleString()} / {vehicle?.maxLoadKg.toLocaleString() || "—"} kg
                  </p>
                </div>
              </div>

              {trip.status === "completed" && trip.revenue > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 sm:flex sm:items-center gap-1 sm:gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display uppercase tracking-wider text-muted-foreground text-[0.6rem]">Fuel:</span>
                    <span className="mono-data text-foreground">{trip.fuelUsedLiters} L</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display uppercase tracking-wider text-muted-foreground text-[0.6rem]">Cost:</span>
                    <span className="mono-data text-foreground font-semibold">${trip.revenue.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-card border border-border rounded-sm p-16 text-center">
            <Filter className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No trips match the current filters.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingTrip ? "Edit Trip" : "Create New Trip"}
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Vehicle"
            value={form.vehicleId}
            onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            options={[
              { value: "", label: "Select vehicle..." },
              ...availableVehicles.map((v) => ({
                value: v.id,
                label: `${v.regNumber} — ${v.make} ${v.model} (max: ${v.maxLoadKg.toLocaleString()} kg)`,
              })),
            ]}
          />
          <Select
            label="Driver"
            value={form.driverId}
            onChange={(e) => setForm({ ...form, driverId: e.target.value })}
            options={[
              { value: "", label: "Select driver..." },
              ...availableDrivers.map((d) => ({
                value: d.id,
                label: d.name,
              })),
            ]}
          />
          <Input
            label="Source"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            placeholder="Newark, NJ"
            required
          />
          <Input
            label="Destination"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            placeholder="Charlotte, NC"
            required
          />
          <div className="col-span-2">
            <Textarea
              label="Cargo Description"
              value={form.cargoDescription}
              onChange={(e) => setForm({ ...form, cargoDescription: e.target.value })}
              placeholder="Describe the cargo..."
            />
          </div>
          <Input
            label="Cargo Weight (kg)"
            type="text"
            inputMode="numeric"
            value={form.cargoWeightKg}
            onChange={(e) => setForm({ ...form, cargoWeightKg: parseInt(e.target.value) || 0 })}
          />
          {selectedVehicle && (
            <div className="flex items-end">
              <p className={cn(
                "text-xs font-mono",
                weightExceedsMax ? "text-destructive font-bold" : "text-muted-foreground"
              )}>
                Max capacity: {selectedVehicle.maxLoadKg.toLocaleString()} kg
                {weightExceedsMax && " — EXCEEDS LIMIT"}
              </p>
            </div>
          )}
          <Input
            label="Scheduled Departure"
            type="datetime-local"
            value={form.scheduledDeparture.replace("Z", "").slice(0, 16)}
            onChange={(e) => setForm({ ...form, scheduledDeparture: new Date(e.target.value).toISOString() })}
          />
          <Input
            label="Scheduled Arrival"
            type="datetime-local"
            value={form.scheduledArrival.replace("Z", "").slice(0, 16)}
            onChange={(e) => setForm({ ...form, scheduledArrival: new Date(e.target.value).toISOString() })}
          />
          <Input
            label="Distance (km)"
            type="text"
            inputMode="numeric"
            value={form.distanceKm}
            onChange={(e) => setForm({ ...form, distanceKm: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            {editingTrip ? "Update Trip" : "Create Trip"}
          </Button>
        </div>
      </Modal>

      {/* Dispatch Confirmation */}
      <Modal
        open={!!showDispatch}
        onClose={() => setShowDispatch(null)}
        title="Dispatch Trip"
        description="Confirm dispatch for this trip"
      >
        {showDispatch && (
          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-sm p-4">
              <p className="mono-data font-bold text-foreground">{showDispatch.tripNumber}</p>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{showDispatch.source}</span>
                <ArrowRight className="h-3 w-3 text-primary" aria-hidden="true" />
                <span>{showDispatch.destination}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This will mark the trip as dispatched and record the departure time.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDispatch(null)}>Cancel</Button>
              <Button onClick={() => { dispatchTrip(showDispatch.id); setShowDispatch(null); }}>
                <Send className="h-4 w-4" aria-hidden="true" />
                Confirm Dispatch
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Confirm Deletion"
        description="This action cannot be undone."
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { if (confirmDelete) removeTrip(confirmDelete); setConfirmDelete(null); }}>
            Delete Trip
          </Button>
        </div>
      </Modal>
    </div>
  );
}
