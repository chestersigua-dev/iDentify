'use client';

import React, { useState } from 'react';
import { 
  User, 
  AcademicSection, 
  GradeSubject, 
  AssignedClass, 
  usersApi, 
  SECTIONS_SEED, 
  SUBJECTS_SEED 
} from '@/lib/api';
import { useTenant } from '@/lib/tenant-context';
import { 
  Layers, 
  BookOpen, 
  Plus, 
  Trash2, 
  UserCheck, 
  CheckCircle, 
  School, 
  Edit3, 
  Sparkles, 
  GraduationCap, 
  ChevronRight, 
  X 
} from 'lucide-react';

interface AcademicAssignmentsViewProps {
  users: User[];
  sections: AcademicSection[];
  subjects: GradeSubject[];
  onRefresh: () => void;
  canManage: boolean; // Principal & AO & Superadmin
}

export function AcademicAssignmentsView({
  users,
  sections,
  subjects,
  onRefresh,
  canManage,
}: AcademicAssignmentsViewProps) {
  const { currentRole, school } = useTenant();
  const [activeSubTab, setActiveSubTab] = useState<'teacher_loads' | 'sections' | 'subjects'>('teacher_loads');

  // Teacher Assignment Modal
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignedClassesState, setAssignedClassesState] = useState<AssignedClass[]>([]);

  // Section Management State
  const [sectionsList, setSectionsList] = useState<AcademicSection[]>(sections);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    grade_level: 7,
    name: '',
    room: '',
    adviser_user_id: '',
    max_capacity: 45,
  });

  // Subjects Management State
  const [subjectsList, setSubjectsList] = useState<GradeSubject[]>(subjects);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    grade_level: 7,
    code: '',
    name: '',
    units: 1.0,
    department: 'JHS Academics',
  });

  // Filter teachers (Teacher I-VI, Master Teacher I-V)
  const teachersList = users.filter(
    (u) =>
      u.role === 'TEACHER' ||
      u.role === 'MASTER_TEACHER' ||
      (u.position && (u.position.includes('Teacher') || u.position.includes('Master Teacher')))
  );

  const handleOpenAssignModal = (teacher: User) => {
    setSelectedTeacher(teacher);
    setAssignedClassesState(teacher.assigned_classes || []);
    setIsAssignModalOpen(true);
  };

  const handleAddClassAssignment = () => {
    setAssignedClassesState([
      ...assignedClassesState,
      {
        grade_level: 7,
        section: sectionsList[0]?.name || 'Bonifacio',
        subject: subjectsList[0]?.name || 'Mathematics 7',
        is_adviser: false,
      },
    ]);
  };

  const handleRemoveClassAssignment = (index: number) => {
    const updated = [...assignedClassesState];
    updated.splice(index, 1);
    setAssignedClassesState(updated);
  };

  const handleSaveTeacherAssignments = async () => {
    if (!selectedTeacher) return;
    try {
      await usersApi.update(selectedTeacher.id, {
        assigned_classes: assignedClassesState,
      });
      alert(`Successfully updated academic assignments for ${selectedTeacher.name}!`);
      setIsAssignModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(`Error saving assignments: ${err.message}`);
    }
  };

  // Section Creation
  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.name) return;
    const newSec: AcademicSection = {
      id: `sec-${Date.now()}`,
      grade_level: Number(sectionForm.grade_level),
      name: sectionForm.name,
      room: sectionForm.room || 'Room 101',
      adviser_user_id: sectionForm.adviser_user_id || undefined,
      max_capacity: Number(sectionForm.max_capacity),
    };
    setSectionsList([...sectionsList, newSec]);
    setIsSectionModalOpen(false);
    setSectionForm({ grade_level: 7, name: '', room: '', adviser_user_id: '', max_capacity: 45 });
  };

  // Subject Creation
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name) return;
    const newSubj: GradeSubject = {
      id: `subj-${Date.now()}`,
      grade_level: Number(subjectForm.grade_level),
      code: subjectForm.code || subjectForm.name.substring(0, 4).toUpperCase(),
      name: subjectForm.name,
      units: Number(subjectForm.units),
      department: subjectForm.department,
    };
    setSubjectsList([...subjectsList, newSubj]);
    setIsSubjectModalOpen(false);
    setSubjectForm({ grade_level: 7, code: '', name: '', units: 1.0, department: 'JHS Academics' });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <School className="w-3.5 h-3.5 inline mr-1" /> DepEd Curriculum &amp; Academic Workload Center
            </span>
            <span className="text-xs text-slate-400 font-mono">School: {school.name}</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Academic Load &amp; Class Assignments</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Principal and Administrative Officer (AO) module to assign grade levels, custom sections, and DepEd subjects to Teachers and Master Teachers.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('teacher_loads')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'teacher_loads'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Teacher Workloads ({teachersList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('sections')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'sections'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Custom Sections ({sectionsList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('subjects')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'subjects'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Grade Subjects ({subjectsList.length})
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Teacher Class & Subject Workloads */}
      {activeSubTab === 'teacher_loads' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white">Teacher Load Allocation Directory</h3>
            </div>
            <span className="text-xs text-slate-400">
              Only Principal, Administrative Assistant, and Superadmin can modify loads
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Faculty Member</th>
                  <th className="px-6 py-3.5">Position & Rank</th>
                  <th className="px-6 py-3.5">Assigned Grade Levels & Sections</th>
                  <th className="px-6 py-3.5">Subject Loads</th>
                  <th className="px-6 py-3.5">Advisory Section</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {teachersList.map((teacher) => {
                  const loads = teacher.assigned_classes || [];
                  const advisoryClass = loads.find((l) => l.is_adviser);

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              teacher.photo_url ||
                              `https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&auto=format&fit=crop&q=80`
                            }
                            alt={teacher.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/40 bg-slate-800"
                          />
                          <div>
                            <div className="font-semibold text-white">{teacher.name}</div>
                            <div className="text-xs text-slate-400">{teacher.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {teacher.position || teacher.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {loads.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">No assigned classes yet</span>
                          ) : (
                            loads.map((l, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200"
                              >
                                Grade {l.grade_level} - {l.section}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {loads.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">None</span>
                          ) : (
                            loads.map((l, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-xs border border-indigo-500/20"
                              >
                                {l.subject}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {advisoryClass ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Sparkles className="w-3 h-3" />
                            G{advisoryClass.grade_level} - {advisoryClass.section}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">None</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {canManage ? (
                          <button
                            onClick={() => handleOpenAssignModal(teacher)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold transition"
                          >
                            Assign Classes & Subjects
                          </button>
                        ) : (
                          <span className="text-xs text-slate-600">Read-only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Custom Sections Management */}
      {activeSubTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Custom DepEd Academic Sections</h3>
            {canManage && (
              <button
                onClick={() => setIsSectionModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
              >
                <Plus className="w-4 h-4" /> Add Custom Section
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sectionsList.map((sec) => (
              <div
                key={sec.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Grade {sec.grade_level}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Max: {sec.max_capacity} Learners</span>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-white">Section {sec.name}</h4>
                  <p className="text-xs text-slate-400">Classroom: {sec.room}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Curriculum: Enhanced Basic Ed</span>
                  <span className="text-emerald-400 font-medium">Active Section</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 3: Subjects Management */}
      {activeSubTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">DepEd Curriculum Subject Offerings</h3>
            {canManage && (
              <button
                onClick={() => setIsSubjectModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
              >
                <Plus className="w-4 h-4" /> Add Subject Offering
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {subjectsList.map((subj) => (
              <div
                key={subj.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono text-[10px] font-bold border border-indigo-500/20">
                    {subj.code}
                  </span>
                  <span className="text-xs text-slate-400">Grade {subj.grade_level}</span>
                </div>
                <h4 className="font-semibold text-white text-sm">{subj.name}</h4>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
                  <span>{subj.department}</span>
                  <span>{subj.units} Unit</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher Assignment Modal */}
      {isAssignModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedTeacher.photo_url ||
                    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&auto=format&fit=crop&q=80'
                  }
                  alt={selectedTeacher.name}
                  className="w-10 h-10 rounded-full object-cover border border-blue-500"
                />
                <div>
                  <h3 className="font-bold text-white text-base">Assign Classes & Subjects</h3>
                  <p className="text-xs text-blue-400">
                    Faculty: {selectedTeacher.name} • {selectedTeacher.position || selectedTeacher.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Assigned Teaching Workload
                </span>
                <button
                  type="button"
                  onClick={handleAddClassAssignment}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Assigned Class
                </button>
              </div>

              {assignedClassesState.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  No classes or subjects assigned yet. Click "Add Assigned Class" above.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedClassesState.map((assignment, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3 items-center"
                    >
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Grade Level
                        </label>
                        <select
                          value={assignment.grade_level}
                          onChange={(e) => {
                            const updated = [...assignedClassesState];
                            updated[idx].grade_level = Number(e.target.value);
                            setAssignedClassesState(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value={7}>Grade 7</option>
                          <option value={8}>Grade 8</option>
                          <option value={9}>Grade 9</option>
                          <option value={10}>Grade 10</option>
                          <option value={11}>Grade 11</option>
                          <option value={12}>Grade 12</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Custom Section
                        </label>
                        <select
                          value={assignment.section}
                          onChange={(e) => {
                            const updated = [...assignedClassesState];
                            updated[idx].section = e.target.value;
                            setAssignedClassesState(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          {sectionsList.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name} (G{s.grade_level})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Subject Assigned
                        </label>
                        <select
                          value={assignment.subject}
                          onChange={(e) => {
                            const updated = [...assignedClassesState];
                            updated[idx].subject = e.target.value;
                            setAssignedClassesState(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          {subjectsList.map((sub) => (
                            <option key={sub.id} value={sub.name}>
                              {sub.name} (G{sub.grade_level})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between md:pt-4">
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={assignment.is_adviser}
                            onChange={(e) => {
                              const updated = [...assignedClassesState];
                              updated[idx].is_adviser = e.target.checked;
                              setAssignedClassesState(updated);
                            }}
                            className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Adviser</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveClassAssignment(idx)}
                          className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                          title="Remove Assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTeacherAssignments}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Save Teacher Assignments</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Creation Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-white text-base">Add Custom DepEd Section</h3>
            <form onSubmit={handleCreateSection} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Grade Level</label>
                <select
                  value={sectionForm.grade_level}
                  onChange={(e) => setSectionForm({ ...sectionForm, grade_level: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value={7}>Grade 7</option>
                  <option value={8}>Grade 8</option>
                  <option value={9}>Grade 9</option>
                  <option value={10}>Grade 10</option>
                  <option value={11}>Grade 11</option>
                  <option value={12}>Grade 12</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Section Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mabini, Silang, Jacinto"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Room Assignment</label>
                <input
                  type="text"
                  placeholder="e.g. Room 204 (Building B)"
                  value={sectionForm.room}
                  onChange={(e) => setSectionForm({ ...sectionForm, room: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Max Student Capacity</label>
                <input
                  type="number"
                  value={sectionForm.max_capacity}
                  onChange={(e) => setSectionForm({ ...sectionForm, max_capacity: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Creation Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-white text-base">Add DepEd Curriculum Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Grade Level</label>
                <select
                  value={subjectForm.grade_level}
                  onChange={(e) => setSubjectForm({ ...subjectForm, grade_level: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value={7}>Grade 7</option>
                  <option value={8}>Grade 8</option>
                  <option value={9}>Grade 9</option>
                  <option value={10}>Grade 10</option>
                  <option value={11}>Grade 11</option>
                  <option value={12}>Grade 12</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Araling Panlipunan 7"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g. AP7"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
