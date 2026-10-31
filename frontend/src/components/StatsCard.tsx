
type StatsCardProps = {
  title: string;
  value: number;
  color: string;
};

function StatsCard({ title, value, color }: StatsCardProps) {
  return (
    <div className="hover-lift animate-fade-up rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>

      <h2 className={`mt-2 text-3xl font-bold ${color}`}>
        {value}
      </h2>
    </div>
  );
}

export default StatsCard;
