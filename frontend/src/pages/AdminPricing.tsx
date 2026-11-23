import React, { useState, useEffect } from 'react';
import {
  DollarSign, Edit2, CheckCircle2, XCircle, Plus, RefreshCw, X, Tag, Trash2, Percent, Users, Sparkles
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface CouponItem {
  id: number;
  code: string;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const AdminPricing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'coupons' | 'pricing'>('coupons');

  // Base Pricing State
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<any | null>(null);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [unitDesc, setUnitDesc] = useState('');
  const [addons, setAddons] = useState<Record<string, number>>({});
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Coupon Engine State
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponPercent, setCouponPercent] = useState<number>(10);
  const [couponMaxUses, setCouponMaxUses] = useState<number>(100);
  const [couponIsActive, setCouponIsActive] = useState<boolean>(true);
  const [couponDesc, setCouponDesc] = useState('');
  const [savingCoupon, setSavingCoupon] = useState(false);

  const fetchPricing = async () => {
    try {
      const res = await api.get('/admin/pricing');
      setConfigs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data || []);
    } catch (e) {
      console.error('Failed to load coupons:', e);
    }
  };

  useEffect(() => {
    Promise.all([fetchPricing(), fetchCoupons()]).finally(() => setLoading(false));
  }, []);

  // Pricing Handlers
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

  // Coupon Handlers
  const openNewCouponModal = () => {
    setEditingCoupon(null);
    setCouponCode('');
    setCouponPercent(10);
    setCouponMaxUses(100);
    setCouponIsActive(true);
    setCouponDesc('');
    setCouponModalOpen(true);
  };

  const openEditCouponModal = (cpn: CouponItem) => {
    setEditingCoupon(cpn);
    setCouponCode(cpn.code);
    setCouponPercent(cpn.discount_percent);
    setCouponMaxUses(cpn.max_uses);
    setCouponIsActive(cpn.is_active);
    setCouponDesc(cpn.description || '');
    setCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) {
      alert('Please enter a coupon code');
      return;
    }
    if (couponPercent <= 0 || couponPercent > 100) {
      alert('Discount % must be between 1 and 100');
      return;
    }

    setSavingCoupon(true);
    try {
      if (editingCoupon) {
        // Update existing coupon
        await api.put(`/admin/coupons/${editingCoupon.id}`, {
          discount_percent: Number(couponPercent),
          max_uses: Number(couponMaxUses),
          is_active: couponIsActive,
          description: couponDesc.trim() || null,
        });
        alert(`Coupon ${cleanCode} updated successfully!`);
      } else {
        // Create new coupon
        await api.post('/admin/coupons', {
          code: cleanCode,
          discount_percent: Number(couponPercent),
          max_uses: Number(couponMaxUses),
          is_active: couponIsActive,
          description: couponDesc.trim() || null,
        });
        alert(`Coupon ${cleanCode} created successfully!`);
      }
      setCouponModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save coupon');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCouponActive = async (cpn: CouponItem) => {
    try {
      await api.put(`/admin/coupons/${cpn.id}`, {
        is_active: !cpn.is_active
      });
      fetchCoupons();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to toggle coupon status');
    }
  };

  const handleDeleteCoupon = async (cpn: CouponItem) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${cpn.code}"?`)) {
      return;
    }
    try {
      await api.delete(`/admin/coupons/${cpn.id}`);
      fetchCoupons();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete coupon');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Summary Metrics for Coupons
  const totalActiveCoupons = coupons.filter(c => c.is_active).length;
  const totalCouponsReleased = coupons.reduce((acc, c) => acc + (c.max_uses || 0), 0);
  const totalRedeemed = coupons.reduce((acc, c) => acc + (c.used_count || 0), 0);

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-blue-600" /> Pricing & Coupon Engine
          </h1>
          <p className="text-xs text-slate-500">
            Manage promo discount percentages, release limits, and domain rate cards
          </p>
        </div>

        {activeTab === 'coupons' && (
          <button
            type="button"
            onClick={openNewCouponModal}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" /> Release New Coupon
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'coupons'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          Promo Coupons Manager
          <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full">
            {coupons.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'pricing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Base Category Rates
          <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold px-2 py-0.5 rounded-full">
            {configs.length}
          </span>
        </button>
      </div>

      {/* ================= TAB 1: PROMO COUPONS MANAGER ================= */}
      {activeTab === 'coupons' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Active Promo Codes</span>
                <h3 className="text-2xl font-black text-slate-900">{totalActiveCoupons}</h3>
                <span className="text-[11px] text-slate-400">{coupons.length} total created</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Coupons Released</span>
                <h3 className="text-2xl font-black text-slate-900">{totalCouponsReleased}</h3>
                <span className="text-[11px] text-purple-600 font-semibold">Total usage capacity</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Redeemed by Students</span>
                <h3 className="text-2xl font-black text-slate-900">{totalRedeemed}</h3>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  {Math.max(0, totalCouponsReleased - totalRedeemed)} remaining
                </span>
              </div>
            </div>
          </div>

          {/* Coupons List */}
          {coupons.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 space-y-3">
              <Tag className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No promo coupons released yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "Release New Coupon" above to set a discount percentage and quantity limit for students.
              </p>
              <button
                type="button"
                onClick={openNewCouponModal}
                className="btn-primary text-xs px-4 py-2 font-bold"
              >
                Release First Coupon
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {coupons.map(cpn => {
                const percentUsed = cpn.max_uses > 0 ? Math.min(100, Math.round((cpn.used_count / cpn.max_uses) * 100)) : 0;
                const isExhausted = cpn.max_uses > 0 && cpn.used_count >= cpn.max_uses;

                return (
                  <div
                    key={cpn.id}
                    className={`bg-white rounded-2xl border p-6 shadow-sm space-y-4 transition-all relative ${
                      cpn.is_active && !isExhausted
                        ? 'border-slate-200 hover:border-blue-300'
                        : 'border-slate-200 opacity-60 bg-slate-50/50'
                    }`}
                  >
                    {/* Top Row: Code & Discount % Badge */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-black tracking-wider text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                            {cpn.code}
                          </span>
                          <span className="text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                            <Percent className="w-3 h-3" /> {cpn.discount_percent}% OFF
                          </span>
                        </div>
                        {cpn.description && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-1">{cpn.description}</p>
                        )}
                      </div>

                      {/* Edit / Delete Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditCouponModal(cpn)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit % & Limits"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(cpn)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress / Capacity Bar */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">Usage & Release</span>
                        <span className="font-mono font-bold text-slate-800">
                          {cpn.used_count} / {cpn.max_uses > 0 ? cpn.max_uses : '∞'} used
                        </span>
                      </div>
                      
                      {cpn.max_uses > 0 && (
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all rounded-full ${
                              percentUsed >= 100
                                ? 'bg-rose-500'
                                : percentUsed >= 75
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                        <span>
                          {cpn.max_uses > 0
                            ? `${Math.max(0, cpn.max_uses - cpn.used_count)} coupons available`
                            : 'Unlimited redemptions'}
                        </span>
                        {isExhausted && (
                          <span className="text-rose-600 font-bold">100% Sold Out</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Status & Toggle */}
                    <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleCouponActive(cpn)}
                        className={`font-bold flex items-center gap-1.5 transition-colors ${
                          cpn.is_active ? 'text-emerald-700 hover:text-emerald-800' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {cpn.is_active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" /> Inactive / Paused
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditCouponModal(cpn)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Adjust % & Cap →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: BASE CATEGORY PRICING ================= */}
      {activeTab === 'pricing' && (
        <div className="space-y-6 animate-fade-in">
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
                      Add-on Deliverable Rates
                    </span>
                    {addonItems.length === 0 ? (
                      <span className="text-slate-400 text-xs italic">No addons configured</span>
                    ) : (
                      addonItems.map(([k, amt]) => (
                        <div key={k} className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                          <span className="capitalize">{k.replace('_', ' ')}</span>
                          <span className="font-semibold text-slate-900">+₹{amt as number}</span>
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
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT COUPON ================= */}
      {couponModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveCoupon} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Release New Promo Coupon'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCouponModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Coupon Code Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Coupon Code * (e.g. DATTA07, TECHFEST25)
              </label>
              <input
                type="text"
                disabled={!!editingCoupon}
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. DATTA07"
                className="input-field font-mono uppercase text-sm font-bold tracking-wider disabled:bg-slate-100"
                required
              />
              {editingCoupon && (
                <span className="text-[11px] text-slate-400 mt-1 block">Coupon code cannot be changed once released.</span>
              )}
            </div>

            {/* Discount Percentage (%) & Max Uses Released */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Discount % *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={couponPercent}
                    onChange={e => setCouponPercent(Number(e.target.value))}
                    className="input-field pr-8 text-sm font-bold text-emerald-700"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                    %
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">e.g. 10 for 10% off</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Released *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={couponMaxUses}
                  onChange={e => setCouponMaxUses(Number(e.target.value))}
                  placeholder="100"
                  className="input-field text-sm font-bold"
                  required
                />
                <span className="text-[10px] text-slate-400">0 = Unlimited redemptions</span>
              </div>
            </div>

            {/* Description / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Campaign Note
              </label>
              <input
                type="text"
                value={couponDesc}
                onChange={e => setCouponDesc(e.target.value)}
                placeholder="e.g. 10% off for Datta's special campaign"
                className="input-field text-xs"
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="coupon_is_active"
                checked={couponIsActive}
                onChange={e => setCouponIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <label htmlFor="coupon_is_active" className="text-xs font-semibold text-slate-700">
                Active & Redeemable by Students at Checkout
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCouponModalOpen(false)}
                className="btn-secondary text-xs px-4 py-2 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCoupon}
                className="btn-primary text-xs px-5 py-2 font-bold flex items-center gap-1.5"
              >
                {savingCoupon ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                {editingCoupon ? 'Save Coupon Updates' : 'Release Coupon Now'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: EDIT CATEGORY RATE CARD ================= */}
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