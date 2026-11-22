import React, { useState, useEffect } from 'react';
import {
  DollarSign, Edit2, CheckCircle2, XCircle, Plus, RefreshCw, X, Tag
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export const AdminPricing: React.FC = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<any | null>(null);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [unitDesc, setUnitDesc] = useState('');
  const [addons, setAddons] = useState<Record<string, number>>({});
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPricing = async () => {
    try {
      const res = await api.get('/admin/pricing');
      setConfigs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const openEditModal = (c: any) => {
    setEditingConfig(c);
    setBasePrice(c.base_price);
    setUnitDesc(c.unit_description || 'Per Project');
    setAddons(c.add_ons || {});
    setIsActive(c.is_active);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;
    setSaving(true);
    try {
      await api.put(`/admin/pricing/${editingConfig.id}`, {
        base_price: Number(basePrice),
        unit_description: unitDesc,
        add_ons_json: JSON.stringify(addons),
        is_active: isActive
      });
      alert('Price configuration saved successfully!');
      setEditingConfig(null);
      fetchPricing();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  const handleAddonChange = (key: string, val: number) => {
    setAddons(prev => ({ ...prev, [key]: val }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dynamic Pricing Engine</h1>
          <p className="text-xs text-slate-500">
            Control base rates, per-page rates, and add-on charges across College and School domains
          </p>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {configs.map(c => {
          const addonItems = Object.entries(c.add_ons || {});
          return (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border p-6 shadow-sm space-y-4 transition-all ${
                c.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {c.student_type}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1.5">{c.category_name}</h3>
                  <span className="font-mono text-[11px] text-slate-400">{c.category_key}</span>
                </div>

                <button
                  type="button"
                  onClick={() => openEditModal(c)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-600 border border-slate-200 transition-all text-slate-600"
                  title="Edit Rate"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Base Price Callout */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Base Price</span>
                  <span className="text-2xl font-black text-brand-600">₹{c.base_price}</span>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {c.unit_description}
                </span>
              </div>

              {/* Addons List */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                  Configured Add-ons
                </span>
                {addonItems.length === 0 ? (
                  <p className="text-slate-400 text-xs">No extra add-ons configured.</p>
                ) : (
                  addonItems.map(([k, amt]: any) => (
                    <div key={k} className="flex justify-between text-slate-600 py-0.5 border-b border-slate-50">
                      <span className="capitalize">{k.replace('_', ' ')}</span>
                      <span className="font-bold text-slate-800">+₹{amt}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Updated: {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : 'Active'}</span>
                <span className={`font-bold ${c.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {c.is_active ? '● Live on Store' : '○ Paused'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Pricing Modal */}
      {editingConfig && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSavePrice} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider">Edit Rate Card</span>
                <h3 className="font-bold text-slate-900 text-base">{editingConfig.category_name}</h3>
              </div>
              <button type="button" onClick={() => setEditingConfig(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Base Price (₹) *</label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={e => setBasePrice(Number(e.target.value))}
                  className="input-field text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit Description *</label>
                <input
                  type="text"
                  value={unitDesc}
                  onChange={e => setUnitDesc(e.target.value)}
                  placeholder="Per Project / Per Page"
                  className="input-field text-sm"
                  required
                />
              </div>
            </div>

            {/* Addon Rates */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Add-on Pricing (₹)
              </h4>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                {Object.entries(addons).map(([k, amt]) => (
                  <div key={k}>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 capitalize">
                      {k.replace('_', ' ')}
                    </label>
                    <input
                      type="number"
                      value={amt}
                      onChange={e => handleAddonChange(k, Number(e.target.value))}
                      className="input-field text-xs py-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 accent-brand-600"
              />
              <label htmlFor="is_active" className="text-xs font-semibold text-slate-700">
                Active & Available in Student Order Wizard
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingConfig(null)}
                className="btn-secondary text-xs px-4 py-2 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs px-5 py-2 font-bold flex items-center gap-1.5"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                Save Pricing
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default AdminPricing;
