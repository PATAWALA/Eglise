import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
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
  Gift,
  Settings,
  Edit,
  Save,
  X as XIcon,
  Power,
  AlertTriangle,
  StopCircle,
  Lock
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

// ========== INTERFACES ==========
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

interface SiteSettings {
  id: number;
  maintenance_mode: boolean;
}

const COLORS = ['#8b5cf6', '#ec489a', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord', color: '#8b5cf6', bgColor: '#ede9fe' },
  { id: 'requests', icon: UserPlus, label: 'Demandes', color: '#f97316', bgColor: '#fff7ed' },
  { id: 'partners', icon: Users, label: 'Partenaires', color: '#10b981', bgColor: '#ecfdf5' },
  { id: 'admins', icon: TrendingUp, label: 'Administrateurs', color: '#3b82f6', bgColor: '#eff6ff' },
  { id: 'settings', icon: Settings, label: 'Paramètres', color: '#6b7280', bgColor: '#f3f4f6' }
];

const AdminDashboard = () => {
  // ========== ETATS GENERAUX ==========
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<'dashboard' | 'partners' | 'requests' | 'admins' | 'settings'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [requests, setRequests] = useState<PartnershipRequest[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  
  // Filtres Dashboard
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour l'édition des admins
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminEmail, setEditAdminEmail] = useState('');
  
  // État pour le changement de mot de passe (admin connecté)
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Modals
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);
  const [maintenanceConfirmText, setMaintenanceConfirmText] = useState('');
  const [showDeleteAllAdminsConfirm, setShowDeleteAllAdminsConfirm] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');
  
  // Graphiques : forcer le re-render
  const [chartKey, setChartKey] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

  // ========== CHARGEMENT ==========
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    if (!isAuthenticated) navigate('/admin-login');
    const adminId = sessionStorage.getItem('admin_id');
    if (adminId) setCurrentAdminId(adminId);
  }, [navigate]);

  useEffect(() => {
    loadAllData();
    loadSiteSettings();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setChartKey(prev => prev + 1);
        window.dispatchEvent(new Event('resize'));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      setChartKey(prev => prev + 1);
    });
    resizeObserver.observe(contentRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadDonations(), loadPartners(), loadRequests(), loadAdmins()]);
    setLoading(false);
  };

  const loadDonations = async () => {
    const { data, error } = await supabase.from('donations').select('*').order('date', { ascending: false });
    if (error) console.error('Erreur chargement dons:', error);
    else setDonations(data || []);
  };

  const loadPartners = async () => {
    const { data, error } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
    if (error) console.error('Erreur chargement partenaires:', error);
    else setPartners(data || []);
  };

  const loadRequests = async () => {
    const { data, error } = await supabase.from('partnership_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (error) console.error('Erreur chargement demandes:', error);
    else setRequests(data || []);
  };

  const loadAdmins = async () => {
    const { data, error } = await supabase.from('admins').select('*').order('created_at', { ascending: false });
    if (error) console.error('Erreur chargement admins:', error);
    else setAdmins(data || []);
  };

  const loadSiteSettings = async () => {
    const { data, error } = await supabase.from('site_settings').select('*').maybeSingle();
    if (error || !data) {
      setSiteSettings({ id: 1, maintenance_mode: false });
    } else {
      setSiteSettings(data);
    }
  };

  // ========== FONCTIONS PARTENAIRES ==========
  const updatePartnerStatus = async (partnerId: string, newStatus: string) => {
    const { error } = await supabase
      .from('partners')
      .update({ status: newStatus })
      .eq('id', partnerId);
    if (error) {
      alert('Erreur lors du changement de statut');
    } else {
      await loadPartners();
      alert(`Statut mis à jour : ${newStatus === 'approved' ? 'Approuvé' : 'Rejeté'}`);
    }
  };

  const removePartner = async (partner: Partner) => {
    if (!confirm(`Supprimer définitivement ${partner.name} ?`)) return;
    const { error } = await supabase.from('partners').delete().eq('id', partner.id);
    if (error) alert('Erreur lors de la suppression');
    else await loadPartners();
  };

  // ========== FONCTIONS DEMANDES ==========
  const approvePartner = async (request: PartnershipRequest) => {
    try {
      const adminId = sessionStorage.getItem('admin_id');
      await supabase.from('partners').delete().eq('email', request.email);
      await supabase.from('partners').insert({
        id: crypto.randomUUID(), email: request.email, name: request.name,
        phone: request.phone, age: request.age, status: 'approved',
        reviewed_by: adminId, reviewed_at: new Date().toISOString()
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

  // ========== FONCTIONS ADMINISTRATEURS ==========
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

  const deleteAdmin = async (adminId: string, adminEmail: string) => {
    if (currentAdminId === adminId) {
      alert("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    if (!confirm(`Supprimer définitivement ${adminEmail} ?`)) return;
    const { error } = await supabase.from('admins').delete().eq('id', adminId);
    if (error) alert("Erreur lors de la suppression");
    else {
      await loadAdmins();
      alert("Administrateur supprimé");
    }
  };

  const deleteAllAdminsExceptCurrent = async () => {
    if (!currentAdminId) return;
    const otherAdmins = admins.filter(a => a.id !== currentAdminId);
    if (otherAdmins.length === 0) {
      alert("Aucun autre administrateur à supprimer.");
      return;
    }
    for (const admin of otherAdmins) {
      await supabase.from('admins').delete().eq('id', admin.id);
    }
    await loadAdmins();
    alert(`${otherAdmins.length} administrateur(s) supprimé(s).`);
    setShowDeleteAllAdminsConfirm(false);
    setDeleteAllConfirmText('');
  };

  const updateAdminInfo = async (adminId: string, newName: string, newEmail: string) => {
    const { error: updateError } = await supabase
      .from('admins')
      .update({ name: newName, email: newEmail })
      .eq('id', adminId);
    if (updateError) {
      alert("Erreur lors de la mise à jour");
      return false;
    }
    await loadAdmins();
    setEditingAdminId(null);
    return true;
  };

  const changeMyPassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError(error.message);
    } else {
      alert("Mot de passe modifié avec succès !");
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    }
  };

  // ========== FONCTIONS MAINTENANCE ==========
  const toggleMaintenanceMode = async (enable: boolean) => {
    if (!siteSettings) return;
    const { error } = await supabase
      .from('site_settings')
      .update({ maintenance_mode: enable })
      .eq('id', siteSettings.id);
    if (error) {
      alert('Erreur lors du changement de mode maintenance');
    } else {
      setSiteSettings({ ...siteSettings, maintenance_mode: enable });
      alert(enable ? 'Site mis en maintenance' : 'Site réactivé');
    }
    setShowMaintenanceConfirm(false);
    setMaintenanceConfirmText('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_id');
    navigate('/');
  };

  // ========== FILTRES & STATS DASHBOARD ==========
  const getFilteredByPeriod = (donationsList: Donation[]) => {
    const now = new Date();
    switch (filterPeriod) {
      case 'today': return donationsList.filter(d => new Date(d.date) >= startOfDay(now) && new Date(d.date) <= endOfDay(now));
      case 'week': return donationsList.filter(d => new Date(d.date) >= subDays(now, 7));
      case 'month': return donationsList.filter(d => new Date(d.date) >= subMonths(now, 1));
      default: return donationsList;
    }
  };

  const filteredDonations = useMemo(() => {
    let result = getFilteredByPeriod(donations);
    if (searchTerm) {
      result = result.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone.includes(searchTerm)
      );
    }
    if (filterType !== 'all') result = result.filter(d => d.donation_type === filterType);
    if (filterPayment !== 'all') result = result.filter(d => d.payment_method === filterPayment);
    return result;
  }, [donations, filterPeriod, searchTerm, filterType, filterPayment]);

  const totalAmount = useMemo(() => filteredDonations.reduce((sum, d) => sum + d.amount, 0), [filteredDonations]);
  const uniqueDonors = useMemo(() => new Set(filteredDonations.map(d => d.phone)).size, [filteredDonations]);
  const donationCount = filteredDonations.length;
  const averageAmount = donationCount > 0 ? totalAmount / donationCount : 0;

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

  const donationTypesData = useMemo(() => {
    const typesMap = new Map<string, number>();
    filteredDonations.forEach(d => typesMap.set(d.donation_type, (typesMap.get(d.donation_type) || 0) + d.amount));
    const result = Array.from(typesMap.entries()).map(([name, value]) => ({ name, value }));
    return result.length > 0 ? result : [{ name: 'Aucun don', value: 0 }];
  }, [filteredDonations]);

  const paymentMethodsData = useMemo(() => {
    const methodsMap = new Map<string, number>();
    filteredDonations.forEach(d => methodsMap.set(d.payment_method, (methodsMap.get(d.payment_method) || 0) + 1));
    const result = Array.from(methodsMap.entries()).map(([name, value]) => ({ name, value }));
    return result.length > 0 ? result : [{ name: 'Aucun don', value: 0 }];
  }, [filteredDonations]);

  const topDonorsList = useMemo(() => {
    const donorsMap = new Map<string, { name: string; phone: string; city: string; total: number; count: number }>();
    filteredDonations.forEach(d => {
      if (donorsMap.has(d.phone)) {
        const existing = donorsMap.get(d.phone)!;
        existing.total += d.amount;
        existing.count++;
      } else {
        donorsMap.set(d.phone, { name: d.name, phone: d.phone, city: d.city, total: d.amount, count: 1 });
      }
    });
    return Array.from(donorsMap.values()).sort((a, b) => b.total - a.total).slice(0, 10);
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
  const rejectedPartners = partners.filter(p => p.status === 'rejected').length;
  const pendingPartners = partners.filter(p => p.status === 'pending').length;

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Chargement...</p>
        </div>
      </div>
    );
  }

  // ========== RENDU PRINCIPAL ==========
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className={`hidden md:block fixed h-screen z-30 bg-white shadow-xl transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`p-5 border-b flex ${sidebarCollapsed ? 'justify-center' : 'justify-between'} items-center h-20`}>
          {!sidebarCollapsed && <h1 className="text-xl font-bold text-purple-700">Dieu est bon</h1>}
          <button type="button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-lg hover:bg-gray-100 transition" aria-label="Réduire/Agrandir">
            {sidebarCollapsed ? <Menu size={20} className="text-gray-500" /> : <X size={20} className="text-gray-500" />}
          </button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-5rem)]">
          {menuItems.map((item) => {
            let badgeCount = 0;
            if (item.id === 'requests') badgeCount = pendingRequests;
            if (item.id === 'partners') badgeCount = partners.length;
            if (item.id === 'admins') badgeCount = admins.length;
            if (item.id === 'settings' && siteSettings?.maintenance_mode) badgeCount = 1;
            
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setActivePage(item.id as any)}
                className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  activePage === item.id ? 'bg-gray-100' : 'text-gray-600 hover:bg-gray-50'
                }`}
                aria-label={item.label}
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
                  <span className="absolute -right-1 top-1/2 -translate-y-1/2 bg-red-100 text-red-600 text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-3 border-t bg-white">
          <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all" aria-label="Déconnexion">
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Sidebar mobile (overlay) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-transform duration-300 md:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64`}>
        <div className="p-5 border-b flex justify-between items-center h-20">
          <h1 className="text-xl font-bold text-purple-700">Dieu est bon</h1>
          <button type="button" onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-5rem)]">
          {menuItems.map((item) => {
            let badgeCount = 0;
            if (item.id === 'requests') badgeCount = pendingRequests;
            if (item.id === 'partners') badgeCount = partners.length;
            if (item.id === 'admins') badgeCount = admins.length;
            if (item.id === 'settings' && siteSettings?.maintenance_mode) badgeCount = 1;
            
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => { setActivePage(item.id as any); setMobileSidebarOpen(false); }}
                className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  activePage === item.id ? 'bg-gray-100' : 'text-gray-600 hover:bg-gray-50'
                }`}
                aria-label={item.label}
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
                <span className={`flex-1 text-left text-sm font-medium ${activePage === item.id ? 'text-gray-900' : 'text-gray-600'}`}>
                  {item.label}
                </span>
                {badgeCount > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-3 border-t bg-white">
          <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut size={20} />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Bouton hamburger mobile */}
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed bottom-4 right-4 z-30 md:hidden bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition"
        aria-label="Ouvrir le menu"
      >
        <Menu size={24} />
      </button>

      {/* MAIN CONTENT - Structure avec flex-col pour header fixe */}
      <main className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} ml-0 flex flex-col h-screen overflow-hidden`}>
        {/* Header fixe - hauteur identique à la sidebar (h-20) */}
        <div className="flex-shrink-0 bg-white shadow-sm border-b border-gray-100 z-20 h-20">
          <div className="px-4 sm:px-6 h-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {activePage === 'dashboard' && 'Tableau de bord'}
                {activePage === 'requests' && 'Demandes de partenariat'}
                {activePage === 'partners' && 'Partenaires'}
                {activePage === 'admins' && 'Administrateurs'}
                {activePage === 'settings' && 'Paramètres avancés'}
              </h2>
              {activePage === 'dashboard' && (
                <p className="text-xs sm:text-sm text-purple-600 mt-0.5">Affichage {getPeriodLabel()}</p>
              )}
            </div>
            {activePage === 'dashboard' && (
              <button
                type="button"
                onClick={exportToCSV}
                disabled={donationCount === 0}
                className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition-all shadow-sm text-sm ${
                  donationCount === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <Download size={16} />
                Exporter CSV
              </button>
            )}
          </div>
        </div>

        {/* Contenu scrollable */}
        <div ref={contentRef} className="flex-1 overflow-y-auto pt-8 sm:pt-6 pb-4 sm:pb-6 px-4 sm:px-6">
          {/* ========== PAGE DASHBOARD ========== */}
          {activePage === 'dashboard' && (
            <>
              {/* Filtres période */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button type="button" onClick={() => setFilterPeriod('all')} className={`px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl transition-all font-medium text-sm flex items-center gap-2 ${filterPeriod === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><LayoutDashboard size={16} /> Tous</button>
                  <button type="button" onClick={() => setFilterPeriod('today')} className={`px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl transition-all font-medium text-sm flex items-center gap-2 ${filterPeriod === 'today' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Calendar size={16} /> Aujourd'hui</button>
                  <button type="button" onClick={() => setFilterPeriod('week')} className={`px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl transition-all font-medium text-sm flex items-center gap-2 ${filterPeriod === 'week' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Clock size={16} /> 7 jours</button>
                  <button type="button" onClick={() => setFilterPeriod('month')} className={`px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl transition-all font-medium text-sm flex items-center gap-2 ${filterPeriod === 'month' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Calendar size={16} /> 30 jours</button>
                  <button type="button" onClick={() => setShowFilters(!showFilters)} className={`px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl transition-all font-medium text-sm flex items-center gap-2 ${showFilters ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Filter size={16} /> Filtres <ChevronDown size={14} className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} /></button>
                </div>
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label><div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Nom, ville ou téléphone..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} aria-label="Rechercher" /></div></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Type de don</label><select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)} aria-label="Filtrer par type"><option value="all">Tous les types</option>{uniqueTypes.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Moyen de paiement</label><select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white text-sm" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} aria-label="Filtrer par paiement"><option value="all">Tous les moyens</option>{uniquePayments.map(method => <option key={method} value={method}>{method}</option>)}</select></div>
                  </div>
                )}
              </div>

              {/* 4 cartes stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6"><div className="flex justify-between items-start"><div><p className="text-gray-500 text-xs sm:text-sm mb-1">Total des dons</p><p className="text-2xl sm:text-3xl font-bold text-purple-700">{totalAmount.toLocaleString()} €</p></div><DollarSign size={28} className="text-purple-200" /></div></div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6"><div className="flex justify-between items-start"><div><p className="text-gray-500 text-xs sm:text-sm mb-1">Donateurs uniques</p><p className="text-2xl sm:text-3xl font-bold text-purple-700">{uniqueDonors}</p></div><Users size={28} className="text-purple-200" /></div></div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6"><div className="flex justify-between items-start"><div><p className="text-gray-500 text-xs sm:text-sm mb-1">Nombre de dons</p><p className="text-2xl sm:text-3xl font-bold text-purple-700">{donationCount}</p></div><Gift size={28} className="text-purple-200" /></div></div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6"><div className="flex justify-between items-start"><div><p className="text-gray-500 text-xs sm:text-sm mb-1">Montant moyen</p><p className="text-2xl sm:text-3xl font-bold text-purple-700">{Math.round(averageAmount).toLocaleString()} €</p></div><TrendingUp size={28} className="text-purple-200" /></div></div>
              </div>

              {/* Graphiques */}
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Répartition par type de don</h3>
                  {donationCount === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">Aucune donnée</div>
                  ) : (
                    <ResponsiveContainer key={`pie-${chartKey}`} width="100%" height={300}>
                      <PieChart>
                        <Pie data={donationTypesData.filter(d => d.value > 0)} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => percent ? `${name} ${(percent * 100).toFixed(0)}%` : name} outerRadius={100} dataKey="value">
                          {donationTypesData.filter(d => d.value > 0).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} €`, 'Montant']} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Répartition par moyen de paiement</h3>
                  {donationCount === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">Aucune donnée</div>
                  ) : (
                    <ResponsiveContainer key={`bar-${chartKey}`} width="100%" height={300}>
                      <BarChart data={paymentMethodsData.filter(d => d.value > 0)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                        <Legend />
                        <Bar dataKey="value" fill="#8b5cf6" name="Nombre de dons" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Évolution */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8">
                <h3 className="font-semibold text-gray-800 mb-4">Évolution des dons (7 derniers jours)</h3>
                <ResponsiveContainer key={`line-${chartKey}`} width="100%" height={300}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${value} €`, 'Montant']} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                    <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top donateurs */}
              {topDonorsList.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8">
                  <h3 className="font-semibold text-gray-800 mb-4">Top donateurs</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px]">
                      <thead className="border-b border-gray-100">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rang</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                          <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nb dons</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {topDonorsList.map((donor, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition">
                            <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-purple-600">#{idx + 1}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 font-medium">{donor.name}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{donor.city}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm font-bold text-purple-600 text-right">{donor.total.toLocaleString()} €</td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 text-center">{donor.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Liste des dons */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Liste des dons ({donationCount})</h3>
                {donationCount === 0 ? (
                  <div className="text-center py-12 text-gray-500">Aucun don pour la période sélectionnée</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="border-b border-gray-100">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                          <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredDonations.slice(0, 50).map((don) => (
                          <tr key={don.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{format(new Date(don.date), 'dd/MM/yyyy HH:mm')}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{don.name}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{don.city}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm font-bold text-purple-600 text-right">{don.amount} €</td>
                            <td className="px-4 sm:px-6 py-4 text-sm"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">{don.donation_type}</span></td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{don.payment_method}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{don.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredDonations.length > 50 && <p className="text-center text-gray-500 text-sm mt-4">Affichage des 50 premiers dons</p>}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ========== PAGE DEMANDES ========== */}
          {activePage === 'requests' && (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center"><CheckCircle size={40} className="mx-auto text-green-300 mb-3" /><p className="text-gray-500">Aucune demande en attente</p></div>
              ) : (
                requests.map((req) => (
                  <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div><h3 className="text-lg font-semibold text-gray-800">{req.name}</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm text-gray-500"><p>{req.email}</p><p>{req.phone}</p><p>{req.age} ans</p><p>{new Date(req.created_at).toLocaleDateString()}</p></div>{req.message && <p className="mt-3 p-3 bg-gray-50 rounded-lg text-gray-600 text-sm">{req.message}</p>}</div>
                      <div className="flex gap-2 flex-wrap">
                        <button type="button" onClick={() => approvePartner(req)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition shadow-sm text-sm"><CheckCircle size={16} /> Approuver</button>
                        <button type="button" onClick={() => rejectRequest(req)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition shadow-sm text-sm"><XCircle size={16} /> Rejeter</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========== PAGE PARTENAIRES ========== */}
          {activePage === 'partners' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                  <p className="text-green-700 text-sm font-medium">Approuvés</p>
                  <p className="text-2xl font-bold text-green-800">{approvedPartners}</p>
                </div>
                <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                  <p className="text-red-700 text-sm font-medium">Rejetés</p>
                  <p className="text-2xl font-bold text-red-800">{rejectedPartners}</p>
                </div>
                <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                  <p className="text-yellow-700 text-sm font-medium">En attente</p>
                  <p className="text-2xl font-bold text-yellow-800">{pendingPartners}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Âge</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date d'adhésion</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {partners.map((partner) => (
                        <tr key={partner.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{partner.name}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{partner.email}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{partner.phone}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{partner.age} ans</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{new Date(partner.created_at).toLocaleDateString()}</td>
                          <td className="px-4 sm:px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              partner.status === 'approved' ? 'bg-green-100 text-green-700' :
                              partner.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {partner.status === 'approved' ? 'Approuvé' : partner.status === 'rejected' ? 'Rejeté' : 'En attente'}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <div className="flex justify-center gap-2 flex-wrap">
                              {partner.status !== 'approved' && (
                                <button type="button" onClick={() => updatePartnerStatus(partner.id, 'approved')} className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-600 transition">Approuver</button>
                              )}
                              {partner.status !== 'rejected' && (
                                <button type="button" onClick={() => updatePartnerStatus(partner.id, 'rejected')} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 transition">Rejeter</button>
                              )}
                              <button type="button" onClick={() => removePartner(partner)} className="text-red-500 hover:text-red-700 transition" title="Supprimer"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========== PAGE ADMINISTRATEURS ========== */}
          {activePage === 'admins' && (
            <div className="space-y-6">
              <button type="button" onClick={() => { const email = prompt('Email du nouvel administrateur:'); const name = prompt('Nom complet:'); const password = prompt('Mot de passe:'); if (email && name && password) addAdmin(email, password, name).catch(alert); }} className="bg-purple-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-purple-700 transition shadow-sm text-sm">Ajouter un administrateur</button>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date d'ajout</th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {admins.map((admin) => (
                        <tr key={admin.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{admin.name}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{admin.email}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{new Date(admin.created_at).toLocaleDateString()}</td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <button type="button" onClick={async () => { if (confirm('Supprimer cet administrateur ?')) { await supabase.from('admins').delete().eq('id', admin.id); loadAdmins(); } }} className="text-red-500 hover:text-red-700 transition"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========== PAGE PARAMÈTRES ========== */}
          {activePage === 'settings' && siteSettings && (
            <div className="space-y-6 sm:space-y-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Gestion des administrateurs</h3>
                  <button type="button" onClick={() => { const email = prompt('Email du nouvel administrateur:'); const name = prompt('Nom complet:'); const password = prompt('Mot de passe:'); if (email && name && password) addAdmin(email, password, name).catch(alert); }} className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition shadow-sm flex items-center gap-2 text-sm"><UserPlus size={16} /> Ajouter un admin</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ajouté le</th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {admins.map((admin) => {
                        const isEditing = editingAdminId === admin.id;
                        return (
                          <tr key={admin.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 sm:px-6 py-4 text-sm">
                              {isEditing ? <input type="text" value={editAdminName} onChange={(e) => setEditAdminName(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 w-full text-sm" aria-label="Nouveau nom" /> : <span className="font-medium text-gray-900">{admin.name}</span>}
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-sm">
                              {isEditing ? <input type="email" value={editAdminEmail} onChange={(e) => setEditAdminEmail(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 w-full text-sm" aria-label="Nouvel email" /> : <span className="text-gray-500">{admin.email}</span>}
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{new Date(admin.created_at).toLocaleDateString()}</td>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              <div className="flex justify-center gap-2 flex-wrap">
                                {isEditing ? (
                                  <>
                                    <button type="button" onClick={() => updateAdminInfo(admin.id, editAdminName, editAdminEmail)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700 flex items-center gap-1"><Save size={14} /> Enregistrer</button>
                                    <button type="button" onClick={() => setEditingAdminId(null)} className="bg-gray-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-gray-600 flex items-center gap-1"><XIcon size={14} /> Annuler</button>
                                  </>
                                ) : (
                                  <>
                                    <button type="button" onClick={() => { setEditingAdminId(admin.id); setEditAdminName(admin.name); setEditAdminEmail(admin.email); }} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 flex items-center gap-1"><Edit size={14} /> Modifier</button>
                                    {currentAdminId === admin.id && (
                                      <button type="button" onClick={() => setShowPasswordForm(true)} className="bg-orange-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-orange-700 flex items-center gap-1"><Lock size={14} /> Changer mdp</button>
                                    )}
                                    <button type="button" onClick={() => deleteAdmin(admin.id, admin.email)} className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-700 flex items-center gap-1"><Trash2 size={14} /> Supprimer</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowDeleteAllAdminsConfirm(true)} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition flex items-center gap-2 text-sm"><Trash2 size={16} /> Supprimer tous les autres administrateurs</button>
                  <p className="text-xs text-gray-400 mt-2">Cette action est irréversible. Vous-même (l'admin connecté) ne serez pas supprimé.</p>
                </div>
              </div>

              <div className="bg-red-50 rounded-2xl shadow-sm border border-red-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2"><StopCircle size={20} className="text-red-600" /> Arrêter le site (mode maintenance)</h3>
                    <p className="text-sm text-red-600 mt-1">Activez cette option pour afficher une page de maintenance aux visiteurs. Seuls les administrateurs pourront accéder au back-office.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${siteSettings.maintenance_mode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {siteSettings.maintenance_mode ? 'Site arrêté' : 'Site actif'}
                    </span>
                    {!siteSettings.maintenance_mode ? (
                      <button type="button" onClick={() => setShowMaintenanceConfirm(true)} className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition shadow-sm flex items-center gap-2 text-sm"><Power size={16} /> Arrêter le site</button>
                    ) : (
                      <button type="button" onClick={() => toggleMaintenanceMode(false)} className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition shadow-sm text-sm">Réactiver le site</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {showMaintenanceConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-4"><AlertTriangle size={24} /><h3 className="text-xl font-bold">Confirmation requise</h3></div>
            <p className="text-gray-600 mb-4 text-sm">Vous allez <strong>arrêter le site</strong> (mode maintenance). Tous les visiteurs verront une page de maintenance.</p>
            <p className="text-gray-600 mb-2 text-sm">Veuillez taper <strong className="font-mono bg-gray-100 px-2 py-1 rounded">ARRÊTER LE SITE</strong> pour confirmer :</p>
            <input type="text" value={maintenanceConfirmText} onChange={(e) => setMaintenanceConfirmText(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2 mb-4 focus:ring-2 focus:ring-red-500 text-sm" placeholder="ARRÊTER LE SITE" aria-label="Confirmation" />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setShowMaintenanceConfirm(false); setMaintenanceConfirmText(''); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Annuler</button>
              <button type="button" onClick={() => { if (maintenanceConfirmText === 'ARRÊTER LE SITE') toggleMaintenanceMode(true); else alert("La phrase saisie est incorrecte."); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Confirmer l'arrêt</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllAdminsConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-4"><AlertTriangle size={24} /><h3 className="text-xl font-bold">Suppression massive</h3></div>
            <p className="text-gray-600 mb-4 text-sm">Vous allez <strong>supprimer tous les autres administrateurs</strong>. Vous seul resterez.</p>
            <p className="text-gray-600 mb-2 text-sm">Tapez <strong className="font-mono bg-gray-100 px-2 py-1 rounded">SUPPRIMER TOUS</strong> pour confirmer :</p>
            <input type="text" value={deleteAllConfirmText} onChange={(e) => setDeleteAllConfirmText(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2 mb-4 focus:ring-2 focus:ring-red-500 text-sm" placeholder="SUPPRIMER TOUS" aria-label="Confirmation" />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setShowDeleteAllAdminsConfirm(false); setDeleteAllConfirmText(''); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Annuler</button>
              <button type="button" onClick={() => { if (deleteAllConfirmText === 'SUPPRIMER TOUS') deleteAllAdminsExceptCurrent(); else alert("La phrase saisie est incorrecte."); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Confirmer la suppression</button>
            </div>
          </div>
        </div>
      )}

      {showPasswordForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl">
            <div className="flex items-center gap-3 text-purple-600 mb-4"><Lock size={24} /><h3 className="text-xl font-bold">Changer mon mot de passe</h3></div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 text-sm" placeholder="••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 text-sm" placeholder="••••••" />
              </div>
              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Annuler</button>
              <button type="button" onClick={changeMyPassword} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">Changer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;