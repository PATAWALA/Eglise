import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  Heart,
  TrendingUp,
  Download,
  Gift,
  Lock,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
  ChevronRight,
  BarChart3,
  DollarSign,
  Users,
  Award,
  Settings,
  Bell,
  Menu,
  Copy,
  Check,
  Loader2,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Smartphone,
  Church,
  HandHeart,
  Building2,
  Globe,
  UsersRound,
  Shield
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { format, subDays, subMonths, startOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Donation {
  id: number;
  name: string;
  city: string;
  amount: number;
  donation_type: string;
  payment_method: string;
  date: string;
  phone?: string;
}

interface PartnerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  status: string;
  created_at: string;
  address?: string;
  city?: string;
  postal_code?: string;
  bio?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

// Types de dons catholiques (identique à la landing page)
const donationTypes = [
  { id: "dime", name: "Dîme", icon: Church, description: "10% de vos revenus pour l'Église" },
  { id: "offering", name: "Offrande", icon: Heart, description: "Don libre pour l'œuvre de Dieu" },
  { id: "alms", name: "Aumône", icon: HandHeart, description: "Pour les plus démunis" },
  { id: "construction", name: "Construction", icon: Building2, description: "Pour l'entretien et la construction" },
  { id: "missions", name: "Missions", icon: Globe, description: "Soutien aux missionnaires" },
  { id: "social", name: "Œuvres sociales", icon: UsersRound, description: "Actions caritatives" },
];

// Moyens de paiement (identique à la landing page)
const paymentMethods = [
  { id: "mtn", name: "MTN Mobile Money", icon: Smartphone },
  { id: "moov", name: "Moov Money", icon: Smartphone },
  { id: "orange", name: "Orange Money", icon: Smartphone },
  { id: "card", name: "Carte bancaire", icon: CreditCard },
  { id: "mobile", name: "Mobile Money", icon: Smartphone },
];

const PartnerDashboard = () => {
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<PartnerData>>({});
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'donations' | 'analytics' | 'settings'>('overview');
  const [showGiveModal, setShowGiveModal] = useState(false);

  // Formulaire de don (identique à la landing page)
  const [donationForm, setDonationForm] = useState({
    nomComplet: '',
    villeQuartier: '',
    phoneNumber: '',
    donationAmount: '',
    selectedDonationType: 'dime',
    selectedPaymentMethod: 'mtn',
    anonymous: false
  });

  const [donating, setDonating] = useState(false);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();

  // Charger les données
  useEffect(() => {
    loadPartnerData();
    loadPartnerDonations();
    loadNotifications();
  }, []);

  const loadPartnerData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate('/devenir-partenaire');
      return;
    }

    const { data: partnerData } = await supabase
      .from('partners')
      .select('*')
      .eq('id', user.id)
      .single();

    if (partnerData) {
      setPartner(partnerData);
      setProfileForm(partnerData);
      setDonationForm(prev => ({
        ...prev,
        nomComplet: partnerData.name || '',
        villeQuartier: partnerData.city || '',
        phoneNumber: partnerData.phone || ''
      }));
    }
    setLoading(false);
  };

  const loadPartnerDonations = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { data: partnerData } = await supabase
      .from('partners')
      .select('name')
      .eq('id', user.id)
      .single();

    if (partnerData) {
      const { data: donationsData } = await supabase
        .from('donations')
        .select('*')
        .eq('name', partnerData.name)
        .order('date', { ascending: false });

      setDonations(donationsData || []);
    }
  };

  const loadNotifications = async () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Bienvenue !',
        message: 'Bienvenue dans votre espace partenaire.',
        type: 'success',
        read: false,
        created_at: new Date().toISOString()
      }
    ];
    setNotifications(mockNotifications);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('partner_authenticated');
    navigate('/');
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    setUpdateMessage(null);

    try {
      const { error } = await supabase
        .from('partners')
        .update({
          name: profileForm.name,
          phone: profileForm.phone,
          address: profileForm.address,
          city: profileForm.city,
          postal_code: profileForm.postal_code,
          bio: profileForm.bio
        })
        .eq('id', partner?.id);

      if (error) throw error;

      setPartner(prev => ({ ...prev!, ...profileForm }));
      setUpdateMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (error) {
      setUpdateMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
    } finally {
      setUpdating(false);
      setEditingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setUpdateMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    setUpdating(true);
    setUpdateMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setUpdateMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès !' });
      setShowPasswordModal(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (error) {
      setUpdateMessage({ type: 'error', text: 'Erreur lors de la mise à jour du mot de passe' });
    } finally {
      setUpdating(false);
    }
  };

  const handleGiveDonation = async () => {
    if (!donationForm.nomComplet || !donationForm.villeQuartier || !donationForm.phoneNumber) {
      setUpdateMessage({ type: 'error', text: 'Veuillez remplir tous les champs avant de donner.' });
      return;
    }

    const amountNumber = parseFloat(donationForm.donationAmount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setUpdateMessage({ type: 'error', text: 'Veuillez entrer un montant valide.' });
      return;
    }

    setDonating(true);

    const donationTypeName = donationTypes.find(t => t.id === donationForm.selectedDonationType)?.name || donationForm.selectedDonationType;
    const paymentMethodName = paymentMethods.find(m => m.id === donationForm.selectedPaymentMethod)?.name || donationForm.selectedPaymentMethod;

    try {
      const newDonation = {
        name: donationForm.anonymous ? 'Anonyme' : donationForm.nomComplet,
        city: donationForm.villeQuartier,
        amount: amountNumber,
        donation_type: donationTypeName,
        payment_method: paymentMethodName,
        phone: donationForm.phoneNumber,
        date: new Date().toISOString()
      };

      const { error } = await supabase
        .from('donations')
        .insert([newDonation]);

      if (error) throw error;

      setDonations(prev => [newDonation as Donation, ...prev]);
      setUpdateMessage({ type: 'success', text: `✅ Don effectué avec succès !\n📝 ${donationTypeName} : ${amountNumber} €\n🙏 ${donationForm.nomComplet}\n💳 Paiement : ${paymentMethodName}\n\nQue Dieu vous bénisse abondamment !` });
      setShowGiveModal(false);

      setDonationForm({
        nomComplet: partner?.name || '',
        villeQuartier: partner?.city || '',
        phoneNumber: partner?.phone || '',
        donationAmount: '',
        selectedDonationType: 'dime',
        selectedPaymentMethod: 'mtn',
        anonymous: false
      });

      setTimeout(() => setUpdateMessage(null), 5000);
    } catch (error) {
      setUpdateMessage({ type: 'error', text: 'Erreur lors du traitement du don' });
    } finally {
      setDonating(false);
    }
  };

  const getFilteredDonations = () => {
    let filtered = [...donations];
    const now = new Date();

    switch (filterPeriod) {
      case 'week':
        filtered = filtered.filter(d => new Date(d.date) >= subDays(now, 7));
        break;
      case 'month':
        filtered = filtered.filter(d => new Date(d.date) >= subMonths(now, 1));
        break;
      case 'year':
        filtered = filtered.filter(d => new Date(d.date) >= subMonths(now, 12));
        break;
      default:
        break;
    }

    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.donation_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(d => d.donation_type === selectedType);
    }

    return filtered;
  };

  const filteredDonations = getFilteredDonations();

  const getStats = () => {
    const totalAmount = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    const donationCount = filteredDonations.length;
    const averageAmount = donationCount > 0 ? totalAmount / donationCount : 0;

    const thisMonth = filteredDonations.filter(d => new Date(d.date) >= startOfMonth(new Date()));
    const thisMonthTotal = thisMonth.reduce((sum, d) => sum + d.amount, 0);

    const lastWeek = filteredDonations.filter(d => new Date(d.date) >= subDays(new Date(), 7));
    const previousWeek = filteredDonations.filter(d => {
      const date = new Date(d.date);
      return date >= subDays(new Date(), 14) && date < subDays(new Date(), 7);
    });
    const lastWeekTotal = lastWeek.reduce((sum, d) => sum + d.amount, 0);
    const previousWeekTotal = previousWeek.reduce((sum, d) => sum + d.amount, 0);
    const weeklyGrowth = previousWeekTotal > 0 ? ((lastWeekTotal - previousWeekTotal) / previousWeekTotal) * 100 : 0;

    const uniqueDonors = new Set(filteredDonations.map(d => d.name)).size;
    const highestDonation = Math.max(...filteredDonations.map(d => d.amount), 0);

    const typeCount = filteredDonations.reduce((acc, d) => {
      acc[d.donation_type] = (acc[d.donation_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostFrequentType = Object.keys(typeCount).reduce((a, b) => typeCount[a] > typeCount[b] ? a : b, 'Aucun');

    return {
      totalAmount,
      donationCount,
      averageAmount,
      weeklyGrowth,
      thisMonthTotal,
      uniqueDonors,
      highestDonation,
      mostFrequentType
    };
  };

  const stats = getStats();

  const getDailyData = () => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(day => {
      const dayDonations = filteredDonations.filter(d => isSameDay(new Date(d.date), day));
      return {
        date: format(day, 'dd/MM'),
        amount: dayDonations.reduce((sum, d) => sum + d.amount, 0),
        count: dayDonations.length
      };
    });
  };

  const getDonationsByType = () => {
    const typeMap = filteredDonations.reduce((acc, d) => {
      acc[d.donation_type] = (acc[d.donation_type] || 0) + d.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  };

  const getPaymentMethods = () => {
    const methodMap = filteredDonations.reduce((acc, d) => {
      acc[d.payment_method] = (acc[d.payment_method] || 0) + d.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(methodMap).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#EF4444'];

  const dailyData = getDailyData();
  const typeData = getDonationsByType();
  const methodData = getPaymentMethods();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
            <Shield className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Votre compte n'est pas encore approuvé.</p>
            <button
              onClick={() => navigate('/')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white shadow-xl transition-all duration-300 z-20 ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-xl font-bold text-purple-700">
                    Espace Partenaire
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">Gestion des dons</p>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label={sidebarCollapsed ? "Agrandir la barre latérale" : "Réduire la barre latérale"}
                type="button"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-purple-50 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              type="button"
            >
              <TrendingUp size={20} />
              {!sidebarCollapsed && <span className="font-medium">Vue d'ensemble</span>}
            </button>

            <button
              onClick={() => setActiveTab('donations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'donations'
                  ? 'bg-purple-50 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              type="button"
            >
              <Heart size={20} />
              {!sidebarCollapsed && <span className="font-medium">Mes dons</span>}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'analytics'
                  ? 'bg-purple-50 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              type="button"
            >
              <BarChart3 size={20} />
              {!sidebarCollapsed && <span className="font-medium">Analytiques</span>}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'settings'
                  ? 'bg-purple-50 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              type="button"
            >
              <Settings size={20} />
              {!sidebarCollapsed && <span className="font-medium">Paramètres</span>}
            </button>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
              aria-label="Déconnexion"
              type="button"
            >
              <LogOut size={20} />
              {!sidebarCollapsed && <span className="font-medium">Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {activeTab === 'overview' && 'Tableau de bord'}
                  {activeTab === 'donations' && 'Mes dons'}
                  {activeTab === 'analytics' && 'Analytiques'}
                  {activeTab === 'settings' && 'Paramètres'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Bienvenue, {partner.name} ! Que Dieu vous bénisse.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                    aria-label="Notifications"
                    type="button"
                  >
                    <Bell size={20} />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-20">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => markNotificationAsRead(notif.id)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                              !notif.read ? 'bg-purple-50' : ''
                            }`}
                          >
                            <p className="font-medium text-sm">{notif.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {format(new Date(notif.created_at), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowGiveModal(true)}
                  className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-xl hover:bg-purple-700 transition-all"
                  type="button"
                >
                  <Gift size={18} />
                  <span className="font-medium">Faire un don</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {updateMessage && (
            <div className={`mb-6 p-4 rounded-xl whitespace-pre-line ${
              updateMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {updateMessage.text}
            </div>
          )}

          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <DollarSign className="text-purple-600" size={24} />
                    </div>
                    <span className={`text-sm font-medium ${stats.weeklyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.weeklyGrowth >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {Math.abs(stats.weeklyGrowth).toFixed(1)}%
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.totalAmount.toLocaleString()} €</h3>
                  <p className="text-sm text-gray-500 mt-1">Total des dons</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-pink-100 rounded-xl">
                      <Heart className="text-pink-600" size={24} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.donationCount}</h3>
                  <p className="text-sm text-gray-500 mt-1">Nombre de dons</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Users className="text-blue-600" size={24} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.uniqueDonors}</h3>
                  <p className="text-sm text-gray-500 mt-1">Donateurs uniques</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Award className="text-green-600" size={24} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{Math.round(stats.averageAmount)} €</h3>
                  <p className="text-sm text-gray-500 mt-1">Montant moyen</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Évolution des dons</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterPeriod('week')}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        filterPeriod === 'week' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                      type="button"
                    >
                      Semaine
                    </button>
                    <button
                      onClick={() => setFilterPeriod('month')}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        filterPeriod === 'month' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                      type="button"
                    >
                      Mois
                    </button>
                    <button
                      onClick={() => setFilterPeriod('year')}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        filterPeriod === 'year' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                      type="button"
                    >
                      Année
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip />
                    <Area type="monotone" dataKey="amount" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Derniers dons</h2>
                  <button
                    onClick={() => setActiveTab('donations')}
                    className="text-purple-600 text-sm font-medium flex items-center gap-1"
                    type="button"
                  >
                    Voir tout <ChevronRight size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  {filteredDonations.slice(0, 5).map((don, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Gift size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{don.donation_type}</p>
                          <p className="text-xs text-gray-500">{format(new Date(don.date), 'dd MMM yyyy')}</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-purple-600">{don.amount} €</p>
                    </div>
                  ))}
                  {filteredDonations.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Aucun don enregistré</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Mes dons */}
          {activeTab === 'donations' && (
            <>
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterPeriod('week')}
                      className={`px-4 py-2 rounded-lg transition ${
                        filterPeriod === 'week'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      7 jours
                    </button>
                    <button
                      onClick={() => setFilterPeriod('month')}
                      className={`px-4 py-2 rounded-lg transition ${
                        filterPeriod === 'month'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      30 jours
                    </button>
                    <button
                      onClick={() => setFilterPeriod('year')}
                      className={`px-4 py-2 rounded-lg transition ${
                        filterPeriod === 'year'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      Année
                    </button>
                    <button
                      onClick={() => setFilterPeriod('all')}
                      className={`px-4 py-2 rounded-lg transition ${
                        filterPeriod === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      Tous
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        aria-label="Rechercher des dons"
                      />
                    </div>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      aria-label="Filtrer par type de don"
                    >
                      <option value="all">Tous les types</option>
                      <option value="Offrande">Offrande</option>
                      <option value="Dîme">Dîme</option>
                      <option value="Aumône">Aumône</option>
                      <option value="Construction">Construction</option>
                      <option value="Missions">Missions</option>
                      <option value="Œuvres sociales">Œuvres sociales</option>
                    </select>
                    <button
                      onClick={() => {
                        const csvContent = [
                          ['Date', 'Montant', 'Type', 'Méthode', 'Ville'],
                          ...filteredDonations.map(d => [
                            format(new Date(d.date), 'dd/MM/yyyy HH:mm'),
                            d.amount,
                            d.donation_type,
                            d.payment_method,
                            d.city
                          ])
                        ].map(row => row.join(',')).join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `mes_dons_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition"
                      type="button"
                      aria-label="Exporter les données CSV"
                    >
                      <Download size={18} />
                      Exporter
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Méthode</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredDonations.map((don) => (
                        <tr key={don.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {format(new Date(don.date), 'dd MMM yyyy')}
                            <span className="block text-xs text-gray-400">
                              {format(new Date(don.date), 'HH:mm')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-purple-600 text-right">
                            {don.amount} €
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-medium">
                              {don.donation_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              {don.payment_method.includes('Carte') && <CreditCard size={14} />}
                              {don.payment_method.includes('Money') && <Smartphone size={14} />}
                              {don.payment_method}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{don.city}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredDonations.length === 0 && (
                    <div className="text-center py-12">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Aucun don trouvé</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Analytiques */}
          {activeTab === 'analytics' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-6">Répartition par type de don</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => {
                          const pct = percent !== undefined ? percent : 0;
                          return `${name} ${(pct * 100).toFixed(0)}%`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {typeData.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-6">Méthodes de paiement</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={methodData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Statistiques détaillées</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Montant total (mois)</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.thisMonthTotal} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Plus gros don</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.highestDonation} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Type le plus fréquent</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.mostFrequentType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Croissance hebdomadaire</p>
                    <p className={`text-2xl font-bold ${stats.weeklyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.weeklyGrowth >= 0 ? '+' : ''}{stats.weeklyGrowth.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Paramètres */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl">
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Informations personnelles</h2>
                    <p className="text-sm text-gray-500 mt-1">Gérez vos informations de profil</p>
                  </div>
                  {!editingProfile ? (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="flex items-center gap-2 px-4 py-2 text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition"
                      type="button"
                    >
                      <Edit2 size={16} />
                      Modifier
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProfile(false);
                          setProfileForm(partner!);
                        }}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        type="button"
                        aria-label="Annuler les modifications"
                      >
                        <X size={16} />
                      </button>
                      <button
                        onClick={handleUpdateProfile}
                        disabled={updating}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                        type="button"
                      >
                        {updating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Sauvegarder
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                    {editingProfile ? (
                      <input
                        type="text"
                        value={profileForm.name || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        aria-label="Nom complet"
                      />
                    ) : (
                      <p className="text-gray-800">{partner.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-800">{partner.email}</p>
                    <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    {editingProfile ? (
                      <input
                        type="tel"
                        value={profileForm.phone || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        aria-label="Numéro de téléphone"
                      />
                    ) : (
                      <p className="text-gray-800">{partner.phone || 'Non renseigné'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                    {editingProfile ? (
                      <textarea
                        value={profileForm.address || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        aria-label="Adresse"
                      />
                    ) : (
                      <p className="text-gray-800">{partner.address || 'Non renseignée'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Sécurité</h2>
                    <p className="text-sm text-gray-500 mt-1">Gérez votre mot de passe</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition"
                    type="button"
                  >
                    <Lock size={16} />
                    Changer le mot de passe
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code de référence partenaire</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-2 bg-gray-100 rounded-lg font-mono text-sm">
                      {partner.id?.slice(0, 8)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(partner.id || '')}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                      type="button"
                      aria-label="Copier le code de référence"
                    >
                      {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de don - PETIT ET ÉPURÉ COMME LA VERSION CIBLE */}
      {showGiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Faire un don</h2>
              <button onClick={() => setShowGiveModal(false)} className="p-1 hover:bg-gray-100 rounded-lg" type="button" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  placeholder="Votre nom et prénom"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={donationForm.nomComplet}
                  onChange={(e) => setDonationForm({ ...donationForm, nomComplet: e.target.value })}
                  aria-label="Nom complet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville / Quartier *</label>
                <input
                  type="text"
                  placeholder="Votre ville ou quartier"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={donationForm.villeQuartier}
                  onChange={(e) => setDonationForm({ ...donationForm, villeQuartier: e.target.value })}
                  aria-label="Ville ou quartier"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (pour confirmation) *</label>
                <input
                  type="tel"
                  placeholder="+229 XX XX XX XX"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={donationForm.phoneNumber}
                  onChange={(e) => setDonationForm({ ...donationForm, phoneNumber: e.target.value })}
                  aria-label="Numéro de téléphone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de don *</label>
                <select
                  value={donationForm.selectedDonationType}
                  onChange={(e) => setDonationForm({ ...donationForm, selectedDonationType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label="Type de don"
                >
                  {donationTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name} - {type.description}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (€) *</label>
                <input
                  type="number"
                  placeholder="Montant en euros"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={donationForm.donationAmount}
                  onChange={(e) => setDonationForm({ ...donationForm, donationAmount: e.target.value })}
                  aria-label="Montant du don"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Moyen de paiement *</label>
                <select
                  value={donationForm.selectedPaymentMethod}
                  onChange={(e) => setDonationForm({ ...donationForm, selectedPaymentMethod: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label="Moyen de paiement"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={donationForm.anonymous}
                  onChange={(e) => setDonationForm({ ...donationForm, anonymous: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  aria-label="Faire un don anonyme"
                />
                <span className="text-sm text-gray-700">Faire un don anonyme</span>
              </label>

              <button
                onClick={handleGiveDonation}
                disabled={donating}
                className="w-full py-3 rounded-lg transition flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400"
                type="button"
              >
                {donating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Donner {donationForm.donationAmount ? `${donationForm.donationAmount} €` : 'un montant'} <Heart size={18} />
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">Votre don est sécurisé. Vous recevrez un reçu par SMS et email.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de changement de mot de passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Changer le mot de passe</h2>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 hover:bg-gray-100 rounded-lg" type="button" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Nouveau mot de passe"
                    aria-label="Nouveau mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    aria-label={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Confirmer le mot de passe"
                  aria-label="Confirmer le mot de passe"
                />
              </div>

              <button
                onClick={handleUpdatePassword}
                disabled={updating}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50"
                type="button"
              >
                {updating ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Mettre à jour'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDashboard;