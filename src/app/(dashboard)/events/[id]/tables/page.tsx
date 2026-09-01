'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { 
  Grid, ArrowLeft, Plus, Users, AlertTriangle, CheckCircle2, 
  Trash2, Move, UserCheck, X, GripVertical, Disc, LayoutGrid, 
  Sparkles, Compass, MapPin, ShieldAlert, Award
} from 'lucide-react';
import { getEventById, getEventGuestGroups } from '@/lib/events';
import { 
  getEventTables, createTable, deleteTable, getEventTableAssignments, 
  assignGroupToTable, unassignGroupFromTable, calculateTableOccupancy 
} from '@/lib/tables';
import { Table, TableAssignment, GuestGroup } from '@/lib/supabase/types';

type LayoutMode = 'SPATIAL_CIRCULAR' | 'SPATIAL_MULTI_ZONE' | 'GRID_CARDS';
type TableShape = 'ROUND' | 'RECTANGULAR' | 'VIP_HONOR';

interface TablePos {
  id: string;
  x: number;
  y: number;
  shape: TableShape;
  zone?: string;
}

export default function TablesManagementPage() {
  const params = useParams();
  const eventId = String(params.id || 'evt-102');
  const currentWorkspaceId = 'ws-a-1111';

  const event = getEventById(eventId, currentWorkspaceId);
  const groups = getEventGuestGroups(eventId);

  const [tables, setTables] = useState<Table[]>(() => getEventTables(eventId));
  const [assignments, setAssignments] = useState<TableAssignment[]>(() => getEventTableAssignments(eventId));

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('SPATIAL_CIRCULAR');
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);

  // Table positions on the 2D Spatial Canvas
  const [tablePositions, setTablePositions] = useState<Record<string, { x: number; y: number; shape: TableShape; zone: string }>>({
    'tbl-1': { x: 140, y: 110, shape: 'ROUND', zone: 'Zona Novia (Izquierda)' },
    'tbl-2': { x: 140, y: 310, shape: 'ROUND', zone: 'Zona Novia (Izquierda)' },
    'tbl-3': { x: 440, y: 60, shape: 'VIP_HONOR', zone: 'Escenario / Mesa de Honor' },
    'tbl-4': { x: 740, y: 110, shape: 'ROUND', zone: 'Zona Novio (Derecha)' },
    'tbl-5': { x: 740, y: 310, shape: 'ROUND', zone: 'Zona Novio (Derecha)' },
  });

  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState(10);
  const [tableShape, setTableShape] = useState<TableShape>('ROUND');
  const [showAddModal, setShowAddModal] = useState(false);

  const refreshData = () => {
    setTables([...getEventTables(eventId)]);
    setAssignments([...getEventTableAssignments(eventId)]);
  };

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    const newTbl = createTable(eventId, currentWorkspaceId, tableName, tableCapacity);
    
    // Add position for new table
    setTablePositions(prev => ({
      ...prev,
      [newTbl.id]: { x: 440, y: 220, shape: tableShape, zone: 'Centro' }
    }));

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

  // Drag and Drop Handlers for Groups -> Tables
  const handleDragStartGroup = (e: React.DragEvent, groupId: string) => {
    e.dataTransfer.setData('text/plain', groupId);
    setDraggedGroupId(groupId);
  };

  const handleDragOverTable = (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    if (dragOverTableId !== tableId) {
      setDragOverTableId(tableId);
    }
  };

  const handleDragLeaveTable = (e: React.DragEvent) => {
    setDragOverTableId(null);
  };

  const handleDropGroupOnTable = (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    const groupId = e.dataTransfer.getData('text/plain') || draggedGroupId;
    setDragOverTableId(null);
    setDraggedGroupId(null);

    if (groupId) {
      const grp = groups.find(g => g.id === groupId);
      if (grp) {
        handleAssign(tableId, groupId, grp.max_passes);
      }
    }
  };

  // Dragging Table Nodes on the 2D Spatial Canvas
  const [movingTableId, setMovingTableId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!movingTableId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(20, Math.min(850, e.clientX - rect.left - 60));
    const y = Math.max(20, Math.min(480, e.clientY - rect.top - 40));

    setTablePositions(prev => ({
      ...prev,
      [movingTableId]: {
        ...prev[movingTableId],
        x,
        y
      }
    }));
  };

  // Filter unassigned groups
  const assignedGroupIds = new Set(assignments.map(a => a.group_id));
  const unassignedGroups = groups.filter(g => !assignedGroupIds.has(g.id));

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059] selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-[#C5A059]/20 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md border border-[#C5A059]/30 group-hover:scale-105 transition-transform">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl.pe Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#1A1A1A] font-serif">
                EventControl<span className="text-[#C5A059]">.pe</span>
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
                {event?.name || 'Evento'}
              </span>
            </div>
          </Link>

          <Link href="/dashboard" className="text-xs text-slate-600 hover:text-[#C5A059] font-bold flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 w-full">
        {/* Title Bar & Mode Switcher */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest block">
              Organización Espacial e Interactiva
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1">Plano Virtual de Mesas y Distribución</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Arrastra familias (Drag & Drop) a las mesas y distribuye el espacio libremente en geometrías circulares, divididas o por zonas.
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setLayoutMode('SPATIAL_CIRCULAR')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                layoutMode === 'SPATIAL_CIRCULAR' 
                  ? 'gold-button shadow-md' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Disc className="w-4 h-4" /> Salón Redondo (Circular)
            </button>

            <button
              onClick={() => setLayoutMode('SPATIAL_MULTI_ZONE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                layoutMode === 'SPATIAL_MULTI_ZONE' 
                  ? 'gold-button shadow-md' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" /> Dividido (Multi-Zona)
            </button>

            <button
              onClick={() => setLayoutMode('GRID_CARDS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                layoutMode === 'GRID_CARDS' 
                  ? 'gold-button shadow-md' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Listado (Tarjetas)
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#C5A059]" /> Nueva Mesa
            </button>
          </div>
        </div>

        {/* Main Grid: Unassigned Drawer (Left) & Canvas Area (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* DRAGGABLE UNASSIGNED GROUPS DRAWER */}
          <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#B8860B]" /> Grupos Sin Asignar
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Arrastra una tarjeta hacia una mesa en el plano</span>
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full border border-amber-300">
                {unassignedGroups.length} pendientes
              </span>
            </div>

            {unassignedGroups.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <strong className="block text-emerald-900 font-bold">¡Distribución Completa!</strong>
                <p>Todos los grupos de invitados están asignados a una mesa de gala.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {unassignedGroups.map((g) => (
                  <div
                    key={g.id}
                    draggable
                    onDragStart={(e) => handleDragStartGroup(e, g.id)}
                    className="p-3.5 bg-white hover:bg-amber-50/50 rounded-xl border border-slate-200 hover:border-[#C5A059] transition text-xs space-y-2 cursor-grab active:cursor-grabbing shadow-sm group hover-lift"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="font-bold text-slate-900 flex items-center gap-1.5">
                        <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-[#B8860B]" />
                        {g.group_name}
                      </strong>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded-md text-[11px]">
                        {g.max_passes} pases
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>Contacto: {g.responsible_phone || 'N/A'}</span>
                      <span className="text-[#B8860B] font-bold group-hover:underline">Arrastrar a Mesa →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SPATIAL 2D CANVAS OR GRID CARDS VIEW */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* VIEW MODE 1 & 2: SPATIAL 2D CANVAS */}
            {layoutMode !== 'GRID_CARDS' ? (
              <div 
                ref={canvasRef}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={() => setMovingTableId(null)}
                className="card-luxury p-6 border-2 border-[#C5A059]/40 shadow-xl min-h-[620px] relative overflow-hidden bg-gradient-to-br from-white via-[#FAF8F5] to-amber-50/20"
              >
                {/* Central Feature Decorator based on Layout Mode */}
                {layoutMode === 'SPATIAL_CIRCULAR' ? (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-2 border-dashed border-[#C5A059]/40 bg-amber-50/40 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-amber-100/80 border border-[#C5A059]/50 flex items-center justify-center text-2xl mb-1 shadow-inner">
                      💃🕺
                    </div>
                    <strong className="text-xs font-serif font-bold text-[#1A1A1A]">Pista de Baile Central</strong>
                    <span className="text-[10px] text-slate-500">Salón Redondo • Disposición Anillo</span>
                  </div>
                ) : (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm h-36 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/30 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                    <span className="text-xs font-serif font-bold text-purple-900">
                      🎭 PISTA DE BAILE CENTRAL & ORQUESTA EN VIVO
                    </span>
                    <span className="text-[10px] text-purple-600 mt-1">
                      Separación: Zona Izquierda (Familia Novia) • Zona Derecha (Familia Novio)
                    </span>
                  </div>
                )}

                {/* Header Zone Indicators */}
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-4 border-b border-slate-100">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-purple-600" /> Zona Izquierda</span>
                  <span className="text-[#B8860B]">Escenario / Mesa de Honor VIP ★</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-600" /> Zona Derecha</span>
                </div>

                {/* Render Interactive Table Nodes on 2D Canvas */}
                {tables.map((tbl, index) => {
                  const stats = calculateTableOccupancy(eventId, tbl.id, tbl.capacity);
                  const assignedToTbl = assignments.filter(a => a.table_id === tbl.id);
                  const pos = tablePositions[tbl.id] || { 
                    x: 100 + (index % 3) * 260, 
                    y: 100 + Math.floor(index / 3) * 180,
                    shape: index === 2 ? 'VIP_HONOR' : 'ROUND',
                    zone: 'Centro'
                  };

                  const isHoveredDrop = dragOverTableId === tbl.id;

                  return (
                    <div
                      key={tbl.id}
                      onDragOver={(e) => handleDragOverTable(e, tbl.id)}
                      onDragLeave={handleDragLeaveTable}
                      onDrop={(e) => handleDropGroupOnTable(e, tbl.id)}
                      style={{
                        position: 'absolute',
                        left: `${pos.x}px`,
                        top: `${pos.y}px`,
                      }}
                      className={`w-60 p-4 rounded-2xl border transition-all duration-300 shadow-md ${
                        isHoveredDrop
                          ? 'border-2 border-emerald-500 bg-emerald-50 scale-105 shadow-2xl ring-4 ring-emerald-200'
                          : stats.isOvercapacity
                          ? 'border-red-400 bg-red-50/90 shadow-red-100'
                          : pos.shape === 'VIP_HONOR'
                          ? 'border-[#C5A059] bg-gradient-to-b from-white to-amber-50/80 shadow-lg'
                          : 'border-slate-300 bg-white hover:border-[#C5A059]'
                      }`}
                    >
                      {/* Table Drag Handle Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div 
                          onMouseDown={() => setMovingTableId(tbl.id)}
                          className="cursor-move flex items-center gap-1.5"
                          title="Arrastrar posición de mesa"
                        >
                          <GripVertical className="w-4 h-4 text-slate-400 hover:text-[#B8860B]" />
                          {pos.shape === 'VIP_HONOR' ? (
                            <span className="text-xs font-bold text-[#B8860B] flex items-center gap-1 font-serif">
                              <Award className="w-3.5 h-3.5 text-[#C5A059]" /> {tbl.name}
                            </span>
                          ) : (
                            <strong className="text-xs font-bold text-slate-900 font-serif">{tbl.name}</strong>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteTable(tbl.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition"
                          title="Eliminar mesa"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Capacity Ratio Progress Bar */}
                      <div className="py-2 space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 font-semibold">Asignación:</span>
                          <strong className={`font-bold ${stats.isOvercapacity ? 'text-red-600' : 'text-slate-900'}`}>
                            {stats.occupancyRatio} pers.
                          </strong>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              stats.isOvercapacity ? 'bg-red-500' :
                              stats.occupancyPercentage >= 100 ? 'bg-emerald-600' : 'bg-[#C5A059]'
                            }`}
                            style={{ width: `${Math.min(100, stats.occupancyPercentage)}%` }}
                          ></div>
                        </div>

                        {stats.isOvercapacity && (
                          <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 pt-1">
                            <ShieldAlert className="w-3 h-3" /> SOBRECUPO (+{stats.overflowCount})
                          </span>
                        )}
                      </div>

                      {/* Assigned Groups inside Table */}
                      <div className="space-y-1.5 pt-1">
                        {assignedToTbl.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic text-center py-2 border border-dashed border-slate-200 rounded-lg">
                            Soltar familia aquí (Drag & Drop)
                          </div>
                        ) : (
                          assignedToTbl.map((a) => {
                            const g = groups.find(grp => grp.id === a.group_id);
                            return (
                              <div key={a.id} className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-[11px] border border-slate-200/80">
                                <span className="font-semibold text-slate-800 truncate max-w-[120px]">{g?.group_name || 'Grupo'}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[#B8860B] bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border border-[#C5A059]/30">
                                    +{a.assigned_passes}
                                  </span>
                                  <button
                                    onClick={() => handleUnassign(a.group_id)}
                                    className="text-slate-400 hover:text-red-600 transition"
                                    title="Quitar de la mesa"
                                  >
                                    <X className="w-3 h-3" />
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
            ) : (
              /* VIEW MODE 3: GRID CARDS LISTING */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tables.map((tbl) => {
                  const stats = calculateTableOccupancy(eventId, tbl.id, tbl.capacity);
                  const assignedToTbl = assignments.filter(a => a.table_id === tbl.id);
                  const isHoveredDrop = dragOverTableId === tbl.id;

                  return (
                    <div 
                      key={tbl.id}
                      onDragOver={(e) => handleDragOverTable(e, tbl.id)}
                      onDragLeave={handleDragLeaveTable}
                      onDrop={(e) => handleDropGroupOnTable(e, tbl.id)}
                      className={`card-luxury p-5 border transition space-y-4 ${
                        isHoveredDrop ? 'border-2 border-emerald-500 bg-emerald-50 ring-4 ring-emerald-200' :
                        stats.isOvercapacity ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-serif font-bold text-[#1A1A1A]">{tbl.name}</h4>
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

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">Ocupación:</span>
                        <strong className={`text-sm font-bold ${stats.isOvercapacity ? 'text-red-600' : 'text-slate-900'}`}>
                          {stats.occupancyRatio} pers.
                        </strong>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        {assignedToTbl.map((a) => {
                          const g = groups.find(grp => grp.id === a.group_id);
                          return (
                            <div key={a.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs border border-slate-100">
                              <span className="font-semibold text-slate-800">{g?.group_name || 'Grupo'}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#B8860B] bg-amber-50 px-2 py-0.5 rounded-md border border-[#C5A059]/30">
                                  {a.assigned_passes} pases
                                </span>
                                <button
                                  onClick={() => handleUnassign(a.group_id)}
                                  className="text-slate-400 hover:text-red-600 transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CREATE NEW TABLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border border-[#C5A059]/40 space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Crear Nueva Mesa de Gala</h3>

            <form onSubmit={handleCreateTable} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre o Número de Mesa
                </label>
                <input
                  type="text"
                  required
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Ej. Mesa 6 (Familia Novio)"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Forma / Geometría de Mesa
                </label>
                <select
                  value={tableShape}
                  onChange={(e) => setTableShape(e.target.value as TableShape)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                >
                  <option value="ROUND">Mesa Redonda de Gala (10-12 pers.)</option>
                  <option value="RECTANGULAR">Mesa Imperial / Rectangular</option>
                  <option value="VIP_HONOR">Mesa de Honor VIP / Presidencial</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Capacidad Máxima de Personas
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 gold-button font-bold rounded-xl shadow-md"
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
