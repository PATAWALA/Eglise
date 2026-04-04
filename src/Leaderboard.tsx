import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Crown, 
  Heart, 
  Calendar, 
  Medal, 
  Trophy,
  Star,
  HandHeart,
  CalendarDays,
  Award,
  List
} from "lucide-react";
import { motion } from "framer-motion";

interface Donation {
  id: number;
  name: string;
  city: string;
  amount: number;
  date: string;
  donation_type: string;
  payment_method: string;
}

interface LeaderboardProps {
  donations: Donation[];
  loading?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ donations, loading = false }) => {
  const [filter, setFilter] = useState<"week" | "month" | "top" | "all">("all");

  // Calcul des dates
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filtrer et trier les dons
  const filteredDonations = useMemo(() => {
    let filtered = [...donations];
    
    if (filter === "week") {
      filtered = filtered.filter((don) => new Date(don.date) >= weekAgo);
    } else if (filter === "month") {
      filtered = filtered.filter((don) => new Date(don.date) >= monthAgo);
    } else if (filter === "top") {
      filtered = filtered
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
    }
    
    return filtered.sort((a, b) => b.amount - a.amount);
  }, [donations, filter, weekAgo, monthAgo]);

  // Rendu des médailles selon le rang
  const getMedal = (index: number) => {
    if (index === 0) return <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />;
    return <span className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 font-medium text-sm sm:text-base">{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Chargement du tableau d'honneur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <div className="container mx-auto px-3 sm:px-6 py-8 sm:py-12 md:py-20">
        {/* Header avec texte inspirant */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-purple-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-3 sm:mb-4">
            <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
            <span className="text-xs sm:text-sm text-purple-600 font-medium">Reconnaissance divine</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-800 mb-3 sm:mb-4">
            Tableau d'<span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">Honneur</span>
          </h1>
          
          <div className="max-w-2xl mx-auto px-2">
            <p className="text-gray-600 text-sm sm:text-base mb-2 sm:mb-3">
              « Que ta main gauche ne sache pas ce que fait ta main droite, afin que ton aumône soit dans le secret ; 
              et ton Père, qui voit dans le secret, te le rendra. » (Matthieu 6:3-4)
            </p>
            <p className="text-xs sm:text-sm text-gray-500 italic">
              Ce tableau honore la générosité des cœurs qui soutiennent l'œuvre de Dieu. 
              Que Dieu bénisse abondamment chaque donateur !
            </p>
          </div>
        </motion.div>

        {/* Filtres élégants - responsive wrap */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10"
        >
          {[
            { id: "week", label: "Cette semaine", icon: CalendarDays },
            { id: "month", label: "Ce mois", icon: Calendar },
            { id: "top", label: "Meilleurs dons", icon: Award },
            { id: "all", label: "Tous les dons", icon: List },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id as typeof filter)}
              className={`px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
                filter === btn.id
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-purple-50 border border-gray-200"
              }`}
            >
              <btn.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden xs:inline">{btn.label}</span>
              <span className="xs:hidden">{btn.label === "Cette semaine" ? "Semaine" : btn.label === "Ce mois" ? "Mois" : btn.label === "Meilleurs dons" ? "Top" : "Tous"}</span>
            </button>
          ))}
        </motion.div>

        {/* Message selon le filtre */}
        {filteredDonations.length > 0 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 px-2"
          >
            <Heart className="inline w-3 h-3 sm:w-4 sm:h-4 text-purple-600 mr-1" />
            {filter === "week" && "Voici les dons reçus cette semaine. Que Dieu bénisse chaque cœur généreux !"}
            {filter === "month" && "Voici les dons reçus ce mois-ci. Merci pour votre fidélité !"}
            {filter === "top" && "Ces généreux donateurs se distinguent par leur soutien exceptionnel. Qu'ils soient bénis !"}
            {filter === "all" && "Tous les dons enregistrés. Chaque contribution, grande ou petite, est précieuse devant Dieu."}
          </motion.p>
        )}

        {/* Tableau responsive avec scroll horizontal */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] sm:min-w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-purple-500">
                <tr>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-left text-white font-semibold text-xs sm:text-sm">Rang</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-left text-white font-semibold text-xs sm:text-sm">Donateur</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-left text-white font-semibold text-xs sm:text-sm hidden sm:table-cell">Ville / Quartier</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-right text-white font-semibold text-xs sm:text-sm">Montant</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-left text-white font-semibold text-xs sm:text-sm hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 sm:py-16">
                      <HandHeart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm sm:text-base">Aucun don pour cette période.</p>
                      <p className="text-xs text-gray-400 mt-1">Soyez le premier à faire un don !</p>
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map((don, idx) => (
                    <motion.tr 
                      key={don.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors group"
                    >
                      <td className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {getMedal(idx)}
                          {idx < 3 && (
                            <span className="text-[10px] sm:text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full">
                              Top {idx + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm sm:text-base">{don.name}</p>
                          <p className="text-xs text-gray-400 sm:hidden">{don.city}</p>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 hidden sm:table-cell text-gray-600 text-sm">{don.city}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-right">
                        <span className="font-bold text-purple-600 text-base sm:text-lg">{don.amount.toLocaleString()} €</span>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 hidden md:table-cell text-gray-500 text-xs sm:text-sm">
                        {new Date(don.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Message de gratitude */}
        {filteredDonations.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 sm:mt-10 text-center px-2"
          >
            <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-purple-50 px-4 py-2 sm:px-6 sm:py-3 rounded-full">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 fill-amber-500" />
              <p className="text-xs sm:text-sm text-gray-600">
                « Donnez, et l'on vous donnera : une bonne mesure, tassée, secouée, débordante » (Luc 6:38)
              </p>
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 fill-amber-500" />
            </div>
          </motion.div>
        )}

        {/* Bouton retour */}
        <div className="mt-8 sm:mt-10 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition font-medium text-sm sm:text-base group"
          >
            <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px] group-hover:-translate-x-1 transition" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;