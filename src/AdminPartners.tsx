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
    
    const { data: requestsData } = await supabase
      .from('partnership_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    setRequests(requestsData || []);

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
    
    try {
      await supabase
        .from('partnership_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);

      const { data: existingPartner } = await supabase
        .from('partners')
        .select('*')
        .eq('email', request.email)
        .maybeSingle();

      if (existingPartner) {
        await supabase
          .from('partners')
          .update({ 
            status: 'approved',
            name: request.name,
            phone: request.phone,
            age: request.age,
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', existingPartner.id);
      } else {
        await supabase
          .from('partners')
          .insert({
            id: crypto.randomUUID(),
            email: request.email,
            name: request.name,
            phone: request.phone,
            age: request.age,
            status: 'approved',
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          });
      }

      await loadData();
      alert(`✅ Partenaire ${request.name} approuvé avec succès !`);
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      alert('Erreur lors de l\'approbation. Veuillez réessayer.');
    }
  };

  const rejectRequest = async (request: PartnershipRequest) => {
    if (!confirm(`Êtes-vous sûr de vouloir rejeter la demande de ${request.name} ?`)) return;

    try {
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
    } catch (error) {
      alert('Erreur lors du rejet');
    }
  };

  const removePartner = async (partner: Partner) => {
    if (!confirm(`⚠️ Attention ! Êtes-vous sûr de vouloir supprimer ${partner.name} de la liste des partenaires ?`)) return;

    try {
      await supabase
        .from('partners')
        .update({ status: 'rejected' })
        .eq('id', partner.id);

      await loadData();
      alert(`🗑️ ${partner.name} a été retiré des partenaires.`);
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-purple-600">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Onglets responsives */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all ${
            activeTab === 'pending'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
          }`}
        >
          📋 Demandes en attente ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all ${
            activeTab === 'approved'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
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
              <p className="text-sm sm:text-base">Aucune demande en attente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1 w-full">
                      <h3 className="text-lg font-semibold text-gray-800">{req.name}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                        <p><span className="text-gray-500">Email:</span> <span className="break-all">{req.email}</span></p>
                        <p><span className="text-gray-500">Téléphone:</span> {req.phone}</p>
                        <p><span className="text-gray-500">Âge:</span> {req.age} ans</p>
                        <p><span className="text-gray-500">Date:</span> {new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                      {req.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 text-sm mb-1">Message:</p>
                          <p className="text-gray-700 text-sm break-words">{req.message}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0 self-end lg:self-center">
                      <button
                        onClick={() => approveRequest(req)}
                        className="flex items-center gap-1 sm:gap-2 bg-green-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-green-600 transition text-sm"
                      >
                        <Check size={16} />
                        <span>Approuver</span>
                      </button>
                      <button
                        onClick={() => rejectRequest(req)}
                        className="flex items-center gap-1 sm:gap-2 bg-red-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-red-600 transition text-sm"
                      >
                        <X size={16} />
                        <span>Rejeter</span>
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
              <p className="text-sm sm:text-base">Aucun partenaire approuvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow-sm">
              <table className="min-w-[700px] md:min-w-full w-full bg-white rounded-xl">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Âge</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {partners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{partner.name}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 break-all">{partner.email}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{partner.phone}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{partner.age} ans</td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{new Date(partner.created_at).toLocaleDateString()}</td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <button
                          onClick={() => removePartner(partner)}
                          className="text-red-500 hover:text-red-700 transition p-1"
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