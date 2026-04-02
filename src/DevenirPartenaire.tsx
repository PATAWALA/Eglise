import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Crown, 
  Heart, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Calendar, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { supabase } from './lib/supabase';

const DevenirPartenaire = () => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    setSuccess(false);

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

        await supabase.from('partnership_requests').insert({
          name: registerData.name,
          email: registerData.email,
          phone: registerData.phone,
          age: age,
          message: registerData.message
        });

        setSuccess(true);
        setRegisterData({ email: '', password: '', name: '', phone: '', age: '', message: '' });
        setTimeout(() => setSuccess(false), 5000);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) {
        setError('Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      // Vérifier si admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('id', data.user?.id)
        .single();

      if (adminData) {
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_email', loginData.email);
        navigate('/admin');
        return;
      }

      // Vérifier partenaire
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('id', data.user?.id)
        .single();

      if (partnerError || !partnerData) {
        await supabase.auth.signOut();
        setError('Compte non trouvé dans nos registres');
        setLoading(false);
        return;
      }

      if (partnerData.status !== 'approved') {
        await supabase.auth.signOut();
        setError('Votre compte n\'est pas encore approuvé. Veuillez patienter.');
        setLoading(false);
        return;
      }

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-md">
        {/* Texte de présentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full mb-4">
            <Crown className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-600 font-medium">Devenir partenaire</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Soutenez durablement <br />
            <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">l'œuvre de Dieu</span>
          </h1>
          <p className="text-gray-600 text-sm">
            En devenant partenaire, vous vous engagez à soutenir régulièrement notre mission.
            Votre fidélité nous permet de planifier et d'agir concrètement.
          </p>
          <div className="mt-3 border-l-4 border-purple-300 pl-3 text-left mx-auto max-w-xs">
            <p className="text-gray-500 text-xs italic">
              « Donnez, et l'on vous donnera : une bonne mesure, tassée, secouée, débordante. » (Luc 6:38)
            </p>
          </div>
        </motion.div>

        {/* Onglets séparés (hors formulaire) */}
        <div className="flex justify-center gap-3 mb-5">
          <button
            onClick={() => { setMode('register'); setError(''); setSuccess(false); }}
            className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 text-sm ${
              mode === 'register'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <User className="inline w-4 h-4 mr-1.5" />
            Inscription
          </button>
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess(false); }}
            className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 text-sm ${
              mode === 'login'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Lock className="inline w-4 h-4 mr-1.5" />
            Connexion
          </button>
        </div>

        {/* Formulaire avec ombre renforcée */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="p-5">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        required
                        placeholder="Jean Dupont"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        required
                        placeholder="jean.dupont@email.com"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        required
                        placeholder="+225 07 XX XX XX XX"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Âge * (18 ans minimum)</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        required
                        min="18"
                        max="120"
                        placeholder="25"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={registerData.age}
                        onChange={(e) => setRegisterData({...registerData, age: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
                    <textarea
                      rows={2}
                      placeholder="Votre message..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      value={registerData.message}
                      onChange={(e) => setRegisterData({...registerData, message: e.target.value})}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <p className="text-xs text-green-600">
                        ✅ Demande envoyée ! Un responsable examinera votre candidature.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition-all duration-300 font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Heart size={16} />
                        Envoyer ma demande
                      </>
                    )}
                  </button>
                </motion.form>
              )}

              {mode === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        required
                        placeholder="jean.dupont@email.com"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition-all duration-300 font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      'Se connecter'
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Bouton Retour à l'accueil en bas */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-all duration-300 shadow-sm text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevenirPartenaire;