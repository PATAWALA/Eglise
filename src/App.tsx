import { motion, AnimatePresence} from "framer-motion";
import {
  Heart,
  CreditCard,
  Users,
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
  MapPinIcon,
  CalendarDays,
  Clock3,
  Sparkles,
  Crown,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle
} from "lucide-react";
import DevenirPartenaire from './DevenirPartenaire';
import PartnerDashboard from './PartnerDashboard';
import MaintenancePage from './MaintenancePage';
import { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
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
];

// Événements & Actualités
const newsAndEvents = [
  {
    id: 1,
    type: "event",
    title: "Grande célébration de Pâques 2024",
    description: "Rejoignez-nous pour célébrer la résurrection du Christ avec une messe solennelle suivie d'un repas fraternel.",
    date: "20 Avril 2024",
    time: "10:00",
    location: "Cathédrale Notre-Dame, Cotonou",
    image: "https://images.pexels.com/photos/3523160/pexels-photo-3523160.jpeg?w=800",
    fullDescription: "La célébration de Pâques est le moment le plus important de l'année liturgique. Venez nombreux pour cette messe solennelle présidée par l'archevêque. Un repas fraternel sera organisé après la messe dans le jardin de la cathédrale. Tous sont les bienvenus !"
  },
  {
    id: 2,
    type: "event",
    title: "Retraite spirituelle",
    description: "Une journée de prière et de méditation pour se ressourcer spirituellement et renouveler sa foi.",
    date: "25 Avril 2024",
    time: "08:00 - 17:00",
    location: "Centre Spirituel Saint Augustin, Porto-Novo",
    image: "https://images.pexels.com/photos/2398220/pexels-photo-2398220.jpeg?w=800",
    fullDescription: "Cette retraite spirituelle est ouverte à tous ceux qui souhaitent prendre du temps pour la prière et la méditation. Au programme : enseignements, adoration, confessions et messe. Venez vous ressourcer dans un cadre paisible."
  },
  {
    id: 3,
    type: "event",
    title: "Concert de louange",
    description: "Soirée de louange et d'adoration avec les plus grands artistes gospel de la région.",
    date: "30 Avril 2024",
    time: "18:00",
    location: "Palais des Congrès, Cotonou",
    image: "https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?w=800",
    fullDescription: "Une soirée exceptionnelle de louange et d'adoration avec les artistes gospel les plus talentueux. Venez célébrer Dieu à travers la musique dans une ambiance de fête et de recueillement. Entrée libre, plateau artistique exceptionnel."
  },
  {
    id: 4,
    type: "news",
    title: "Campagne de soutien aux orphelinats",
    description: "Notre campagne annuelle de collecte pour les orphelinats a débuté. Votre générosité change des vies !",
    date: "15 Mars 2024",
    location: "Tout le Bénin",
    image: "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?w=800",
    fullDescription: "La campagne 'Un sourire pour chaque enfant' vise à collecter des fonds pour soutenir les 5 orphelinats partenaires. Les dons permettront d'améliorer les conditions de vie, d'acheter du matériel scolaire et d'organiser des activités récréatives. Chaque don compte !"
  },
  {
    id: 5,
    type: "news",
    title: "Nouveau projet de construction d'école",
    description: "Lancement du projet de construction d'une école primaire pour les enfants défavorisés.",
    date: "10 Mars 2024",
    location: "Lokossa",
    image: "https://images.pexels.com/photos/5212346/pexels-photo-5212346.jpeg?w=800",
    fullDescription: "Nous lançons officiellement le projet 'Bâtir l'avenir' : la construction d'une école primaire de 6 classes à Lokossa. Ce projet permettra à 200 enfants d'accéder à une éducation de qualité. Les travaux débuteront en mai 2024. Nous recherchons des partenaires pour soutenir ce projet."
  },
  {
    id: 6,
    type: "news",
    title: "Remise des diplômes du centre catéchétique",
    description: "Célébration de la remise des diplômes aux nouveaux catéchistes formés cette année.",
    date: "5 Avril 2024",
    location: "Paroisse Saint Pierre, Cotonou",
    image: "https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?w=800",
    fullDescription: "Après 2 ans de formation intensive, 45 nouveaux catéchistes recevront leur diplôme lors d'une cérémonie solennelle présidée par l'archevêque. Venez nombreux les encourager et célébrer cet engagement au service de la foi."
  }
];

