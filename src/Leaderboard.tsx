import { useState } from "react";

interface Donation {
  id: number;
  name: string;
  city: string;
  amount: number;
  date: Date;
}

interface LeaderboardProps {
  donations: Donation[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ donations }) => {
  const [filter, setFilter] = useState<"week" | "month" | "all">("all");

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filteredDonations = donations.filter((don) => {
    if (filter === "week") return don.date >= weekAgo;
    if (filter === "month") return don.date >= monthAgo;
    return true;
  });

  const sortedDonations = [...filteredDonations].sort((a, b) => b.amount - a.amount);

  return (
    <div className="container mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-center text-purple-700 mb-8">
        Classement des dons
      </h1>

      {/* Filtres */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setFilter("week")}
          className={`px-6 py-2 rounded-full transition ${
            filter === "week"
              ? "bg-purple-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-purple-100"
          }`}
        >
          Cette semaine
        </button>
        <button
          onClick={() => setFilter("month")}
          className={`px-6 py-2 rounded-full transition ${
            filter === "month"
              ? "bg-purple-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-purple-100"
          }`}
        >
          Ce mois
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-6 py-2 rounded-full transition ${
            filter === "all"
              ? "bg-purple-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-purple-100"
          }`}
        >
          Tous les dons
        </button>
      </div>

      {/* Tableau */}
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
                  <td className="py-3 px-6 text-right font-bold text-purple-600">
                    {don.amount} €
                  </td>
                  <td className="py-3 px-6 text-gray-600">
                    {don.date.toLocaleDateString()}
                  </td>
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