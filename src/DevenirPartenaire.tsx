import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {  ArrowLeft } from 'lucide-react';
import { supabase } from './lib/supabase';

const DevenirPartenaire = () => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    age: '',
    message: ''
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const age = parseInt(registerData.age);
    if (age < 18) {
      setError('Vous devez avoir au moins 18 ans pour devenir partenaire.');
      setLoading(false);
      return;
    }

    if (!registerData.email || !registerData.email.includes('@')) {
      setError('Veuillez entrer un email valide');
      setLoading(false);
      return;
    }

    try {
      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            name: registerData.name,
            role: 'partner'
          }
        }
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          setError('Un compte existe déjà avec cet email. Veuillez vous connecter.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Ajouter dans la table partners
        const { error: partnerError } = await supabase
          .from('partners')
          .insert({
            id: authData.user.id,
            email: registerData.email,
            name: registerData.name,
            phone: registerData.phone,
            age: age,
            status: 'pending'
          });

        if (partnerError) {
          console.error('Erreur:', partnerError);
          setError('Erreur lors de l\'enregistrement');
          setLoading(false);
          return;
        }

        // Sauvegarder la demande
        await supabase.from('partnership_requests').insert({
          name: registerData.name,
          email: registerData.email,
          phone: registerData.phone,
          age: age,
          message: registerData.message
        });

        alert('✅ Demande envoyée avec succès !\nUn responsable examinera votre candidature.');
        navigate('/');
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    console.log('Tentative de connexion avec:', loginData.email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password
    });

    if (error) {
      console.error('Erreur auth:', error);
      setError('Email ou mot de passe incorrect');
      setLoading(false);
      return;
    }

    console.log('Utilisateur connecté ID:', data.user?.id);

    // 1. Vérifier si c'est un admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    console.log('Admin trouvé:', adminData);
    console.log('Admin error:', adminError);

    if (adminData) {
      console.log('✅ Admin détecté, redirection vers /admin');
      sessionStorage.setItem('admin_authenticated', 'true');
      sessionStorage.setItem('admin_email', loginData.email);
      navigate('/admin');
      return;
    }

    // 2. Si pas admin, vérifier si c'est un partenaire
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    console.log('Partenaire trouvé:', partnerData);
    console.log('Partenaire error:', partnerError);

    if (partnerError || !partnerData) {
      await supabase.auth.signOut();
      console.log('❌ Utilisateur non trouvé dans partners');
      setError('Compte non trouvé dans nos registres');
      setLoading(false);
      return;
    }

    if (partnerData.status !== 'approved') {
      await supabase.auth.signOut();
      setError('Votre compte n\'est pas encore approuvé');
      setLoading(false);
      return;
    }

    console.log('✅ Partenaire approuvé, redirection vers /espace-partenaire');
    sessionStorage.setItem('partner_authenticated', 'true');
    navigate('/espace-partenaire');
  } catch (err: any) {
    console.error('Erreur:', err);
    setError('Erreur de connexion');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <button onClick={() => navigate('/')} className="text-purple-600 hover:text-purple-700 mb-6 inline-flex items-center gap-2">
          <ArrowLeft size={20} />
          Retour à l'accueil
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-4 text-center font-medium transition ${
                mode === 'register'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🙏 Inscription partenaire
            </button>
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-4 text-center font-medium transition ${
                mode === 'login'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🔑 Connexion
            </button>
          </div>

          <div className="p-8">
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                  <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={registerData.name} onChange={(e) => setRegisterData({...registerData, name: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={registerData.email} onChange={(e) => setRegisterData({...registerData, email: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                  <input type="password" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={registerData.password} onChange={(e) => setRegisterData({...registerData, password: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                  <input type="tel" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={registerData.phone} onChange={(e) => setRegisterData({...registerData, phone: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Âge * (18 ans minimum)</label>
                  <input type="number" required min="18" max="120" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={registerData.age} onChange={(e) => setRegisterData({...registerData, age: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
                  <textarea rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={registerData.message} onChange={(e) => setRegisterData({...registerData, message: e.target.value})} />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50">
                  {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
                </button>
              </form>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                  <input type="password" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50">
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevenirPartenaire;