'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { 
  Grid, ArrowLeft, Plus, Users, AlertTriangle, CheckCircle2, 
  Trash2, Move, UserCheck, X, GripVertical, Disc, LayoutGrid, 
  Sparkles, Compass, MapPin, ShieldAlert, Award, ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronUp, Edit3, Save, RotateCcw
} from 'lucide-react';
import { getEventById, getEventGuestGroups } from '@/lib/events';
import { 
  getEventTables, createTable, deleteTable, updateTable, getEventTableAssignments, 
  assignGroupToTable, unassignGroupFromTable, calculateTableOccupancy, updateTablePosition 
} from '@/lib/tables';
import { Table, TableAssignment, GuestGroup } from '@/lib/supabase/types';

type LayoutMode = 'SPATIAL_CIRCULAR' | 'SPATIAL_MULTI_ZONE' | 'GRID_CARDS';
type TableShape = 'ROUND' | 'RECTANGULAR' | 'VIP_HONOR';

export default function TablesManagementPage() {
  const params = useParams();
  const eventId = String(params.id || 'evt-102');
  const currentWorkspaceId = 'ws-a-1111';

  const event = getEventById(eventId, currentWorkspaceId);
  const groups = getEventGuestGroups(eventId);

  const [tables, setTables] = useState<Table[]>(() => getEventTables(eventId));
  const [assignments, setAssignments] = useState<TableAssignment[]>(() => getEventTableAssignments(eventId));

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('SPATIAL_CIRCULAR');
  const [canvasZoom, setCanvasZoom] = useState<number>(1);
  const [isCompactView, setIsCompactView] = useState<boolean>(true);

  // Editable Zone Headers
  const [zoneLeftHeader, setZoneLeftHeader] = useState('Zona Izquierda (Novia)');
  const [zoneCenterHeader, setZoneCenterHeader] = useState('Escenario / Mesa de Honor VIP');
  const [zoneRightHeader, setZoneRightHeader] = useState('Zona Derecha (Novio)');
  const [editingZoneHeader, setEditingZoneHeader] = useState<'left' | 'center' | 'right' | null>(null);

  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);

  // Table positions initialized from persistent tablesStore pos_x / pos_y
  const [tablePositions, setTablePositions] = useState<Record<string, { x: number; y: number; shape: TableShape; zone: string }>>(() => {
    const initialPos: Record<string, { x: number; y: number; shape: TableShape; zone: string }> = {};
    const tbls = getEventTables(eventId);
    tbls.forEach((t, i) => {
      initialPos[t.id] = {
        x: t.pos_x || (140 + (i % 4) * 280),
        y: t.pos_y || (110 + Math.floor(i / 4) * 200),
        shape: i === 4 ? 'VIP_HONOR' : 'ROUND',
        zone: 'Centro'
      };
    });
    return initialPos;
  });

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [editingTableObj, setEditingTableObj] = useState<Table | null>(null);

  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState(10);
  const [tableShape, setTableShape] = useState<TableShape>('ROUND');
  const [showAddModal, setShowAddModal] = useState(false);

  const refreshData = () => {
    const updatedTables = getEventTables(eventId);
    setTables([...updatedTables]);
    setAssignments([...getEventTableAssignments(eventId)]);

    // Sync positions from store
    const updatedPos: Record<string, { x: number; y: number; shape: TableShape; zone: string }> = {};
    updatedTables.forEach((t, i) => {
      updatedPos[t.id] = tablePositions[t.id] || {
        x: t.pos_x || (140 + (i % 4) * 280),
        y: t.pos_y || (110 + Math.floor(i / 4) * 200),
        shape: 'ROUND',
        zone: 'Centro'
      };
    });
    setTablePositions(updatedPos);
  };

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    const newTbl = createTable(eventId, currentWorkspaceId, tableName, tableCapacity, 500, 250);
    
    setTablePositions(prev => ({
      ...prev,
      [newTbl.id]: { x: 500, y: 250, shape: tableShape, zone: 'Centro' }
    }));

    setTableName('');
    setShowAddModal(false);
    refreshData();
  };

  const handleSaveEditTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTableObj) return;

    updateTable(eventId, editingTableObj.id, editingTableObj.name, editingTableObj.capacity);
    setEditingTableObj(null);
    refreshData();
  };

  const handleDeleteTable = (tableId: string) => {
    if (confirm('¿Eliminar esta mesa y liberar sus asignaciones?')) {
      deleteTable(eventId, tableId);
      if (selectedTableId === tableId) setSelectedTableId(null);
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

  // Drag and Drop Handlers for Guest Groups -> Table Nodes
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

  // WINDOW-LEVEL POINTER DRAGGING (100% UNTRAPPABLE & 60FPS FLUID)
  const canvasWorldRef = useRef<HTMLDivElement>(null);
  const activeDragRef = useRef<{
    tableId: string;
    nodeEl: HTMLElement;
    grabOffsetX: number;
    grabOffsetY: number;
    currentX: number;
    currentY: number;
    hasMoved: boolean;
  } | null>(null);

  const handlePointerDownGrip = (e: React.PointerEvent, tableId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const gripEl = e.currentTarget as HTMLElement;
    const nodeEl = gripEl.closest('[data-table-node]') as HTMLElement;
    if (!nodeEl || !canvasWorldRef.current) return;

    const canvasRect = canvasWorldRef.current.getBoundingClientRect();
    const nodeRect = nodeEl.getBoundingClientRect();

    const grabOffsetX = (e.clientX - nodeRect.left) / canvasZoom;
    const grabOffsetY = (e.clientY - nodeRect.top) / canvasZoom;

    const initialX = tablePositions[tableId]?.x || 140;
    const initialY = tablePositions[tableId]?.y || 110;

    activeDragRef.current = {
      tableId,
      nodeEl,
      grabOffsetX,
      grabOffsetY,
      currentX: initialX,
      currentY: initialY,
      hasMoved: false,
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
  };

  const handleGlobalPointerMove = (e: PointerEvent) => {
    if (!activeDragRef.current || !canvasWorldRef.current) return;
    e.preventDefault();

    const drag = activeDragRef.current;
    drag.hasMoved = true;

    const canvasRect = canvasWorldRef.current.getBoundingClientRect();
    const mouseCanvasX = (e.clientX - canvasRect.left) / canvasZoom;
    const mouseCanvasY = (e.clientY - canvasRect.top) / canvasZoom;

    const newX = Math.round(Math.max(10, Math.min(1250, mouseCanvasX - drag.grabOffsetX)));
    const newY = Math.round(Math.max(10, Math.min(800, mouseCanvasY - drag.grabOffsetY)));

    drag.currentX = newX;
    drag.currentY = newY;

    // Direct 0ms DOM manipulation
    drag.nodeEl.style.left = `${newX}px`;
    drag.nodeEl.style.top = `${newY}px`;
  };

  const handleGlobalPointerUp = (e: PointerEvent) => {
    window.removeEventListener('pointermove', handleGlobalPointerMove);
    window.removeEventListener('pointerup', handleGlobalPointerUp);
    window.removeEventListener('pointercancel', handleGlobalPointerUp);

    if (activeDragRef.current) {
      const { tableId, currentX, currentY } = activeDragRef.current;

      // Save position to persistent store
      updateTablePosition(eventId, tableId, currentX, currentY);

      // Update React state once
      setTablePositions(prev => ({
        ...prev,
        [tableId]: {
          ...(prev[tableId] || { shape: 'ROUND', zone: 'Centro' }),
          x: currentX,
          y: currentY,
        }
      }));

      activeDragRef.current = null;
    }
  };

  // Clean up global listeners on unmount if any
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  // Filter unassigned groups
  const assignedGroupIds = new Set(assignments.map(a => a.group_id));
  const unassignedGroups = groups.filter(g => !assignedGroupIds.has(g.id));

  // CALCULATE GLOBAL SEATING METRICS BAR WITH EXACT MATHEMATICAL COHERENCE
  const totalAuthorizedPasses = groups.reduce((sum, g) => sum + (g.max_passes || 0), 0);
  const totalUnassignedPasses = unassignedGroups.reduce((sum, g) => sum + (g.max_passes || 0), 0);
  const totalAssignedPasses = Math.max(0, totalAuthorizedPasses - totalUnassignedPasses);
  const totalTableCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const assignedPercentage = totalAuthorizedPasses > 0 ? Math.min(100, Math.round((totalAssignedPasses / totalAuthorizedPasses) * 100)) : 0;

  const selectedTableObj = tables.find(t => t.id === selectedTableId);
  const selectedTableAssignments = assignments.filter(a => a.table_id === selectedTableId);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059] selection:text-white select-none">
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
      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4 w-full">
        {/* Title Bar & Mode Switcher */}
        <div className="card-luxury p-5 border border-[#C5A059]/30 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest block">
              Organización Espacial e Interactiva
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-0.5">Plano Virtual de Mesas y Distribución</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Arrastra pases a las mesas (Drag & Drop). Mueve las mesas desde su manija (Grip) en el salón amplio de 1400px sin trabas ni bloqueos.
            </p>
          </div>

          {/* Mode & Scale Switchers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setLayoutMode('SPATIAL_CIRCULAR')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                layoutMode === 'SPATIAL_CIRCULAR' 
                  ? 'gold-button shadow-md' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Disc className="w-4 h-4" /> Salón Redondo
            </button>

            <button
              onClick={() => setLayoutMode('SPATIAL_MULTI_ZONE')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                layoutMode === 'SPATIAL_MULTI_ZONE' 
                  ? 'gold-button shadow-md' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" /> Multi-Zona
            </button>

            <button
              onClick={() => setLayoutMode('GRID_CARDS')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                layoutMode === 'GRID_CARDS' 
                  ? 'gold-button shadow-md' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Tarjetas
            </button>

            <button
              onClick={() => setIsCompactView(!isCompactView)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-[#C5A059]/40 font-bold text-xs rounded-xl transition flex items-center gap-1"
            >
              {isCompactView ? <ChevronDown className="w-4 h-4 text-[#B8860B]" /> : <ChevronUp className="w-4 h-4 text-[#B8860B]" />}
              {isCompactView ? 'Modo Plano Compacto' : 'Modo Desplegado'}
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#C5A059]" /> Nueva Mesa
            </button>
          </div>
        </div>

        {/* GLOBAL SEATING METRICS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card-luxury p-4 border border-[#C5A059]/30 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Invitados Autorizados</span>
            <strong className="text-xl font-serif font-bold text-slate-900 mt-0.5 block">{totalAuthorizedPasses} pases</strong>
          </div>

          <div className="card-luxury p-4 border border-emerald-300 bg-emerald-50/40 text-center">
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Asignados a Mesa</span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <strong className="text-xl font-serif font-bold text-emerald-700">{totalAssignedPasses} pases</strong>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full">
                {assignedPercentage}%
              </span>
            </div>
          </div>

          <div className="card-luxury p-4 border border-amber-300 bg-amber-50/40 text-center">
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Pendientes por Asignar</span>
            <strong className="text-xl font-serif font-bold text-amber-900 mt-0.5 block">{totalUnassignedPasses} pases</strong>
          </div>

          <div className="card-luxury p-4 border border-purple-300 bg-purple-50/40 text-center">
            <span className="text-[10px] text-purple-800 font-bold uppercase tracking-wider block">Aforo Total en Mesas</span>
            <strong className="text-xl font-serif font-bold text-purple-900 mt-0.5 block">
              {tables.length} Mesas ({totalTableCapacity} sillas)
            </strong>
          </div>
        </div>

        {/* Main Grid: Draggable Groups Drawer (Left) & 2D Canvas / Inspector (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* DRAGGABLE UNASSIGNED GROUPS DRAWER */}
          <div className="card-luxury p-5 border border-[#C5A059]/30 shadow-md space-y-3">
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
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {unassignedGroups.map((g) => (
                  <div
                    key={g.id}
                    draggable
                    onDragStart={(e) => handleDragStartGroup(e, g.id)}
                    className="p-3 bg-white hover:bg-amber-50/60 rounded-xl border border-slate-200 hover:border-[#C5A059] transition text-xs space-y-1.5 cursor-grab active:cursor-grabbing shadow-sm group hover-lift select-none"
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

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span>Tel: {g.responsible_phone || 'N/A'}</span>
                      <span className="text-[#B8860B] font-bold group-hover:underline">Arrastrar a Mesa →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SPATIAL 2D CANVAS OR GRID CARDS VIEW */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* SPATIAL 2D BLUEPRINT CANVAS */}
            {layoutMode !== 'GRID_CARDS' ? (
              <div className="space-y-3">
                {/* Zoom Controls & Editable Zone Headers Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-[#C5A059]/30 text-xs shadow-sm">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#B8860B]" />
                    Salón Amplio (1400px x 900px • Arrastre de ventana sin bloqueo)
                  </span>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCanvasZoom(z => Math.max(0.6, z - 0.1))} 
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 font-bold" 
                      title="Alejar Zoom"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="font-mono font-bold text-slate-700 text-xs">{Math.round(canvasZoom * 100)}%</span>
                    <button 
                      onClick={() => setCanvasZoom(z => Math.min(1.4, z + 0.1))} 
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 font-bold" 
                      title="Acercar Zoom"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setCanvasZoom(1)} 
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 font-bold" 
                      title="Restablecer (100%)"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* SCROLLABLE VIEWPORT CONTAINER FOR LARGE VENUES (20+ TABLES) */}
                <div className="card-luxury border-2 border-[#C5A059]/40 shadow-xl max-h-[640px] overflow-auto relative rounded-2xl bg-[#FAF8F5]">
                  
                  {/* INNER CANVAS WORLD (1400px x 900px) */}
                  <div 
                    ref={canvasWorldRef}
                    className="relative min-w-[1400px] min-h-[900px] p-6 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:24px_24px] select-none"
                    style={{
                      transform: `scale(${canvasZoom})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    {/* Central Feature Decorator based on Layout Mode */}
                    {layoutMode === 'SPATIAL_CIRCULAR' ? (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border-2 border-dashed border-[#C5A059]/40 bg-amber-50/30 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                        <div className="w-20 h-20 rounded-full bg-amber-100/80 border border-[#C5A059]/50 flex items-center justify-center text-3xl mb-1 shadow-inner">
                          💃🕺
                        </div>
                        <strong className="text-sm font-serif font-bold text-[#1A1A1A]">PISTA DE BAILE CENTRAL</strong>
                        <span className="text-xs text-slate-500">Disposición Circular Anillo</span>
                      </div>
                    ) : (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md h-40 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/20 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                        <span className="text-sm font-serif font-bold text-purple-900">
                          🎭 PISTA DE BAILE CENTRAL & ORQUESTA EN VIVO
                        </span>
                      </div>
                    )}

                    {/* EDITABLE ZONE HEADERS BAR */}
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest pb-3 border-b border-slate-200/80">
                      {/* Left Zone Header */}
                      <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#B8860B]" onClick={() => setEditingZoneHeader('left')}>
                        {editingZoneHeader === 'left' ? (
                          <input 
                            type="text" 
                            value={zoneLeftHeader} 
                            onChange={(e) => setZoneLeftHeader(e.target.value)}
                            onBlur={() => setEditingZoneHeader(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingZoneHeader(null)}
                            autoFocus
                            className="px-2 py-0.5 bg-white border border-[#C5A059] rounded text-xs text-slate-900 font-bold"
                          />
                        ) : (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-purple-600" /> {zoneLeftHeader} <Edit3 className="w-3 h-3 text-slate-400" />
                          </span>
                        )}
                      </div>

                      {/* Center Zone Header */}
                      <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#B8860B]" onClick={() => setEditingZoneHeader('center')}>
                        {editingZoneHeader === 'center' ? (
                          <input 
                            type="text" 
                            value={zoneCenterHeader} 
                            onChange={(e) => setZoneCenterHeader(e.target.value)}
                            onBlur={() => setEditingZoneHeader(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingZoneHeader(null)}
                            autoFocus
                            className="px-2 py-0.5 bg-white border border-[#C5A059] rounded text-xs text-slate-900 font-bold"
                          />
                        ) : (
                          <span className="text-[#B8860B] flex items-center gap-1 font-serif">
                            ★ {zoneCenterHeader} <Edit3 className="w-3 h-3 text-slate-400" />
                          </span>
                        )}
                      </div>

                      {/* Right Zone Header */}
                      <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#B8860B]" onClick={() => setEditingZoneHeader('right')}>
                        {editingZoneHeader === 'right' ? (
                          <input 
                            type="text" 
                            value={zoneRightHeader} 
                            onChange={(e) => setZoneRightHeader(e.target.value)}
                            onBlur={() => setEditingZoneHeader(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingZoneHeader(null)}
                            autoFocus
                            className="px-2 py-0.5 bg-white border border-[#C5A059] rounded text-xs text-slate-900 font-bold"
                          />
                        ) : (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-emerald-600" /> {zoneRightHeader} <Edit3 className="w-3 h-3 text-slate-400" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* RENDER COMPACT SLEEK TABLE BLUEPRINT NODES */}
                    {tables.map((tbl, index) => {
                      const stats = calculateTableOccupancy(eventId, tbl.id, tbl.capacity);
                      const assignedToTbl = assignments.filter(a => a.table_id === tbl.id);
                      const pos = tablePositions[tbl.id] || { 
                        x: tbl.pos_x || (140 + (index % 4) * 280), 
                        y: tbl.pos_y || (110 + Math.floor(index / 4) * 200),
                        shape: index === 4 ? 'VIP_HONOR' : 'ROUND',
                        zone: 'Centro'
                      };

                      const isHoveredDrop = dragOverTableId === tbl.id;
                      const isSelected = selectedTableId === tbl.id;

                      return (
                        <div
                          key={tbl.id}
                          data-table-node
                          onDragOver={(e) => handleDragOverTable(e, tbl.id)}
                          onDragLeave={handleDragLeaveTable}
                          onDrop={(e) => handleDropGroupOnTable(e, tbl.id)}
                          onClick={() => {
                            if (!activeDragRef.current?.hasMoved) {
                              setSelectedTableId(tbl.id);
                            }
                          }}
                          style={{
                            position: 'absolute',
                            left: `${pos.x}px`,
                            top: `${pos.y}px`,
                          }}
                          className={`transition-shadow duration-150 cursor-pointer shadow-md select-none ${
                            isCompactView ? 'w-48 p-3 rounded-2xl' : 'w-64 p-4 rounded-2xl'
                          } ${
                            isHoveredDrop
                              ? 'border-2 border-emerald-500 bg-emerald-50 scale-105 shadow-2xl ring-4 ring-emerald-200'
                              : isSelected
                              ? 'border-2 border-[#C5A059] bg-amber-50/90 ring-4 ring-amber-100 shadow-xl'
                              : stats.isOvercapacity
                              ? 'border-2 border-red-400 bg-red-50/90'
                              : pos.shape === 'VIP_HONOR'
                              ? 'border border-[#C5A059] bg-gradient-to-b from-white to-amber-50/90'
                              : 'border border-slate-300 bg-white hover:border-[#C5A059]'
                          }`}
                        >
                          {/* Table Drag Handle Header */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                            <div 
                              onPointerDown={(e) => handlePointerDownGrip(e, tbl.id)}
                              className="cursor-grab active:cursor-grabbing flex items-center gap-1.5 py-0.5 px-1 hover:bg-slate-100 rounded transition"
                              title="Mantén presionado y arrastra para mover la mesa"
                            >
                              <GripVertical className="w-4 h-4 text-slate-400 hover:text-[#B8860B]" />
                              {pos.shape === 'VIP_HONOR' ? (
                                <span className="text-xs font-serif font-bold text-[#B8860B] truncate max-w-[100px]">
                                  ★ {tbl.name}
                                </span>
                              ) : (
                                <strong className="text-xs font-serif font-bold text-slate-900 truncate max-w-[100px]">{tbl.name}</strong>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingTableObj(tbl); }}
                                className="text-slate-400 hover:text-[#B8860B] p-0.5 transition"
                                title="Editar nombre / capacidad"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteTable(tbl.id); }}
                                className="text-slate-400 hover:text-red-600 p-0.5 transition"
                                title="Eliminar mesa"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Compact Blueprint Capacity Badge */}
                          <div className="pt-2 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-500 font-semibold">Ocupación:</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                              stats.isOvercapacity ? 'bg-red-100 text-red-700 border border-red-300' :
                              stats.occupancyPercentage >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {stats.occupancyRatio}
                            </span>
                          </div>

                          {stats.isOvercapacity && (
                            <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 pt-1">
                              <ShieldAlert className="w-3 h-3" /> SOBRECUPO (+{stats.overflowCount})
                            </span>
                          )}

                          {/* Detailed Guest List (Only if Not Compact or Selected) */}
                          {(!isCompactView || isSelected) && (
                            <div className="space-y-1 pt-2 border-t border-slate-100 mt-2">
                              {assignedToTbl.length === 0 ? (
                                <div className="text-[10px] text-slate-400 italic text-center py-1">
                                  Soltar familia aquí (Drag & Drop)
                                </div>
                              ) : (
                                assignedToTbl.map((a) => {
                                  const g = groups.find(grp => grp.id === a.group_id);
                                  return (
                                    <div key={a.id} className="flex items-center justify-between p-1 bg-slate-50 rounded text-[10px]">
                                      <span className="font-semibold text-slate-800 truncate max-w-[100px]">{g?.group_name || 'Grupo'}</span>
                                      <div className="flex items-center gap-1">
                                        <span className="font-bold text-[#B8860B]">+{a.assigned_passes}</span>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleUnassign(a.group_id); }}
                                          className="text-slate-400 hover:text-red-600"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
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

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingTableObj(tbl)}
                            className="text-slate-400 hover:text-[#B8860B] p-1.5 rounded-lg hover:bg-amber-50 transition"
                            title="Editar mesa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTable(tbl.id)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                            title="Eliminar mesa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

            {/* QUICK TABLE INSPECTOR POPOVER / PANEL */}
            {selectedTableObj && (
              <div className="card-luxury p-5 border border-[#C5A059]/40 shadow-xl space-y-3 bg-white animate-fade-in-up">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] text-[#B8860B] uppercase font-bold tracking-widest block">Detalle de Mesa Seleccionada</span>
                    <h3 className="text-lg font-serif font-bold text-slate-900">{selectedTableObj.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingTableObj(selectedTableObj)} className="text-xs text-[#B8860B] font-bold hover:underline flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" /> Editar Mesa
                    </button>
                    <button onClick={() => setSelectedTableId(null)} className="text-slate-400 hover:text-slate-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">Familias e Invitados Asignados ({selectedTableAssignments.length}):</span>
                  {selectedTableAssignments.length === 0 ? (
                    <p className="text-slate-400 italic">Mesa sin familias asignadas. Arrastra una familia desde el panel izquierdo.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedTableAssignments.map(a => {
                        const g = groups.find(grp => grp.id === a.group_id);
                        return (
                          <div key={a.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <span className="font-bold text-slate-800">{g?.group_name || 'Grupo'}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[#B8860B]">{a.assigned_passes} pases</span>
                              <button onClick={() => handleUnassign(a.group_id)} className="text-slate-400 hover:text-red-600">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* EDIT EXISTING TABLE MODAL */}
      {editingTableObj && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border border-[#C5A059]/40 space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Editar Mesa de Gala</h3>

            <form onSubmit={handleSaveEditTable} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre o Número de Mesa
                </label>
                <input
                  type="text"
                  required
                  value={editingTableObj.name}
                  onChange={(e) => setEditingTableObj({ ...editingTableObj, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Capacidad Máxima de Personas (Sillas)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={editingTableObj.capacity}
                  onChange={(e) => setEditingTableObj({ ...editingTableObj, capacity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTableObj(null)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 gold-button font-bold rounded-xl shadow-md"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  Capacidad Máxima de Personas (Sillas)
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
