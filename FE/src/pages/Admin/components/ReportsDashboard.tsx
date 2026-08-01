import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown, Download, DollarSign, Ticket, Car, BarChart2, Users, ShieldAlert, Clock } from "lucide-react";
import { parkingLotService, reportService } from "../../../services/api";

export function ReportsDashboard() {
  const [parkingLots, setParkingLots] = useState<any[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const [period, setPeriod] = useState<string>("month");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState<any | null>(null);
  const [revenue, setRevenue] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any | null>(null);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [exporting, setExporting] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Fetch parking lots
  useEffect(() => {
    const fetchLots = async () => {
      try {
        const res = await parkingLotService.getParkingLots({ status: 'active' });
        const list = res.data?.parkingLots || res.data || res || [];
        if (Array.isArray(list)) {
          setParkingLots(list);
        }
      } catch (err) {
        console.error("Failed to load parking lots", err);
      }
    };
    fetchLots();
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, revenueRes, sessionsRes, occupancyRes] = await Promise.all([
        reportService.getDashboardStats(selectedLotId),
        reportService.getRevenueReport({ period, groupBy: period === "today" ? "hour" : "day", parkingLotId: selectedLotId }),
        reportService.getSessionReport({ period, parkingLotId: selectedLotId }),
        reportService.getOccupancyReport(selectedLotId)
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (revenueRes.success) setRevenue(revenueRes.data);
      if (sessionsRes.success) setSessions(sessionsRes.data);
      if (occupancyRes.success) setOccupancy(occupancyRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể tải báo cáo. Vui lòng kiểm tra kết nối.");
    } finally {
      setLoading(false);
    }
  }, [selectedLotId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export CSV
  const handleExportCSV = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const responseBlob = await reportService.exportSessions({ period, parkingLotId: selectedLotId });
      const url = window.URL.createObjectURL(new Blob([responseBlob], { type: 'text/csv' }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bao_cao_luot_do_${period}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      console.error(err);
      alert("Xuất CSV thất bại: " + (err.message || err));
    } finally {
      setExporting(false);
    }
  };

  // Group occupancy by vehicle type
  const getOccupancyStats = () => {
    const map: { [key: string]: { name: string; occupied: number; available: number; total: number } } = {};
    occupancy.forEach(item => {
      const typeId = item.vehicleType?._id || item._id.vehicleType;
      const typeName = item.vehicleType?.name || "Khác";
      const status = item._id.status;
      
      if (!map[typeId]) {
        map[typeId] = { name: typeName, occupied: 0, available: 0, total: 0 };
      }
      
      if (status === 'occupied') {
        map[typeId].occupied += item.count;
      } else if (status === 'available') {
        map[typeId].available += item.count;
      }
      map[typeId].total += item.count;
    });
    return Object.values(map);
  };

  // SVG Chart Math
  const chartData = revenue?.chart || [];
  const N = chartData.length;
  const maxRevenue = Math.max(...chartData.map((d: any) => d.totalRevenue || 0), 100000) * 1.15;
  const svgWidth = 640;
  const svgHeight = 260;
  const chartPadLeft = 70;
  const chartPadRight = 20;
  const chartPadTop = 20;
  const chartPadBot = 40;
  const chartW = svgWidth - chartPadLeft - chartPadRight;
  const chartH = svgHeight - chartPadTop - chartPadBot;

  const points = chartData.map((d: any, idx: number) => {
    const x = chartPadLeft + (N > 1 ? (idx / (N - 1)) * chartW : chartW / 2);
    const y = chartPadTop + chartH - ((d.totalRevenue || 0) / maxRevenue) * chartH;
    
    let label = "";
    if (d._id) {
      if (d._id.hour !== undefined) label = `${String(d._id.hour).padStart(2, '0')}:00`;
      else if (d._id.day !== undefined) label = `${d._id.day}/${d._id.month}`;
      else if (d._id.month !== undefined) label = `T.${d._id.month}`;
      else if (d._id.year !== undefined) label = `${d._id.year}`;
    }
    
    return { x, y, val: d.totalRevenue, label, count: d.count };
  });

  const lineD = points.length > 0 
    ? `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}` 
    : '';

  const areaD = points.length > 0 
    ? `${lineD} L ${points[points.length - 1].x} ${chartPadTop + chartH} L ${points[0].x} ${chartPadTop + chartH} Z` 
    : '';

  const formatYLabel = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val.toString();
  };

  const getPeriodLabel = (p: string) => {
    if (p === 'today') return 'Hôm nay';
    if (p === 'week') return 'Tuần này';
    if (p === 'month') return 'Tháng này';
    if (p === 'year') return 'Năm nay';
    return p;
  };

  const occupancyStatsList = getOccupancyStats();
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="animate-fade-in">
      {/* Header & Controls */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Báo cáo & Thống kê
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 leading-tight">
            Dashboard Báo cáo
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Tổng quan hiệu suất hoạt động, doanh thu và tỷ lệ sử dụng chỗ đỗ
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bãi xe</label>
            <div className="relative">
              <select
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 transition shadow-sm cursor-pointer"
              >
                <option value="">Tất cả bãi xe</option>
                {parkingLots.map((lot) => (
                  <option key={lot._id} value={lot._id}>{lot.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Chu kỳ</label>
            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
              {["today", "week", "month", "year"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    period === p 
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {p === "today" ? "Hôm nay" : p === "week" ? "Tuần" : p === "month" ? "Tháng" : "Năm"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 mt-5 text-gray-700"
          >
            <Download className="w-4 h-4 text-gray-500" />
            {exporting ? "Đang xuất..." : "Xuất CSV"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-sm text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
          Đang tải dữ liệu báo cáo...
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-100 text-red-750 rounded-2xl text-sm shadow-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="font-bold">Lỗi tải dữ liệu</p>
            <p className="text-xs text-red-550 mt-0.5">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            {[
              {
                label: `Doanh thu ${getPeriodLabel(period).toLowerCase()}`,
                value: `${revenue?.totalRevenue?.toLocaleString() || 0} ₫`,
                icon: DollarSign,
                color: "text-amber-600 bg-amber-50 border-amber-100",
              },
              {
                label: `Lượt đỗ ${getPeriodLabel(period).toLowerCase()}`,
                value: `${revenue?.totalTransactions || 0}`,
                icon: Ticket,
                color: "text-blue-600 bg-blue-50 border-blue-100",
              },
              {
                label: "Xe đang đỗ",
                value: `${stats?.activeSessions || 0}`,
                icon: Car,
                color: "text-emerald-600 bg-emerald-50 border-emerald-100",
              },
              {
                label: "Tỷ lệ lấp đầy",
                value: `${stats?.occupancyRate || 0}%`,
                icon: BarChart2,
                color: "text-violet-600 bg-violet-50 border-violet-100",
              },
              {
                label: "Tài khoản khách",
                value: `${stats?.totalUsers || 0}`,
                icon: Users,
                color: "text-sky-600 bg-sky-50 border-sky-100",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
              </div>
            ))}
          </div>

          {/* Main Visuals Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left side: Revenue line chart & Peak Hours */}
            <div className="col-span-2 space-y-6">
              {/* Revenue Line Chart Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-800 mb-6">Biểu đồ xu hướng doanh thu</h2>
                
                <div className="relative h-[260px] w-full flex items-center justify-center">
                  {points.length === 0 ? (
                    <p className="text-xs text-gray-400">Không có dữ liệu doanh thu cho khoảng thời gian này</p>
                  ) : (
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="revenue-area-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#111827" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#111827" stopOpacity="0.00" />
                        </linearGradient>
                      </defs>
                      
                      {/* Horizontal Grid lines */}
                      {gridLines.map((gl, gIdx) => {
                        const y = chartPadTop + chartH * (1 - gl);
                        const val = maxRevenue * gl;
                        return (
                          <g key={gIdx} className="opacity-40">
                            <line
                              x1={chartPadLeft}
                              y1={y}
                              x2={svgWidth - chartPadRight}
                              y2={y}
                              stroke="#E5E7EB"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={chartPadLeft - 10}
                              y={y + 4}
                              textAnchor="end"
                              className="text-[9px] font-bold fill-gray-400 font-mono"
                            >
                              {formatYLabel(val)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area Fill */}
                      {areaD && (
                        <path
                          d={areaD}
                          fill="url(#revenue-area-grad)"
                          className="transition-all duration-300"
                        />
                      )}

                      {/* Line Stroke */}
                      {lineD && (
                        <path
                          d={lineD}
                          fill="none"
                          stroke="#111827"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-all duration-300"
                        />
                      )}

                      {/* Hover Trigger Zones */}
                      {points.map((p, idx) => {
                        const sliceW = chartW / Math.max(N - 1, 1);
                        const startX = p.x - sliceW / 2;
                        return (
                          <rect
                            key={idx}
                            x={startX}
                            y={chartPadTop}
                            width={sliceW}
                            height={chartH}
                            fill="transparent"
                            onMouseEnter={() => setHoveredPoint(p)}
                            onMouseLeave={() => setHoveredPoint(null)}
                            className="cursor-pointer"
                          />
                        );
                      })}

                      {/* Joint Dots */}
                      {points.map((p, idx) => {
                        const isHovered = hoveredPoint && hoveredPoint.x === p.x;
                        return (
                          <circle
                            key={idx}
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? 5 : 3.5}
                            fill={isHovered ? "#FFFFFF" : "#111827"}
                            stroke="#111827"
                            strokeWidth={isHovered ? 3 : 1.5}
                            className="transition-all duration-150 pointer-events-none"
                          />
                        );
                      })}

                      {/* X labels */}
                      {points.map((p, idx) => {
                        const showLabel = N <= 10 || idx % Math.ceil(N / 7) === 0 || idx === N - 1;
                        if (!showLabel) return null;
                        return (
                          <text
                            key={idx}
                            x={p.x}
                            y={chartPadTop + chartH + 18}
                            textAnchor="middle"
                            className="text-[9px] font-bold fill-gray-400 font-mono"
                          >
                            {p.label}
                          </text>
                        );
                      })}

                      {/* Hover Tooltip */}
                      {hoveredPoint && (
                        <g className="pointer-events-none transition-all duration-150">
                          <line
                            x1={hoveredPoint.x}
                            y1={chartPadTop}
                            x2={hoveredPoint.x}
                            y2={chartPadTop + chartH}
                            stroke="#111827"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                            opacity="0.4"
                          />
                          <foreignObject
                            x={Math.max(10, Math.min(svgWidth - 160, hoveredPoint.x - 75))}
                            y={Math.max(5, hoveredPoint.y - 68)}
                            width="150"
                            height="60"
                          >
                            <div className="bg-gray-900 text-white text-[10px] px-3 py-2 rounded-xl shadow-lg border border-gray-800 flex flex-col font-sans">
                              <span className="font-semibold text-gray-400">{hoveredPoint.label}</span>
                              <span className="font-bold text-white text-xs mt-0.5">{hoveredPoint.val.toLocaleString()} ₫</span>
                              <span className="text-[9px] text-gray-400 mt-0.5">{hoveredPoint.count} lượt xe | Doanh thu</span>
                            </div>
                          </foreignObject>
                        </g>
                      )}
                    </svg>
                  )}
                </div>
              </div>

              {/* Peak Hours Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-800">Khung giờ cao điểm vào bãi</h2>
                <p className="text-xs text-gray-400 mt-1">Phân tích top 5 khung giờ có mật độ xe vào bãi lớn nhất</p>
                
                <div className="grid grid-cols-5 gap-3 mt-6">
                  {sessions?.peakHours && sessions.peakHours.length > 0 ? (
                    sessions.peakHours.map((item: any, idx: number) => {
                      const peakMax = Math.max(...(sessions?.peakHours || []).map((h: any) => h.count), 1);
                      const pct = Math.round((item.count / peakMax) * 100);
                      return (
                        <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 flex flex-col justify-between">
                          <div className="flex items-center gap-1.5 text-gray-400 mb-3">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[11px] font-bold font-mono">{String(item._id).padStart(2, '0')}:00</span>
                          </div>
                          <div>
                            <p className="text-base font-bold text-gray-800 leading-none mb-1">{item.count}</p>
                            <p className="text-[10px] font-medium text-gray-400">lượt xe</p>
                          </div>
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden mt-3">
                            <div className="h-full bg-gray-900 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400 py-6 text-center col-span-5">Không có dữ liệu cao điểm</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Occupancy rate and session details */}
            <div className="col-span-1 space-y-6">
              {/* Occupancy Rate by Vehicle Type */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">Tỷ lệ lấp đầy theo loại xe</h2>
                  <p className="text-xs text-gray-400 mt-1 mb-5">Số vị trí đỗ đang hoạt động / tổng số chỗ đỗ</p>
                  
                  <div className="space-y-4">
                    {occupancyStatsList.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center">Không có dữ liệu lấp đầy chỗ đỗ</p>
                    ) : (
                      occupancyStatsList.map((stat: any, idx: number) => {
                        const pct = stat.total > 0 ? Math.round((stat.occupied / stat.total) * 100) : 0;
                        return (
                          <div key={idx} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                            <div className="flex items-center justify-between text-xs font-semibold mb-2">
                              <span className="text-gray-700">{stat.name}</span>
                              <span className="text-gray-500 font-mono">
                                {stat.occupied}/{stat.total} chỗ
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pct > 80 ? "bg-rose-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500"
                                }`} 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                            <div className="flex justify-between items-center mt-1.5">
                              <span className="text-[10px] text-gray-400">Đã lấp đầy</span>
                              <span className={`text-[10px] font-bold ${
                                pct > 80 ? "text-rose-600" : pct > 50 ? "text-amber-600" : "text-emerald-600"
                              }`}>
                                {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Extra Stats Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-800 mb-4">Các chỉ số phụ khác</h2>
                
                <div className="space-y-4 font-sans text-xs">
                  <div className="flex justify-between items-center p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                    <span className="font-semibold text-gray-500">Thời gian đỗ trung bình</span>
                    <span className="font-bold text-gray-800">
                      {sessions?.summary?.avgDurationHours?.toFixed(1) || 0} giờ
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                    <span className="font-semibold text-gray-500">Phí đỗ trung bình / lượt</span>
                    <span className="font-bold text-gray-800">
                      {(sessions?.summary?.avgFee || 0).toLocaleString()} ₫
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                    <span className="font-semibold text-gray-500">Số lượt đỗ quá giờ</span>
                    <span className="font-bold text-gray-800 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                        {sessions?.summary?.totalOvertime || 0} lượt
                      </span>
                      <span className="text-gray-400">
                        ({sessions?.summary?.totalSessions ? Math.round((sessions.summary.totalOvertime / sessions.summary.totalSessions) * 100) : 0}%)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
