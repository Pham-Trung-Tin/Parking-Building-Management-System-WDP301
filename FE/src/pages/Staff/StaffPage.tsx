import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LogIn, 
  LogOut, 
  Eye, 
  AlertTriangle, 
  Bell, 
  User, 
  RefreshCw,
  CarFront,
  Truck,
  Bike,
  Car,
  ArrowRight,
  Printer,
  ShieldAlert
} from 'lucide-react';
import useProfile from '../../hooks/useProfile';

const StaffPage = () => {
  const { profile } = useProfile();
  const [selectedVehicle, setSelectedVehicle] = useState('car');

  const vehicleTypes = [
    { id: 'car', label: 'CAR', icon: Car },
    { id: 'suv', label: 'SUV', icon: CarFront },
    { id: 'motorcycle', label: 'MOTORCYCLE', icon: Bike },
    { id: 'truck', label: 'TRUCK', icon: Truck },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between">
        <div>
          <div className="p-6">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">ParkingOps</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Staff Suite</p>
          </div>
          
          <nav className="mt-6 flex flex-col space-y-1">
            <Link to="/staff" className="flex items-center px-6 py-3 bg-gray-50 border-r-4 border-gray-900 text-gray-900 font-medium w-full text-left">
              <LogIn className="w-5 h-5 mr-3 text-gray-700" />
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
            <Link to="/staff/exceptions" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <AlertTriangle className="w-5 h-5 mr-3 text-gray-400" />
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
            <div className="flex items-center px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Entry Lane 01 Active
            </div>
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
          <div className="max-w-6xl mx-auto flex gap-8">
            {/* Left Column (Forms & Actions) */}
            <div className="flex-1 flex flex-col space-y-8">
              
              {/* License Plate Section */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">License Plate</h3>
                <div className="bg-white border border-gray-200 p-8 flex items-center justify-center min-h-[160px] shadow-sm">
                  <span className="text-6xl font-light text-gray-300 tracking-wider">ABC-1234</span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500">Automatic recognition confidence: 98%</span>
                  <button className="flex items-center text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    RE-SCAN
                  </button>
                </div>
              </section>

              {/* Vehicle Classification */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Vehicle Classification</h3>
                <div className="grid grid-cols-4 gap-4">
                  {vehicleTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedVehicle === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedVehicle(type.id)}
                        className={`flex flex-col items-center justify-center p-6 border transition-all ${
                          isSelected 
                            ? 'border-gray-900 shadow-md bg-white' 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-400'
                        }`}
                      >
                        <Icon className={`w-8 h-8 mb-3 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`} />
                        <span className={`text-xs font-bold tracking-wider ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                          {type.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Actions */}
              <section className="pt-4 flex flex-col space-y-4">
                <button className="w-full bg-black text-white py-5 text-lg font-bold flex items-center justify-center hover:bg-gray-900 transition-colors shadow-lg group">
                  Create Session
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex gap-4">
                  <button className="flex-1 bg-white border border-gray-200 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wider">
                    Print Ticket
                  </button>
                  <button className="flex-1 bg-white border border-gray-200 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wider">
                    Manual Override
                  </button>
                </div>
              </section>

            </div>

            {/* Right Column (Status & Info) */}
            <div className="w-[380px] flex flex-col space-y-8">
              
              {/* Camera View */}
              <section>
                <div className="relative bg-gray-200 aspect-video overflow-hidden border border-gray-200 shadow-sm">
                  {/* Since we can't reliably load local generated files easily on windows dev server without moving them, we use a placeholder image that looks like a cctv */}
                  <img 
                    src="https://images.unsplash.com/photo-1621570273836-5b4d70908865?auto=format&fit=crop&q=80&w=600" 
                    alt="Camera Feed" 
                    className="w-full h-full object-cover grayscale opacity-80 mix-blend-multiply"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                    CAM-01-LIVE
                  </div>
                </div>
              </section>

              {/* Recommended Allocation */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Recommended Allocation</h3>
                <div className="flex flex-col space-y-3">
                  <div className="bg-white border border-gray-200 p-4 shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">ZONE A: GROUND FLOOR</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Best for oversized vehicles</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">42%</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Occupancy</p>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 p-4 shadow-sm flex items-center justify-between opacity-60">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">ZONE B: LEVEL 2</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Standard height only</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">88%</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Occupancy</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Infrastructure Status */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Infrastructure Status</h3>
                <div className="bg-white border border-gray-200 p-5 shadow-sm flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-700">
                      <AlertTriangle className="w-4 h-4 mr-3 text-gray-400" />
                      Gate Arm 01
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase">Closed</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-700">
                      <Printer className="w-4 h-4 mr-3 text-gray-400" />
                      Printer 01
                    </div>
                    <span className="text-xs font-bold text-green-600 uppercase">Online</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-700">
                      <ShieldAlert className="w-4 h-4 mr-3 text-gray-400" />
                      Entry Beacon
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase">Ready</span>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffPage;
