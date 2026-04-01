import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  TrendingUp, 
  DollarSign, 
  LogOut,
  Menu,
  X,
  CheckCircle,
  XCircle,
  Trash2,
  Filter,
  ChevronDown,
  Search,
  Download,
  Clock,
  Calendar,
  Gift
} from 'lucide-react';
import { supabase } from './lib/supabase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Donation {
  id: number;
  name: string;
  city: string;
  amount: number;
  donation_type: string;
  payment_method: string;
  phone: string;
  date: string;
}

interface Partner {
  id: string;
  email: string;
  name: string;
  phone: string;
  age: number;
  status: string;
  created_at: string;
}

interface PartnershipRequest {
  id: number;
  name: string;
  email: string;
  phone: string;
  age: number;
  message: string;
  status: string;
  created_at: string;
}

interface Admin {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

const COLORS = ['#8b5cf6', '#ec489a', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord', color: '#8b5cf6', bgColor: '#ede9fe' },
  { id: 'requests', icon: UserPlus, label: 'Demandes', color: '#f97316', bgColor: '#fff7ed' },
  { id: 'partners', icon: Users, label: 'Partenaires', color: '#10b981', bgColor: '#ecfdf5' },
  { id: 'admins', icon: TrendingUp, label: 'Administrateurs', color: '#3b82f6', bgColor: '#eff6ff' }
];

const AdminDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState<'dashboard' | 'partners' | 'requests' | 'admins'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [requests, setRequests] = useState<PartnershipRequest[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  
  // Filtres
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    if (!isAuthenticated) navigate('/admin-login');
  }, [navigate]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadDonations(), loadPartners(), loadRequests(), loadAdmins()]);
    setLoading(false);
  };

  const loadDonations = async () => {
    const { data, error } = await supabase.from('donations').select('*').order('date', { ascending: false });
    if (!error) setDonations(data || []);
  };

  const loadPartners = async () => {
    const { data, error } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
    if (!error) setPartners(data || []);
  };

  const loadRequests = async () => {
    const { data, error } = await supabase.from('partnership_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (!error) setRequests(data || []);
  };

  const loadAdmins = async () => {
    const { data, error } = await supabase.from('admins').select('*').order('created_at', { ascending: false });
    if (!error) setAdmins(data || []);
  };

  const approvePartner = async (request: PartnershipRequest) => {
    const { data: { user } } = await supabase.auth.getUser();
    try {
      await supabase.from('partners').delete().eq('email', request.email);
      await supabase.from('partners').insert({
        id: crypto.randomUUID(), email: request.email, name: request.name,
        phone: request.phone, age: request.age, status: 'approved',
        reviewed_by: user?.id, reviewed_at: new Date().toISOString()
      });
      await supabase.from('partnership_requests').update({ status: 'approved' }).eq('id', request.id);
      await loadAllData();
      alert(`${request.name} a été approuvé avec succès !`);
    } catch (error) { alert('Erreur lors de l\'approbation'); }
  };

  const rejectRequest = async (request: PartnershipRequest) => {
    if (!confirm(`Rejeter la demande de ${request.name} ?`)) return;
    await supabase.from('partnership_requests').update({ status: 'rejected' }).eq('id', request.id);
    await loadRequests();
    alert(`Demande de ${request.name} rejetée.`);
  };

  const removePartner = async (partner: Partner) => {
    if (!confirm(`Supprimer ${partner.name} définitivement ?`)) return;
    await supabase.from('partners').delete().eq('id', partner.id);
    await loadPartners();
  };

  const addAdmin = async (email: string, password: string, name: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password, options: { data: { name, role: 'admin' } }
    });
    if (authError) throw authError;
    if (authData.user) {
      await supabase.from('admins').insert({ id: authData.user.id, email, name });
      await loadAdmins();
      alert(`Administrateur ${name} ajouté avec succès !`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('admin_authenticated');
    navigate('/');
  };

  // === FONCTION DE FILTRAGE PAR PÉRIODE ===
  const getFilteredByPeriod = (donationsList: Donation[]) => {
    const now = new Date();
    switch (filterPeriod) {
      case 'today':
        return donationsList.filter(d => {
          const date = new Date(d.date);
          return date >= startOfDay(now) && date <= endOfDay(now);
        });
      case 'week':
        return donationsList.filter(d => new Date(d.date) >= subDays(now, 7));
      case 'month':
        return donationsList.filter(d => new Date(d.date) >= subMonths(now, 1));
      default:
        return donationsList;
    }
  };

  // === UNE SEULE SOURCE DE VÉRITÉ : filteredDonations ===
  // Cette variable est recalculée à chaque fois que filterPeriod, searchTerm, filterType, filterPayment changent
  const filteredDonations = useMemo(() => {
    // 1. Appliquer le filtre période
    let result = getFilteredByPeriod(donations);
    
    // 2. Appliquer le filtre recherche
    if (searchTerm) {
      result = result.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone.includes(searchTerm)
      );
    }
    
    // 3. Appliquer le filtre type de don
    if (filterType !== 'all') {
      result = result.filter(d => d.donation_type === filterType);
    }
    
    // 4. Appliquer le filtre moyen de paiement
    if (filterPayment !== 'all') {
      result = result.filter(d => d.payment_method === filterPayment);
    }
    
    return result;
  }, [donations, filterPeriod, searchTerm, filterType, filterPayment]);

  // === STATISTIQUES (TOUT dépend de filteredDonations) ===
  const totalAmount = useMemo(() => filteredDonations.reduce((sum, d) => sum + d.amount, 0), [filteredDonations]);
  const uniqueDonors = useMemo(() => new Set(filteredDonations.map(d => d.phone)).size, [filteredDonations]);
  const donationCount = filteredDonations.length;
  const averageAmount = donationCount > 0 ? totalAmount / donationCount : 0;

  // === GRAPHIQUE ÉVOLUTION (basé sur filteredDonations) ===
  const evolutionData = useMemo(() => {
    const now = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayDonations = filteredDonations.filter(d => {
        const donDate = new Date(d.date);
        return donDate >= dayStart && donDate <= dayEnd;
      });
      result.push({
        day: format(date, 'EEE', { locale: fr }),
        amount: dayDonations.reduce((sum, d) => sum + d.amount, 0)
      });
    }
    return result;
  }, [filteredDonations]);

  // === RÉPARTITION PAR TYPE DE DON (basé sur filteredDonations) ===
  const donationTypesData = useMemo(() => {
    const typesMap = new Map<string, number>();
    filteredDonations.forEach(d => {
      typesMap.set(d.donation_type, (typesMap.get(d.donation_type) || 0) + d.amount);
    });
    const result = Array.from(typesMap.entries()).map(([name, value]) => ({ name, value }));
    return result.length > 0 ? result : [{ name: 'Aucun don', value: 0 }];
  }, [filteredDonations]);

  // === RÉPARTITION PAR MOYEN DE PAIEMENT (basé sur filteredDonations) ===
  const paymentMethodsData = useMemo(() => {
    const methodsMap = new Map<string, number>();
    filteredDonations.forEach(d => {
      methodsMap.set(d.payment_method, (methodsMap.get(d.payment_method) || 0) + 1);
    });
    const result = Array.from(methodsMap.entries()).map(([name, value]) => ({ name, value }));
    return result.length > 0 ? result : [{ name: 'Aucun don', value: 0 }];
  }, [filteredDonations]);

  // === TOP DONATEURS (basé sur filteredDonations) ===
  const topDonorsList = useMemo(() => {
    const donorsMap = new Map<string, { name: string; phone: string; city: string; total: number; count: number }>();
    filteredDonations.forEach(d => {
      if (donorsMap.has(d.phone)) {
        const existing = donorsMap.get(d.phone)!;
        existing.total += d.amount;
        existing.count++;
      } else {
        donorsMap.set(d.phone, {
          name: d.name,
          phone: d.phone,
          city: d.city,
          total: d.amount,
          count: 1
        });
      }
    });
    return Array.from(donorsMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredDonations]);

  const exportToCSV = () => {
    const headers = ['Nom', 'Ville', 'Montant', 'Type', 'Méthode', 'Téléphone', 'Date'];
    const rows = filteredDonations.map(d => [
      d.name, d.city, d.amount, d.donation_type, d.payment_method, d.phone,
      format(new Date(d.date), 'dd/MM/yyyy HH:mm')
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dons_${format(new Date(), 'yyyy-MM-dd')}_${filterPeriod}.csv`;
    link.click();
  };

  const uniqueTypes = [...new Set(donations.map(d => d.donation_type))];
  const uniquePayments = [...new Set(donations.map(d => d.payment_method))];
  const pendingRequests = requests.length;
  const approvedPartners = partners.filter(p => p.status === 'approved').length;

  const getPeriodLabel = () => {
    switch (filterPeriod) {
      case 'today': return "aujourd'hui";
      case 'week': return "des 7 derniers jours";
      case 'month': return "des 30 derniers jours";
      default: return "tous les dons";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - inchangée */}
      <aside className={`fixed h-screen z-30 bg-white shadow-xl transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`p-5 border-b flex ${sidebarCollapsed ? 'justify-center' : 'justify-between'} items-center h-20`}>
          {!sidebarCollapsed && <h1 className="text-xl font-bold text-purple-700">Admin Panel</h1>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-lg hover:bg-gray-100 transition">
            {sidebarCollapsed ? <Menu size={20} className="text-gray-500" /> : <X size={20} className="text-gray-500" />}
          </button>
        </div>
        
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-5rem)]">
          {menuItems.map((item) => {
            let badgeCount = 0;
            if (item.id === 'requests') badgeCount = pendingRequests;
            if (item.id === 'partners') badgeCount = approvedPartners;
            if (item.id === 'admins') badgeCount = admins.length;
            
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  activePage === item.id 
                    ? 'bg-gray-100' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div 
                  className="p-1.5 rounded-lg transition-all"
                  style={{ 
                    backgroundColor: activePage === item.id ? item.color : item.bgColor,
                    color: activePage === item.id ? 'white' : item.color
                  }}
                >
                  <item.icon size={18} />
                </div>
                {!sidebarCollapsed && (
                  <>
                    <span className={`flex-1 text-left text-sm font-medium ${activePage === item.id ? 'text-gray-900' : 'text-gray-600'}`}>
                      {item.label}
                    </span>
                    {badgeCount > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </>
                )}
                {sidebarCollapsed && badgeCount > 0 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-100 text-red-600 text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-full p-3 border-t bg-white">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-20 px-6 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {activePage === 'dashboard' && 'Tableau de bord'}
                {activePage === 'requests' && 'Demandes de partenariat'}
                {activePage === 'partners' && 'Partenaires'}
                {activePage === 'admins' && 'Administrateurs'}
              </h2>
              {activePage === 'dashboard' && (
                <p className="text-sm text-purple-600 mt-1">
                  Affichage {getPeriodLabel()}
                  {filterPeriod !== 'all' && donationCount === 0 && " — Aucun don pour cette période"}
                </p>
              )}
            </div>
            {activePage === 'dashboard' && donationCount > 0 && (
              <button onClick={exportToCSV} className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 transition-all shadow-sm">
                <Download size={18} /> Exporter CSV
              </button>
            )}
          </div>
        </header>

        {/* Contenu scrollable */}
        <div className="p-6 overflow-y-auto" style={{ height: 'calc(100vh - 73px)' }}>
          {/* Page Dashboard */}
          {activePage === 'dashboard' && (
            <>
              {/* Filtres période */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => setFilterPeriod('all')}
                    className={`px-5 py-2.5 rounded-xl transition-all font-medium flex items-center gap-2 ${filterPeriod === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <LayoutDashboard size={16} /> Tous
                  </button>
                  <button 
                    onClick={() => setFilterPeriod('today')}
                    className={`px-5 py-2.5 rounded-xl transition-all font-medium flex items-center gap-2 ${filterPeriod === 'today' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <Calendar size={16} /> Aujourd'hui
                  </button>
                  <button 
                    onClick={() => setFilterPeriod('week')}
                    className={`px-5 py-2.5 rounded-xl transition-all font-medium flex items-center gap-2 ${filterPeriod === 'week' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <Clock size={16} /> 7 derniers jours
                  </button>
                  <button 
                    onClick={() => setFilterPeriod('month')}
                    className={`px-5 py-2.5 rounded-xl transition-all font-medium flex items-center gap-2 ${filterPeriod === 'month' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <Calendar size={16} /> 30 derniers jours
                  </button>
                  <button 
                    onClick={() => setShowFilters(!showFilters)} 
                    className={`px-5 py-2.5 rounded-xl transition-all font-medium flex items-center gap-2 ${showFilters ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <Filter size={16} /> Filtres avancés <ChevronDown size={14} className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {showFilters && (
                  <div className="mt-5 pt-5 border-t border-gray-100 grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                      <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Nom, ville ou téléphone..." 
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" 
                          value={searchTerm} 
                          onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type de don</label>
                      <select 
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white" 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                      >
                        <option value="all">Tous les types</option>
                        {uniqueTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Moyen de paiement</label>
                      <select 
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white" 
                        value={filterPayment} 
                        onChange={(e) => setFilterPayment(e.target.value)}
                      >
                        <option value="all">Tous les moyens</option>
                        {uniquePayments.map(method => <option key={method} value={method}>{method}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Statistiques - 4 cartes (basées sur filteredDonations) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Total des dons</p>
                      <p className="text-3xl font-bold text-purple-700">{totalAmount.toLocaleString()} €</p>
                    </div>
                    <DollarSign size={32} className="text-purple-200" />
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Donateurs uniques</p>
                      <p className="text-3xl font-bold text-purple-700">{uniqueDonors}</p>
                    </div>
                    <Users size={32} className="text-purple-200" />
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Nombre de dons</p>
                      <p className="text-3xl font-bold text-purple-700">{donationCount}</p>
                    </div>
                    <Gift size={32} className="text-purple-200" />
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Montant moyen</p>
                      <p className="text-3xl font-bold text-purple-700">{Math.round(averageAmount).toLocaleString()} €</p>
                    </div>
                    <TrendingUp size={32} className="text-purple-200" />
                  </div>
                </div>
              </div>

              {/* Graphiques côte à côte */}
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Répartition par type de don</h3>
                  {donationCount === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">Aucune donnée pour cette période</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie 
                          data={donationTypesData.filter(d => d.value > 0)} 
                          cx="50%" 
                          cy="50%" 
                          labelLine={false} 
                          label={({ name, percent }) => percent ? `${name} ${(percent * 100).toFixed(0)}%` : name} 
                          outerRadius={100} 
                          dataKey="value"
                        >
                          {donationTypesData.filter(d => d.value > 0).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} €`, 'Montant']} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Répartition par moyen de paiement</h3>
                  {donationCount === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">Aucune donnée pour cette période</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={paymentMethodsData.filter(d => d.value > 0)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                        <Legend />
                        <Bar dataKey="value" fill="#8b5cf6" name="Nombre de dons" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Évolution des dons */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <h3 className="font-semibold text-gray-800 mb-4">Évolution des dons (7 derniers jours)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip formatter={(value) => [`${value} €`, 'Montant']} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                    <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top donateurs */}
              {topDonorsList.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                  <h3 className="font-semibold text-gray-800 mb-4">Top donateurs</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rang</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ville</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre de dons</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {topDonorsList.map((donor, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 text-sm font-semibold text-purple-600">#{idx + 1}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">{donor.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{donor.city}</td>
                            <td className="px-6 py-4 text-sm font-bold text-purple-600 text-right">{donor.total.toLocaleString()} €</td>
                            <td className="px-6 py-4 text-sm text-gray-500 text-center">{donor.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Liste des dons */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Liste des dons ({donationCount})</h3>
                {donationCount === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>Aucun don pour la période sélectionnée</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ville</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredDonations.slice(0, 50).map((don) => (
                          <tr key={don.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(don.date), 'dd/MM/yyyy HH:mm')}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{don.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{don.city}</td>
                            <td className="px-6 py-4 text-sm font-bold text-purple-600 text-right">{don.amount} €</td>
                            <td className="px-6 py-4 text-sm"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">{don.donation_type}</span></td>
                            <td className="px-6 py-4 text-sm text-gray-500">{don.payment_method}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{don.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredDonations.length > 50 && (
                      <p className="text-center text-gray-500 text-sm mt-4">Affichage des 50 premiers dons</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Page Demandes - inchangée */}
          {activePage === 'requests' && (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <CheckCircle size={48} className="mx-auto text-green-300 mb-3" />
                  <p className="text-gray-500">Aucune demande en attente</p>
                </div>
              ) : (
                requests.map((req) => (
                  <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                    <div className="flex justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{req.name}</h3>
                        <div className="grid md:grid-cols-2 gap-2 mt-2 text-sm text-gray-500">
                          <p>{req.email}</p>
                          <p>{req.phone}</p>
                          <p>{req.age} ans</p>
                          <p>{new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                        {req.message && <p className="mt-3 p-3 bg-gray-50 rounded-lg text-gray-600 text-sm">{req.message}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => approvePartner(req)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition shadow-sm">
                          <CheckCircle size={16} /> Approuver
                        </button>
                        <button onClick={() => rejectRequest(req)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition shadow-sm">
                          <XCircle size={16} /> Rejeter
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Page Partenaires - inchangée */}
          {activePage === 'partners' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Âge</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date d'adhésion</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {partners.filter(p => p.status === 'approved').map((partner) => (
                      <tr key={partner.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{partner.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{partner.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{partner.phone}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{partner.age} ans</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(partner.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => removePartner(partner)} className="text-red-500 hover:text-red-700 transition" title="Supprimer">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Page Administrateurs - inchangée */}
          {activePage === 'admins' && (
            <div className="space-y-6">
              <button 
                onClick={() => {
                  const email = prompt('Email du nouvel administrateur:');
                  const name = prompt('Nom complet:');
                  const password = prompt('Mot de passe:');
                  if (email && name && password) addAdmin(email, password, name).catch(alert);
                }} 
                className="bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 transition shadow-sm"
              >
                Ajouter un administrateur
              </button>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date d'ajout</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{admin.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{admin.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(admin.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={async () => { 
                              if (confirm('Supprimer cet administrateur ?')) {
                                await supabase.from('admins').delete().eq('id', admin.id); 
                                loadAdmins();
                              }
                            }} 
                            className="text-red-500 hover:text-red-700 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;