import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LogIn, 
  LogOut, 
  Eye, 
  AlertTriangle, 
  Bell, 
  User, 
  Ticket,
  ChevronDown
} from 'lucide-react';
import useProfile from '../../hooks/useProfile';

const StaffExceptionsPage = () => {
  const { profile } = useProfile();
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">ParkingOps</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Staff Suite</p>
          </div>
          
          <nav className="mt-6 flex flex-col space-y-1">
            <Link to="/staff" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <LogIn className="w-5 h-5 mr-3 text-gray-400" />
              Entry
            </Link>
            <Link to="/staff/exit" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <LogOut className="w-5 h-5 mr-3 text-gray-400" />
              Exit
            </Link>
            <Link to="/staff/live-view" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <Eye className="w-5 h-5 mr-3 text-gray-400" />
              Live View
            </Link>
            <Link to="/staff/exceptions" className="flex items-center px-6 py-3 bg-gray-50 border-r-4 border-gray-900 text-gray-900 font-medium w-full text-left">
              <AlertTriangle className="w-5 h-5 mr-3 text-gray-700" />
              Exceptions
            </Link>
          </nav>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white mr-3 overflow-hidden">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{profile?.fullName || 'Loading...'}</p>
            <p className="text-xs text-gray-500 uppercase">{profile?.role ? profile.role.replace('_', ' ') : 'Staff'}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-gray-900 mr-6">Main Street Garage</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-[1200px] mx-auto">
            {/* Page Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Exceptions & Overrides</h1>
                <p className="text-gray-500 text-sm mt-1">Manage manual lot overrides and active security alerts.</p>
              </div>
              <button className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-900 transition-colors shadow-md">
                Sync Revenue Data
              </button>
            </div>

            <div className="flex gap-8 mb-8">
              {/* Left Column (Report Form) */}
              <div className="w-[450px] shrink-0">
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Report New Exception</h3>
                  <div className="bg-white border border-gray-200 p-6 shadow-sm flex flex-col space-y-6">
                    
                    <div className="flex gap-4">
                      <button className="flex-1 flex flex-col items-center justify-center py-6 border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                        <Ticket className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Lost Ticket</span>
                      </button>
                      <button className="flex-1 flex flex-col items-center justify-center py-6 border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                        <AlertTriangle className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Mismatch</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">License Plate (LPR Manual Entry)</label>
                      <input 
                        type="text" 
                        defaultValue="ABC-1234"
                        className="w-full border border-gray-200 p-3 text-gray-900 text-sm outline-none focus:border-gray-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Override Reason</label>
                      <div className="relative">
                        <select className="w-full appearance-none border border-gray-200 p-3 text-gray-900 text-sm outline-none focus:border-gray-400 transition-colors bg-white pr-10">
                          <option>Standard Maintenance</option>
                          <option>VIP Guest</option>
                          <option>Emergency Services</option>
                          <option>System Error</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <button className="w-full border border-gray-200 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wider mt-2">
                      Submit Manual Override
                    </button>

                  </div>
                </section>
              </div>

              {/* Right Column (Lot Topology) */}
              <div className="flex-1">
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Lot Topology: Zone A</h3>
                    <div className="flex items-center space-x-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
                        Occupied
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-black mr-2"></span>
                        Exception
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 p-8 shadow-sm h-[400px] flex flex-col justify-center">
                    {/* Top Row */}
                    <div className="flex justify-between items-end border-b border-gray-200 pb-8 mb-8 relative">
                      {/* Slots */}
                      <div className="w-12 h-16 border border-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A1</div>
                      <div className="w-12 h-16 border border-gray-200 bg-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A2</div>
                      <div className="w-12 h-16 border border-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A3</div>
                      <div className="w-14 h-20 border-2 border-gray-800 bg-black flex items-start justify-center pt-2 text-[10px] text-white">M</div>
                      <div className="w-12 h-16 border border-gray-200 bg-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A5</div>
                      <div className="w-12 h-16 border border-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A6</div>
                      <div className="w-12 h-16 border border-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A7</div>
                      <div className="w-12 h-16 border border-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A8</div>
                      
                      {/* Lane Divider line */}
                      <div className="absolute left-0 right-0 -bottom-4 border-b-2 border-dashed border-gray-300"></div>
                    </div>
                    
                    {/* Bottom Row */}
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-16 border border-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A9</div>
                      <div className="w-12 h-16 border border-gray-200 bg-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A10</div>
                      <div className="w-14 h-20 border-2 border-gray-800 bg-black flex items-end justify-center pb-2 text-[10px] text-white">A11</div>
                      <div className="w-12 h-16 border border-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A12</div>
                      <div className="w-12 h-16 border border-gray-200 bg-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A13</div>
                      <div className="w-12 h-16 border border-gray-200 bg-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A14</div>
                      <div className="w-12 h-16 border border-gray-200 bg-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A15</div>
                      <div className="w-12 h-16 border border-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A16</div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Bottom Section (Log Table) */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Exception Log</h3>
                <div className="text-xs text-gray-500">
                  Filter by: <span className="font-bold text-gray-700">All Statuses</span>
                </div>
              </div>
              <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider font-bold border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-bold">Timestamp</th>
                      <th className="px-6 py-4 font-bold">Reference ID</th>
                      <th className="px-6 py-4 font-bold">Exception Type</th>
                      <th className="px-6 py-4 font-bold">Details</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">14:02:11</td>
                      <td className="px-6 py-4 font-medium text-gray-900">#EX-09412</td>
                      <td className="px-6 py-4">LPR Mismatch</td>
                      <td className="px-6 py-4">Entry Plate: JKL-9011 | Expected: UNK</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Issue</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-xs font-bold text-gray-900 uppercase tracking-wider hover:text-gray-600 transition-colors">Resolve</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">13:55:04</td>
                      <td className="px-6 py-4 font-medium text-gray-900">#EX-09411</td>
                      <td className="px-6 py-4">Lost Ticket</td>
                      <td className="px-6 py-4">Stated Entry: 09:15 AM - Zone B</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Pending</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-xs font-bold text-gray-900 uppercase tracking-wider hover:text-gray-600 transition-colors">Process</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">13:42:58</td>
                      <td className="px-6 py-4 font-medium text-gray-900">#EX-09409</td>
                      <td className="px-6 py-4">Manual Release</td>
                      <td className="px-6 py-4">Staff Override - Service Unit #44</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Resolved</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-xs font-bold text-gray-900 uppercase tracking-wider hover:text-gray-600 transition-colors">View</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffExceptionsPage;
