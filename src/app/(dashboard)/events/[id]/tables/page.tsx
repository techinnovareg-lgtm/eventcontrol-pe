'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Grid, ArrowLeft, Plus, Users, AlertTriangle, CheckCircle2, 
  Trash2, Move, UserCheck, X
} from 'lucide-react';
import { getEventById, getEventGuestGroups } from '@/lib/events';
import { 
  getEventTables, createTable, deleteTable, getEventTableAssignments, 
  assignGroupToTable, unassignGroupFromTable, calculateTableOccupancy 
} from '@/lib/tables';
import { Table, TableAssignment, GuestGroup } from '@/lib/supabase/types';

export default function TablesManagementPage() {
  const params = useParams();
  const eventId = String(params.id || 'evt-102');
  const currentWorkspaceId = 'ws-a-1111';

  const event = getEventById(eventId, currentWorkspaceId);
  const groups = getEventGuestGroups(eventId);

  const [tables, setTables] = useState<Table[]>(getEventTables(eventId));
  const [assignments, setAssignments] = useState<TableAssignment[]>(getEventTableAssignments(eventId));

  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);

  const refreshData = () => {
    setTables([...getEventTables(eventId)]);
    setAssignments([...getEventTableAssignments(eventId)]);
  };

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    createTable(eventId, currentWorkspaceId, tableName, tableCapacity);
    setTableName('');
    setShowAddModal(false);
    refreshData();
  };

  const handleDeleteTable = (tableId: string) => {
    if (confirm('¿Eliminar esta mesa y liberar sus asignaciones?')) {
      deleteTable(eventId, tableId);
      refreshData();
    }
  };

  const handleAssign = (tableId: string, groupId: string, passes: number) => {
    assignGroupToTable(eventId, currentWorkspaceId, tableId, groupId, passes);
    refreshData();
  };

  const handleUnassign = (groupId: string) => {
    unassignGroupFromTable(eventId, groupId);
    refreshData();
  };

  // Find unassigned groups
  const assignedGroupIds = new Set(assignments.map(a => a.group_id));
  const unassignedGroups = groups.filter(g => !assignedGroupIds.has(g.id));

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link href="/events" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" /> Volver a Eventos
          </Link>
          <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-3 py-1 rounded-full">
            {event?.name || 'Evento'}
          </span>
        </div>

        {/* Page Title */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Organizador de Espacio</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Plano Virtual de Mesas y Distribución</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Crea mesas, asigna grupos de invitados y verifica la ocupación total sin exceder capacidades.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Crear Nueva Mesa
          </button>
        </div>

        {/* Main Grid: Unassigned Groups Drawer (Left) & Tables Canvas (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Unassigned Groups Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600" /> Grupos Sin Asignar
              </h3>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                {unassignedGroups.length} pendientes
              </span>
            </div>

            {unassignedGroups.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                ¡Excelente! Todos los grupos de invitados están asignados a una mesa.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {unassignedGroups.map((g) => (
                  <div key={g.id} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{g.group_name}</span>
                      <span className="px-2 py-0.5 bg-brand-100 text-brand-800 rounded-full font-bold">
                        {g.max_passes} pases
                      </span>
                    </div>

                    {/* Quick Assign Dropdown */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleAssign(e.target.value, g.id, g.max_passes);
                      }}
                      defaultValue=""
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="" disabled>-- Asignar a Mesa --</option>
                      {tables.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} (Capacidad: {t.capacity})</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tables Canvas Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tables.map((tbl) => {
                const stats = calculateTableOccupancy(eventId, tbl.id, tbl.capacity);
                const assignedToTbl = assignments.filter(a => a.table_id === tbl.id);

                return (
                  <div key={tbl.id} className={`bg-white rounded-2xl border p-5 shadow-sm transition space-y-4 ${
                    stats.isOvercapacity ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
                  }`}>
                    {/* Table Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">{tbl.name}</h4>
                        <span className="text-xs text-slate-500">Capacidad: {tbl.capacity} personas</span>
                      </div>

                      <button
                        onClick={() => handleDeleteTable(tbl.id)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                        title="Eliminar mesa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Occupancy Indicator */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">Ocupación Asignada:</span>
                      <div className="flex items-center gap-2">
                        <strong className={`text-sm font-extrabold ${stats.isOvercapacity ? 'text-red-600' : 'text-slate-900'}`}>
                          {stats.occupancyRatio}
                        </strong>
                        {stats.isOvercapacity && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold text-[10px] rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> SOBRECUPOS (+{stats.overflowCount})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Assigned Groups inside Table */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Grupos en Mesa:</span>
                      {assignedToTbl.length === 0 ? (
                        <div className="text-xs text-slate-400 italic py-2 text-center">Mesa vacía (Sin asignaciones)</div>
                      ) : (
                        assignedToTbl.map((a) => {
                          const g = groups.find(grp => grp.id === a.group_id);
                          return (
                            <div key={a.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs border border-slate-100">
                              <span className="font-semibold text-slate-800">{g?.group_name || 'Grupo'}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                                  {a.assigned_passes} pases
                                </span>
                                <button
                                  onClick={() => handleUnassign(a.group_id)}
                                  className="text-slate-400 hover:text-red-600 transition"
                                  title="Quitar de la mesa"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Crear Nueva Mesa</h2>

            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre o Número de Mesa
                </label>
                <input
                  type="text"
                  required
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Ej. Mesa 4 (Familia Novia)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Capacidad Máxima de Personas
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg transition shadow-sm"
                >
                  Guardar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
