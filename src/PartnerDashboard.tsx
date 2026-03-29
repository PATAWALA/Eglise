import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  LogOut, 
  Heart, 
  Calendar, 
  TrendingUp,
  Download,
  Gift
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { format, subDays, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Donation {
  id: number;
  name: string;
  city: string;
  amount: number;
  donation_type: string;
  payment_method: string;
  date: string;
}

interface PartnerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  status: string;
  created_at: string;
}

const PartnerDashboard = () => {
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'all'>('all');
  const navigate = useNavigate();

  // Charger les données du partenaire et ses dons
  useEffect(() => {
    loadPartnerData();
    loadPartnerDonations();
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
    }
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
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('partner_authenticated');
    navigate('/');
  };

  // Filtrer les dons par période
  const getFilteredDonations = () => {
    const now = new Date();
    let filtered = [...donations];

    switch (filterPeriod) {
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

  const filteredDonations = getFilteredDonations();
  const totalAmount = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
  const donationCount = filteredDonations.length;
  const averageAmount = donationCount > 0 ? totalAmount / donationCount : 0;

  // Données pour le graphique (derniers 7 jours)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayDonations = filteredDonations.filter(d => {
      const donDate = new Date(d.date);
      return donDate.toDateString() === date.toDateString();
    });
    return {
      day: format(date, 'EEE', { locale: fr }),
      amount: dayDonations.reduce((sum, d) => sum + d.amount, 0),
      count: dayDonations.length
    };
  });

  // Calculer le montant total par type de don
  const donationsByType = filteredDonations.reduce((acc, d) => {
    acc[d.donation_type] = (acc[d.donation_type] || 0) + d.amount;
    return acc;
  }, {} as Record<string, number>);

  // Exporter les dons en CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Montant', 'Type', 'Méthode', 'Ville'];
    const rows = filteredDonations.map(d => [
      format(new Date(d.date), 'dd/MM/yyyy'),
      d.amount,
      d.donation_type,
      d.payment_method,
      d.city
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mes_dons_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-purple-600 text-xl">Chargement de votre espace...</div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Votre compte n'est pas encore approuvé.</p>
          <button onClick={() => navigate('/')} className="text-purple-600 hover:text-purple-700">
            Retour à l'accueil
          </button>
        </div>
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
              <button onClick={() => navigate('/')} className="text-gray-600 hover:text-purple-600 transition">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-bold text-purple-700">Mon Espace Partenaire</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition"
              >
                <Download size={18} />
                Exporter mes dons
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Bienvenue */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold">Bienvenue, {partner.name} !</h2>
          <p className="text-purple-100 mt-2">
            Merci pour votre engagement au service de l'Église. Que Dieu vous bénisse abondamment.
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total des dons</p>
                <p className="text-3xl font-bold text-purple-700">{totalAmount.toLocaleString()} €</p>
              </div>
              <Gift size={40} className="text-purple-200" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Nombre de dons</p>
                <p className="text-3xl font-bold text-purple-700">{donationCount}</p>
              </div>
              <Heart size={40} className="text-purple-200" />
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
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Membre depuis</p>
                <p className="text-3xl font-bold text-purple-700">
                  {partner.created_at ? format(new Date(partner.created_at), 'MM/yyyy') : 'N/A'}
                </p>
              </div>
              <Calendar size={40} className="text-purple-200" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="flex gap-2">
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
                Tous mes dons
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {filteredDonations.length} don(s) affiché(s)
            </p>
          </div>
        </div>

        {/* Graphique d'évolution */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Évolution de mes dons (7 derniers jours)</h3>
          <div className="h-64 flex items-end gap-2">
            {last7Days.map((day, idx) => {
              const maxAmount = Math.max(...last7Days.map(d => d.amount), 1);
              const height = (day.amount / maxAmount) * 200;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex justify-center">
                    <div
                      className="w-full max-w-[60px] bg-purple-500 rounded-t-lg transition-all duration-300"
                      style={{ height: `${height}px`, minHeight: day.amount > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-600">{day.amount}€</p>
                  <p className="text-xs text-gray-400">{day.day}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Répartition par type de don */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition par type de don</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(donationsByType).map(([type, amount]) => (
              <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{amount}€</p>
                <p className="text-sm text-gray-600 mt-1">{type}</p>
              </div>
            ))}
            {Object.keys(donationsByType).length === 0 && (
              <p className="text-gray-500 col-span-full text-center py-8">
                Aucun don enregistré pour cette période
              </p>
            )}
          </div>
        </div>

        {/* Liste des dons */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Historique de mes dons</h3>
          <div className="overflow-x-auto">
            {filteredDonations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Vous n'avez pas encore fait de don. Que votre générosité soit bénie !
              </p>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Méthode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDonations.map((don) => (
                    <tr key={don.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(new Date(don.date), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-purple-600 text-right">
                        {don.amount} €
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {don.donation_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{don.payment_method}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{don.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Message de foi */}
        <div className="mt-8 p-6 bg-purple-50 rounded-xl text-center">
          <p className="text-purple-800 italic">
            « Donnez, et l'on vous donnera : une bonne mesure, tassée, secouée, débordante »
          </p>
          <p className="text-purple-600 text-sm mt-2">Luc 6:38</p>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;