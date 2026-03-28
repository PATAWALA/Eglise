import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let filteredDonations = [...donations];
  if (filter === "week") {
    filteredDonations = filteredDonations.filter((don) => new Date(don.date) >= weekAgo);
  } else if (filter === "month") {
    filteredDonations = filteredDonations.filter((don) => new Date(don.date) >= monthAgo);
  } else if (filter === "top") {
    filteredDonations = filteredDonations
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  const sortedDonations = [...filteredDonations].sort((a, b) => b.amount - a.amount);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <div className="text-purple-600 text-xl">Chargement du tableau d'honneur...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-20">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-4xl font-bold text-purple-700">Tableau d'Honneur</h1>
        <Link to="/" className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-5 py-2 rounded-full hover:bg-purple-200 transition">
          <ArrowLeft size={20} />
          Retour à l'accueil
        </Link>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <button onClick={() => setFilter("week")} className={`px-6 py-2 rounded-full transition ${filter === "week" ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-purple-100"}`}>
          Cette semaine
        </button>
        <button onClick={() => setFilter("month")} className={`px-6 py-2 rounded-full transition ${filter === "month" ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-purple-100"}`}>
          Ce mois
        </button>
        <button onClick={() => setFilter("top")} className={`px-6 py-2 rounded-full transition ${filter === "top" ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-purple-100"}`}>
          Meilleurs dons
        </button>
        <button onClick={() => setFilter("all")} className={`px-6 py-2 rounded-full transition ${filter === "all" ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-purple-100"}`}>
          Tous les dons
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-md overflow-hidden">
          <thead className="bg-purple-600 text-white">
            <tr>
              <th className="py-3 px-6 text-left">Rang</th>
              <th className="py-3 px-6 text-left">Nom</th>
              <th className="py-3 px-6 text-left">Ville / Quartier</th>
              <th className="py-3 px-6 text-right">Montant</th>
              <th className="py-3 px-6 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {sortedDonations.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  Aucun don pour cette période.
                </td>
              </tr>
            ) : (
              sortedDonations.map((don, idx) => (
                <tr key={don.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-6 font-semibold">{idx + 1}</td>
                  <td className="py-3 px-6">{don.name}</td>
                  <td className="py-3 px-6">{don.city}</td>
                  <td className="py-3 px-6 text-right font-bold text-purple-600">{don.amount} €</td>
                  <td className="py-3 px-6 text-gray-600">{new Date(don.date).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;