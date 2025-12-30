import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  MapPin,
  User,
  Calendar,
  Package,
  TrendingUp,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface DispatchRow {
  id: string
  batchNumber: number
  clusterName: string
  station: string
  region: string
  countTO: number
  totalOIDLoaded: number
  actualDockedTime: string
  dockNumber: string
  actualDepartTime: string
  processorName: string
  lHTripNumber: string
  plateNumber: string
  fleetSize: string
  assignedPIC: string
  dockConfirmed: boolean
  loadPercentage: number
}

const fleetSizes = ["4WH", "6W", "6WF", "10WH", "CV"]
const mockClusterNames = ["MNL-001", "CBU-002", "CEB-003", "DVO-004", "ZAM-005"]
const mockStations = ["Hub-A", "Hub-B", "Hub-C", "Hub-D"]
const mockRegions = ["NCR", "LUZON", "VISAYAS", "MINDANAO"]
const mockProcessors = ["Juan Dela Cruz", "Maria Santos", "Jose Reyes", "Ana Garcia"]

export function DispatchReportTable() {
  const [rows, setRows] = useState<DispatchRow[]>([
    {
      id: "1",
      batchNumber: 1,
      clusterName: "",
      station: "",
      region: "",
      countTO: 0,
      totalOIDLoaded: 0,
      actualDockedTime: "",
      dockNumber: "",
      actualDepartTime: "",
      processorName: "",
      lHTripNumber: "",
      plateNumber: "",
      fleetSize: "4WH",
      assignedPIC: "",
      dockConfirmed: false,
      loadPercentage: 0
    }
  ])
  const [truckLoadPercentage, setTruckLoadPercentage] = useState(0)
  const [selectedFleetSize, setSelectedFleetSize] = useState<string>("6WH")
  
  const [filteredClusters, setFilteredClusters] = useState<string[]>([])
  const [filteredProcessors, setFilteredProcessors] = useState<string[]>([])
  const [showClusterDropdown, setShowClusterDropdown] = useState<string | null>(null)
  const [showProcessorDropdown, setShowProcessorDropdown] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  // Pause animations when component is not visible to save resources
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (tableRef.current) {
      observer.observe(tableRef.current)
    }
    return () => observer.disconnect()
  }, [])

  // Auto-fill batch numbers when rows change - using functional update to avoid dependency issues
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setRows(prevRows => {
      const needsUpdate = prevRows.some((row, index) => row.batchNumber !== index + 1)
      if (!needsUpdate) return prevRows // Return same reference if no update needed
      return prevRows.map((row, index) => ({
        ...row,
        batchNumber: index + 1
      }))
    })
  }, [rows.length])

  // Auto-fill station and region based on cluster
  const handleClusterChange = (rowId: string, value: string) => {
    setRows(prevRows => 
      prevRows.map(row => {
        if (row.id === rowId) {
          const clusterIndex = mockClusterNames.indexOf(value)
          return {
            ...row,
            clusterName: value,
            station: clusterIndex >= 0 ? mockStations[clusterIndex % mockStations.length] : "",
            region: clusterIndex >= 0 ? mockRegions[clusterIndex % mockRegions.length] : ""
          }
        }
        return row
      })
    )
  }

  // Filter clusters based on input
  const handleClusterInput = (rowId: string, value: string) => {
    handleClusterChange(rowId, value)
    
    if (value.length >= 3) {
      const filtered = mockClusterNames.filter(cluster => 
        cluster.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredClusters(filtered)
      setShowClusterDropdown(rowId)
    } else {
      setShowClusterDropdown(null)
    }
  }

  // Filter processors based on input
  const handleProcessorInput = (rowId: string, value: string) => {
    setRows(prevRows => 
      prevRows.map(row => 
        row.id === rowId ? { ...row, processorName: value } : row
      )
    )
    
    if (value.length >= 3) {
      const filtered = mockProcessors.filter(processor => 
        processor.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredProcessors(filtered)
      setShowProcessorDropdown(rowId)
    } else {
      setShowProcessorDropdown(null)
    }
  }

  // Add new row
  const addRow = () => {
    const newRow: DispatchRow = {
      id: Date.now().toString(),
      batchNumber: rows.length + 1,
      clusterName: "",
      station: "",
      region: "",
      countTO: 0,
      totalOIDLoaded: 0,
      actualDockedTime: "",
      dockNumber: `D-${rows.length + 1}`,
      actualDepartTime: "",
      processorName: "",
      lHTripNumber: "",
      plateNumber: "",
      fleetSize: "4WH",
      assignedPIC: "",
      dockConfirmed: false,
      loadPercentage: 0
    }
    setRows([...rows, newRow])
  }

  // Delete row
  const deleteRow = (rowId: string) => {
    setRows(rows.filter(row => row.id !== rowId))
  }

  // Clear all rows
  const clearAll = () => {
    setRows([{
      id: "1",
      batchNumber: 1,
      clusterName: "",
      station: "",
      region: "",
      countTO: 0,
      totalOIDLoaded: 0,
      actualDockedTime: "",
      dockNumber: "",
      actualDepartTime: "",
      processorName: "",
      lHTripNumber: "",
      plateNumber: "",
      fleetSize: "4WH",
      assignedPIC: "",
      dockConfirmed: false,
      loadPercentage: 0
    }])
    setTruckLoadPercentage(0)
  }

  // Handle cell edit
  const handleCellEdit = (rowId: string, field: keyof DispatchRow, value: string | number | boolean) => {
    setRows(prevRows => 
      prevRows.map(row => 
        row.id === rowId ? { ...row, [field]: value } : row
      )
    )
  }

  // Calculate metrics
  const totalBatches = rows.length
  const totalVolume = rows.reduce((sum, row) => sum + row.totalOIDLoaded, 0)

  // Memoize load fill color to prevent recalculation on every render
  const loadFillColor = useMemo(() => {
    if (truckLoadPercentage < 30) return { start: "#22C55E", end: "#16A34A" }
    if (truckLoadPercentage < 70) return { start: "#F59E0B", end: "#D97706" }
    return { start: "#EF4444", end: "#DC2626" }
  }, [truckLoadPercentage])

  // Memoize truck dimensions based on fleet size to avoid recalculation
  const truckConfig = useMemo(() => {
    switch (selectedFleetSize) {
      case "CONTAINER":
        return { shadowCx: 320, shadowRx: 280, containerWidth: 416, containerX: 22, containerY: 27, containerHeight: 71 }
      case "10WH":
        return { shadowCx: 300, shadowRx: 250, containerWidth: 356, containerX: 32, containerY: 32, containerHeight: 64 }
      case "6WH":
        return { shadowCx: 240, shadowRx: 180, containerWidth: 216, containerX: 82, containerY: 40, containerHeight: 51 }
      default: // 4WH
        return { shadowCx: 230, shadowRx: 120, containerWidth: 146, containerX: 122, containerY: 47, containerHeight: 41 }
    }
  }, [selectedFleetSize])

  return (
    <div className="max-w-9xl mx-auto px-4 py-4 space-y-6">
      {/* Top Section: Scorecards and Calendar */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Truck Loading Dashboard - Full Width */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
          >
            {/* Compact Header Section */}
            <div className="relative overflow-hidden">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500" />
              {isVisible && (
                <motion.div 
                  className="absolute inset-0 opacity-30"
                  animate={{ 
                    background: [
                      'radial-gradient(circle at 0% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                      'radial-gradient(circle at 100% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                      'radial-gradient(circle at 0% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)'
                    ]
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              
              <div className="relative px-6 py-3">
                <div className="flex items-center justify-between">
                  {/* Title */}
                  <h3 className="font-black text-white text-xl tracking-tight drop-shadow-md">
                    Truck Loading Status
                  </h3>

                  <div className="flex items-center gap-4">
                    {/* Stats Cards */}
                    <div className="flex gap-3">
                      <motion.div 
                        className="relative bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 text-center min-w-[100px] border border-white/20 shadow-lg overflow-hidden group cursor-pointer"
                        whileHover={{ scale: 1.05, y: -1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <div className="relative flex items-center justify-center gap-2 mb-0.5">
                          <Package className="h-3.5 w-3.5 text-white/80" />
                          <p className="text-white/90 text-xs font-semibold uppercase tracking-wider">Batches</p>
                        </div>
                        <p className="relative text-white text-2xl font-black tracking-tight">{totalBatches}</p>
                      </motion.div>
                      
                      <motion.div 
                        className="relative bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 text-center min-w-[100px] border border-white/20 shadow-lg overflow-hidden group cursor-pointer"
                        whileHover={{ scale: 1.05, y: -1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <div className="relative flex items-center justify-center gap-2 mb-0.5">
                          <TrendingUp className="h-3.5 w-3.5 text-white/80" />
                          <p className="text-white/90 text-xs font-semibold uppercase tracking-wider">Volume</p>
                        </div>
                        <p className="relative text-white text-2xl font-black tracking-tight">{totalVolume.toLocaleString()}</p>
                      </motion.div>
                    </div>

                    {/* Controls */}
                    <motion.div 
                      className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-yellow-300" />
                        <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Fleet</span>
                        <select
                          value={selectedFleetSize}
                          onChange={(e) => setSelectedFleetSize(e.target.value)}
                          className="h-8 px-3 text-sm font-bold rounded-lg border-0 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-400 shadow-md cursor-pointer"
                        >
                          <option value="4WH">4 Wheeler</option>
                          <option value="6WH">6 Wheeler</option>
                          <option value="10WH">10 Wheeler</option>
                          <option value="CONTAINER">Container Van</option>
                        </select>
                      </div>
                      <div className="w-px h-6 bg-white/30"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Load</span>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={truckLoadPercentage}
                          onChange={(e) => setTruckLoadPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-16 h-8 text-center font-black text-sm border-0 bg-white text-gray-900 shadow-md rounded-lg"
                        />
                        <span className="text-white font-black">%</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Truck Visualization with Faded Warehouse Background */}
            <div className="relative w-full h-[150px] flex items-center justify-center overflow-hidden group">
              {/* Soft gradient background */}
              <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-slate-50 to-gray-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
              
              {/* Faded Warehouse Structure - very subtle */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 180" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#CBD5E1" />
                    <stop offset="100%" stopColor="#E2E8F0" />
                  </linearGradient>
                  <linearGradient id="warehouseWall" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#94A3B8" />
                    <stop offset="100%" stopColor="#64748B" />
                  </linearGradient>
                  <linearGradient id="warehouseRoof" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                </defs>
                
                {/* Distant warehouse buildings - left */}
                <rect x="0" y="50" width="100" height="50" fill="url(#warehouseWall)" />
                <polygon points="0,50 50,30 100,50" fill="url(#warehouseRoof)" />
                
                {/* Distant warehouse buildings - right */}
                <rect x="700" y="45" width="100" height="55" fill="url(#warehouseWall)" />
                <polygon points="700,45 750,25 800,45" fill="url(#warehouseRoof)" />
                
                {/* Main sorting facility - center background */}
                <rect x="180" y="35" width="440" height="65" fill="#CBD5E1" />
                <polygon points="180,35 400,10 620,35" fill="#64748B" />
                
                {/* Facility windows - subtle */}
                {Array.from({ length: 6 }, (_, i) => (
                  <rect key={i} x={210 + i * 65} y="50" width="30" height="20" fill="#94A3B8" />
                ))}
              </svg>
              
              {/* Subtle animated shimmer - only animate when visible */}
              {isVisible && (
                <motion.div 
                  className="absolute inset-0 opacity-5"
                  animate={{ 
                    background: [
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                    ],
                    backgroundPosition: ['-100% 0%', '200% 0%']
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: '50% 100%' }}
                />
              )}
              
              <svg viewBox="0 0 700 120" className="w-full h-full relative z-10" preserveAspectRatio="xMidYMid meet">
                <defs>
                  {/* Realistic metallic orange gradient for Shopee */}
                  <linearGradient id="cabMetallic" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FF8C5A" />
                    <stop offset="15%" stopColor="#FF6B35" />
                    <stop offset="50%" stopColor="#EE4D2D" />
                    <stop offset="85%" stopColor="#D73211" />
                    <stop offset="100%" stopColor="#B82A0E" />
                  </linearGradient>
                  <linearGradient id="cabHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                  
                  {/* Container gradients - Light transparent orange for fill emphasis */}
                  <linearGradient id="containerBody" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFD4C4" />
                    <stop offset="50%" stopColor="#FFBDA8" />
                    <stop offset="100%" stopColor="#FFA88C" />
                  </linearGradient>
                  <linearGradient id="containerShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
                  </linearGradient>
                  <linearGradient id="containerHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </linearGradient>
                  
                  {/* Load fill gradient - using memoized colors */}
                  <linearGradient id="loadFill" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={loadFillColor.start} />
                    <stop offset="100%" stopColor={loadFillColor.end} />
                  </linearGradient>
                  <linearGradient id="loadShine" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
                  </linearGradient>
                  
                  {/* Glass effect */}
                  <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#B4E4FF" />
                    <stop offset="30%" stopColor="#87CEEB" />
                    <stop offset="70%" stopColor="#5DADE2" />
                    <stop offset="100%" stopColor="#3498DB" />
                  </linearGradient>
                  
                  {/* Tire realistic gradient */}
                  <radialGradient id="tireReal" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4B5563" />
                    <stop offset="60%" stopColor="#1F2937" />
                    <stop offset="80%" stopColor="#111827" />
                    <stop offset="100%" stopColor="#030712" />
                  </radialGradient>
                  <radialGradient id="rimReal" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#F9FAFB" />
                    <stop offset="40%" stopColor="#D1D5DB" />
                    <stop offset="100%" stopColor="#6B7280" />
                  </radialGradient>
                  
                  {/* Chrome effect */}
                  <linearGradient id="chromeReal" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="20%" stopColor="#E5E7EB" />
                    <stop offset="40%" stopColor="#9CA3AF" />
                    <stop offset="60%" stopColor="#E5E7EB" />
                    <stop offset="80%" stopColor="#9CA3AF" />
                    <stop offset="100%" stopColor="#6B7280" />
                  </linearGradient>
                  
                  {/* Shadows */}
                  <filter id="truckDropShadow" x="-20%" y="-20%" width="140%" height="160%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.3"/>
                  </filter>
                  <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feMerge>
                      <feMergeNode in="blur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Ground/Road */}
                <rect x="0" y="105" width="700" height="15" fill="#374151" />
                <rect x="0" y="105" width="700" height="2" fill="#4B5563" />
                {/* Road markings */}
                {Array.from({ length: 8 }, (_, i) => (
                  <rect key={i} x={20 + i * 90} y="111" width="40" height="3" rx="1" fill="#FCD34D" />
                ))}

                {/* Ground shadow under truck - using memoized config */}
                <ellipse cx={truckConfig.shadowCx} cy="108" rx={truckConfig.shadowRx} ry="6" fill="rgba(0,0,0,0.3)" />

                {/* === TRUCK BODY === */}
                <g filter="url(#truckDropShadow)">
                  {/* Container/Cargo Area */}
                  {selectedFleetSize === "CONTAINER" ? (
                    /* Container Van - Large container - Shopee Orange */
                    <g>
                      <rect x="20" y="25" width="420" height="75" rx="2" fill="url(#containerBody)" />
                      <rect x="20" y="25" width="420" height="75" rx="2" fill="url(#containerHighlight)" />
                      {/* Container panel lines */}
                      {Array.from({ length: 6 }, (_, i) => (
                        <rect key={i} x={70 + i * 70} y="25" width="2" height="75" fill="rgba(0,0,0,0.1)" />
                      ))}
                      {/* Shopee Xpress branding */}
                      <text x="230" y="55" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">Shopee</text>
                      <text x="230" y="75" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="2">XPRESS</text>
                      {/* Load fill overlay */}
                      <clipPath id="containerClipPath">
                        <rect x="22" y="27" width="416" height="71" rx="1" />
                      </clipPath>
                      <g clipPath="url(#containerClipPath)">
                        <rect
                          x="22"
                          y="27"
                          height="71"
                          fill="url(#loadFill)"
                          opacity="0.7"
                          width={truckConfig.containerWidth}
                          style={{
                            transform: `scaleX(${truckLoadPercentage / 100})`,
                            transformOrigin: 'left',
                            transition: 'transform 0.8s ease-out'
                          }}
                        />
                      </g>
                      {/* Container frame */}
                      <rect x="20" y="25" width="420" height="75" rx="2" fill="none" stroke="#B82A0E" strokeWidth="2" />
                      <rect x="20" y="98" width="420" height="6" fill="#8B2510" />
                    </g>
                  ) : selectedFleetSize === "10WH" ? (
                    /* 10 Wheeler - Long truck - Shopee Orange */
                    <g>
                      <rect x="30" y="30" width="360" height="68" rx="3" fill="url(#containerBody)" />
                      <rect x="30" y="30" width="360" height="68" rx="3" fill="url(#containerHighlight)" />
                      {/* Panel lines */}
                      {Array.from({ length: 5 }, (_, i) => (
                        <rect key={i} x={80 + i * 70} y="30" width="2" height="68" fill="rgba(0,0,0,0.1)" />
                      ))}
                      {/* Shopee Xpress branding */}
                      <text x="210" y="58" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">Shopee</text>
                      <text x="210" y="78" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="2">XPRESS</text>
                      <clipPath id="container10Clip">
                        <rect x="32" y="32" width="356" height="64" rx="2" />
                      </clipPath>
                      <g clipPath="url(#container10Clip)">
                        <rect
                          x="32" y="32" height="64"
                          fill="url(#loadFill)"
                          opacity="0.7"
                          width="356"
                          style={{
                            transform: `scaleX(${truckLoadPercentage / 100})`,
                            transformOrigin: 'left',
                            transition: 'transform 0.8s ease-out'
                          }}
                        />
                      </g>
                      <rect x="30" y="30" width="360" height="68" rx="3" fill="none" stroke="#B82A0E" strokeWidth="2" />
                      <rect x="30" y="96" width="360" height="6" fill="#8B2510" />
                    </g>
                  ) : selectedFleetSize === "6WH" ? (
                    /* 6 Wheeler - Medium truck - Shopee Orange */
                    <g>
                      <rect x="80" y="38" width="220" height="55" rx="3" fill="url(#containerBody)" />
                      <rect x="80" y="38" width="220" height="55" rx="3" fill="url(#containerHighlight)" />
                      {/* Panel lines */}
                      {Array.from({ length: 3 }, (_, i) => (
                        <rect key={i} x={130 + i * 55} y="38" width="2" height="55" fill="rgba(0,0,0,0.1)" />
                      ))}
                      {/* Shopee Xpress branding */}
                      <text x="190" y="60" textAnchor="middle" fill="#EE4D2D" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">Shopee</text>
                      <text x="190" y="76" textAnchor="middle" fill="#EE4D2D" fontSize="13" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="1">XPRESS</text>
                      <clipPath id="container6Clip">
                        <rect x="82" y="40" width="216" height="51" rx="2" />
                      </clipPath>
                      <g clipPath="url(#container6Clip)">
                        <rect
                          x="82" y="40" height="51"
                          fill="url(#loadFill)"
                          width="216"
                          style={{
                            transform: `scaleX(${truckLoadPercentage / 100})`,
                            transformOrigin: 'left',
                            transition: 'transform 0.8s ease-out'
                          }}
                        />
                      </g>
                      <rect x="80" y="38" width="220" height="55" rx="3" fill="none" stroke="#FFA07A" strokeWidth="2" />
                      <rect x="80" y="91" width="220" height="5" fill="#CD5C5C" />
                    </g>
                  ) : (
                    /* 4 Wheeler - Small truck/van - Shopee Orange (smaller than 6WH) */
                    <g>
                      <rect x="120" y="45" width="150" height="45" rx="3" fill="url(#containerBody)" />
                      <rect x="120" y="45" width="150" height="45" rx="3" fill="url(#containerHighlight)" />
                      {/* Panel lines */}
                      {Array.from({ length: 2 }, (_, i) => (
                        <rect key={i} x={165 + i * 50} y="45" width="2" height="45" fill="rgba(0,0,0,0.1)" />
                      ))}
                      {/* Shopee Xpress branding */}
                      <text x="195" y="62" textAnchor="middle" fill="#EE4D2D" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif">Shopee</text>
                      <text x="195" y="76" textAnchor="middle" fill="#EE4D2D" fontSize="10" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="1">XPRESS</text>
                      <clipPath id="container4Clip">
                        <rect x="122" y="47" width="146" height="41" rx="2" />
                      </clipPath>
                      <g clipPath="url(#container4Clip)">
                        <rect
                          x="122" y="47" height="41"
                          fill="url(#loadFill)"
                          width="146"
                          style={{
                            transform: `scaleX(${truckLoadPercentage / 100})`,
                            transformOrigin: 'left',
                            transition: 'transform 0.8s ease-out'
                          }}
                        />
                      </g>
                      <rect x="120" y="45" width="150" height="45" rx="3" fill="none" stroke="#FFA07A" strokeWidth="2" />
                      <rect x="120" y="88" width="150" height="4" fill="#CD5C5C" />
                    </g>
                  )}

                  {/* === CAB === */}
                  {selectedFleetSize === "CONTAINER" ? (
                    <g>
                      <path d="M440 30 L440 100 L530 100 L530 55 L510 30 Z" fill="url(#cabMetallic)" />
                      <path d="M440 30 L440 100 L530 100 L530 55 L510 30 Z" fill="url(#cabHighlight)" />
                      <path d="M445 35 L505 35 L520 55 L520 70 L445 70 Z" fill="url(#glassGradient)" stroke="#1F2937" strokeWidth="2" />
                      <rect x="447" y="37" width="20" height="10" rx="2" fill="rgba(255,255,255,0.5)" />
                      <rect x="445" y="75" width="40" height="22" rx="2" fill="#D73211" stroke="#B82A0E" strokeWidth="1" />
                      <rect x="455" y="82" width="25" height="10" rx="2" fill="#FFFFFF" />
                      <text x="467" y="90" textAnchor="middle" fill="#EE4D2D" fontSize="7" fontWeight="bold">SPX</text>
                    </g>
                  ) : selectedFleetSize === "10WH" ? (
                    <g>
                      <path d="M390 35 L390 98 L470 98 L470 55 L455 35 Z" fill="url(#cabMetallic)" />
                      <path d="M390 35 L390 98 L470 98 L470 55 L455 35 Z" fill="url(#cabHighlight)" />
                      <path d="M395 40 L450 40 L465 55 L465 68 L395 68 Z" fill="url(#glassGradient)" stroke="#1F2937" strokeWidth="2" />
                      <rect x="397" y="42" width="18" height="8" rx="2" fill="rgba(255,255,255,0.5)" />
                      <rect x="395" y="72" width="38" height="22" rx="2" fill="#D73211" stroke="#B82A0E" strokeWidth="1" />
                      <rect x="403" y="80" width="22" height="9" rx="2" fill="#FFFFFF" />
                      <text x="414" y="87" textAnchor="middle" fill="#EE4D2D" fontSize="6" fontWeight="bold">SPX</text>
                    </g>
                  ) : selectedFleetSize === "6WH" ? (
                    <g>
                      <path d="M300 43 L300 93 L360 93 L360 60 L350 43 Z" fill="url(#cabMetallic)" />
                      <path d="M300 43 L300 93 L360 93 L360 60 L350 43 Z" fill="url(#cabHighlight)" />
                      <path d="M305 48 L345 48 L355 60 L355 68 L305 68 Z" fill="url(#glassGradient)" stroke="#1F2937" strokeWidth="2" />
                      <rect x="307" y="50" width="12" height="6" rx="1" fill="rgba(255,255,255,0.5)" />
                      <rect x="305" y="72" width="30" height="18" rx="2" fill="#D73211" stroke="#B82A0E" strokeWidth="1" />
                      <rect x="310" y="77" width="18" height="7" rx="1" fill="#FFFFFF" />
                      <text x="319" y="83" textAnchor="middle" fill="#EE4D2D" fontSize="4" fontWeight="bold">SPX</text>
                    </g>
                  ) : (
                    /* 4 Wheeler cab - smaller */
                    <g>
                      <path d="M270 50 L270 90 L320 90 L320 62 L312 50 Z" fill="url(#cabMetallic)" />
                      <path d="M270 50 L270 90 L320 90 L320 62 L312 50 Z" fill="url(#cabHighlight)" />
                      <path d="M274 54 L308 54 L316 62 L316 68 L274 68 Z" fill="url(#glassGradient)" stroke="#1F2937" strokeWidth="1.5" />
                      <rect x="276" y="56" width="10" height="5" rx="1" fill="rgba(255,255,255,0.5)" />
                      <rect x="274" y="71" width="25" height="15" rx="2" fill="#D73211" stroke="#B82A0E" strokeWidth="1" />
                      <rect x="278" y="74" width="15" height="6" rx="1" fill="#FFFFFF" />
                      <text x="285" y="79" textAnchor="middle" fill="#EE4D2D" fontSize="3" fontWeight="bold">SPX</text>
                    </g>
                  )}
                </g>

                {/* === WHEELS === */}
                {selectedFleetSize === "CONTAINER" ? (
                  /* Container Van - 10 wheels (dual rear axle) */
                  <g>
                    {[60, 90, 350, 380, 500].map((x, i) => (
                      <g key={i}>
                        <circle cx={x} cy="102" r="14" fill="url(#tireReal)" />
                        <circle cx={x} cy="102" r="9" fill="url(#rimReal)" />
                        <circle cx={x} cy="102" r="3" fill="#4B5563" />
                      </g>
                    ))}
                  </g>
                ) : selectedFleetSize === "10WH" ? (
                  /* 10 Wheeler */
                  <g>
                    {[70, 100, 300, 330, 450].map((x, i) => (
                      <g key={i}>
                        <circle cx={x} cy="100" r="13" fill="url(#tireReal)" />
                        <circle cx={x} cy="100" r="8" fill="url(#rimReal)" />
                        <circle cx={x} cy="100" r="3" fill="#4B5563" />
                      </g>
                    ))}
                  </g>
                ) : selectedFleetSize === "6WH" ? (
                  /* 6 Wheeler */
                  <g>
                    {[120, 260, 350].map((x, i) => (
                      <g key={i}>
                        <circle cx={x} cy="96" r="11" fill="url(#tireReal)" />
                        <circle cx={x} cy="96" r="6" fill="url(#rimReal)" />
                        <circle cx={x} cy="96" r="2" fill="#4B5563" />
                      </g>
                    ))}
                  </g>
                ) : (
                  /* 4 Wheeler - smaller wheels */
                  <g>
                    {[155, 235, 310].map((x, i) => (
                      <g key={i}>
                        <circle cx={x} cy="94" r="9" fill="url(#tireReal)" />
                        <circle cx={x} cy="94" r="5" fill="url(#rimReal)" />
                        <circle cx={x} cy="94" r="1.5" fill="#4B5563" />
                      </g>
                    ))}
                  </g>
                )}

                {/* Percentage Display */}
                <g>
                  <rect x="550" y="15" width="130" height="45" rx="8" fill="rgba(255,255,255,0.95)" stroke="#E5E7EB" strokeWidth="1" />
                  <text x="615" y="32" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="500">
                    {selectedFleetSize === "CONTAINER" ? "Container Van" : selectedFleetSize === "10WH" ? "10 Wheeler" : selectedFleetSize === "6WH" ? "6 Wheeler" : "4 Wheeler"}
                  </text>
                  <text x="615" y="52" textAnchor="middle" fill={truckLoadPercentage < 30 ? "#22C55E" : truckLoadPercentage < 70 ? "#F59E0B" : "#EF4444"} fontSize="18" fontWeight="bold">
                    {truckLoadPercentage}% LOADED
                  </text>
                </g>
              </svg>
            </div>

            {/* Compact Loading Progress Bar */}
            <div className="px-4 py-2 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Loading Progress</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                  truckLoadPercentage < 30 
                    ? 'bg-emerald-500 text-white' 
                    : truckLoadPercentage < 70 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {truckLoadPercentage}% LOADED
                </span>
              </div>
              
              <div className="relative">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${truckLoadPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full relative overflow-hidden ${
                      truckLoadPercentage < 30 
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
                        : truckLoadPercentage < 70 
                        ? 'bg-gradient-to-r from-amber-400 to-amber-600' 
                        : 'bg-gradient-to-r from-orange-500 to-red-600'
                    }`}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                </div>
              </div>
              
              <div className="flex justify-between mt-2">
                <div className={`flex items-center gap-1.5 ${truckLoadPercentage < 30 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${truckLoadPercentage < 30 ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                  <span className="text-xs font-semibold">Low</span>
                </div>
                <div className={`flex items-center gap-1.5 ${truckLoadPercentage >= 30 && truckLoadPercentage < 70 ? 'text-amber-600' : 'text-gray-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${truckLoadPercentage >= 30 && truckLoadPercentage < 70 ? 'bg-amber-500' : 'bg-gray-300'}`}></span>
                  <span className="text-xs font-semibold">Medium</span>
                </div>
                <div className={`flex items-center gap-1.5 ${truckLoadPercentage >= 70 ? 'text-red-600' : 'text-gray-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${truckLoadPercentage >= 70 ? 'bg-red-500' : 'bg-gray-300'}`}></span>
                  <span className="text-xs font-semibold">High</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Calendar Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ 
            scale: 1.02,
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
            transition: { duration: 0.3 }
          }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 flex-shrink-0 cursor-pointer w-full lg:w-[280px]"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="h-8 w-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="space-y-1">
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center font-medium text-gray-500 dark:text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {(() => {
                const today = new Date()
                const year = today.getFullYear()
                const month = today.getMonth()
                const firstDay = new Date(year, month, 1).getDay()
                const daysInMonth = new Date(year, month + 1, 0).getDate()
                const cells = []
                
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`empty-${i}`} className="text-center py-1.5"></div>)
                }
                
                for (let day = 1; day <= daysInMonth; day++) {
                  const isToday = day === today.getDate()
                  cells.push(
                    <div
                      key={day}
                      className={`
                        text-center py-1.5 rounded-md cursor-pointer transition-colors
                        ${isToday 
                          ? 'bg-blue-600 text-white font-semibold' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'}
                      `}
                    >
                      {day}
                    </div>
                  )
                }
                return cells
              })()}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-start items-center mb-6">
        <div className="flex gap-3">
          <Button
            onClick={addRow}
            className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          <Button
            onClick={clearAll}
            variant="outline"
            className="border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 transition-all duration-300 hover:scale-105"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Escalations Table */}
      <div 
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
        style={{
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <div ref={tableRef} className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr 
                style={{
                  height: '56px',
                  background: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0'
                }}
              >
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Batch #</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Cluster Name</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Station</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Region</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Count of TO</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Total OID Loaded</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Actual Docked Time</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Dock #</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Actual Depart Time</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Name of Processor</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>LH Trip #</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Plate #</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Fleet Size</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Assigned PIC / OPS Coor</th>
                <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748B', fontSize: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 transition-all duration-200 border-l-4 border-l-transparent hover:border-l-sky-400"
                    style={{ height: '52px' }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-sky-100 to-sky-200 text-sky-800 font-bold text-sm shadow-sm">
                        {row.batchNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap relative">
                      <Input
                        value={row.clusterName}
                        onChange={(e) => handleClusterInput(row.id, e.target.value)}
                        placeholder="Type 3+ chars..."
                        className="w-36 h-10 text-sm border-gray-200 rounded-xl focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        style={{ fontSize: '14px' }}
                      />
                      {showClusterDropdown === row.id && filteredClusters.length > 0 && (
                        <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-auto">
                          {filteredClusters.map(cluster => (
                            <div
                              key={cluster}
                              onClick={() => {
                                handleClusterChange(row.id, cluster)
                                setShowClusterDropdown(null)
                              }}
                              className="px-4 py-3 hover:bg-sky-50 cursor-pointer text-sm transition-colors"
                            >
                              {cluster}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600 font-medium" style={{ fontSize: '14px' }}>{row.station || "Auto-filled"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                        {row.region || "Auto-filled"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Input
                        type="number"
                        min="0"
                        value={row.countTO}
                        onChange={(e) => handleCellEdit(row.id, 'countTO', parseInt(e.target.value) || 0)}
                        className="w-24 h-10 text-sm border-gray-200 rounded-xl focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        style={{ fontSize: '14px' }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Input
                        type="number"
                        min="0"
                        value={row.totalOIDLoaded}
                        onChange={(e) => handleCellEdit(row.id, 'totalOIDLoaded', parseInt(e.target.value) || 0)}
                        className="w-28 h-10 text-sm border-gray-200 rounded-xl focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        style={{ fontSize: '14px' }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Input
                        type="datetime-local"
                        value={row.actualDockedTime}
                        onChange={(e) => handleCellEdit(row.id, 'actualDockedTime', e.target.value)}
                        className="w-40 h-10 text-sm border-gray-200 rounded-xl focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        style={{ fontSize: '14px' }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Input
                          value={row.dockNumber}
                          onChange={(e) => handleCellEdit(row.id, 'dockNumber', e.target.value)}
                          className="w-24 h-10 text-sm border-gray-200 rounded-xl focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                          style={{ fontSize: '14px' }}
                        />
                        <input
                          type="checkbox"
                          checked={row.dockConfirmed}
                          onChange={(e) => handleCellEdit(row.id, 'dockConfirmed', e.target.checked)}
                          className="h-5 w-5 text-sky-600 rounded-lg border-gray-300 focus:ring-sky-500"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Input
                        type="datetime-local"
                        value={row.actualDepartTime}
                        onChange={(e) => handleCellEdit(row.id, 'actualDepartTime', e.target.value)}
                        min={row.actualDockedTime}
                        className="w-40 h-10 text-sm border-gray-200 rounded-xl focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        style={{ fontSize: '14px' }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap relative">
                      <Input
                        value={row.processorName}
                        onChange={(e) => handleProcessorInput(row.id, e.target.value)}
                        placeholder="Type 3+ chars..."
                        className="w-36 h-10 text-sm border-gray-200 rounded-xl focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        style={{ fontSize: '14px' }}
                      />
                      {showProcessorDropdown === row.id && filteredProcessors.length > 0 && (
                        <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-auto">
                          {filteredProcessors.map(processor => (
                            <div
                              key={processor}
                              onClick={() => {
                                handleCellEdit(row.id, 'processorName', processor)
                                setShowProcessorDropdown(null)
                              }}
                              className="px-4 py-3 hover:bg-sky-50 cursor-pointer text-sm transition-colors"
                            >
                              {processor}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Input
                        value={row.lHTripNumber}
                        onChange={(e) => handleCellEdit(row.id, 'lHTripNumber', e.target.value.toUpperCase())}
                        placeholder="LT..."
                        className="w-28 h-10 text-sm border-gray-200 rounded-xl focus:border-sky-400 focus:ring-2 focus:ring-sky-100 uppercase"
                        style={{ fontSize: '14px' }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Input
                        value={row.plateNumber}
                        onChange={(e) => handleCellEdit(row.id, 'plateNumber', e.target.value.toUpperCase())}
                        className="w-24 h-10 text-sm border-gray-200 rounded-xl focus:border-sky-400 focus:ring-2 focus:ring-sky-100 uppercase"
                        style={{ fontSize: '14px' }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={row.fleetSize}
                        onChange={(e) => handleCellEdit(row.id, 'fleetSize', e.target.value)}
                        className="w-20 h-10 text-sm border-gray-200 rounded-xl px-3 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        style={{ fontSize: '14px' }}
                      >
                        {fleetSizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <Input
                          value={row.assignedPIC}
                          onChange={(e) => handleCellEdit(row.id, 'assignedPIC', e.target.value)}
                          placeholder="OPS ID..."
                          className="w-28 h-10 text-sm border-gray-200 rounded-xl focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        onClick={() => deleteRow(row.id)}
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 hover:scale-110"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Button Below Table */}
      <div className="flex justify-center mt-8">
        <Button
          className="bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-8 py-3 text-base font-semibold border-0"
        >
          <Save className="h-5 w-5 mr-2" />
          Submit Report
        </Button>
      </div>
    </div>
  )
}
