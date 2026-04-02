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
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Bouton retour */}
        <button 
          onClick={() => navigate('/')} 
          className="text-purple-600 hover:text-purple-700 mb-8 inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} />
          Retour à l'accueil
        </button>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Colonne gauche - texte épuré */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full mb-4">
                <Crown className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-600 font-medium">Devenir partenaire</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Soutenez durablement <br />
                <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">l'œuvre de Dieu</span>
              </h1>
              <p className="text-gray-600 leading-relaxed">
                En devenant partenaire, vous vous engagez à soutenir régulièrement notre mission.
                Votre fidélité nous permet de planifier et d'agir concrètement.
              </p>
            </div>
          </motion.div>

          {/* Colonne droite - formulaire avec ombre renforcée */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-shadow duration-300 overflow-hidden"
          >
            {/* Onglets */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => { setMode('register'); setError(''); setSuccess(false); }}
                className={`flex-1 py-4 text-center font-medium transition-all duration-300 ${
                  mode === 'register'
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/30'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="inline w-4 h-4 mr-2" />
                Inscription
              </button>
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(false); }}
                className={`flex-1 py-4 text-center font-medium transition-all duration-300 ${
                  mode === 'login'
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/30'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Lock className="inline w-4 h-4 mr-2" />
                Connexion
              </button>
            </div>

            <div className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.form
                    key="register"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleRegister}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={registerData.age}
                          onChange={(e) => setRegisterData({...registerData, age: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        value={registerData.message}
                        onChange={(e) => setRegisterData({...registerData, message: e.target.value})}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-sm text-green-600">
                          ✅ Demande envoyée avec succès ! Un responsable examinera votre candidature.
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 transition-all duration-300 font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <Heart size={18} />
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
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="email"
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={loginData.password}
                          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 transition-all duration-300 font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      ) : (
                        'Se connecter'
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DevenirPartenaire;