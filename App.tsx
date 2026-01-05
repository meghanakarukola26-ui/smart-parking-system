
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layout, 
  Car, 
  MapPin, 
  History, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  QrCode,
  Sparkles,
  Info
} from 'lucide-react';
import { User, ParkingSlot, ParkingStatus, VehicleType, UserRole, ParkingHistory } from './types';
import { getParkingInsights } from './services/geminiService';

// Initial Mock Data
const INITIAL_SLOTS: ParkingSlot[] = [
  { id: 'A1', location: 'Lot A', status: ParkingStatus.AVAILABLE, capacity: 1, type: VehicleType.FOUR_WHEELER },
  { id: 'A2', location: 'Lot A', status: ParkingStatus.AVAILABLE, capacity: 1, type: VehicleType.FOUR_WHEELER },
  { id: 'A3', location: 'Lot A', status: ParkingStatus.OCCUPIED, currentUserId: 'guest-1', entryTime: new Date(Date.now() - 3600000).toISOString(), capacity: 1, type: VehicleType.FOUR_WHEELER },
  { id: 'B1', location: 'Lot B', status: ParkingStatus.AVAILABLE, capacity: 1, type: VehicleType.TWO_WHEELER },
  { id: 'B2', location: 'Lot B', status: ParkingStatus.AVAILABLE, capacity: 1, type: VehicleType.TWO_WHEELER },
  { id: 'B3', location: 'Lot B', status: ParkingStatus.AVAILABLE, capacity: 1, type: VehicleType.TWO_WHEELER },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>(INITIAL_SLOTS);
  const [view, setView] = useState<'dashboard' | 'map' | 'history' | 'staff'>('dashboard');
  const [insight, setInsight] = useState<string>('Analyzing your parking habits...');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Auth Simulation
  const handleLogin = (role: UserRole) => {
    setIsLoggingIn(true);
    setTimeout(() => {
      const newUser: User = {
        id: role === UserRole.STAFF ? 'staff-001' : 'user-001',
        name: role === UserRole.STAFF ? 'Staff Member' : 'Alice Johnson',
        email: role === UserRole.STAFF ? 'staff@park.pro' : 'alice@example.com',
        role: role,
        vehicle: { regNo: 'ABC-1234', type: VehicleType.FOUR_WHEELER },
        history: []
      };
      setUser(newUser);
      setIsLoggingIn(false);
      if (role === UserRole.STAFF) setView('staff');
    }, 800);
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
  };

  // Booking Logic
  const bookSlot = (slotId: string) => {
    if (!user) return;
    setSlots(prev => prev.map(slot => {
      if (slot.id === slotId && slot.status === ParkingStatus.AVAILABLE) {
        return {
          ...slot,
          status: ParkingStatus.OCCUPIED,
          currentUserId: user.id,
          entryTime: new Date().toISOString()
        };
      }
      return slot;
    }));
  };

  const releaseSlot = (slotId: string) => {
    setSlots(prev => prev.map(slot => {
      if (slot.id === slotId) {
        // Calculate charges
        const entry = new Date(slot.entryTime!).getTime();
        const exit = new Date().getTime();
        const hours = Math.max(1, (exit - entry) / 3600000);
        const rate = slot.type === VehicleType.FOUR_WHEELER ? 2 : 1;
        const total = Math.round(hours * rate * 100) / 100;

        const record: ParkingHistory = {
          id: Math.random().toString(36).substr(2, 9),
          userId: slot.currentUserId!,
          slotId: slot.id,
          location: slot.location,
          entryTime: slot.entryTime!,
          exitTime: new Date().toISOString(),
          charges: total,
          status: 'completed'
        };

        if (user && user.id === slot.currentUserId) {
          setUser({ ...user, history: [record, ...user.history] });
        }

        return {
          ...slot,
          status: ParkingStatus.AVAILABLE,
          currentUserId: undefined,
          entryTime: undefined
        };
      }
      return slot;
    }));
  };

  // Gemini Integration
  useEffect(() => {
    if (user && user.role === UserRole.USER) {
      getParkingInsights(user.history, slots, user).then(res => {
        if (res) setInsight(res);
      });
    }
  }, [user, slots]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 space-y-8 border border-slate-100">
          <div className="text-center space-y-2">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Car className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">SmartPark Pro</h1>
            <p className="text-slate-500">AI-Powered Parking Management System</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => handleLogin(UserRole.USER)}
              disabled={isLoggingIn}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? 'Connecting...' : <><UserIcon size={20} /> Login as Resident</>}
            </button>
            <button 
              onClick={() => handleLogin(UserRole.STAFF)}
              disabled={isLoggingIn}
              className="w-full bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 font-semibold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck size={20} /> Staff Portal
            </button>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <p className="text-xs text-center text-slate-400 leading-relaxed italic">
              "Providing seamless urban mobility solutions through intelligent infrastructure."
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeParking = slots.find(s => s.currentUserId === user.id);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0 lg:pl-64">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col p-6 z-30">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Car className="text-white" size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">SmartPark</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavBtn active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Car size={20} />} label="Dashboard" />
          <NavBtn active={view === 'map'} onClick={() => setView('map')} icon={<MapPin size={20} />} label="View Lots" />
          <NavBtn active={view === 'history'} onClick={() => setView('history')} icon={<History size={20} />} label="Activity Logs" />
          {user.role === UserRole.STAFF && (
            <NavBtn active={view === 'staff'} onClick={() => setView('staff')} icon={<ShieldCheck size={20} />} label="Staff Panel" />
          )}
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 font-medium p-3 rounded-xl hover:bg-red-50 transition-colors">
          <LogOut size={20} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="p-4 lg:p-8 max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome, {user.name}</h2>
            <p className="text-slate-500">
              {user.role === UserRole.STAFF ? 'System Administrator Control' : `${user.vehicle.regNo} (${user.vehicle.type})`}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-slate-600">Live Status</span>
          </div>
        </header>

        {view === 'dashboard' && (
          <div className="space-y-6">
            {/* Gemini Insight Box */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <Sparkles className="absolute top-4 right-4 opacity-30" size={48} />
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
                  <Sparkles size={16} />
                </div>
                <span className="text-sm font-semibold uppercase tracking-wider opacity-90">AI Smart Insight</span>
              </div>
              <p className="text-xl font-medium leading-snug">{insight}</p>
            </div>

            {/* Current Session Card */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Car className="text-blue-600" /> Current Parking Session
              </h3>
              {activeParking ? (
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-400 font-semibold mb-1">LOCATION</p>
                        <p className="text-lg font-bold">{activeParking.location}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-400 font-semibold mb-1">SLOT ID</p>
                        <p className="text-lg font-bold text-blue-600">{activeParking.id}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs text-slate-400 font-semibold mb-1">ENTRY TIME</p>
                      <p className="text-lg font-medium">{new Date(activeParking.entryTime!).toLocaleTimeString()}</p>
                    </div>
                    <button 
                      onClick={() => releaseSlot(activeParking.id)}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-95"
                    >
                      End Session & Pay
                    </button>
                  </div>
                  <div className="bg-slate-100 w-48 h-48 rounded-2xl flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-slate-300">
                    <QrCode size={80} className="text-slate-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-tighter">Your Entry Pass</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Car className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500 font-medium mb-6">No active session found</p>
                  <button 
                    onClick={() => setView('map')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all"
                  >
                    Find a Slot
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Available Slots" value={slots.filter(s => s.status === ParkingStatus.AVAILABLE).length.toString()} icon={<MapPin className="text-emerald-500" />} />
              <StatCard label="Your Total Visits" value={user.history.length.toString()} icon={<History className="text-blue-500" />} />
              <StatCard label="Current Rate" value={user.vehicle.type === VehicleType.FOUR_WHEELER ? "$2.00 / hr" : "$1.00 / hr"} icon={<Info className="text-orange-500" />} />
            </div>
          </div>
        )}

        {view === 'map' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Real-time Slot Availability</h3>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-sm font-medium"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Available</span>
                <span className="flex items-center gap-1.5 text-sm font-medium"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Occupied</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {['Lot A', 'Lot B'].map(lot => (
                <div key={lot} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h4 className="text-lg font-bold mb-4 flex items-center justify-between">
                    {lot}
                    <span className="text-sm font-normal text-slate-400">
                      {slots.filter(s => s.location === lot && s.status === ParkingStatus.AVAILABLE).length} / {slots.filter(s => s.location === lot).length} free
                    </span>
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {slots.filter(s => s.location === lot).map(slot => (
                      <button
                        key={slot.id}
                        disabled={slot.status !== ParkingStatus.AVAILABLE || !!activeParking}
                        onClick={() => bookSlot(slot.id)}
                        className={`
                          relative p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2
                          ${slot.status === ParkingStatus.AVAILABLE 
                            ? 'border-green-100 bg-green-50 hover:border-green-400 cursor-pointer active:scale-95' 
                            : 'border-red-100 bg-red-50 opacity-70 cursor-not-allowed'}
                        `}
                      >
                        <span className="text-xs font-bold text-slate-400">{slot.id}</span>
                        <Car size={24} className={slot.status === ParkingStatus.AVAILABLE ? 'text-green-500' : 'text-red-500'} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{slot.type}</span>
                        {slot.currentUserId === user.id && (
                          <div className="absolute top-1 right-1 bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full">YOU</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!!activeParking && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-center gap-3 text-orange-800">
                <Info size={20} />
                <p className="text-sm font-medium">You already have an active booking at {activeParking.location} ({activeParking.id}). Finish it before booking another.</p>
              </div>
            )}
          </div>
        )}

        {view === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Parking Logs</h3>
              <button className="text-sm text-blue-600 font-semibold hover:underline">Download Report</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Slot</th>
                    <th className="px-6 py-4">Entry</th>
                    <th className="px-6 py-4">Exit</th>
                    <th className="px-6 py-4">Charges</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {user.history.length > 0 ? (
                    user.history.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{log.slotId}</span>
                            <span className="text-xs text-slate-400">({log.location})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(log.entryTime).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{log.exitTime ? new Date(log.exitTime).toLocaleString() : '-'}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">${log.charges.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No history available yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'staff' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                <div className="bg-blue-100 p-6 rounded-full mb-6">
                  <QrCode size={48} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Simulate Scan</h3>
                <p className="text-slate-500 mb-8">Process vehicle entry or exit by scanning customer QR codes.</p>
                <div className="w-full space-y-4">
                  <input type="text" placeholder="Paste QR JSON data string..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl transition-all active:scale-95">Manual Entry Process</button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold mb-6">Management Tools</h3>
                <div className="space-y-4">
                  <AdminTool label="Clear All Lots" sub="Reset occupancy status" color="red" />
                  <AdminTool label="Export Daily Revenue" sub="Generate CSV spreadsheet" color="blue" />
                  <AdminTool label="System Health Check" sub="Run diagnostic on sensors" color="emerald" />
                  <AdminTool label="Notification Broadcast" sub="Send alert to all users" color="orange" />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 p-8 rounded-3xl text-white">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="text-blue-400" /> Administrative Notice
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                As a staff member, your actions are logged for security purposes. Unauthorized status overrides are subject to audit. 
                Use the QR simulator above to test entry/exit logic flows during this POC phase.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-50 rounded-t-[2rem] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <MobNavBtn active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Car size={24} />} />
        <MobNavBtn active={view === 'map'} onClick={() => setView('map')} icon={<MapPin size={24} />} />
        <MobNavBtn active={view === 'history'} onClick={() => setView('history')} icon={<History size={24} />} />
        {user.role === UserRole.STAFF ? (
          <MobNavBtn active={view === 'staff'} onClick={() => setView('staff')} icon={<ShieldCheck size={24} />} />
        ) : (
          <button onClick={handleLogout} className="text-slate-400 p-2"><LogOut size={24} /></button>
        )}
      </nav>
    </div>
  );
};

// Sub-components
const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl font-medium transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
  >
    {icon} {label}
  </button>
);

const MobNavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ active, onClick, icon }) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 'text-slate-400 hover:bg-slate-50'}`}
  >
    {icon}
  </button>
);

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const AdminTool: React.FC<{ label: string; sub: string; color: string }> = ({ label, sub, color }) => {
  const colorMap: Record<string, string> = {
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <button className={`w-full text-left p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors`}>
      <div>
        <p className="font-bold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
      <div className={`p-2 rounded-lg ${colorMap[color] || 'bg-slate-50'}`}>
        <ShieldCheck size={16} />
      </div>
    </button>
  );
};

export default App;