// Composant LandingPage (inchangé)
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
  const [selectedItem, setSelectedItem] = useState<typeof newsAndEvents[0] | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);

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

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 3000);
  };

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md shadow-md z-50">
        <div className="container mx-auto px-8 py-5">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Church className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                <Sparkles className="h-3 w-3 text-amber-400 absolute -top-1 -right-1" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">
                Mon offrande
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-10">
              <a href="#hero" className="text-gray-600 hover:text-purple-600 transition font-medium">Accueil</a>
              <a href="#about" className="text-gray-600 hover:text-purple-600 transition font-medium">À propos</a>
              <a href="#news" className="text-gray-600 hover:text-purple-600 transition font-medium">Événements & Actus</a>
              <Link to="/tableau" className="text-gray-600 hover:text-purple-600 transition font-medium">Donateurs</Link>
              <a href="#contact" className="text-gray-600 hover:text-purple-600 transition font-medium">Contact</a>
            </div>
            
            <div className="hidden md:block">
              <Link 
                to="/devenir-partenaire" 
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
              >
                <Crown size={18} />
                Devenir partenaire
              </Link>
            </div>
            
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t py-4 px-6 flex flex-col space-y-3">
            <a href="#hero" className="text-gray-700 py-2" onClick={() => setMobileMenuOpen(false)}>Accueil</a>
            <a href="#about" className="text-gray-700 py-2" onClick={() => setMobileMenuOpen(false)}>À propos</a>
            <a href="#news" className="text-gray-700 py-2" onClick={() => setMobileMenuOpen(false)}>Événements & Actus</a>
            <Link to="/tableau" className="text-gray-700 py-2" onClick={() => setMobileMenuOpen(false)}>Donateurs</Link>
            <a href="#contact" className="text-gray-700 py-2" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            <Link to="/devenir-partenaire" className="bg-purple-600 text-white px-5 py-2 rounded-xl text-center" onClick={() => setMobileMenuOpen(false)}>
              Devenir partenaire
            </Link>
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
              <button onClick={scrollToDonate} className="bg-purple-600 text-white px-8 py-3 rounded-xl hover:bg-purple-700 transition flex items-center gap-2 shadow-lg">
                Faire un don <ChevronRight size={18} />
              </button>
              <Link to="/devenir-partenaire" className="border border-white text-white px-8 py-3 rounded-xl hover:bg-white/10 transition">
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

      {/* Section Événements & Actualités */}
      <section id="news" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Événements & Actualités</h2>
            <p className="text-gray-600 mt-3">Restez connecté à la vie de notre communauté</p>
          </motion.div>

          <div className="flex justify-center gap-3 mb-12">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'event', label: 'Événements', icon: CalendarDays },
              { id: 'news', label: 'Actualités', icon: BookOpen },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as typeof activeFilter)}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeFilter === filter.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {filter.icon && <filter.icon size={16} />}
                {filter.label}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                viewport={{ once: true }}
                onClick={() => setSelectedItem(item)}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-medium shadow-md ${
                        item.type === 'event' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-emerald-500 text-white'
                      }`}>
                        {item.type === 'event' ? ' Événement' : ' Actualité'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{item.date}</span>
                      </div>
                      {item.time && (
                        <div className="flex items-center gap-1">
                          <Clock3 size={12} />
                          <span>{item.time}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin size={12} />
                        <span className="truncate max-w-[150px]">{item.location}</span>
                      </div>
                      <span className="text-purple-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Lire plus <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation form */}
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
                <input type="text" placeholder="Votre nom et prénom" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" value={nomComplet} onChange={(e) => setNomComplet(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville / Quartier *</label>
                <input type="text" placeholder="Votre ville ou quartier" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" value={villeQuartier} onChange={(e) => setVilleQuartier(e.target.value)} required />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (pour confirmation) *</label>
              <input type="tel" placeholder="+225 XX XX XX XX" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Type de don *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {donationTypes.map((type) => (
                  <button key={type.id} onClick={() => setSelectedDonationType(type.id)} className={`p-3 rounded-xl border-2 transition-all ${selectedDonationType === type.id ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
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
                <input type="number" placeholder="Montant en euros" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Moyen de paiement *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {paymentMethods.map((method) => (
                  <button key={method.id} onClick={() => setSelectedPaymentMethod(method.id)} className={`p-3 rounded-xl border-2 transition-all text-center ${selectedPaymentMethod === method.id ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                    <method.icon className={`w-6 h-6 mx-auto mb-1 ${selectedPaymentMethod === method.id ? "text-purple-600" : "text-gray-500"}`} />
                    <p className={`text-xs font-medium ${selectedPaymentMethod === method.id ? "text-purple-700" : "text-gray-700"}`}>{method.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleDonate} disabled={isProcessing} className={`w-full py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md ${isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"} text-white font-medium`}>
              {isProcessing ? "Traitement en cours..." : `Donner ${donationAmount || 'un montant'} €`} <Heart size={18} />
            </button>
            <p className="text-xs text-gray-500 text-center mt-4">Votre don est sécurisé. Vous recevrez un reçu par SMS et email.</p>
          </motion.div>
        </div>
      </section>

      {/* Section Devenir partenaire */}
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
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 transition shadow-md"
          >
            Je deviens partenaire <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Section Contact */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full mb-4">
              <MessageCircle className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-600 font-medium">Nous contacter</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Une question ? <span className="text-purple-600">Écrivez-nous</span>
            </h2>
            <p className="text-gray-600">Notre équipe vous répondra dans les meilleurs délais</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Informations de contact */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Informations</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <MapPinIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Adresse</h4>
                      <p className="text-gray-500">Abidjan, Côte d'Ivoire</p>
                      <p className="text-gray-400 text-sm mt-1">2 Plateaux, Rue des Églises</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Phone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Téléphone</h4>
                      <p className="text-gray-500">+225 07 00 00 00</p>
                      <p className="text-gray-400 text-sm">Lun-Ven, 8h-18h</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Email</h4>
                      <p className="text-gray-500">contact@eglise-catholique.ci</p>
                      <p className="text-gray-400 text-sm">support@eglise-catholique.ci</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Réseaux sociaux */}
              <div className="bg-gray-50 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Suivez-nous</h3>
                <div className="flex gap-3">
                  {[
                    { icon: Facebook, label: "Facebook", color: "hover:bg-blue-600" },
                    { icon: Twitter, label: "Twitter", color: "hover:bg-sky-500" },
                    { icon: Instagram, label: "Instagram", color: "hover:bg-pink-600" },
                    { icon: Youtube, label: "YouTube", color: "hover:bg-red-600" },
                    { icon: Linkedin, label: "LinkedIn", color: "hover:bg-blue-700" },
                  ].map((social, idx) => (
                    <a
                      key={idx}
                      href="#"
                      className={`p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:text-white ${social.color} group`}
                    >
                      <social.icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Formulaire de contact */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gray-50 p-8 rounded-2xl"
            >
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                  <input
                    type="text"
                    placeholder="Votre nom et prénom"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    placeholder="+225 XX XX XX XX"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Votre message..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {formSubmitted ? (
                    <>✓ Message envoyé</>
                  ) : (
                    <>
                      Envoyer le message <Send size={16} />
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Nous vous répondrons dans les 24-48h ouvrables
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="border-b border-gray-800">
          <div className="container mx-auto px-6 py-12">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-xl font-semibold mb-2">Restez informé</h3>
              <p className="text-gray-400 mb-6">Recevez nos actualités et événements par email</p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
                <button className="px-6 py-3 bg-purple-600 rounded-xl hover:bg-purple-700 transition font-medium">
                  S'abonner
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Church className="h-7 w-7 text-purple-400" />
                <span className="text-lg font-bold">Mon offrande</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Donnez avec joie, car Dieu aime celui qui donne avec joie. Au service de la communauté depuis plus de 50 ans.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Navigation</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#hero" className="hover:text-purple-400 transition">Accueil</a></li>
                <li><a href="#about" className="hover:text-purple-400 transition">À propos</a></li>
                <li><a href="#news" className="hover:text-purple-400 transition">Événements & Actus</a></li>
                <li><Link to="/tableau" className="hover:text-purple-400 transition">Donateurs</Link></li>
                <li><a href="#contact" className="hover:text-purple-400 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Agir</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={scrollToDonate} className="hover:text-purple-400 transition">Faire un don</button></li>
                <li><Link to="/devenir-partenaire" className="hover:text-purple-400 transition">Devenir partenaire</Link></li>
                <li><a href="#" className="hover:text-purple-400 transition">Devenir bénévole</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Prier pour nous</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-center gap-2"><MapPinIcon size={14} /> <span>Abidjan, Côte d'Ivoire</span></li>
                <li className="flex items-center gap-2"><Phone size={14} /> <span>+225 07 00 00 00</span></li>
                <li className="flex items-center gap-2"><Mail size={14} /> <span>contact@eglise-catholique.ci</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Mon offrande en ligne. Tous droits réservés.</p>
            <p className="mt-1">Conçu avec ❤️ pour la communauté catholique de Côte d'Ivoire</p>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="relative h-64">
                <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-full object-cover rounded-t-2xl" />
                <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition"><X size={20} /></button>
                <div className="absolute bottom-4 left-4">
                  <span className={`px-3 py-1.5 rounded-xl text-sm font-medium ${selectedItem.type === 'event' ? 'bg-purple-600 text-white' : 'bg-emerald-500 text-white'}`}>
                    {selectedItem.type === 'event' ? ' Événement' : ' Actualité'}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{selectedItem.title}</h3>
                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1"><Calendar size={16} /> <span>{selectedItem.date}</span></div>
                  {selectedItem.time && <div className="flex items-center gap-1"><Clock3 size={16} /> <span>{selectedItem.time}</span></div>}
                  <div className="flex items-center gap-1"><MapPin size={16} /> <span>{selectedItem.location}</span></div>
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">{selectedItem.fullDescription || selectedItem.description}</p>
                <div className="flex gap-3">
                  <button onClick={() => { setSelectedItem(null); scrollToDonate(); }} className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 transition font-medium">
                    {selectedItem.type === 'event' ? 'Participer' : 'Soutenir'} <ArrowRight size={16} />
                  </button>
                  <button onClick={() => setSelectedItem(null)} className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium">Fermer</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Composant pour protéger les routes admin
const ProtectedAdminRoute = () => {
  const isAuthenticated = sessionStorage.getItem('admin_authenticated');
  return isAuthenticated ? <AdminDashboard /> : <Navigate to="/admin-login" replace />;
};

// Composant principal avec routage (modifié pour éviter l'écran de chargement)
function App() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  
  // Initialisation immédiate : valeur par défaut ou cache sessionStorage
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => {
    const cached = sessionStorage.getItem('maintenance_mode');
    return cached !== null ? cached === 'true' : false;
  });

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

  // Mise à jour en arrière‑plan du mode maintenance (sans bloquer l'affichage)
  useEffect(() => {
    const checkMaintenance = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('maintenance_mode')
        .maybeSingle();
      let mode = false;
      if (!error && data) {
        mode = data.maintenance_mode;
      }
      setMaintenanceMode(mode);
      sessionStorage.setItem('maintenance_mode', String(mode));
    };
    checkMaintenance();
  }, []);

  // Plus d'écran de chargement : on utilise directement la valeur initiale
  return (
    <Routes>
      <Route path="/" element={maintenanceMode ? <MaintenancePage /> : <LandingPage onDonate={addDonation} />} />
      <Route path="/devenir-partenaire" element={maintenanceMode ? <MaintenancePage /> : <DevenirPartenaire />} />
      <Route path="/espace-partenaire" element={<PartnerDashboard />} />
      <Route path="/tableau" element={maintenanceMode ? <MaintenancePage /> : <Leaderboard donations={donations} loading={loading} />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedAdminRoute />} />
    </Routes>
  )
}

export default App;