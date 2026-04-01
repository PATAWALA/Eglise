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
  UserPlus,
  Calendar,
  MapPin,
  ArrowRight,
  Mail,
  Phone,
  MapPinIcon
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

// Événements & Actualités fusionnés
const newsAndEvents = [
  {
    id: 1,
    type: "event",
    title: "Grande célébration de Pâques 2024",
    description: "Rejoignez-nous pour célébrer la résurrection du Christ avec une messe solennelle.",
    date: "20 Avril 2024",
    location: "Cathédrale Notre-Dame, Cotonou",
    image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab41?w=800"
  },
  {
    id: 2,
    type: "news",
    title: "Campagne de soutien aux orphelinats",
    description: "Notre campagne annuelle de collecte pour les orphelinats a débuté.",
    date: "15 Mars 2024",
    location: "Tout le Bénin",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800"
  },
  {
    id: 3,
    type: "event",
    title: "Retraite spirituelle",
    description: "Une journée de prière et de méditation pour se ressourcer.",
    date: "25 Avril 2024",
    location: "Centre Spirituel Saint Augustin",
    image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800"
  },
  {
    id: 4,
    type: "news",
    title: "Nouveau projet de construction d'école",
    description: "Lancement du projet de construction d'une école primaire.",
    date: "10 Mars 2024",
    location: "Lokossa",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800"
  }
];

