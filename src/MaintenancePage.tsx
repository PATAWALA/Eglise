// MaintenancePage.tsx
import { Church } from 'lucide-react';

const MaintenancePage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <Church className="h-20 w-20 mx-auto text-gray-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Site en maintenance</h1>
        <p className="text-gray-600 mb-6">
          Notre site est actuellement en cours de maintenance. 
          Nous revenons très bientôt. Merci de votre compréhension.
        </p>
        <div className="border-t pt-6 text-sm text-gray-500">
          <p>Église Catholique – Service des offrandes en ligne</p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;