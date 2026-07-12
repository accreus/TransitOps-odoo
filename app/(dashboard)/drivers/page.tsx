"use client";

import { useState, useMemo } from "react";
import { useDriverStore } from "@/stores";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/form-elements";
import { EmptyState } from "@/components/ui/empty-state";
import type { Driver, DriverStatus } from "@/types";
import { Plus, Pencil, Trash2, ShieldAlert, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { differenceInDays } from "date-fns";

const statusOptions = ["All Status", "available", "on_trip", "off_duty", "suspended"];
const regionOptions = ["All Regions", "Northeast", "Southeast", "Midwest", "West", "Southwest"];

const emptyDriver: Omit<Driver, "id"> = {
  name: "",
  licenseNumber: "",
  licenseExpiry: "",
  phone: "",
  email: "",
  status: "available",
  region: "Northeast",
  assignedVehicleId: null,
  joinDate: new Date().toISOString().split("T")[0],
  totalTrips: 0,
};

export default function DriversPage() {
  const { drivers, addDriver, updateDriver, removeDriver } = useDriverStore();
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState(emptyDriver);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [regionFilter, setRegionFilter] = useState("All Regions");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return drivers.filter((d) => {
      if (statusFilter !== "All Status" && d.status !== statusFilter) return false;
      if (regionFilter !== "All Regions" && d.region !== regionFilter) return false;
      return true;
    });
  }, [drivers, statusFilter, regionFilter]);

  const openAdd = () => {
    setEditingDriver(null);
    setForm(emptyDriver);
    setShowModal(true);
  };

  const openEdit = (d: Driver) => {
    setEditingDriver(d);
    setForm({ ...d });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.licenseNumber) return;
    if (editingDriver) {
      updateDriver(editingDriver.id, form);
    } else {
      addDriver({ ...form, id: `drv-${Date.now()}` });
    }
    setShowModal(false);
  };

  const getLicenseStatus = (expiry: string) => {
    const days = differenceInDays(new Date(expiry), new Date());
    if (days < 0) return { label: "EXPIRED", color: "text-destructive", bg: "bg-destructive/10" };
    if (days < 30) return { label: `${days}d LEFT`, color: "text-destructive", bg: "bg-destructive/10" };
    if (days < 90) return { label: `${days}d LEFT`, color: "text-primary", bg: "bg-primary/10" };
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Driver Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {filtered.length} OF {drivers.length} DRIVERS
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Driver
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
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">NAME</th>
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden sm:table-cell">LICENSE</th>
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden md:table-cell">PHONE</th>
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden lg:table-cell">REGION</th>
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold hidden xl:table-cell">TRIPS</th>
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">LICENSE STATUS</th>
                <th className="text-left px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">STATUS</th>
                <th className="text-right px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((driver, i) => {
                const licStatus = getLicenseStatus(driver.licenseExpiry);
                return (
                  <tr
                    key={driver.id}
                    className={cn(
                      "border-b border-border/50 table-row-hover animate-manifest-print",
                      licStatus && "bg-destructive/5"
                    )}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-4 py-2.5">
                      <div>
                        <p className="text-foreground font-semibold">{driver.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{driver.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className="mono-data text-xs text-muted-foreground">{driver.licenseNumber}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{driver.phone}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{driver.region}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden xl:table-cell">
                      <span className="mono-data text-xs text-muted-foreground">{driver.totalTrips}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {licStatus ? (
                        <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[0.65rem] font-display font-bold uppercase tracking-wider", licStatus.color, licStatus.bg)}>
                          <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                          {licStatus.label}
                        </div>
                      ) : (
                        <span className="text-[0.65rem] text-status-available font-display uppercase tracking-wider font-bold">VALID</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={driver.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(driver)}
                          className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          aria-label={`Edit ${driver.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(driver.id)}
                          className="p-1.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          aria-label={`Delete ${driver.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-4">
                    <EmptyState
                      icon={Users}
                      title="No drivers found"
                      description="No drivers match the current filters. Try adjusting your filters or add a new driver."
                      action={{ label: "Add Driver", onClick: openAdd }}
                    />
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
        title={editingDriver ? "Edit Driver" : "Add Driver"}
        description={editingDriver ? `Update details for ${editingDriver.name}` : "Register a new driver"}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="John Smith"
            required
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="john@transitops.com"
          />
          <Input
            label="License Number"
            value={form.licenseNumber}
            onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
            placeholder="CDL-CA-123456"
            required
          />
          <Input
            label="License Expiry"
            type="date"
            value={form.licenseExpiry}
            onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })}
          />
          <Input
            label="Phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+1-555-0100"
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
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as DriverStatus })}
            options={[
              { value: "available", label: "Available" },
              { value: "on_trip", label: "On Trip" },
              { value: "off_duty", label: "Off Duty" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            {editingDriver ? "Update Driver" : "Add Driver"}
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
          Are you sure you want to remove this driver from the system?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirmDelete) removeDriver(confirmDelete);
              setConfirmDelete(null);
            }}
          >
            Delete Driver
          </Button>
        </div>
      </Modal>
    </div>
  );
}
