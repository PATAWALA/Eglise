import { motion } from "framer-motion";
import {
  Heart,
  CreditCard,
  Clock,
  Users,
  Shield,
  ChevronRight,
  Menu,
  X,
  BookOpen,
  Church,
  HandHeart,
  Building2,
  Globe,
  UsersRound,
  Smartphone,
} from "lucide-react";
import DevenirPartenaire from './DevenirPartenaire';
import PartnerDashboard from './PartnerDashboard';
import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Leaderboard from "./Leaderboard";
import AdminDashboard from './AdminDashboard';
import AdminLogin from './AdminLogin';

interface Donation {
  id: number;
  name: string;
  city: string;
  amount: number;
  date: string;
  donation_type: string;
  payment_method: string;
  phone?: string;
}

// Types de dons catholiques
const donationTypes = [
  { id: "dime", name: "Dîme", icon: Church, description: "10% de vos revenus pour l'Église" },
  { id: "offering", name: "Offrande", icon: Heart, description: "Don libre pour l'œuvre de Dieu" },
  { id: "alms", name: "Aumône", icon: HandHeart, description: "Pour les plus démunis" },
  { id: "construction", name: "Construction", icon: Building2, description: "Pour l'entretien et la construction" },
  { id: "missions", name: "Missions", icon: Globe, description: "Soutien aux missionnaires" },
  { id: "social", name: "Œuvres sociales", icon: UsersRound, description: "Actions caritatives" },
];

// Moyens de paiement
const paymentMethods = [
  { id: "mtn", name: "MTN Mobile Money", icon: Smartphone },
  { id: "moov", name: "Moov Money", icon: Smartphone },
  { id: "orange", name: "Orange Money", icon: Smartphone },
  { id: "card", name: "Carte bancaire", icon: CreditCard },
  { id: "mobile", name: "Mobile Money", icon: Smartphone },
];

