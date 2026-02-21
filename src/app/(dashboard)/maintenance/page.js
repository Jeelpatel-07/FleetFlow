'use client';
import { useState } from 'react';
import { useMaintenance } from '@/lib/hooks/useMaintenance';
import { useVehicles } from '@/lib/hooks/useVehicles';
import { useToast } from '@/lib/toast-context';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import ConfirmModal from '@/components/ConfirmModal';
import EmptyState from '@/components/EmptyState';
import { Plus, Trash2, Wrench, DollarSign } from 'lucide-react';

const EMPTY = { vehicle_id: '', description: '', cost: '', date: '' };

export default function MaintenancePage() {
  const { logs, loading, error, refetch, addLog, deleteLog } = useMaintenance();
  const { vehicles } = useVehicles();
  const toast = useToast();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () => { setForm({ ...EMPTY, date: new Date().toISOString().split('T')[0] }); setFormError(''); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setFormError(''); };

  const handleSave = async () => {
    if (!form.vehicle_id) { setFormError('Select a vehicle.'); return; }
    if (!form.description.trim()) { setFormError('Description is required.'); return; }
    setSaving(true); setFormError('');
    try {
      await addLog({
        vehicle_id: form.vehicle_id,
        description: form.description.trim(),
        cost: form.cost ? parseFloat(form.cost) : null,
        date: form.date || new Date().toISOString().split('T')[0],
      });
      toast.success('Maintenance log added. Vehicle set to In Shop.');
      closeModal();
    } catch (e) {
      setFormError(e.message);
      toast.error(`Failed: ${e.message}`);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteLog(confirmDelete.id);
      toast.success('Log deleted.');
      setConfirmDelete(null);
    } catch (e) {
      toast.error(`Delete failed: ${e.message}`);
      setConfirmDelete(null);
    }
  };

  const totalCost = logs.reduce((s, l) => s + (parseFloat(l.cost) || 0), 0);
  const inShopCount = vehicles.filter(v => v.status === 'In Shop').length;

  const columns = [
    { key: 'vehicle', label: 'Vehicle', sortable: false,
      render: r => r.vehicles ? (
        <div>
          <div style={{ fontWeight: '600', fontSize: '14px' }}>{r.vehicles.model}</div>
          <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.vehicles.license_plate}</code>
        </div>
      ) : <span className="text-muted">—</span>
    },
    { key: 'description', label: 'Description', accessor: 'description',
      render: r => <span style={{ fontSize: '13px' }}>{r.description || '—'}</span>
    },
    { key: 'cost', label: 'Cost', accessor: 'cost',
      render: r => r.cost ? <span style={{ color: '#f97316', fontWeight: '600' }}>${Number(r.cost).toLocaleString()}</span> : <span className="text-muted">—</span>
    },
    { key: 'date', label: 'Date', accessor: 'date',
      render: r => r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
    },
    { key: 'actions', label: 'Actions', sortable: false,
      render: r => (
        <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(r)} style={{ fontSize: '11px', padding: '4px 8px' }}>
          <Trash2 size={10} />
        </button>
      )
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Maintenance Logs</h2>
        <p className="page-subtitle">{logs.length} maintenance record{logs.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Vehicles In Shop', value: inShopCount, icon: Wrench, color: '#f97316' },
          { label: 'Total Repair Cost', value: `$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign, color: '#ef4444' },
          { label: 'Total Records', value: logs.length, icon: Wrench, color: '#3b82f6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: '16px', borderLeft: `3px solid ${color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Icon size={16} color={color} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color }}>{value}</div>
          </div>
        ))}
      </div>

      {error ? (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '16px', color: '#ef4444', fontSize: '14px' }}>
          {error} <button className="btn btn-sm btn-secondary" style={{ marginLeft: '12px' }} onClick={refetch}>Retry</button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyComponent={<EmptyState type="maintenance" title="No maintenance logs" description="Log a maintenance event to track repairs and costs." action={{ label: '+ Log Maintenance', onClick: openAdd }} />}
          actions={<button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> Log Maintenance</button>}
        />
      )}

      {showModal && (
        <FormModal title="Log Maintenance" onClose={closeModal}
          footer={<>
            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Log'}</button>
          </>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {formError && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 12px', color: '#ef4444', fontSize: '13px' }}>{formError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Vehicle *</label>
                <select className="form-select" value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
                  <option value="">Select vehicle...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.model} — {v.license_plate} ({v.status})</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description *</label>
                <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Oil change, brake pad replacement..." />
              </div>
              <div className="form-group">
                <label className="form-label">Cost ($)</label>
                <input className="form-input" type="number" step="0.01" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="e.g. 250.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
          </div>
        </FormModal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Log"
          message={`Delete this maintenance record for "${confirmDelete.vehicles?.model || 'vehicle'}"?`}
          confirmLabel="Delete"
          confirmStyle="danger"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
