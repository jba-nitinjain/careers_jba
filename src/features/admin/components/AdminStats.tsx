import type { ApplicationRecord } from '../../../types/admin';

interface AdminStatsProps {
  applications: ApplicationRecord[];
}

export function AdminStats({ applications }: AdminStatsProps) {
  const cards = [
    { label: 'Total', value: applications.length },
    { label: 'Article Assistant', value: applications.filter((item) => item.position === 'article').length },
    { label: 'Paid Assistant', value: applications.filter((item) => item.position === 'paid_assistant').length },
    { label: 'Called for Interview', value: applications.filter((item) => item.adminStatus === 'called_for_interview').length },
    { label: 'Selected', value: applications.filter((item) => item.adminStatus === 'selected').length },
    { label: 'Rejected', value: applications.filter((item) => item.adminStatus === 'rejected').length },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">{card.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
