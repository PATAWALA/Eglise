import { useState, useEffect } from 'react';
import { Trash2,  Shield,  UserPlus } from 'lucide-react';
import { supabase } from './lib/supabase';

interface Admin {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

const AdminAdmins = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });
    
    setAdmins(data || []);
    setLoading(false);
  };

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError('');

    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password,
        options: {
          data: {
            name: newAdmin.name,
            role: 'admin'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Ajouter dans la table admins
        const { error: adminError } = await supabase
          .from('admins')
          .insert({
            id: authData.user.id,
            email: newAdmin.email,
            name: newAdmin.name
          });

        if (adminError) throw adminError;

        alert(`✅ Administrateur ${newAdmin.name} ajouté avec succès !`);
        setShowAddModal(false);
        setNewAdmin({ email: '', password: '', name: '' });
        loadAdmins();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setAdding(false);
    }
  };

  const removeAdmin = async (admin: Admin) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${admin.name} des administrateurs ?`)) return;

    // Supprimer de la table admins (l'utilisateur reste dans auth)
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', admin.id);

    if (error) {
      alert('Erreur lors de la suppression');
    } else {
      alert(`🗑️ ${admin.name} a été retiré des administrateurs.`);
      loadAdmins();
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-purple-600">Chargement...</div>;
  }

  return (
    <div>
      {/* Bouton ajouter */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          <UserPlus size={18} />
          Ajouter un administrateur
        </button>
      </div>

      {/* Liste des admins */}
      {admins.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Shield size={48} className="mx-auto mb-3 text-gray-300" />
          <p>Aucun administrateur</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date d'ajout</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{admin.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{admin.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => removeAdmin(admin)}
                      className="text-red-500 hover:text-red-700 transition"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Ajouter un administrateur</h3>
            <form onSubmit={addAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {adding ? 'Ajout...' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdmins;