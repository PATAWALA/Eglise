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
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import Leaderboard from "./Leaderboard";

interface Donation {
  id: number;
  name: string;
  city: string;
  amount: number;
  date: Date;
}

// Composant Home (contient toutes les sections sauf le classement)
const Home = ({
  donations,
  onDonate,
}: {
  donations: Donation[];
  onDonate: (name: string, city: string, amount: number) => void;
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState("20");
  const [nomComplet, setNomComplet] = useState("");
  const [villeQuartier, setVilleQuartier] = useState("");

  const donateSectionRef = useRef<HTMLElement>(null);

  const handleDonate = () => {
    if (!nomComplet || !villeQuartier) {
      alert("Veuillez remplir tous les champs avant de donner.");
      return;
    }
    const amountNumber = parseFloat(donationAmount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      alert("Veuillez entrer un montant valide.");
      return;
    }
    onDonate(nomComplet, villeQuartier, amountNumber);
    alert(
      `Merci ${nomComplet} de ${villeQuartier} pour votre don de ${amountNumber} € ! Que Dieu vous bénisse.`
    );
    setNomComplet("");
    setVilleQuartier("");
    setDonationAmount("20");
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
          <div className="text-2xl font-bold text-purple-700">Église de la Grâce</div>
          <div className="hidden md:flex space-x-8 items-center">
            <a href="#hero" className="text-gray-700 hover:text-purple-600 transition">
              Accueil
            </a>
            <a href="#why" className="text-gray-700 hover:text-purple-600 transition">
              Pourquoi donner ?
            </a>
            <a href="#how" className="text-gray-700 hover:text-purple-600 transition">
              Comment ça marche
            </a>
            <a href="#donate" className="text-gray-700 hover:text-purple-600 transition">
              Faire un don
            </a>
            <Link
              to="/classement"
              className="text-gray-700 hover:text-purple-600 transition"
            >
              Classement
            </Link>
            <button
              onClick={scrollToDonate}
              className="bg-purple-600 text-white px-5 py-2 rounded-full hover:bg-purple-700 transition shadow-md"
            >
              Donner maintenant
            </button>
          </div>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t py-4 px-6 flex flex-col space-y-3">
            <a href="#hero" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>
              Accueil
            </a>
            <a href="#why" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>
              Pourquoi donner ?
            </a>
            <a href="#how" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>
              Comment ça marche
            </a>
            <a href="#donate" className="text-gray-700 hover:text-purple-600" onClick={() => setMobileMenuOpen(false)}>
              Faire un don
            </a>
            <Link
              to="/classement"
              className="text-gray-700 hover:text-purple-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Classement
            </Link>
            <button
              onClick={scrollToDonate}
              className="bg-purple-600 text-white px-5 py-2 rounded-full w-full text-center"
            >
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
              « Il n’y a pas de plus grand amour que de donner sa vie pour ses amis » (Jean 15:13).
              <br />
              En soutenant notre église, vous participez à l’œuvre de Dieu et venez en aide aux plus
              démunis.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
              <button
                onClick={scrollToDonate}
                className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition flex items-center gap-2 shadow-lg"
              >
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
            <p className="text-gray-600 mt-3">
              Donner, c’est obéir à Dieu et participer à son plan d’amour pour le monde.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10 mt-16">
            {[
              {
                icon: BookOpen,
                title: "La dîme, un acte de foi",
                desc: "« Apportez à la maison du trésor toutes les dîmes… Et éprouvez-moi en cela, dit l’Éternel » (Malachie 3:10). Donner, c’est reconnaître que tout vient de Dieu.",
              },
              {
                icon: Heart,
                title: "Suivre l’exemple de Jésus",
                desc: "Jésus a donné sa vie par amour. En donnant, nous imitons son cœur généreux et nous bénissons ceux qui souffrent.",
              },
              {
                icon: Users,
                title: "Secourir les démunis",
                desc: "« Vous avez donné à manger à celui qui avait faim… c’est à moi que vous l’avez fait » (Matthieu 25:40). Vos dons soutiennent les familles dans le besoin.",
              },
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
            <h2 className="text-3xl font-bold text-gray-800">
              Comment donner selon la volonté de Dieu ?
            </h2>
            <p className="text-gray-600 mt-3">
              En trois étapes simples, vous pouvez bénir l’œuvre du Seigneur et vos frères dans le
              besoin.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              {
                icon: CreditCard,
                step: "1",
                title: "Choisissez un montant",
                desc: "Que ce soit la dîme, une offrande ou un don pour les pauvres, Dieu regarde votre cœur.",
              },
              {
                icon: Shield,
                step: "2",
                title: "Paiement sécurisé",
                desc: "Donnez en toute confiance, comme si vous déposiez votre offrande à l’église.",
              },
              {
                icon: Clock,
                step: "3",
                title: "Confirmation et prière",
                desc: "Vous recevrez un reçu et nous prierons pour vous et vos intentions.",
              },
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
              « Donnez, et l’on vous donnera : une bonne mesure, tassée, secouée, débordante » (Luc
              6:38).
              <br />
              Que Dieu vous bénisse au centuple pour votre générosité.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-md mx-auto mt-12 bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Nom complet</label>
              <input
                type="text"
                placeholder="Votre nom et prénom"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={nomComplet}
                onChange={(e) => setNomComplet(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Ville / Quartier</label>
              <input
                type="text"
                placeholder="Votre ville ou quartier"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={villeQuartier}
                onChange={(e) => setVilleQuartier(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-between gap-3 flex-wrap mb-4">
              {["10", "20", "50", "100"].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDonationAmount(amount)}
                  className={`flex-1 py-2 rounded-full border transition ${
                    donationAmount === amount
                      ? "bg-purple-600 text-white border-purple-600"
                      : "border-gray-300 text-gray-700 hover:border-purple-600"
                  }`}
                >
                  {amount} €
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Autre montant</label>
              <input
                type="number"
                placeholder="Montant personnalisé"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
              />
            </div>

            <button
              onClick={handleDonate}
              className="w-full bg-purple-600 text-white py-3 rounded-full hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-md"
            >
              Donner {donationAmount} € <Heart size={18} />
            </button>
            <p className="text-xs text-gray-500 text-center mt-4">
              Votre don est sécurisé. Vous recevrez un reçu fiscal et nous prierons pour vous.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold">Église de la Grâce</h3>
              <p className="text-gray-400 mt-2">
                « Que votre lumière brille devant les hommes » (Matthieu 5:16)
              </p>
              <p className="text-gray-400">contact@eglise-grace.fr</p>
            </div>
            <div className="mt-6 md:mt-0 flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition">
                Mentions légales
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                Confidentialité
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                Nous contacter
              </a>
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

// Composant principal avec routage
function App() {
  const [donations, setDonations] = useState<Donation[]>([
    { id: 1, name: "Jean Dupont", city: "Paris", amount: 500, date: new Date(2026, 2, 15) },
    { id: 2, name: "Marie Lambert", city: "Lyon", amount: 300, date: new Date(2026, 2, 10) },
    { id: 3, name: "Pierre Martin", city: "Marseille", amount: 200, date: new Date(2026, 2, 5) },
    { id: 4, name: "Sophie Bernard", city: "Bordeaux", amount: 1000, date: new Date(2026, 1, 28) },
    { id: 5, name: "Lucas Moreau", city: "Lille", amount: 750, date: new Date(2026, 1, 20) },
    { id: 6, name: "Élise Robert", city: "Toulouse", amount: 450, date: new Date(2026, 2, 18) },
  ]);

  const addDonation = (name: string, city: string, amount: number) => {
    const newDonation: Donation = {
      id: donations.length + 1,
      name,
      city,
      amount,
      date: new Date(),
    };
    setDonations([...donations, newDonation]);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Home donations={donations} onDonate={addDonation} />}
        />
        <Route path="/classement" element={<Leaderboard donations={donations} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;