// Composant LandingPage
const LandingPage = ({ onDonate }: { onDonate: (name: string, city: string, amount: number, donationType: string, paymentMethod: string, phone: string) => Promise<boolean> }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState("20");
  const [nomComplet, setNomComplet] = useState("");
  const [villeQuartier, setVilleQuartier] = useState("");
  const [selectedDonationType, setSelectedDonationType] = useState("dime");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("mtn");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const donateSectionRef = useRef<HTMLElement>(null);

  const handleDonate = async () => {
    if (!nomComplet || !villeQuartier || !phoneNumber) {
      alert("Veuillez remplir tous les champs avant de donner.");
      return;
    }
    const amountNumber = parseFloat(donationAmount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      alert("Veuillez entrer un montant valide.");
      return;
    }

    setIsProcessing(true);
    
    const donationTypeName = donationTypes.find(t => t.id === selectedDonationType)?.name || selectedDonationType;
    const paymentMethodName = paymentMethods.find(m => m.id === selectedPaymentMethod)?.name || selectedPaymentMethod;
    
    const success = await onDonate(
      nomComplet, 
      villeQuartier, 
      amountNumber, 
      donationTypeName, 
      paymentMethodName,
      phoneNumber
    );
    
    if (success) {
      alert(`✅ Don effectué avec succès !\n\n` +
        `📝 ${donationTypeName} : ${amountNumber} €\n` +
        `🙏 ${nomComplet} (${villeQuartier})\n` +
        `💳 Paiement : ${paymentMethodName}\n\n` +
        `Que Dieu vous bénisse abondamment !`);
      
      setNomComplet("");
      setVilleQuartier("");
      setDonationAmount("20");
      setPhoneNumber("");
    }
    
    setIsProcessing(false);
  };

  const scrollToDonate = () => {
    donateSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
    viewport: { once: true, amount: 0.3 },
  };

  const heroImages = ["/images/eglise1.jpg", "/images/eglise2.jpg", "/images/eglise3.jpg"];
  const [currentImage, setCurrentImage] = useState(0);
  const [nextImage, setNextImage] = useState(1);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentImage(nextImage);
        setNextImage((nextImage + 1) % heroImages.length);
        setFade(true);
      }, 1000);
    }, 4000);
    return () => clearInterval(interval);
  }, [nextImage, heroImages.length]);

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-purple-700">Mon offrande en ligne</div>
          <div className="hidden md:flex space-x-8 items-center">
            <a href="#hero" className="text-gray-700 hover:text-purple-600 transition">Accueil</a>
            <a href="#why" className="text-gray-700 hover:text-purple-600 transition">Pourquoi donner ?</a>
            <a href="#how" className="text-gray-700 hover:text-purple-600 transition">Comment ça marche</a>
            <a href="#donate" className="text-gray-700 hover:text-purple-600 transition">Faire un don</a>
            <Link to="/tableau" className="text-gray-700 hover:text-purple-600 transition">
              Tableau d'Honneur
            </Link>
            <button onClick={scrollToDonate} className="bg-purple-600 text-white px-5 py-2 rounded-full hover:bg-purple-700 transition shadow-md">
              Donner maintenant
            </button>
          </div>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t py-4 px-6 flex flex-col space-y-3">
            <a href="#hero" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>Accueil</a>
            <a href="#why" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>Pourquoi donner ?</a>
            <a href="#how" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>Comment ça marche</a>
            <a href="#donate" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>Faire un don</a>
            <Link to="/tableau" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>
              Tableau d'Honneur
            </Link>
            <button onClick={scrollToDonate} className="bg-purple-600 text-white px-5 py-2 rounded-full w-full text-center">
              Donner maintenant
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-20 min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImages[currentImage]}
            alt="Fond d'église"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          />
          <img
            src={heroImages[nextImage]}
            alt="Fond d'église suivant"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              fade ? "opacity-0" : "opacity-100"
            }`}
          />
        </div>
        <div className="absolute inset-0 bg-black/50" />
        <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center">
          <motion.div {...fadeInUp} className="md:w-1/2 text-center md:text-left text-white">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Donnez avec joie, car{" "}
              <span className="text-purple-300">Dieu aime celui qui donne avec joie</span>
            </h1>
            <p className="mt-4 text-lg italic text-gray-100">
              « Il n'y a pas de plus grand amour que de donner sa vie pour ses amis » (Jean 15:13).
              <br />
              En soutenant notre église, vous participez à l'œuvre de Dieu et venez en aide aux plus démunis.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
              <button onClick={scrollToDonate} className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition flex items-center gap-2 shadow-lg">
                Faire un don <ChevronRight size={18} />
              </button>
              <button className="border border-white text-white px-8 py-3 rounded-full hover:bg-white/10 transition">
                Lire la Parole
              </button>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {heroImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentImage(idx);
                setNextImage((idx + 1) % heroImages.length);
                setFade(true);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                currentImage === idx ? "bg-white w-4" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Why donate section */}
      <section id="why" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800">Pourquoi donner ?</h2>
            <p className="text-gray-600 mt-3">Donner, c'est obéir à Dieu et participer à son plan d'amour pour le monde.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-10 mt-16">
            {[
              { icon: BookOpen, title: "La dîme, un acte de foi", desc: "« Apportez à la maison du trésor toutes les dîmes… Et éprouvez-moi en cela, dit l'Éternel » (Malachie 3:10)." },
              { icon: Heart, title: "Suivre l'exemple de Jésus", desc: "Jésus a donné sa vie par amour. En donnant, nous imitons son cœur généreux." },
              { icon: Users, title: "Secourir les démunis", desc: "« Vous avez donné à manger à celui qui avait faim… c'est à moi que vous l'avez fait » (Matthieu 25:40)." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-xl shadow-md hover:shadow-xl transition bg-gray-50"
              >
                <item.icon className="w-12 h-12 mx-auto text-purple-600" />
                <h3 className="text-xl font-semibold mt-4">{item.title}</h3>
                <p className="text-gray-600 mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800">Comment donner selon la volonté de Dieu ?</h2>
            <p className="text-gray-600 mt-3">En trois étapes simples, vous pouvez bénir l'œuvre du Seigneur.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              { icon: CreditCard, step: "1", title: "Choisissez un type de don et un montant", desc: "Que ce soit la dîme, une offrande ou un don pour les pauvres, Dieu regarde votre cœur." },
              { icon: Shield, step: "2", title: "Paiement sécurisé", desc: "Donnez en toute confiance via MTN, Moov, Orange Money ou carte bancaire." },
              { icon: Clock, step: "3", title: "Confirmation et prière", desc: "Vous recevrez un reçu et nous prierons pour vous." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="relative bg-white p-6 rounded-xl shadow-md text-center"
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <item.icon className="w-12 h-12 mx-auto text-purple-600 mt-4" />
                <h3 className="text-xl font-semibold mt-4">{item.title}</h3>
                <p className="text-gray-600 mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation form */}
      <section id="donate" ref={donateSectionRef} className="py-20 bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="container mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800">Faites un don aujourd'hui</h2>
            <p className="text-gray-600 mt-3">
              « Donnez, et l'on vous donnera : une bonne mesure, tassée, secouée, débordante » (Luc 6:38).
              <br />
              Que Dieu vous bénisse au centuple pour votre générosité.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input type="text" placeholder="Votre nom et prénom" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={nomComplet} onChange={(e) => setNomComplet(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville / Quartier *</label>
                <input type="text" placeholder="Votre ville ou quartier" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={villeQuartier} onChange={(e) => setVilleQuartier(e.target.value)} required />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (pour confirmation) *</label>
              <input type="tel" placeholder="+229 XX XX XX XX" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Type de don *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {donationTypes.map((type) => (
                  <button key={type.id} onClick={() => setSelectedDonationType(type.id)} className={`p-3 rounded-lg border-2 transition-all ${selectedDonationType === type.id ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                    <type.icon className={`w-6 h-6 mx-auto mb-1 ${selectedDonationType === type.id ? "text-purple-600" : "text-gray-500"}`} />
                    <p className={`text-sm font-medium ${selectedDonationType === type.id ? "text-purple-700" : "text-gray-700"}`}>{type.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Montant du don *</label>
              <div className="flex flex-wrap gap-3 mb-3">
                {["10", "20", "50", "100", "200", "500"].map((amount) => (
                  <button key={amount} onClick={() => setDonationAmount(amount)} className={`px-4 py-2 rounded-full border transition ${donationAmount === amount ? "bg-purple-600 text-white border-purple-600" : "border-gray-300 text-gray-700 hover:border-purple-600"}`}>
                    {amount} €
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autre montant</label>
                <input type="number" placeholder="Montant personnalisé" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Moyen de paiement *</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {paymentMethods.map((method) => (
                  <button key={method.id} onClick={() => setSelectedPaymentMethod(method.id)} className={`p-3 rounded-lg border-2 transition-all text-center ${selectedPaymentMethod === method.id ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                    <method.icon className={`w-6 h-6 mx-auto mb-1 ${selectedPaymentMethod === method.id ? "text-purple-600" : "text-gray-500"}`} />
                    <p className={`text-xs font-medium ${selectedPaymentMethod === method.id ? "text-purple-700" : "text-gray-700"}`}>{method.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleDonate} disabled={isProcessing} className={`w-full py-3 rounded-full transition flex items-center justify-center gap-2 shadow-md ${isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"} text-white`}>
              {isProcessing ? "Traitement en cours..." : `Donner ${donationAmount} €`} <Heart size={18} />
            </button>
            <p className="text-xs text-gray-500 text-center mt-4">Votre don est sécurisé. Vous recevrez un reçu par SMS et email.</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold">Église de la Grâce</h3>
              <p className="text-gray-400 mt-2">« Que votre lumière brille devant les hommes » (Matthieu 5:16)</p>
              <p className="text-gray-400">contact@eglise-grace.fr</p>
            </div>
            <div className="mt-6 md:mt-0 flex flex-wrap gap-4 justify-center">
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Mentions légales</a>
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Confidentialité</a>
              <Link to="/devenir-partenaire" className="text-gray-400 hover:text-purple-400 transition text-sm">
                🙏 Devenir partenaire
              </Link>
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Nous contacter</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Église de la Grâce – Tous droits réservés.
          </div>
        </div>
      </footer>
    </>
  );
};

// Composant pour protéger les routes admin
const ProtectedAdminRoute = () => {
  const isAuthenticated = sessionStorage.getItem('admin_authenticated');
  return isAuthenticated ? <AdminDashboard /> : <Navigate to="/admin-login" replace />;
};

// Composant principal avec routage et Supabase
function App() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)

  // Charger les dons depuis Supabase
  const loadDonations = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('amount', { ascending: false })
    
    if (error) {
      console.error('Erreur de chargement:', error)
    } else {
      setDonations(data || [])
    }
    setLoading(false)
  }

  // Ajouter un don
  const addDonation = async (name: string, city: string, amount: number, donationType: string, paymentMethod: string, phone: string) => {
    const { error } = await supabase
      .from('donations')
      .insert([
        {
          name,
          city,
          amount,
          donation_type: donationType,
          payment_method: paymentMethod,
          phone,
        }
      ])
    
    if (error) {
      console.error('Erreur d\'insertion:', error)
      alert('Erreur lors de l\'enregistrement du don')
      return false
    }
    
    // Recharger la liste
    await loadDonations()
    return true
  }

  // Charger au démarrage
  useEffect(() => {
    loadDonations()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage onDonate={addDonation} />} />
        <Route path="/devenir-partenaire" element={<DevenirPartenaire />} />
        <Route path="/espace-partenaire" element={<PartnerDashboard />} />
        <Route path="/tableau" element={<Leaderboard donations={donations} loading={loading} />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedAdminRoute />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App