'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import EventNavHeader from '@/components/EventNavHeader';
import { useParams } from 'next/navigation';
import { 
  Grid, ArrowLeft, Plus, Users, AlertTriangle, CheckCircle2, 
  Trash2, Move, UserCheck, X, GripVertical, Disc, LayoutGrid, 
  Sparkles, Compass, MapPin, ShieldAlert, Award, ZoomIn, ZoomOut, Maximize2, Minimize2,
  ChevronDown, ChevronUp, Edit3, Save, RotateCcw, GlassWater, UtensilsCrossed, 
  Flower2, Columns, Waves, Trees, DoorOpen, Layers, Maximize, UserPlus, Printer, Download, FileText,
  FoldVertical, UnfoldVertical
} from 'lucide-react';
import { getEventById, getEventGuestGroups } from '@/lib/events';
import { 
  getEventTables, createTable, deleteTable, updateTable, getEventTableAssignments, 
  assignGroupToTable, unassignGroupFromTable, calculateTableOccupancy, updateTablePosition,
  getEventVenueElements, createVenueElement, updateVenueElement, updateVenueElementPosition, 
  deleteVenueElement, VenueElement, VenueElementType, ElementSize, computeElementDimensions 
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
  const [venueElements, setVenueElements] = useState<VenueElement[]>(() => getEventVenueElements(eventId));

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('SPATIAL_CIRCULAR');
  
  // Default Zoom set to 80% (0.8) as requested
  const [canvasZoom, setCanvasZoom] = useState<number>(0.8);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isCompactView, setIsCompactView] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // INDIVIDUAL & GLOBAL TABLE COLLAPSE STATE ON 2D CANVAS
  const [collapsedTableIds, setCollapsedTableIds] = useState<Set<string>>(new Set());
  const [allTablesCollapsed, setAllTablesCollapsed] = useState<boolean>(false);

  const toggleTableCollapse = (tableId: string) => {
    setCollapsedTableIds(prev => {
      const next = new Set(prev);
      if (next.has(tableId)) {
        next.delete(tableId);
      } else {
        next.add(tableId);
      }
      return next;
    });
  };

  const toggleAllTablesCollapse = () => {
    if (allTablesCollapsed) {
      setCollapsedTableIds(new Set());
      setAllTablesCollapsed(false);
    } else {
      setCollapsedTableIds(new Set(tables.map(t => t.id)));
      setAllTablesCollapsed(true);
    }
  };

  // Drag state for guest groups -> tables
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);

  // Table & Venue Element Positions initialized with proper headroom
  const [tablePositions, setTablePositions] = useState<Record<string, { x: number; y: number; shape: TableShape }>>(() => {
    const initialPos: Record<string, { x: number; y: number; shape: TableShape }> = {};
    const tbls = getEventTables(eventId);
    tbls.forEach((t, i) => {
      initialPos[t.id] = {
        x: t.pos_x || (140 + (i % 4) * 280),
        y: t.pos_y || (140 + Math.floor(i / 4) * 200),
        shape: i === 4 ? 'VIP_HONOR' : 'ROUND',
      };
    });
    return initialPos;
  });

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [editingTableObj, setEditingTableObj] = useState<Table | null>(null);
  const [editingVenueElementObj, setEditingVenueElementObj] = useState<VenueElement | null>(null);

  // New Table Modal Form
  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState(10);
  const [tableShape, setTableShape] = useState<TableShape>('ROUND');
  const [showAddTableModal, setShowAddTableModal] = useState(false);

  // New Venue Element Modal Form (With Size Selection)
  const [showAddElementModal, setShowAddElementModal] = useState(false);
  const [elementType, setElementType] = useState<VenueElementType>('MACETERO');
  const [elementLabel, setElementLabel] = useState('');
  const [elementSize, setElementSize] = useState<ElementSize>('medium');
  const [elementOrientation, setElementOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [elementShape, setElementShape] = useState<'rect' | 'round_rect' | 'circle' | 'oval'>('circle');

  const refreshData = () => {
    const updatedTables = getEventTables(eventId);
    setTables([...updatedTables]);
    setAssignments([...getEventTableAssignments(eventId)]);
    setVenueElements([...getEventVenueElements(eventId)]);

    const updatedPos: Record<string, { x: number; y: number; shape: TableShape }> = {};
    updatedTables.forEach((t, i) => {
      updatedPos[t.id] = tablePositions[t.id] || {
        x: t.pos_x || (140 + (i % 4) * 280),
        y: t.pos_y || (140 + Math.floor(i / 4) * 200),
        shape: 'ROUND',
      };
    });
    setTablePositions(updatedPos);
  };

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    const newTbl = createTable(eventId, currentWorkspaceId, tableName || 'Nueva Mesa', tableCapacity, 500, 250);
    setTablePositions(prev => ({
      ...prev,
      [newTbl.id]: { x: 500, y: 250, shape: tableShape }
    }));
    setTableName('');
    setShowAddTableModal(false);
    refreshData();
  };

  const handleCreateVenueElement = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultLabels: Record<VenueElementType, string> = {
      ESCENARIO: 'Escenario Principal',
      PISTA_BAILE: 'Pista de Baile Central',
      PISTA_ORQUESTA: 'PISTA DE BAILE CENTRAL & ORQUESTA EN VIVO',
      BAR: 'Barra de Coctelería',
      BUFFET: 'Mesa de Bocaditos / Buffet',
      PISCINA: 'Piscina / Espejo de Agua',
      JARDIN: 'Zona Verde / Jardín',
      MACETERO: 'Macetero Ornamental Gigante',
      COLUMNA: 'Columna / Estructura',
      ENTRADA: 'Entrada Principal / Photocall',
    };

    createVenueElement(
      eventId,
      currentWorkspaceId,
      elementType,
      elementLabel || defaultLabels[elementType],
      elementSize,
      elementOrientation,
      elementShape,
      480,
      350
    );

    setElementLabel('');
    setShowAddElementModal(false);
    refreshData();
  };

  const handleSaveEditTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTableObj) return;
    updateTable(eventId, editingTableObj.id, editingTableObj.name, editingTableObj.capacity);
    setEditingTableObj(null);
    refreshData();
  };

  const handleSaveEditVenueElement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVenueElementObj) return;
    updateVenueElement(eventId, editingVenueElementObj.id, {
      label: editingVenueElementObj.label,
      size: editingVenueElementObj.size || 'medium',
      orientation: editingVenueElementObj.orientation,
      shape: editingVenueElementObj.shape,
    });
    setEditingVenueElementObj(null);
    refreshData();
  };

  const handleDeleteTable = (tableId: string) => {
    if (confirm('¿Eliminar esta mesa y liberar sus asignaciones?')) {
      deleteTable(eventId, tableId);
      if (selectedTableId === tableId) setSelectedTableId(null);
      refreshData();
    }
  };

  const handleDeleteVenueElement = (elemId: string) => {
    if (confirm('¿Eliminar este elemento del salón?')) {
      deleteVenueElement(eventId, elemId);
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

  // FULLSCREEN TOGGLE
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullScreen(false);
    }
  };

  // HIGH-FIDELITY PNG IMAGE GENERATION (100% MATCHES WEB APP & INCLUDES FOOTER WATERMARK)
  const handleExportPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Background Parchment Texture
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Gold Woven Grid Dots
    ctx.fillStyle = 'rgba(197, 160, 89, 0.2)';
    for (let x = 0; x < canvas.width; x += 28) {
      for (let y = 0; y < canvas.height; y += 28) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // 2. Top Header Title & Metrics Banner
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(30, 20, 1340, 90, 16);
    ctx.fill();
    ctx.stroke();

    // Event Title
    ctx.fillStyle = '#1A1A1A';
    ctx.font = 'bold 22px serif';
    ctx.fillText(`${event?.name || 'Evento'} - Plano Oficial de Distribución del Salón`, 50, 56);

    // Metrics Subtitle
    ctx.fillStyle = '#B8860B';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`Capacidad: ${totalAuthorizedGuests} invitados autorizados  •  Ubicados: ${totalAssignedGuests} pers. en ${tables.length} mesas`, 50, 84);

    const yOffset = 120;

    // 3. Render Venue Architectural Elements
    venueElements.forEach((elem) => {
      const dims = computeElementDimensions(elem.size || 'medium', elem.shape, elem.orientation);
      const isCircle = elem.shape === 'circle' || elem.shape === 'oval';
      const posX = elem.pos_x;
      const posY = elem.pos_y + yOffset;

      ctx.save();
      ctx.fillStyle = '#FFFDF9';
      ctx.strokeStyle = '#DBBB6E';
      ctx.lineWidth = 2.5;

      if (isCircle) {
        ctx.beginPath();
        ctx.ellipse(posX + dims.width / 2, posY + dims.height / 2, dims.width / 2, dims.height / 2, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.roundRect(posX, posY, dims.width, dims.height, 16);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = '#1A1A1A';
      ctx.font = 'bold 11px serif';
      ctx.textAlign = 'center';

      const words = elem.label.split(' ');
      let line = '';
      let lines = [];
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > dims.width - 20 && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      let startY = posY + (dims.height / 2) - ((lines.length - 1) * 7);
      lines.forEach((l, i) => {
        ctx.fillText(l.trim(), posX + dims.width / 2, startY + (i * 14));
      });

      ctx.restore();
    });

    // 4. Render Table Cards
    tables.forEach((tbl) => {
      const pos = tablePositions[tbl.id] || { x: tbl.pos_x || 200, y: tbl.pos_y || 200 };
      const posX = pos.x;
      const posY = pos.y + yOffset;
      const occ = calculateTableOccupancy(eventId, tbl.id, tbl.capacity);
      const isCollapsed = collapsedTableIds.has(tbl.id);
      const cardHeight = isCollapsed ? 54 : 130;

      ctx.save();
      ctx.fillStyle = occ.isOvercapacity ? '#FEF2F2' : '#FFFFFF';
      ctx.strokeStyle = occ.isOvercapacity ? '#DC2626' : '#DBBB6E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(posX, posY, 210, cardHeight, 16);
      ctx.fill();
      ctx.stroke();

      // Grip Pill Badge
      ctx.fillStyle = '#DBBB6E';
      ctx.beginPath();
      ctx.roundRect(posX + 65, posY - 10, 80, 18, 9);
      ctx.fill();
      ctx.fillStyle = '#1A1A1A';
      ctx.font = 'extrabold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tbl.name.split(' ')[0] + ' ' + (tbl.name.split(' ')[1] || ''), posX + 105, posY + 2);

      // Table Title Name
      ctx.fillStyle = '#1A1A1A';
      ctx.font = 'bold 12px serif';
      ctx.textAlign = 'left';
      let truncatedName = tbl.name;
      if (ctx.measureText(truncatedName).width > 120) {
        truncatedName = tbl.name.slice(0, 14) + '...';
      }
      ctx.fillText(truncatedName, posX + 12, posY + 26);

      // Ratio Pill Badge
      ctx.fillStyle = occ.isOvercapacity ? '#DC2626' : '#DBBB6E';
      ctx.beginPath();
      ctx.roundRect(posX + 150, posY + 12, 48, 18, 9);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${occ.occupancyRatio}`, posX + 174, posY + 25);

      if (!isCollapsed) {
        // Divider Line
        ctx.strokeStyle = '#F1F5F9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(posX + 12, posY + 36);
        ctx.lineTo(posX + 198, posY + 36);
        ctx.stroke();

        // Guest Assignments List
        const tblAsgn = assignments.filter(a => a.table_id === tbl.id);
        let lineY = posY + 54;
        if (tblAsgn.length === 0) {
          ctx.fillStyle = '#94A3B8';
          ctx.font = 'italic 11px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Sin asignaciones', posX + 12, lineY);
        } else {
          tblAsgn.slice(0, 3).forEach((asgn) => {
            const grp = groups.find(g => g.id === asgn.group_id);
            ctx.fillStyle = '#334155';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'left';
            let grpName = grp?.group_name || 'Grupo';
            if (ctx.measureText(grpName).width > 130) {
              grpName = grpName.slice(0, 15) + '...';
            }
            ctx.fillText(`• ${grpName}`, posX + 12, lineY);
            
            ctx.fillStyle = '#B8860B';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${asgn.assigned_passes}p`, posX + 198, lineY);

            lineY += 18;
          });
        }

        // Sillas Capacity Footer
        ctx.fillStyle = '#64748B';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Cap: ${tbl.capacity} sillas`, posX + 12, posY + 118);
      }

      ctx.restore();
    });

    // 5. MANDATORY TRADEMARK FOOTER WATERMARK
    ctx.fillStyle = 'rgba(26, 26, 26, 0.85)';
    ctx.fillRect(0, canvas.height - 36, canvas.width, 36);

    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Generado oficialmente por Plataforma EventControl.pe  |  Desarrollado e Innovado por Tech Innova (tech.innova.reg@gmail.com)', canvas.width / 2, canvas.height - 14);

    // 6. Data URL Export & Link Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Plano_Distribucion_Salón_${event?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'EventControl'}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportModal(false);
  };

  const handleExportPDF = () => {
    window.print();
  };

  // CANVAS PANNING VIA EMPTY BACKGROUND DRAGGING / TOUCH-PAN
  const isPanningRef = useRef(false);
  const startPanPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleCanvasStartPan = (clientX: number, clientY: number) => {
    isPanningRef.current = true;
    startPanPointRef.current = {
      x: clientX - panOffset.x,
      y: clientY - panOffset.y,
    };
  };

  const handleCanvasMovePan = (clientX: number, clientY: number) => {
    if (!isPanningRef.current) return;
    setPanOffset({
      x: clientX - startPanPointRef.current.x,
      y: clientY - startPanPointRef.current.y,
    });
  };

  const handleCanvasEndPan = () => {
    isPanningRef.current = false;
  };

  // POINTER DRAGGING FOR TABLES & VENUE ELEMENTS (UNTRAPPABLE 60FPS)
  const canvasWorldRef = useRef<HTMLDivElement>(null);
  const activeDragRef = useRef<{
    id: string;
    type: 'table' | 'venue_element';
    nodeEl: HTMLElement;
    grabOffsetX: number;
    grabOffsetY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const handlePointerDownItemGrip = (e: React.PointerEvent, id: string, type: 'table' | 'venue_element', initialX: number, initialY: number) => {
    e.preventDefault();
    e.stopPropagation();

    const gripEl = e.currentTarget as HTMLElement;
    const nodeEl = gripEl.closest('[data-drag-node]') as HTMLElement;
    if (!nodeEl || !canvasWorldRef.current) return;

    const grabOffsetX = (e.clientX - nodeEl.getBoundingClientRect().left) / canvasZoom;
    const grabOffsetY = (e.clientY - nodeEl.getBoundingClientRect().top) / canvasZoom;

    activeDragRef.current = {
      id,
      type,
      nodeEl,
      grabOffsetX,
      grabOffsetY,
      currentX: initialX,
      currentY: initialY,
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
  };

  const handleGlobalPointerMove = (e: PointerEvent) => {
    if (!activeDragRef.current || !canvasWorldRef.current) return;
    e.preventDefault();

    const drag = activeDragRef.current;
    const canvasRect = canvasWorldRef.current.getBoundingClientRect();
    const mouseCanvasX = (e.clientX - canvasRect.left) / canvasZoom;
    const mouseCanvasY = (e.clientY - canvasRect.top) / canvasZoom;

    const newX = Math.round(Math.max(10, Math.min(1350, mouseCanvasX - drag.grabOffsetX)));
    const newY = Math.round(Math.max(10, Math.min(850, mouseCanvasY - drag.grabOffsetY)));

    drag.currentX = newX;
    drag.currentY = newY;

    drag.nodeEl.style.left = `${newX}px`;
    drag.nodeEl.style.top = `${newY}px`;
  };

  const handleGlobalPointerUp = (e: PointerEvent) => {
    window.removeEventListener('pointermove', handleGlobalPointerMove);
    window.removeEventListener('pointerup', handleGlobalPointerUp);
    window.removeEventListener('pointercancel', handleGlobalPointerUp);

    if (activeDragRef.current) {
      const { id, type, currentX, currentY } = activeDragRef.current;

      if (type === 'table') {
        updateTablePosition(eventId, id, currentX, currentY);
        setTablePositions(prev => ({
          ...prev,
          [id]: { ...(prev[id] || { shape: 'ROUND' }), x: currentX, y: currentY }
        }));
      } else {
        updateVenueElementPosition(eventId, id, currentX, currentY);
        setVenueElements(prev => prev.map(ve => ve.id === id ? { ...ve, pos_x: currentX, pos_y: currentY } : ve));
      }

      activeDragRef.current = null;
    }
  };

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

  // EXACT MATHEMATICAL SEATING METRICS FOR INVITADOS (PERSONAS) + PASES (GRUPOS)
  const totalAuthorizedGuests = groups.reduce((sum, g) => sum + (g.max_passes || 0), 0);
  const totalAuthorizedPassesCount = groups.length;

  const totalUnassignedGuests = unassignedGroups.reduce((sum, g) => sum + (g.max_passes || 0), 0);
  const totalUnassignedPassesCount = unassignedGroups.length;

  const totalAssignedGuests = Math.max(0, totalAuthorizedGuests - totalUnassignedGuests);
  const totalAssignedPassesCount = totalAuthorizedPassesCount - totalUnassignedPassesCount;

  const totalTableCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const assignedGuestsPercentage = totalAuthorizedGuests > 0 ? Math.min(100, Math.round((totalAssignedGuests / totalAuthorizedGuests) * 100)) : 0;

  const selectedTableObj = tables.find(t => t.id === selectedTableId);
  const selectedTableAssignments = assignments.filter(a => a.table_id === selectedTableId);

  // Helper icon renderer for Venue Elements
  const renderVenueElementIcon = (type: VenueElementType) => {
    switch (type) {
      case 'BAR': return <GlassWater className="w-5 h-5 text-amber-700" />;
      case 'BUFFET': return <UtensilsCrossed className="w-5 h-5 text-orange-700" />;
      case 'MACETERO': return <Flower2 className="w-5 h-5 text-emerald-700" />;
      case 'COLUMNA': return <Columns className="w-5 h-5 text-slate-700" />;
      case 'PISCINA': return <Waves className="w-5 h-5 text-blue-700" />;
      case 'JARDIN': return <Trees className="w-5 h-5 text-emerald-800" />;
      case 'ENTRADA': return <DoorOpen className="w-5 h-5 text-indigo-700" />;
      default: return <Sparkles className="w-5 h-5 text-[#B8860B]" />;
    }
  };

  const getVenueElementCardStyle = (type: VenueElementType) => {
    switch (type) {
      case 'BAR':
      case 'BUFFET':
      case 'ESCENARIO':
      case 'PISTA_ORQUESTA':
      case 'PISTA_BAILE':
        return 'bg-amber-50/90 text-slate-900 border-2 border-[#DBBB6E] shadow-md';
      case 'MACETERO':
      case 'JARDIN':
        return 'bg-emerald-50/90 text-slate-900 border-2 border-emerald-300 shadow-md';
      case 'PISCINA':
        return 'bg-blue-50/90 text-slate-900 border-2 border-blue-300 shadow-md';
      case 'COLUMNA':
      case 'ENTRADA':
        return 'bg-slate-50/90 text-slate-900 border-2 border-slate-300 shadow-md';
      default:
        return 'bg-amber-50/90 text-slate-900 border-2 border-[#DBBB6E] shadow-md';
    }
  };

  /* FULLSCREEN MODE: FIXED NON-OVERLAPPING HEADER BAR + 100% CANVAS VIEWPORT */
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF8F5] flex flex-col justify-between overflow-hidden select-none">
        
        {/* FIXED TOP HEADER BAR IN FULLSCREEN MODE */}
        <div className="h-16 bg-white border-b border-[#C5A059]/40 px-4 sm:px-6 flex items-center justify-between z-40 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-serif font-bold text-[#1A1A1A] hidden md:inline">
              {event?.name || 'Evento'} - Plano Virtual en Pantalla Completa
            </span>
            
            {/* Zoom & Centrar Plano */}
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl p-1">
              <button
                onClick={() => setCanvasZoom(z => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 transition"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-bold px-2 text-[#B8860B]">
                {Math.round(canvasZoom * 100)}%
              </span>
              <button
                onClick={() => setCanvasZoom(z => Math.min(1.5, Number((z + 0.1).toFixed(1))))}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 transition"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setCanvasZoom(0.8); setPanOffset({ x: 0, y: 0 }); }}
                className="p-1.5 hover:bg-amber-100 rounded-lg text-[#B8860B] transition border-l border-slate-200 flex items-center gap-1 px-2 text-xs font-bold"
                title="Centrar Plano (80%)"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Centrar Plano
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* GLOBAL TOGGLE ALL TABLES MINIMIZE / EXPAND IN FULLSCREEN */}
            <button
              onClick={toggleAllTablesCollapse}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-[#C5A059]/40 font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              {allTablesCollapsed ? <UnfoldVertical className="w-4 h-4 text-[#B8860B]" /> : <FoldVertical className="w-4 h-4 text-[#B8860B]" />}
              {allTablesCollapsed ? 'Desplegar Todas las Mesas' : 'Minimizar Todas las Mesas'}
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-[#B8860B]" /> Exportar Plano
            </button>

            <button
              onClick={toggleFullScreen}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 border border-slate-700"
            >
              <Minimize2 className="w-4 h-4 text-[#C5A059]" /> Salir de Pantalla Completa
            </button>
          </div>
        </div>

        {/* 100% CANVAS VIEWPORT IN FULLSCREEN MODE */}
        <div
          className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing w-full h-[calc(100vh-64px)]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).getAttribute('data-canvas-bg') === 'true') {
              handleCanvasStartPan(e.clientX, e.clientY);
            }
          }}
          onMouseMove={(e) => handleCanvasMovePan(e.clientX, e.clientY)}
          onMouseUp={handleCanvasEndPan}
          onTouchStart={(e) => {
            if (e.touches.length === 1) handleCanvasStartPan(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 1) handleCanvasMovePan(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={handleCanvasEndPan}
          data-canvas-bg="true"
        >
          <div
            ref={canvasWorldRef}
            className="absolute inset-0 w-[1400px] h-[900px] transition-transform duration-75 origin-top-left"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${canvasZoom})`,
            }}
            data-canvas-bg="true"
          >
            <div 
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: 'radial-gradient(#C5A059 1px, transparent 1px), linear-gradient(90deg, rgba(197,160,89,0.12) 1px, transparent 1px)',
                backgroundSize: '28px 28px, 28px 28px',
              }}
              data-canvas-bg="true"
            ></div>

            {/* RENDER VENUE ARCHITECTURAL ELEMENTS */}
            {venueElements.map((elem) => {
              const isCircle = elem.shape === 'circle' || elem.shape === 'oval';
              const shapeRadius = isCircle ? 'rounded-full' : elem.shape === 'round_rect' ? 'rounded-2xl' : 'rounded-none';
              const cardBgStyle = getVenueElementCardStyle(elem.type);

              const dims = computeElementDimensions(elem.size || 'medium', elem.shape, elem.orientation);

              return (
                <div
                  key={elem.id}
                  data-drag-node="true"
                  className={`absolute z-10 p-2 text-center cursor-move transition-shadow ${shapeRadius} ${cardBgStyle} group flex flex-col items-center justify-center`}
                  style={{
                    left: `${elem.pos_x}px`,
                    top: `${elem.pos_y}px`,
                    width: `${dims.width}px`,
                    height: `${dims.height}px`,
                  }}
                  onDoubleClick={() => setEditingVenueElementObj(elem)}
                >
                  <div
                    onPointerDown={(e) => handlePointerDownItemGrip(e, elem.id, 'venue_element', elem.pos_x, elem.pos_y)}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#DBBB6E] text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shadow-md cursor-grab active:cursor-grabbing flex items-center gap-1 z-20"
                  >
                    <GripVertical className="w-3 h-3" /> Mover
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingVenueElementObj(elem); }}
                    className="absolute top-1.5 right-1.5 p-1 bg-white hover:bg-amber-100 text-[#B8860B] rounded-full border border-[#DBBB6E] shadow-sm transition group-hover:scale-110 z-20"
                    title="Editar Título o Opción"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>

                  <div className="flex flex-col items-center justify-center gap-0.5 px-2 max-w-full">
                    {renderVenueElementIcon(elem.type)}
                    <span className="text-[11px] font-serif font-bold text-slate-900 leading-tight text-center max-w-full break-words line-clamp-3">
                      {elem.label}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* RENDER EVENT TABLES NODES (WITH INDIVIDUAL COLLAPSE BUTTON) */}
            {tables.map((tbl) => {
              const occ = calculateTableOccupancy(eventId, tbl.id, tbl.capacity);
              const isOver = occ.isOvercapacity;
              const isSelected = selectedTableId === tbl.id;
              const isDragOver = dragOverTableId === tbl.id;
              const pos = tablePositions[tbl.id] || { x: tbl.pos_x || 200, y: tbl.pos_y || 200, shape: 'ROUND' };
              const isCollapsed = collapsedTableIds.has(tbl.id);

              return (
                <div
                  key={tbl.id}
                  data-table-node="true"
                  data-drag-node="true"
                  className={`absolute z-20 transition-shadow ${
                    isSelected ? 'ring-4 ring-[#DBBB6E] ring-offset-2 scale-105' : ''
                  } ${isDragOver ? 'ring-4 ring-emerald-500 scale-110' : ''}`}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                  }}
                  onDragOver={(e) => handleDragOverTable(e, tbl.id)}
                  onDragLeave={handleDragLeaveTable}
                  onDrop={(e) => handleDropGroupOnTable(e, tbl.id)}
                  onClick={() => setSelectedTableId(tbl.id)}
                >
                  <div
                    onPointerDown={(e) => handlePointerDownItemGrip(e, tbl.id, 'table', pos.x, pos.y)}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#DBBB6E] text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-md cursor-grab active:cursor-grabbing flex items-center gap-1 z-30"
                  >
                    <GripVertical className="w-3 h-3" /> {tbl.name.split(' ')[0]} {tbl.name.split(' ')[1] || ''}
                  </div>

                  <div className={`p-3 min-w-[200px] border-2 shadow-xl rounded-2xl transition flex flex-col justify-between ${
                    isOver ? 'bg-red-50 border-red-500 text-red-950' : 'bg-white text-slate-900 border-[#DBBB6E]/70'
                  }`}>
                    
                    {/* TABLE HEADER WITH COLLAPSE TOGGLE */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleTableCollapse(tbl.id); }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-[#B8860B] transition"
                          title={isCollapsed ? "Expandir Mesa" : "Minimizar Mesa"}
                        >
                          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-[#B8860B]" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        </button>
                        <strong className="text-xs font-serif font-bold text-slate-900 truncate max-w-[120px]">
                          {tbl.name}
                        </strong>
                      </div>
                      <span 
                        style={{ backgroundColor: isOver ? '#dc2626' : '#DBBB6E' }}
                        className="px-2 py-0.5 text-white font-extrabold text-[10px] rounded-full shadow-sm shrink-0"
                      >
                        {occ.occupancyRatio}
                      </span>
                    </div>

                    {/* EXPANDED TABLE CONTENT */}
                    {!isCollapsed && (
                      <>
                        <div className="py-2 space-y-1 min-h-[45px]">
                          {assignments.filter(a => a.table_id === tbl.id).length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic block text-center pt-2">
                              Arrastra pases aquí
                            </span>
                          ) : (
                            assignments.filter(a => a.table_id === tbl.id).map(asgn => {
                              const grp = groups.find(g => g.id === asgn.group_id);
                              return (
                                <div key={asgn.id} className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                  <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                                    {grp?.group_name || 'Grupo'}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold text-[#B8860B]">{asgn.assigned_passes}p</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleUnassign(asgn.group_id); }}
                                      className="text-slate-400 hover:text-red-600 transition"
                                      title="Desasignar"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-semibold">Cap: {tbl.capacity} sillas</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingTableObj(tbl); }}
                            className="text-[#B8860B] hover:underline font-bold"
                          >
                            Editar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* NORMAL DASHBOARD PAGE LAYOUT */
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059] selection:text-white select-none">
      <EventNavHeader currentTab="tables" eventId={eventId} eventName={event?.name} />

      {/* Main Container */}
      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 w-full">
        
        {/* Page Title Bar */}
        <div className="card-luxury p-5 border border-[#C5A059]/30 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest block">
                Organización Espacial e Interactiva 2D
              </span>
              <span className="text-[11px] font-serif font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-[#C5A059]/40 shadow-2xs">
                🍷 Evento: {event?.name}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-0.5">Plano Virtual del Salón & Elementos</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestión centralizada de mesas, ambientación y exportación oficial de guías para el personal.
            </p>
          </div>
        </div>

        {/* INFORMATIVE SUMMARY CARDS PANEL */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card-luxury p-4 border border-[#C5A059]/30 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Invitados Autorizados</span>
            <strong className="text-xl font-serif font-bold text-slate-900 mt-0.5 block">{totalAuthorizedGuests} personas</strong>
            <span className="text-[10px] text-slate-500 font-medium">En {totalAuthorizedPassesCount} pases / grupos</span>
          </div>

          <div className="card-luxury p-4 border border-emerald-200 bg-emerald-50/50 text-center">
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Asignados a Mesa</span>
            <strong className="text-xl font-serif font-bold text-emerald-800 mt-0.5 block">
              {totalAssignedGuests} personas ({assignedGuestsPercentage}%)
            </strong>
            <span className="text-[10px] text-emerald-700 font-medium">En {totalAssignedPassesCount} pases ubicados</span>
          </div>

          <div className="card-luxury p-4 border border-amber-200 bg-amber-50/50 text-center">
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Invitados Sin Asignar</span>
            <strong className="text-xl font-serif font-bold text-amber-800 mt-0.5 block">{totalUnassignedGuests} personas</strong>
            <span className="text-[10px] text-amber-700 font-medium">{totalUnassignedPassesCount} pases pendientes</span>
          </div>

          <div className="card-luxury p-4 border border-purple-200 bg-purple-50/50 text-center">
            <span className="text-[10px] text-purple-900 font-bold uppercase tracking-wider block">Capacidad Total Mesas</span>
            <strong className="text-xl font-serif font-bold text-purple-900 mt-0.5 block">{totalTableCapacity} sillas</strong>
            <span className="text-[10px] text-purple-800 font-medium">{tables.length} mesas en salón</span>
          </div>
        </div>

        {/* UNIFIED 1-ROW FLOATING MANAGEMENT TOOLBAR */}
        <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-2xl border border-[#C5A059]/40 shadow-sm overflow-x-auto whitespace-nowrap">
          {/* Zoom & Centrar Plano */}
          <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setCanvasZoom(z => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
              className="p-1 hover:bg-slate-200 rounded-lg text-slate-700 transition"
              title="Alejar Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-2 text-[#B8860B]">
              {Math.round(canvasZoom * 100)}%
            </span>
            <button
              onClick={() => setCanvasZoom(z => Math.min(1.5, Number((z + 0.1).toFixed(1))))}
              className="p-1 hover:bg-slate-200 rounded-lg text-slate-700 transition"
              title="Acercar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setCanvasZoom(0.8); setPanOffset({ x: 0, y: 0 }); }}
              className="p-1 hover:bg-amber-100 rounded-lg text-[#B8860B] transition border-l border-slate-200 flex items-center gap-1 px-2 text-[11px] font-bold"
              title="Centrar Plano (80%)"
            >
              <RotateCcw className="w-3 h-3" /> Centrar Plano
            </button>
          </div>

          {/* Action Buttons Row with Global Minimize / Expand All Tables Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleAllTablesCollapse}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-[#C5A059]/40 font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-sm"
              title={allTablesCollapsed ? "Desplegar el detalle de todas las mesas" : "Minimizar todas las mesas para ver solo títulos"}
            >
              {allTablesCollapsed ? <UnfoldVertical className="w-3.5 h-3.5 text-[#B8860B]" /> : <FoldVertical className="w-3.5 h-3.5 text-[#B8860B]" />}
              {allTablesCollapsed ? 'Desplegar Todas las Mesas' : 'Minimizar Todas las Mesas'}
            </button>

            <button
              onClick={() => setIsCompactView(!isCompactView)}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-sm"
            >
              {isCompactView ? <ChevronDown className="w-3.5 h-3.5 text-[#B8860B]" /> : <ChevronUp className="w-3.5 h-3.5 text-[#B8860B]" />}
              {isCompactView ? 'Ver Mesas Desplegadas' : 'Modo Plano Compacto'}
            </button>

            <button
              onClick={toggleFullScreen}
              className="px-3 py-2 bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#C5A059]" /> Pantalla Completa
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-[#B8860B]" /> Exportar Plano
            </button>

            <button
              onClick={() => setShowAddTableModal(true)}
              style={{ backgroundColor: '#DBBB6E' }}
              className="px-3.5 py-2 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 hover:brightness-110"
            >
              <Plus className="w-3.5 h-3.5 text-white" /> Nueva Mesa
            </button>

            <button
              onClick={() => setShowAddElementModal(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-[#C5A059]" /> + Elemento Salón
            </button>
          </div>
        </div>

        {/* 2D CANVAS INTERACTIVE FLOOR PLAN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          
          {/* LEFT SIDEBAR: UNASSIGNED GUEST PASSES */}
          <div className="card-luxury p-4 border border-[#C5A059]/30 space-y-3 lg:col-span-1 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#B8860B]" /> Pases Sin Mesa ({unassignedGroups.length})
              </h3>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {totalUnassignedGuests} pers.
              </span>
            </div>

            {unassignedGroups.length === 0 ? (
              <div className="p-4 text-center bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <strong>¡Todos Asignados!</strong> Todos los invitados tienen mesa reservada.
              </div>
            ) : (
              <div className="space-y-2">
                {unassignedGroups.map(grp => (
                  <div
                    key={grp.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', grp.id);
                      setDraggedGroupId(grp.id);
                    }}
                    className="p-3 bg-white hover:bg-amber-50/60 rounded-xl border border-slate-200 hover:border-[#C5A059] shadow-sm transition cursor-grab active:cursor-grabbing flex items-center justify-between group"
                  >
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block group-hover:text-[#B8860B] transition">
                        {grp.group_name}
                      </strong>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {grp.id}</span>
                    </div>
                    <span 
                      style={{ backgroundColor: '#DBBB6E' }}
                      className="px-2.5 py-1 text-white font-extrabold text-xs rounded-lg shadow-sm"
                    >
                      {grp.max_passes} p.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MAIN 2D INTERACTIVE CANVAS VIEWPORT */}
          <div className="lg:col-span-3 card-luxury p-3 border-2 border-[#C5A059]/40 shadow-xl relative overflow-hidden bg-[#FAF8F5]">
            
            {/* CANVAS INTERACTIVE PANNING WRAPPER */}
            <div
              className="w-full h-[650px] relative overflow-hidden cursor-grab active:cursor-grabbing rounded-lg"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).getAttribute('data-canvas-bg') === 'true') {
                  handleCanvasStartPan(e.clientX, e.clientY);
                }
              }}
              onMouseMove={(e) => handleCanvasMovePan(e.clientX, e.clientY)}
              onMouseUp={handleCanvasEndPan}
              onMouseLeave={handleCanvasEndPan}
              onTouchStart={(e) => {
                if (e.touches.length === 1) handleCanvasStartPan(e.touches[0].clientX, e.touches[0].clientY);
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 1) handleCanvasMovePan(e.touches[0].clientX, e.touches[0].clientY);
              }}
              onTouchEnd={handleCanvasEndPan}
              data-canvas-bg="true"
            >
              {/* TRANSFORM SCALED WORLD */}
              <div
                ref={canvasWorldRef}
                className="absolute inset-0 w-[1400px] h-[900px] transition-transform duration-75 origin-top-left"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${canvasZoom})`,
                }}
                data-canvas-bg="true"
              >
                {/* Woven Paper Texture Grid */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    backgroundImage: 'radial-gradient(#C5A059 1px, transparent 1px), linear-gradient(90deg, rgba(197,160,89,0.12) 1px, transparent 1px)',
                    backgroundSize: '28px 28px, 28px 28px',
                  }}
                  data-canvas-bg="true"
                ></div>

                {/* RENDER VENUE ARCHITECTURAL ELEMENTS */}
                {venueElements.map((elem) => {
                  const isCircle = elem.shape === 'circle' || elem.shape === 'oval';
                  const shapeRadius = isCircle ? 'rounded-full' : elem.shape === 'round_rect' ? 'rounded-2xl' : 'rounded-none';
                  const cardBgStyle = getVenueElementCardStyle(elem.type);

                  const dims = computeElementDimensions(elem.size || 'medium', elem.shape, elem.orientation);

                  return (
                    <div
                      key={elem.id}
                      data-drag-node="true"
                      className={`absolute z-10 p-2 text-center cursor-move transition-shadow ${shapeRadius} ${cardBgStyle} group flex flex-col items-center justify-center`}
                      style={{
                        left: `${elem.pos_x}px`,
                        top: `${elem.pos_y}px`,
                        width: `${dims.width}px`,
                        height: `${dims.height}px`,
                      }}
                      onDoubleClick={() => setEditingVenueElementObj(elem)}
                    >
                      <div
                        onPointerDown={(e) => handlePointerDownItemGrip(e, elem.id, 'venue_element', elem.pos_x, elem.pos_y)}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#DBBB6E] text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shadow-md cursor-grab active:cursor-grabbing flex items-center gap-1 z-20"
                      >
                        <GripVertical className="w-3 h-3" /> Mover
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingVenueElementObj(elem); }}
                        className="absolute top-1.5 right-1.5 p-1 bg-white hover:bg-amber-100 text-[#B8860B] rounded-full border border-[#DBBB6E] shadow-sm transition group-hover:scale-110 z-20"
                        title="Editar Título o Opción"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>

                      <div className="flex flex-col items-center justify-center gap-0.5 px-2 max-w-full">
                        {renderVenueElementIcon(elem.type)}
                        <span className="text-[11px] font-serif font-bold text-slate-900 leading-tight text-center max-w-full break-words line-clamp-3">
                          {elem.label}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* RENDER EVENT TABLES NODES (WITH INDIVIDUAL COLLAPSE BUTTON) */}
                {tables.map((tbl) => {
                  const occ = calculateTableOccupancy(eventId, tbl.id, tbl.capacity);
                  const isOver = occ.isOvercapacity;
                  const isSelected = selectedTableId === tbl.id;
                  const isDragOver = dragOverTableId === tbl.id;
                  const pos = tablePositions[tbl.id] || { x: tbl.pos_x || 200, y: tbl.pos_y || 200, shape: 'ROUND' };
                  const isCollapsed = collapsedTableIds.has(tbl.id);

                  return (
                    <div
                      key={tbl.id}
                      data-table-node="true"
                      data-drag-node="true"
                      className={`absolute z-20 transition-shadow ${
                        isSelected ? 'ring-4 ring-[#DBBB6E] ring-offset-2 scale-105' : ''
                      } ${isDragOver ? 'ring-4 ring-emerald-500 scale-110' : ''}`}
                      style={{
                        left: `${pos.x}px`,
                        top: `${pos.y}px`,
                      }}
                      onDragOver={(e) => handleDragOverTable(e, tbl.id)}
                      onDragLeave={handleDragLeaveTable}
                      onDrop={(e) => handleDropGroupOnTable(e, tbl.id)}
                      onClick={() => setSelectedTableId(tbl.id)}
                    >
                      <div
                        onPointerDown={(e) => handlePointerDownItemGrip(e, tbl.id, 'table', pos.x, pos.y)}
                        className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#DBBB6E] text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-md cursor-grab active:cursor-grabbing flex items-center gap-1 z-30"
                      >
                        <GripVertical className="w-3 h-3" /> {tbl.name.split(' ')[0]} {tbl.name.split(' ')[1] || ''}
                      </div>

                      <div className={`p-3 min-w-[200px] border-2 shadow-xl rounded-2xl transition flex flex-col justify-between ${
                        isOver ? 'bg-red-50 border-red-500 text-red-950' : 'bg-white text-slate-900 border-[#DBBB6E]/70'
                      }`}>
                        
                        {/* TABLE HEADER WITH COLLAPSE TOGGLE */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleTableCollapse(tbl.id); }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-[#B8860B] transition"
                              title={isCollapsed ? "Expandir Mesa" : "Minimizar Mesa"}
                            >
                              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-[#B8860B]" /> : <ChevronUp className="w-3.5 h-3.5" />}
                            </button>
                            <strong className="text-xs font-serif font-bold text-slate-900 truncate max-w-[120px]">
                              {tbl.name}
                            </strong>
                          </div>
                          <span 
                            style={{ backgroundColor: isOver ? '#dc2626' : '#DBBB6E' }}
                            className="px-2 py-0.5 text-white font-extrabold text-[10px] rounded-full shadow-sm shrink-0"
                          >
                            {occ.occupancyRatio}
                          </span>
                        </div>

                        {/* EXPANDED TABLE CONTENT */}
                        {!isCollapsed && (
                          <>
                            <div className="py-2 space-y-1 min-h-[45px]">
                              {assignments.filter(a => a.table_id === tbl.id).length === 0 ? (
                                <span className="text-[11px] text-slate-400 italic block text-center pt-2">
                                  Arrastra pases aquí
                                </span>
                              ) : (
                                assignments.filter(a => a.table_id === tbl.id).map(asgn => {
                                  const grp = groups.find(g => g.id === asgn.group_id);
                                  return (
                                    <div key={asgn.id} className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                      <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                                        {grp?.group_name || 'Grupo'}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <span className="font-bold text-[#B8860B]">{asgn.assigned_passes}p</span>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleUnassign(asgn.group_id); }}
                                          className="text-slate-400 hover:text-red-600 transition"
                                          title="Desasignar"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 font-semibold">Cap: {tbl.capacity} sillas</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingTableObj(tbl); }}
                                className="text-[#B8860B] hover:underline font-bold"
                              >
                                Editar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          </div>
        </div>

        {/* DETALLE GENERAL DE MESAS INSTALADAS (MODO DESPLEGADO) */}
        {!isCompactView && (
          <div className="space-y-4 pt-4 border-t border-[#C5A059]/30 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-[#B8860B]" /> Detalle General de Mesas Instaladas ({tables.length})
                </h3>
                <p className="text-xs text-slate-500">Vista desplegada con desglose de grupos e invitados asignados por cada mesa.</p>
              </div>

              <button
                onClick={() => setShowAddTableModal(true)}
                style={{ backgroundColor: '#DBBB6E' }}
                className="px-3.5 py-2 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 hover:brightness-110"
              >
                <Plus className="w-4 h-4 text-white" /> Agregar Mesa
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map(tbl => {
                const occ = calculateTableOccupancy(eventId, tbl.id, tbl.capacity);
                const tblAssignments = assignments.filter(a => a.table_id === tbl.id);

                return (
                  <div key={tbl.id} className="card-luxury p-5 border border-[#C5A059]/40 shadow-md space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <strong className="text-sm font-serif font-bold text-slate-900">{tbl.name}</strong>
                        <span 
                          style={{ backgroundColor: occ.isOvercapacity ? '#dc2626' : '#DBBB6E' }}
                          className="px-2.5 py-1 text-white font-extrabold text-xs rounded-lg shadow-sm"
                        >
                          {occ.occupancyRatio}
                        </span>
                      </div>

                      <div className="py-3 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Grupos e Invitados Asignados:</span>
                        {tblAssignments.length === 0 ? (
                          <span className="text-xs text-slate-400 italic block py-2 text-center bg-slate-50 rounded-xl">Sin asignaciones aún</span>
                        ) : (
                          tblAssignments.map(asgn => {
                            const grp = groups.find(g => g.id === asgn.group_id);
                            return (
                              <div key={asgn.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
                                <span className="font-semibold text-slate-800">{grp?.group_name || 'Grupo'}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#B8860B]">{asgn.assigned_passes} pases</span>
                                  <button
                                    onClick={() => handleUnassign(asgn.group_id)}
                                    className="text-slate-400 hover:text-red-600 transition"
                                    title="Quitar de mesa"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Capacidad: {tbl.capacity} sillas</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingTableObj(tbl)}
                          className="text-[#B8860B] hover:underline font-bold"
                        >
                          Editar Mesa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* EXPORT FLOOR PLAN MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in-up">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border-2 border-[#DBBB6E] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#B8860B]" /> Exportar Plano de Distribución
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Exporta la disposición final de las mesas y elementos del salón en formato PDF o descárgalo como imagen PNG lista para enviar o imprimir.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleExportPDF}
                style={{ backgroundColor: '#DBBB6E' }}
                className="w-full py-3.5 px-4 text-white font-extrabold text-xs rounded-xl shadow-md transition hover:brightness-110 flex items-center justify-center gap-2.5"
              >
                <Printer className="w-4 h-4 text-white" /> Imprimir / Guardar como PDF Oficial
              </button>

              <button
                onClick={handleExportPNG}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2.5"
              >
                <Download className="w-4 h-4 text-[#C5A059]" /> Descargar Imagen PNG (Fidelidad 100% Web)
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium space-y-1">
              <div>💡 <strong>Fidelidad & Marca Oficial:</strong> El archivo PNG y PDF incluirán el encabezado oficial, datos de invitados y el pie de página indicando la plataforma <strong>EventControl.pe</strong> y desarrollador <strong>Tech Innova</strong>.</div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW TABLE MODAL */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border border-[#C5A059]/40 space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Agregar Nueva Mesa al Salón</h3>

            <form onSubmit={handleCreateTable} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre de la Mesa</label>
                <input
                  type="text"
                  required
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Ej. Mesa 6 (Familia Amigos)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Capacidad Sillas</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#DBBB6E' }}
                  className="w-1/2 py-2.5 text-white font-bold rounded-xl shadow-md hover:brightness-110"
                >
                  Crear Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD VENUE ARCHITECTURAL ELEMENT MODAL WITH SIZE SELECTION */}
      {showAddElementModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border-2 border-[#DBBB6E] space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Agregar Elemento del Salón</h3>
            <p className="text-xs text-slate-500">Selecciona el tipo, tamaño y forma del elemento del menú desplegable.</p>

            <form onSubmit={handleCreateVenueElement} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo de Elemento del Salón
                </label>
                <select
                  value={elementType}
                  onChange={(e) => setElementType(e.target.value as VenueElementType)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                >
                  <option value="MACETERO">🌸 Maceteros / Jardineras de Gran Tamaño</option>
                  <option value="BAR">🍸 Bar / Barra de Coctelería</option>
                  <option value="BUFFET">🍰 Mesa de Bocaditos / Buffet</option>
                  <option value="ESCENARIO">🎭 Escenario / Tarima Principal</option>
                  <option value="PISTA_ORQUESTA">🎺 PISTA DE BAILE CENTRAL & ORQUESTA EN VIVO</option>
                  <option value="PISTA_BAILE">💃 PISTA DE BAILE CENTRAL</option>
                  <option value="PISCINA">🏊 Piscina / Espejo de Agua</option>
                  <option value="JARDIN">🌿 Jardín / Zona Verde</option>
                  <option value="COLUMNA">🏛️ Columna / Pilar Estructural</option>
                  <option value="ENTRADA">🚪 Entrada Principal / Photocall</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título / Etiqueta Personalizada
                </label>
                <input
                  type="text"
                  value={elementLabel}
                  onChange={(e) => setElementLabel(e.target.value)}
                  placeholder="Ej. Barra de Coctelería VIP"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tamaño del Elemento
                </label>
                <select
                  value={elementSize}
                  onChange={(e) => setElementSize(e.target.value as ElementSize)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                >
                  <option value="small">Pequeño (Compacto)</option>
                  <option value="medium">Mediano (Estándar)</option>
                  <option value="large">Grande (Gran Tamaño / Destacado)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Orientación
                  </label>
                  <select
                    value={elementOrientation}
                    onChange={(e) => setElementOrientation(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  >
                    <option value="horizontal">Horizontal ▬</option>
                    <option value="vertical">Vertical ▮</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Forma Geométrica
                  </label>
                  <select
                    value={elementShape}
                    onChange={(e) => setElementShape(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  >
                    <option value="round_rect">Rectángulo Curvo</option>
                    <option value="rect">Rectángulo Recto</option>
                    <option value="circle">Circular / Redondo</option>
                    <option value="oval">Ovalado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddElementModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#DBBB6E' }}
                  className="w-1/2 py-2.5 text-white font-bold rounded-xl shadow-md hover:brightness-110"
                >
                  Agregar al Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VENUE ELEMENT MODAL WITH SIZE SELECTION */}
      {editingVenueElementObj && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border-2 border-[#DBBB6E] space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Editar Elemento del Salón</h3>

            <form onSubmit={handleSaveEditVenueElement} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título del Elemento
                </label>
                <input
                  type="text"
                  required
                  value={editingVenueElementObj.label}
                  onChange={(e) => setEditingVenueElementObj({ ...editingVenueElementObj, label: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tamaño del Elemento
                </label>
                <select
                  value={editingVenueElementObj.size || 'medium'}
                  onChange={(e) => setEditingVenueElementObj({ ...editingVenueElementObj, size: e.target.value as ElementSize })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                >
                  <option value="small">Pequeño (Compacto)</option>
                  <option value="medium">Mediano (Estándar)</option>
                  <option value="large">Grande (Gran Tamaño / Destacado)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Orientación
                  </label>
                  <select
                    value={editingVenueElementObj.orientation}
                    onChange={(e) => setEditingVenueElementObj({ ...editingVenueElementObj, orientation: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  >
                    <option value="horizontal">Horizontal ▬</option>
                    <option value="vertical">Vertical ▮</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Forma Geométrica
                  </label>
                  <select
                    value={editingVenueElementObj.shape}
                    onChange={(e) => setEditingVenueElementObj({ ...editingVenueElementObj, shape: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  >
                    <option value="round_rect">Rectángulo Curvo</option>
                    <option value="rect">Rectángulo Recto</option>
                    <option value="circle">Circular</option>
                    <option value="oval">Ovalado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteVenueElement(editingVenueElementObj.id)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 transition"
                >
                  Eliminar Elemento
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingVenueElementObj(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: '#DBBB6E' }}
                    className="px-4 py-2 text-white font-bold rounded-xl shadow-md hover:brightness-110"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TABLE MODAL */}
      {editingTableObj && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border border-[#C5A059]/40 space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Editar Mesa</h3>

            <form onSubmit={handleSaveEditTable} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre de la Mesa</label>
                <input
                  type="text"
                  required
                  value={editingTableObj.name}
                  onChange={(e) => setEditingTableObj({ ...editingTableObj, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Capacidad Sillas</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={editingTableObj.capacity}
                  onChange={(e) => setEditingTableObj({ ...editingTableObj, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteTable(editingTableObj.id)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 transition"
                >
                  Eliminar Mesa
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTableObj(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: '#DBBB6E' }}
                    className="px-4 py-2 text-white font-bold rounded-xl shadow-md hover:brightness-110"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
