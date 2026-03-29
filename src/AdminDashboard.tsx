import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  ChevronDown,
  Search
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
import { useNavigate } from 'react-router-dom';
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import AdminPartners from './AdminPartners';
import AdminAdmins from './AdminAdmins';

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

const COLORS = ['#8b5cf6', '#ec489a', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

const AdminDashboard = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [adminTab, setAdminTab] = useState<'stats' | 'partners' | 'admins'>('stats');
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      navigate('/admin-login');
    }
  }, [navigate]);

  // Charger les dons
  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Erreur:', error);
    } else {
      setDonations(data || []);
    }
    setLoading(false);
  };

  // Filtrer les dons par période
  const getFilteredByPeriod = () => {
    const now = new Date();
    let filtered = [...donations];

    switch (filterPeriod) {
      case 'today':
        filtered = filtered.filter(d => {
          const date = new Date(d.date);
          return date >= startOfDay(now) && date <= endOfDay(now);
        });
        break;
      case 'week':
        filtered = filtered.filter(d => new Date(d.date) >= subDays(now, 7));
        break;
      case 'month':
        filtered = filtered.filter(d => new Date(d.date) >= subMonths(now, 1));
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredByPeriod = getFilteredByPeriod();

  // Filtrer par recherche
  const filteredBySearch = filteredByPeriod.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone.includes(searchTerm)
  );

  // Filtrer par type de don
  const filteredByType = filterType === 'all' 
    ? filteredBySearch 
    : filteredBySearch.filter(d => d.donation_type === filterType);

  // Filtrer par méthode de paiement
  const finalDonations = filterPayment === 'all'
    ? filteredByType
    : filteredByType.filter(d => d.payment_method === filterPayment);

  // Statistiques
  const totalAmount = finalDonations.reduce((sum, d) => sum + d.amount, 0);
  const uniqueDonors = new Set(finalDonations.map(d => d.phone)).size;
  const averageAmount = finalDonations.length > 0 ? totalAmount / finalDonations.length : 0;

  // Données pour le graphique des 7 derniers jours
  const getLast7DaysData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayDonations = donations.filter(d => {
        const donDate = new Date(d.date);
        return donDate >= dayStart && donDate <= dayEnd;
      });
      return {
        day: format(date, 'EEE', { locale: fr }),
        date: format(date, 'dd/MM'),
        amount: dayDonations.reduce((sum, d) => sum + d.amount, 0),
        count: dayDonations.length
      };
    });
    return last7Days;
  };

  // Données pour les types de dons (top 5)
  const getDonationTypesData = () => {
    const typesMap = new Map();
    finalDonations.forEach(d => {
      typesMap.set(d.donation_type, (typesMap.get(d.donation_type) || 0) + d.amount);
    });
    return Array.from(typesMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  // Données pour les méthodes de paiement
  const getPaymentMethodsData = () => {
    const methodsMap = new Map();
    finalDonations.forEach(d => {
      methodsMap.set(d.payment_method, (methodsMap.get(d.payment_method) || 0) + 1);
    });
    return Array.from(methodsMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Top donateurs
  const topDonors = [...finalDonations]
    .reduce((acc, d) => {
      const existing = acc.find(item => item.phone === d.phone);
      if (existing) {
        existing.total += d.amount;
        existing.count++;
      } else {
        acc.push({
          name: d.name,
          phone: d.phone,
          city: d.city,
          total: d.amount,
          count: 1
        });
      }
      return acc;
    }, [] as any[])
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Nom', 'Ville', 'Montant', 'Type', 'Méthode', 'Téléphone', 'Date'];
    const rows = finalDonations.map(d => [
      d.name,
      d.city,
      d.amount,
      d.donation_type,
      d.payment_method,
      d.phone,
      format(new Date(d.date), 'dd/MM/yyyy HH:mm')
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dons_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Types de dons uniques pour le filtre
  const uniqueTypes = [...new Set(donations.map(d => d.donation_type))];
  const uniquePayments = [...new Set(donations.map(d => d.payment_method))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-purple-600 text-xl">Chargement du dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-600 hover:text-purple-600 transition">
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-2xl font-bold text-purple-700">Dashboard Administrateur</h1>
            </div>
            {adminTab === 'stats' && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                <Download size={18} />
                Exporter CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setAdminTab('stats')}
              className={`px-6 py-3 font-medium transition ${
                adminTab === 'stats'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Statistiques
            </button>
            <button
              onClick={() => setAdminTab('partners')}
              className={`px-6 py-3 font-medium transition ${
                adminTab === 'partners'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🤝 Gestion des partenaires
            </button>
            <button
              onClick={() => setAdminTab('admins')}
              className={`px-6 py-3 font-medium transition ${
                adminTab === 'admins'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👑 Gestion des admins
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Onglet Statistiques */}
        {adminTab === 'stats' && (
          <>
            {/* Filtres période */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-wrap gap-3 justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterPeriod('today')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filterPeriod === 'today'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Aujourd'hui
                  </button>
                  <button
                    onClick={() => setFilterPeriod('week')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filterPeriod === 'week'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    7 derniers jours
                  </button>
                  <button
                    onClick={() => setFilterPeriod('month')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filterPeriod === 'month'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    30 derniers jours
                  </button>
                  <button
                    onClick={() => setFilterPeriod('all')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filterPeriod === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Tous
                  </button>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
                >
                  <Filter size={18} />
                  Filtres avancés
                  <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Filtres avancés */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Nom, ville ou téléphone..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de don</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">Tous les types</option>
                      {uniqueTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moyen de paiement</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={filterPayment}
                      onChange={(e) => setFilterPayment(e.target.value)}
                    >
                      <option value="all">Tous les moyens</option>
                      {uniquePayments.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Statistiques */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total des dons</p>
                    <p className="text-3xl font-bold text-purple-700">{totalAmount.toLocaleString()} €</p>
                  </div>
                  <DollarSign size={40} className="text-purple-200" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Donateurs uniques</p>
                    <p className="text-3xl font-bold text-purple-700">{uniqueDonors}</p>
                  </div>
                  <Users size={40} className="text-purple-200" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Nombre de dons</p>
                    <p className="text-3xl font-bold text-purple-700">{finalDonations.length}</p>
                  </div>
                  <Calendar size={40} className="text-purple-200" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Montant moyen</p>
                    <p className="text-3xl font-bold text-purple-700">{Math.round(averageAmount)} €</p>
                  </div>
                  <TrendingUp size={40} className="text-purple-200" />
                </div>
              </div>
            </div>

            {/* Graphiques */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Évolution des dons (7 derniers jours)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getLast7DaysData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value} €`} />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#8b5cf6" name="Montant (€)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 types de dons</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getDonationTypesData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => percent ? `${name} (${(percent * 100).toFixed(0)}%)` : name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getDonationTypesData().map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} €`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Méthodes de paiement */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition par moyen de paiement</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getPaymentMethodsData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8b5cf6" name="Nombre de dons" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top donateurs */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Top 10 des donateurs</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rang</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total donné</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nombre de dons</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topDonors.map((donor, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-semibold text-purple-600">#{idx + 1}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{donor.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{donor.city}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{donor.phone}</td>
                        <td className="px-6 py-4 text-sm font-bold text-purple-600 text-right">{donor.total.toLocaleString()} €</td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-center">{donor.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Liste complète des dons */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Liste des dons ({finalDonations.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {finalDonations.slice(0, 50).map((don) => (
                      <tr key={don.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">{format(new Date(don.date), 'dd/MM/yyyy HH:mm')}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{don.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{don.city}</td>
                        <td className="px-6 py-4 text-sm font-bold text-purple-600 text-right">{don.amount} €</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">{don.donation_type}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{don.payment_method}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{don.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {finalDonations.length > 50 && (
                  <p className="text-center text-gray-500 text-sm mt-4">Affichage des 50 premiers dons seulement</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Onglet Gestion des partenaires */}
        {adminTab === 'partners' && <AdminPartners />}

        {/* Onglet Gestion des admins */}
        {adminTab === 'admins' && <AdminAdmins />}
      </div>
    </div>
  );
};

export default AdminDashboard;