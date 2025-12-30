import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  MapPin,
  Package,
  Truck,
  User,
  Calendar,
  BarChart3,
  MoreHorizontal
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
      dockConfirmed: false
    }
  ])
  
  const [filteredClusters, setFilteredClusters] = useState<string[]>([])
  const [filteredProcessors, setFilteredProcessors] = useState<string[]>([])
  const [showClusterDropdown, setShowClusterDropdown] = useState<string | null>(null)
  const [showProcessorDropdown, setShowProcessorDropdown] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  // Auto-fill batch numbers
  useEffect(() => {
    setRows(prevRows => 
      prevRows.map((row, index) => ({
        ...row,
        batchNumber: index + 1
      }))
    )
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
      dockConfirmed: false
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
      dockConfirmed: false
    }])
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
  const avgProductivity = totalBatches > 0 ? Math.round((totalVolume / totalBatches) * 10) / 10 : 0

  // Generate fake line graph data
  const generateLineData = (points: number, variance: number) => {
    return Array.from({ length: points }, (_, i) => {
      const base = 50 + Math.random() * variance
      const trend = i * 2
      return Math.max(10, Math.min(100, base + trend + (Math.random() - 0.5) * 20))
    })
  }

  const batchTrendData = generateLineData(7, 30)
  const volumeTrendData = generateLineData(7, 40)
  const productivityTrendData = generateLineData(7, 25)

  return (
    <div className="max-w-9xl mx-auto px-4 py-4 space-y-6">
      {/* Top Section: Scorecards and Calendar */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Scorecards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 w-full">
          {/* Total Batches Scorecard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(79, 70, 229, 0.3)",
              transition: { duration: 0.3 }
            }}
            className="relative cursor-pointer"
            style={{
              width: '240px',
              height: '120px',
              borderRadius: '16px',
              padding: '16px',
              background: 'linear-gradient(135deg, #A5B4FC, #C7D2FE)',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#EEF2FF' }}
              >
                <Package className="h-4 w-4" style={{ color: '#4F46E5' }} />
              </div>
              <button className="text-gray-600 hover:bg-gray-100 rounded p-1">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              <p 
                className="font-medium text-left"
                style={{ fontSize: '12px', color: '#0F172A' }}
              >
                Total Batches
              </p>
              <p 
                className="font-bold text-left"
                style={{ fontSize: '28px', color: '#0F172A' }}
              >
                {totalBatches}
              </p>
            </div>
            {/* Mini Trend Graph */}
            <div className="absolute bottom-2 left-4 right-4 h-6">
              <svg viewBox="0 0 100 25" className="w-full h-full">
                <polyline
                  points={batchTrendData.map((value, index) => 
                    `${(index / (batchTrendData.length - 1)) * 100},${25 - (value / 100) * 20}`
                  ).join(' ')}
                  fill="none"
                  stroke="rgba(79, 70, 229, 0.2)"
                  strokeWidth="1.5"
                />
                <polyline
                  points={batchTrendData.map((value, index) => 
                    `${(index / (batchTrendData.length - 1)) * 100},${25 - (value / 100) * 20}`
                  ).join(' ')}
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </motion.div>

          {/* Volume Loaded Scorecard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(220, 38, 38, 0.3)",
              transition: { duration: 0.3 }
            }}
            className="relative cursor-pointer w-full h-[120px] rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, #FB7185, #FDA4AF)',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#FFE4E6' }}
              >
                <Truck className="h-4 w-4" style={{ color: '#DC2626' }} />
              </div>
              <button className="text-gray-600 hover:bg-gray-100 rounded p-1">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              <p 
                className="font-medium text-left"
                style={{ fontSize: '12px', color: '#0F172A' }}
              >
                Volume Loaded
              </p>
              <p 
                className="font-bold text-left"
                style={{ fontSize: '28px', color: '#0F172A' }}
              >
                {totalVolume.toLocaleString()}
              </p>
            </div>
            {/* Mini Trend Graph */}
            <div className="absolute bottom-2 left-4 right-4 h-6">
              <svg viewBox="0 0 100 25" className="w-full h-full">
                <polyline
                  points={volumeTrendData.map((value, index) => 
                    `${(index / (volumeTrendData.length - 1)) * 100},${25 - (value / 100) * 20}`
                  ).join(' ')}
                  fill="none"
                  stroke="rgba(220, 38, 38, 0.2)"
                  strokeWidth="1.5"
                />
                <polyline
                  points={volumeTrendData.map((value, index) => 
                    `${(index / (volumeTrendData.length - 1)) * 100},${25 - (value / 100) * 20}`
                  ).join(' ')}
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </motion.div>

          {/* Productivity Scorecard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(217, 119, 6, 0.3)",
              transition: { duration: 0.3 }
            }}
            className="relative cursor-pointer w-full h-[120px] rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, #FBBF24, #FDE68A)',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#FFFBEB' }}
              >
                <BarChart3 className="h-4 w-4" style={{ color: '#D97706' }} />
              </div>
              <button className="text-gray-600 hover:bg-gray-100 rounded p-1">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              <p 
                className="font-medium text-left"
                style={{ fontSize: '12px', color: '#0F172A' }}
              >
                Productivity
              </p>
              <p 
                className="font-bold text-left"
                style={{ fontSize: '28px', color: '#0F172A' }}
              >
                {avgProductivity}
              </p>
            </div>
            {/* Mini Trend Graph */}
            <div className="absolute bottom-2 left-4 right-4 h-6">
              <svg viewBox="0 0 100 25" className="w-full h-full">
                <polyline
                  points={productivityTrendData.map((value, index) => 
                    `${(index / (productivityTrendData.length - 1)) * 100},${25 - (value / 100) * 20}`
                  ).join(' ')}
                  fill="none"
                  stroke="rgba(217, 119, 6, 0.2)"
                  strokeWidth="1.5"
                />
                <polyline
                  points={productivityTrendData.map((value, index) => 
                    `${(index / (productivityTrendData.length - 1)) * 100},${25 - (value / 100) * 20}`
                  ).join(' ')}
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
          className="bg-white rounded-2xl shadow-lg p-4 flex-shrink-0 cursor-pointer"
          style={{
            width: '240px',
            height: '240px',
            alignSelf: 'flex-start',
            transition: 'all 0.3s ease'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-left">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center font-medium text-gray-500 text-left">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-sm">
              {Array.from({ length: 35 }, (_, i) => {
                const dayNum = i - 2 + 1
                const isCurrentMonth = dayNum > 0 && dayNum <= 31
                const isToday = dayNum === new Date().getDate()
                return (
                  <div
                    key={i}
                    className={`
                      text-center py-2 rounded cursor-pointer transition-colors
                      ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                      ${isToday ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-blue-50'}
                    `}
                    style={{
                      color: isToday ? '#FFFFFF' : isCurrentMonth ? '#94A3B8' : '#E2E8F0'
                    }}
                  >
                    {isCurrentMonth ? dayNum : ''}
                  </div>
                )
              })}
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
