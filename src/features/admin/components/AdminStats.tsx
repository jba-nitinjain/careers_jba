import type { ApplicationRecord } from '../../../types/admin';

interface AdminStatsProps {
  applications: ApplicationRecord[];
}

export function AdminStats({ applications }: AdminStatsProps) {
  const articleshipCount = applications.filter((item) => item.position === 'article').length;
  const paidAssistantCount = applications.filter((item) => item.position === 'paid_assistant').length;

  const cards = [
    { label: 'Total', value: applications.length },
    { label: 'Article Assistant', value: articleshipCount },
    { label: 'Paid Assistant', value: paidAssistantCount },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">{card.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
