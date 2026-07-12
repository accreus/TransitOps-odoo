"use client";

import { useState, useMemo } from "react";
import { useVehicleStore } from "@/stores";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/form-elements";
import type { Vehicle, VehicleStatus, VehicleType } from "@/types";
import { Plus, Pencil, Trash2, Filter } from "lucide-react";

const statusOptions = ["All Status", "available", "on_trip", "in_shop", "retired"];
const typeOptions = ["All Types", "truck", "van", "trailer", " tanker"];
const regionOptions = ["All Regions", "Northeast", "Southeast", "Midwest", "West", "Southwest"];

const emptyVehicle: Omit<Vehicle, "id"> = {
  regNumber: "",
  type: "truck",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  status: "available",
  region: "Northeast",
  maxLoadKg: 0,
  currentOdometer: 0,
  lastServiceDate: new Date().toISOString().split("T")[0],
  fuelType: "diesel",
};

export default function VehiclesPage() {
  const { vehicles, addVehicle, updateVehicle, removeVehicle } = useVehicleStore();
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(emptyVehicle);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [regionFilter, setRegionFilter] = useState("All Regions");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (statusFilter !== "All Status" && v.status !== statusFilter) return false;
      if (typeFilter !== "All Types" && v.type !== typeFilter) return false;
      if (regionFilter !== "All Regions" && v.region !== regionFilter) return false;
      return true;
    });
  }, [vehicles, statusFilter, typeFilter, regionFilter]);

  const openAdd = () => {
    setEditingVehicle(null);
    setForm(emptyVehicle);
    setShowModal(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm({ ...v });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.regNumber || !form.make || !form.model) return;
    if (editingVehicle) {
      updateVehicle(editingVehicle.id, form);
    } else {
      addVehicle({ ...form, id: `veh-${Date.now()}` });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Vehicle Registry
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {filtered.length} OF {vehicles.length} VEHICLES
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Vehicle
        </Button>
      </div>

      <div className="hazard-divider" />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions.map((s) => ({ value: s, label: s === "All Status" ? s : s.replace("_", " ").toUpperCase() }))}
          />
        </div>
        <div className="w-40">
          <Select
            label="Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={typeOptions.map((t) => ({ value: t, label: t === "All Types" ? t : t.charAt(0).toUpperCase() + t.slice(1) }))}
          />
        </div>
        <div className="w-40">
          <Select
            label="Region"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            options={regionOptions.map((r) => ({ value: r, label: r }))}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">REG #</th>
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">TYPE</th>
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden sm:table-cell">MAKE / MODEL</th>
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden md:table-cell">YEAR</th>
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden lg:table-cell">REGION</th>
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden xl:table-cell">MAX LOAD</th>
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden xl:table-cell">ODOMETER</th>
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">STATUS</th>
                <th className="text-right px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((vehicle, i) => (
                <tr
                  key={vehicle.id}
                  className="border-b border-border/50 table-row-hover animate-manifest-print"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="px-4 py-2.5">
                    <span className="mono-data font-semibold text-foreground">{vehicle.regNumber}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs uppercase text-muted-foreground">{vehicle.type}</span>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <div>
                      <p className="text-foreground">{vehicle.make}</p>
                      <p className="text-xs text-muted-foreground">{vehicle.model}</p>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <span className="mono-data text-xs text-muted-foreground">{vehicle.year}</span>
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">{vehicle.region}</span>
                  </td>
                  <td className="px-4 py-2.5 hidden xl:table-cell">
                    <span className="mono-data text-xs text-muted-foreground">{vehicle.maxLoadKg.toLocaleString()} kg</span>
                  </td>
                  <td className="px-4 py-2.5 hidden xl:table-cell">
                    <span className="mono-data text-xs text-muted-foreground">{vehicle.currentOdometer.toLocaleString()} mi</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={vehicle.status} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(vehicle)}
                        className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-label={`Edit ${vehicle.regNumber}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(vehicle.id)}
                        className="p-1.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-label={`Delete ${vehicle.regNumber}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Filter className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">No vehicles match the current filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
        description={editingVehicle ? `Update details for ${editingVehicle.regNumber}` : "Register a new vehicle in the fleet"}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Registration Number"
            value={form.regNumber}
            onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
            placeholder="TRK-1234"
            required
          />
          <Select
            label="Vehicle Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as VehicleType })}
            options={[
              { value: "truck", label: "Truck" },
              { value: "van", label: "Van" },
              { value: "trailer", label: "Trailer" },
              { value: " tanker", label: "Tanker" },
            ]}
          />
          <Input
            label="Make"
            value={form.make}
            onChange={(e) => setForm({ ...form, make: e.target.value })}
            placeholder="Freightliner"
            required
          />
          <Input
            label="Model"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="Cascadia"
            required
          />
          <Input
            label="Year"
            type="text"
            inputMode="numeric"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 0 })}
          />
          <Select
            label="Region"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            options={[
              { value: "Northeast", label: "Northeast" },
              { value: "Southeast", label: "Southeast" },
              { value: "Midwest", label: "Midwest" },
              { value: "West", label: "West" },
              { value: "Southwest", label: "Southwest" },
            ]}
          />
          <Input
            label="Max Load (kg)"
            type="text"
            inputMode="numeric"
            value={form.maxLoadKg}
            onChange={(e) => setForm({ ...form, maxLoadKg: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Current Odometer"
            type="text"
            inputMode="numeric"
            value={form.currentOdometer}
            onChange={(e) => setForm({ ...form, currentOdometer: parseInt(e.target.value) || 0 })}
          />
          <Select
            label="Fuel Type"
            value={form.fuelType}
            onChange={(e) => setForm({ ...form, fuelType: e.target.value as Vehicle["fuelType"] })}
            options={[
              { value: "diesel", label: "Diesel" },
              { value: "petrol", label: "Petrol" },
              { value: "electric", label: "Electric" },
              { value: "cng", label: "CNG" },
            ]}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
            options={[
              { value: "available", label: "Available" },
              { value: "on_trip", label: "On Trip" },
              { value: "in_shop", label: "In Shop" },
              { value: "retired", label: "Retired" },
            ]}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Confirm Deletion"
        description="This action cannot be undone."
      >
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to remove this vehicle from the registry?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirmDelete) removeVehicle(confirmDelete);
              setConfirmDelete(null);
            }}
          >
            Delete Vehicle
          </Button>
        </div>
      </Modal>
    </div>
  );
}
