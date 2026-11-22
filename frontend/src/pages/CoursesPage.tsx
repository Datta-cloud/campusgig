import React, { useState, useEffect } from 'react';
import {
  BookOpen, Clock, Users, Plus, CheckCircle2, Sparkles, X, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export const CoursesPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  // New Course Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('AI & Machine Learning');
  const [newPrice, setNewPrice] = useState(1499);
  const [newDuration, setNewDuration] = useState(12);
  const [newLevel, setNewLevel] = useState('intermediate');
  const [creating, setCreating] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: number) => {
    setEnrollingId(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      alert('Enrollment successful! Our mentor will contact you for session scheduling.');
      fetchCourses();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Enrollment failed');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/courses', {
        title: newTitle,
        description: newDesc,
        category: newCategory,
        price: Number(newPrice),
        duration_hours: Number(newDuration),
        level: newLevel,
        is_active: true
      });
      alert('New course added to catalog!');
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      fetchCourses();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 space-y-8 bg-slate-50 min-h-screen max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Upskill & Masterclasses
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-2">
            CampusGig Mentorship Courses
          </h1>
          <p className="text-xs text-slate-500">
            1-on-1 practical masterclasses on Agentic AI, Full-Stack engineering, and College Capstone prep
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" /> Add New Course
          </button>
        )}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-3 bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
            <span className="text-3xl">📚</span>
            <h3 className="font-bold text-slate-800">No Courses Available Right Now</h3>
            <p className="text-xs text-slate-400">Admin can publish new courses anytime using the Add Course button above.</p>
          </div>
        ) : (
          courses.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-brand-300 transition-all">
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded border border-brand-200">
                    {c.category || 'Engineering'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 capitalize">
                    {c.level}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">{c.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{c.description}</p>

                <div className="pt-2 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {c.duration_hours || 10} Hours
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> {c.enrollment_count || 0} Students
                  </span>
                </div>
              </div>

              <div className="p-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Course Fee</span>
                  <span className="text-xl font-black text-slate-900">
                    {c.price === 0 ? 'Free' : `₹${c.price}`}
                  </span>
                </div>

                {user?.role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleEnroll(c.id)}
                    disabled={enrollingId === c.id}
                    className="btn-primary text-xs px-5 py-2 font-bold shadow-sm"
                  >
                    {enrollingId === c.id ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateCourse} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Create New Masterclass / Course</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Title *</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g., Agentic AI & RAG Bootcamp with LangGraph"
                className="input-field text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Detailed curriculum, skills gained, and deliverables..."
                className="input-field text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fee (₹)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={e => setNewPrice(Number(e.target.value))}
                  className="input-field text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Hours)</label>
                <input
                  type="number"
                  value={newDuration}
                  onChange={e => setNewDuration(Number(e.target.value))}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty Level</label>
                <select
                  value={newLevel}
                  onChange={e => setNewLevel(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-secondary text-xs px-4 py-2 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="btn-primary text-xs px-5 py-2 font-bold"
              >
                {creating ? 'Publishing...' : 'Publish Course'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default CoursesPage;
