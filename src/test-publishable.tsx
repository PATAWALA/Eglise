import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export function TestPublishable() {
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function test() {
      console.log('🔌 Test avec Publishable Key...')
      console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('Key (premiers caractères):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
      
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('amount', { ascending: false })
      
      if (error) {
        console.error('❌ Erreur:', error)
        setError(error.message)
      } else {
        console.log('✅ Données reçues:', data)
        setData(data || [])
      }
      setLoading(false)
    }
    test()
  }, [])
  
  if (loading) return <div className="p-8 text-center">⏳ Chargement...</div>
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">❌ Erreur</h2>
        <p className="mt-2 text-gray-600">{error}</p>
      </div>
    )
  }
  
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-purple-600 mb-4">
        ✅ Connexion réussie ! {data.length} dons trouvés
      </h2>
      <div className="space-y-2 max-h-96 overflow-auto">
        {data.slice(0, 5).map((don: any) => (
          <div key={don.id} className="border p-3 rounded-lg bg-gray-50">
            <span className="font-bold">{don.name}</span> - {don.city}<br />
            <span className="text-purple-600 font-bold">{don.amount}€</span> - {don.donation_type}
          </div>
        ))}
      </div>
    </div>
  )
}