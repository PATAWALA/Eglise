import { useState, useEffect } from 'react';
import { Check, X, UserCheck, UserX } from 'lucide-react';
import { supabase } from './lib/supabase';

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

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  status: string;
  created_at: string;
}

const AdminPartners = () => {
  const [requests, setRequests] = useState<PartnershipRequest[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Charger les demandes en attente
    const { data: requestsData } = await supabase
      .from('partnership_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    setRequests(requestsData || []);

    // Charger les partenaires approuvés
    const { data: partnersData } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    
    setPartners(partnersData || []);
    setLoading(false);
  };

  const approveRequest = async (request: PartnershipRequest) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Mettre à jour le statut dans partnership_requests
    await supabase
      .from('partnership_requests')
      .update({ status: 'approved' })
      .eq('id', request.id);

    // 2. Mettre à jour le partenaire dans partners
    const { data: existingPartner } = await supabase
      .from('partners')
      .select('id')
      .eq('email', request.email)
      .single();

    if (existingPartner) {
      await supabase
        .from('partners')
        .update({ 
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date()
        })
        .eq('id', existingPartner.id);
    }

    // 3. Recharger les données
    await loadData();
    alert(`✅ Partenaire ${request.name} approuvé avec succès !`);
  };

  const rejectRequest = async (request: PartnershipRequest) => {
    if (!confirm(`Êtes-vous sûr de vouloir rejeter la demande de ${request.name} ?`)) return;

    await supabase
      .from('partnership_requests')
      .update({ status: 'rejected' })
      .eq('id', request.id);

    await supabase
      .from('partners')
      .update({ status: 'rejected' })
      .eq('email', request.email);

    await loadData();
    alert(`❌ Demande de ${request.name} rejetée.`);
  };

  const removePartner = async (partner: Partner) => {
    if (!confirm(`⚠️ Attention ! Êtes-vous sûr de vouloir supprimer ${partner.name} de la liste des partenaires ?`)) return;

    await supabase
      .from('partners')
      .update({ status: 'rejected' })
      .eq('id', partner.id);

    await loadData();
    alert(`🗑️ ${partner.name} a été retiré des partenaires.`);
  };

  if (loading) {
    return <div className="text-center py-8 text-purple-600">Chargement...</div>;
  }

  return (
    <div>
      {/* Onglets */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'pending'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Demandes en attente ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'approved'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ✅ Partenaires approuvés ({partners.length})
        </button>
      </div>

      {/* Demandes en attente */}
      {activeTab === 'pending' && (
        <>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserCheck size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Aucune demande en attente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{req.name}</h3>
                      <div className="grid md:grid-cols-2 gap-2 mt-2 text-sm">
                        <p><span className="text-gray-500">Email:</span> {req.email}</p>
                        <p><span className="text-gray-500">Téléphone:</span> {req.phone}</p>
                        <p><span className="text-gray-500">Âge:</span> {req.age} ans</p>
                        <p><span className="text-gray-500">Date:</span> {new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                      {req.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 text-sm mb-1">Message:</p>
                          <p className="text-gray-700">{req.message}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveRequest(req)}
                        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                      >
                        <Check size={18} />
                        Approuver
                      </button>
                      <button
                        onClick={() => rejectRequest(req)}
                        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                      >
                        <X size={18} />
                        Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Partenaires approuvés */}
      {activeTab === 'approved' && (
        <>
          {partners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserX size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Aucun partenaire approuvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Âge</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {partners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{partner.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{partner.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{partner.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{partner.age} ans</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(partner.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removePartner(partner)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Retirer"
                        >
                          <UserX size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPartners;