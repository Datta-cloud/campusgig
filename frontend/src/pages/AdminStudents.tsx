import React, { useState, useEffect } from 'react';
import {
  Users, Search, Mail, Phone, GraduationCap, BookOpen, Clock, ShieldCheck
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

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
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

      {/* Students Table */}
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminStudents;