// Composant LandingPage
const LandingPage = ({ onDonate }: { onDonate: (name: string, city: string, amount: number, donationType: string, paymentMethod: string, phone: string) => Promise<boolean> }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [nomComplet, setNomComplet] = useState("");
  const [villeQuartier, setVilleQuartier] = useState("");
  const [selectedDonationType, setSelectedDonationType] = useState("dime");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("mtn");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'event' | 'news'>('all');

  const donateSectionRef = useRef<HTMLElement>(null);

  const filteredNews = activeFilter === 'all' 
    ? newsAndEvents 
    : newsAndEvents.filter(item => item.type === activeFilter);

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
      setDonationAmount("");
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
      {/* Navbar épurée avec liens centrés */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo à gauche */}
            <Link to="/" className="text-xl font-bold text-purple-700">
              Mon offrande en ligne
            </Link>
            
            {/* Liens centrés */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#hero" className="text-gray-700 hover:text-purple-600 transition">Accueil</a>
              <a href="#about" className="text-gray-700 hover:text-purple-600 transition">À propos</a>
              <a href="#news" className="text-gray-700 hover:text-purple-600 transition">Événements & Actus</a>
              <Link to="/tableau" className="text-gray-700 hover:text-purple-600 transition">Donateurs</Link>
              <a href="#contact" className="text-gray-700 hover:text-purple-600 transition">Contact</a>
            </div>
            
            {/* Bouton à droite */}
            <div className="hidden md:block">
              <Link to="/devenir-partenaire" className="bg-purple-600 text-white px-5 py-2 rounded-full hover:bg-purple-700 transition shadow-md">
                Devenir partenaire
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t py-4 px-6 flex flex-col space-y-3">
            <a href="#hero" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>Accueil</a>
            <a href="#about" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>À propos</a>
            <a href="#news" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>Événements & Actus</a>
            <Link to="/tableau" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>Donateurs</Link>
            <a href="#contact" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            <Link to="/devenir-partenaire" className="bg-purple-600 text-white px-5 py-2 rounded-full text-center" onClick={() => setMobileMenuOpen(false)}>
              Devenir partenaire
            </Link>
          </div>
        )}
      </nav>
{/* Hero Section - Texte centré sur tous les écrans */}
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
  <div className="container mx-auto px-6 relative z-10">
    <motion.div {...fadeInUp} className="text-center text-white max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-bold leading-tight">
        Donnez avec joie, car{" "}
        <span className="text-purple-300">Dieu aime celui qui donne avec joie</span>
      </h1>
      <p className="mt-4 text-lg italic text-gray-100">
        « Il n'y a pas de plus grand amour que de donner sa vie pour ses amis » (Jean 15:13).
        <br />
        En soutenant notre église, vous participez à l'œuvre de Dieu et venez en aide aux plus démunis.
      </p>
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <button onClick={scrollToDonate} className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition flex items-center gap-2 shadow-lg">
          Faire un don <ChevronRight size={18} />
        </button>
        <Link to="/devenir-partenaire" className="border border-white text-white px-8 py-3 rounded-full hover:bg-white/10 transition">
          Devenir partenaire
        </Link>
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
      {/* Section À propos */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Notre mission</h2>
            <p className="text-gray-600 mt-3">Au service de Dieu et de la communauté depuis plus de 50 ans</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: BookOpen, title: "Transmission de la foi", desc: "Annoncer l'Évangile et former les croyants à vivre leur foi au quotidien." },
              { icon: Heart, title: "Charité active", desc: "Soutenir les plus démunis à travers des actions concrètes et régulières." },
              { icon: Users, title: "Vie communautaire", desc: "Créer du lien et rassembler les fidèles autour de moments de partage." },
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

      {/* Section Événements & Actualités fusionnée */}
      <section id="news" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Événements & Actualités</h2>
            <p className="text-gray-600 mt-3">Restez informé des activités de notre communauté</p>
          </div>

          {/* Filtres */}
          <div className="flex justify-center gap-4 mb-10">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-6 py-2 rounded-full font-medium transition ${
                activeFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setActiveFilter('event')}
              className={`px-6 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                activeFilter === 'event'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar size={16} />
              Événements
            </button>
            <button
              onClick={() => setActiveFilter('news')}
              className={`px-6 py-2 rounded-full font-medium transition ${
                activeFilter === 'news'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Actualités
            </button>
          </div>

          {/* Grille */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden"
              >
                <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
                <div className="p-5">
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.type === 'event' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {item.type === 'event' ? 'Événement' : 'Actualité'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{item.date}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <MapPin size={14} />
                    <span>{item.location}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Donation Form */}
      <section id="donate" ref={donateSectionRef} className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800">Faites un don aujourd'hui</h2>
            <p className="text-gray-600 mt-3">
              « Donnez, et l'on vous donnera : une bonne mesure, tassée, secouée, débordante » (Luc 6:38).
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto mt-12 bg-gray-50 rounded-2xl shadow-xl p-8"
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
              <div>
                <input type="number" placeholder="Montant en euros" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Moyen de paiement *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {paymentMethods.map((method) => (
                  <button key={method.id} onClick={() => setSelectedPaymentMethod(method.id)} className={`p-3 rounded-lg border-2 transition-all text-center ${selectedPaymentMethod === method.id ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                    <method.icon className={`w-6 h-6 mx-auto mb-1 ${selectedPaymentMethod === method.id ? "text-purple-600" : "text-gray-500"}`} />
                    <p className={`text-xs font-medium ${selectedPaymentMethod === method.id ? "text-purple-700" : "text-gray-700"}`}>{method.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleDonate} disabled={isProcessing} className={`w-full py-3 rounded-full transition flex items-center justify-center gap-2 shadow-md ${isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"} text-white`}>
              {isProcessing ? "Traitement en cours..." : `Donner ${donationAmount || 'un montant'} €`} <Heart size={18} />
            </button>
            <p className="text-xs text-gray-500 text-center mt-4">Votre don est sécurisé. Vous recevrez un reçu par SMS et email.</p>
          </motion.div>
        </div>
      </section>

      {/* Section Devenir partenaire - Fond gris clair */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-6 text-center">
          <UserPlus className="w-16 h-16 mx-auto mb-6 text-purple-600" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Devenez partenaire de l'Église</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
            « Que chacun donne comme il l'a décidé en son cœur, sans tristesse ni contrainte, 
            car Dieu aime celui qui donne avec joie. » (2 Corinthiens 9:7)
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto mb-8">
            Les partenaires bénéficient d'un espace personnel pour suivre leurs dons et contribuer 
            durablement à la mission de l'Église.
          </p>
          <Link 
            to="/devenir-partenaire" 
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition shadow-md"
          >
            Je deviens partenaire <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Section Contact - Dernière section avant footer */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Contactez-nous</h2>
            <p className="text-gray-600 mt-3">Une question ? Nous sommes à votre écoute</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <MapPinIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Adresse</h4>
                  <p className="text-gray-600">Cotonou, Bénin</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Phone className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Téléphone</h4>
                  <p className="text-gray-600">+229 97 00 00 00</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Email</h4>
                  <p className="text-gray-600">contact@eglise-catholique.bj</p>
                </div>
              </div>
            </div>
            <form className="space-y-4">
              <input type="text" placeholder="Votre nom" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <input type="email" placeholder="Votre email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <textarea placeholder="Votre message" rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
              <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">Envoyer</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer avec coordonnées Abidjan */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Mon offrande en ligne</h3>
              <p className="text-gray-400 text-sm">Donnez avec joie, car Dieu aime celui qui donne avec joie.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liens rapides</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#hero" className="hover:text-white transition">Accueil</a></li>
                <li><a href="#about" className="hover:text-white transition">À propos</a></li>
                <li><a href="#news" className="hover:text-white transition">Événements & Actus</a></li>
                <li><Link to="/tableau" className="hover:text-white transition">Donateurs</Link></li>
                <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
                <li><Link to="/devenir-partenaire" className="hover:text-purple-400 transition">Devenir partenaire</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400 text-sm">contact@eglise-catholique.ci</p>
              <p className="text-gray-400 text-sm mt-2">+225 07 00 00 00</p>
              <p className="text-gray-400 text-sm">Abidjan, Côte d'Ivoire</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Mon offrande en ligne – Tous droits réservés.
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

// Composant principal avec routage
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
    
    await loadDonations()
    return true
  }

  useEffect(() => {
    loadDonations()
  }, [])

  return (
    <Routes>
      <Route path="/" element={<LandingPage onDonate={addDonation} />} />
      <Route path="/devenir-partenaire" element={<DevenirPartenaire />} />
      <Route path="/espace-partenaire" element={<PartnerDashboard />} />
      <Route path="/tableau" element={<Leaderboard donations={donations} loading={loading} />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedAdminRoute />} />
    </Routes>
  )
}

export default App;