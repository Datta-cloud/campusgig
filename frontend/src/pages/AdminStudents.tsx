import React, { useState, useEffect } from 'react';
import {
  Users, Search, Mail, Phone, GraduationCap, BookOpen, Clock, ShieldCheck, CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/admin/students');
        setStudents(res.data.students || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const filtered = students.filter(s =>
    (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.college_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeStudents = filtered.filter(s => (s.stats?.completed_orders || 0) === 0);
  const graduatedStudents = filtered.filter(s => (s.stats?.completed_orders || 0) > 0);

  const renderStudentRow = (s: any) => (
    <tr key={s.id} className="hover:bg-slate-50/80 transition-all">
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
            {s.full_name?.charAt(0) || 'S'}
          </div>
          <div>
            <span className="font-bold text-slate-900 block">{s.full_name || 'Anonymous'}</span>
            <span className="text-[10px] text-slate-400 font-mono">@{s.username}</span>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
          {s.student_type === 'school' ? (
            <BookOpen className="w-3.5 h-3.5 text-accent-600" />
          ) : (
            <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
          )}
          <span className="capitalize">{s.student_type}</span>
        </div>
        <span className="text-[10px] text-slate-500 block">
          {s.college_name || s.school_class || 'Not specified'}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <span className="block text-slate-600">{s.email}</span>
        <span className="text-[10px] text-slate-400">{s.phone || 'No phone'}</span>
      </td>
      <td className="py-3.5 px-4 font-bold text-slate-800">
        {s.stats?.total_orders || 0} Orders
        <span className="text-[10px] text-emerald-600 font-semibold block">
          {s.stats?.completed_orders || 0} Completed
        </span>
      </td>
      <td className="py-3.5 px-4 font-bold text-slate-900">
        ₹{s.stats?.total_spent?.toLocaleString() || 0}
      </td>
      <td className="py-3.5 px-4">
        {s.is_online ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Offline</span>
        )}
      </td>
      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
        {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
      </td>
    </tr>
  );

  return (
    <div className="p-6 sm:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Registered Students Directory</h1>
          <p className="text-xs text-slate-500">
            {students.length} students enrolled across school and university programs
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student, college, email..."
            className="input-field pl-10 text-xs py-2.5"
          />
        </div>
      </div>

      {/* 1. Active Enrolled Students */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-pulse"></span>
            🎓 Active Enrolled Students ({activeStudents.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">Students with active or pending orders</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Stream & Institution</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Orders Placed</th>
                  <th className="py-3.5 px-4">Total Paid</th>
                  <th className="py-3.5 px-4">Presence</th>
                  <th className="py-3.5 px-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {activeStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No active students found.
                    </td>
                  </tr>
                ) : (
                  activeStudents.map(renderStudentRow)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Completed / Graduated Students Section at Bottom */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ✓ Completed / Certified Students ({graduatedStudents.length})
          </h2>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {graduatedStudents.length} Students Completed
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-50/60 text-emerald-800 uppercase tracking-wider text-[10px] border-b border-emerald-100">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Stream & Institution</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Orders Placed</th>
                  <th className="py-3.5 px-4">Total Paid</th>
                  <th className="py-3.5 px-4">Presence</th>
                  <th className="py-3.5 px-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {graduatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No completed student records yet.
                    </td>
                  </tr>
                ) : (
                  graduatedStudents.map(renderStudentRow)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminStudents;
