import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LogIn, 
  LogOut, 
  Eye, 
  AlertTriangle, 
  Bell, 
  User, 
  Search,
  CheckCircle2
} from 'lucide-react';
import useProfile from '../../hooks/useProfile';

const StaffExitPage = () => {
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
            <Link to="/staff/exit" className="flex items-center px-6 py-3 bg-gray-50 border-r-4 border-gray-900 text-gray-900 font-medium w-full text-left">
              <LogOut className="w-5 h-5 mr-3 text-gray-700" />
              Exit
            </Link>
            <Link to="/staff/live-view" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <Eye className="w-5 h-5 mr-3 text-gray-400" />
              Live View
            </Link>
            <Link to="/staff/exceptions" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <AlertTriangle className="w-5 h-5 mr-3 text-gray-400" />
              Exceptions
            </Link>
          </nav>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mr-3 overflow-hidden">
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
          <div className="max-w-6xl mx-auto">
            {/* Plate Lookup Section */}
            <section className="mb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Plate Lookup</h3>
              <div className="bg-white border border-gray-200 p-4 shadow-sm flex items-center">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input 
                  type="text" 
                  placeholder="Lookup: GHI-5542" 
                  className="w-full outline-none text-gray-600 text-lg placeholder-gray-300"
                />
              </div>
            </section>

            <div className="flex gap-8">
              {/* Left Column */}
              <div className="flex-1 flex flex-col space-y-6">
                
                {/* Active Session Details */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Active Session Details</h3>
                  <div className="bg-white border border-gray-200 shadow-sm p-6">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Entry Time</p>
                        <p className="font-bold text-gray-900 text-lg">Oct 24, 08:14 AM</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="font-bold text-gray-900 text-lg">06h 42m</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Zone / Level</p>
                        <p className="font-bold text-gray-900 text-lg">North - Level 3</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Vehicle Info</p>
                        <p className="font-bold text-gray-900 text-lg">ABC-1234 (Gray SUV)</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Verification</span>
                      <div className="flex items-center text-green-600 text-sm font-bold">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Payment Validated
                      </div>
                    </div>
                  </div>
                </section>

                {/* History Log */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">History Log</h3>
                  <div className="bg-white border border-gray-200 shadow-sm flex flex-col">
                    <div className="flex items-center border-b border-gray-100 p-4">
                      <span className="w-24 text-xs text-gray-400">08:14 AM</span>
                      <span className="flex-1 text-sm text-gray-700">ANPR Entry Detected</span>
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">System</span>
                    </div>
                    <div className="flex items-center p-4">
                      <span className="w-24 text-xs text-gray-400">02:50 PM</span>
                      <span className="flex-1 text-sm text-gray-700">Payment Received via Kiosk 4</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wider">User</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column (Amount Due) */}
              <div className="w-[380px]">
                <div className="bg-white border border-gray-200 shadow-sm p-8 flex flex-col space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount Due</h3>
                    <p className="text-5xl font-black text-gray-900 tracking-tight">$18.00</p>
                  </div>
                  
                  <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Base Rate (Daily)</span>
                      <span className="font-medium text-gray-900">$15.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Service Fee</span>
                      <span className="font-medium text-gray-900">$3.00</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3 border-t border-gray-100">
                      <span className="font-bold text-gray-900 text-xs uppercase tracking-wider">Balance Due</span>
                      <span className="font-bold text-gray-900">$0.00</span>
                    </div>
                  </div>

                  <div className="pt-6 flex flex-col space-y-4">
                    <button className="w-full bg-black text-white py-4 text-sm font-bold flex items-center justify-center hover:bg-gray-900 transition-colors shadow-lg group">
                      <CheckCircle2 className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                      Process & Release
                    </button>
                    <button className="w-full bg-white border border-gray-200 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wider">
                      Manual Override
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffExitPage;
