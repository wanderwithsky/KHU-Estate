export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 shadow-sm border border-brand-soft-grey rounded-lg">
          <h3 className="text-sm uppercase tracking-widest text-brand-charcoal/60 mb-2 font-medium">Pending Applications</h3>
          <p className="text-3xl font-serif text-brand-deep-navy">0</p>
        </div>
        <div className="bg-white p-6 shadow-sm border border-brand-soft-grey rounded-lg">
          <h3 className="text-sm uppercase tracking-widest text-brand-charcoal/60 mb-2 font-medium">Total Associates</h3>
          <p className="text-3xl font-serif text-brand-deep-navy">0</p>
        </div>
        <div className="bg-white p-6 shadow-sm border border-brand-soft-grey rounded-lg">
          <h3 className="text-sm uppercase tracking-widest text-brand-charcoal/60 mb-2 font-medium">Active Team Leaders</h3>
          <p className="text-3xl font-serif text-brand-deep-navy">0</p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-brand-soft-grey rounded-lg p-6">
        <h2 className="text-lg font-serif text-brand-deep-navy mb-4">Recent Activity</h2>
        <div className="text-sm text-brand-charcoal/60 italic">
          No recent activity to display. Connect the PostgreSQL database to view live data.
        </div>
      </div>
    </div>
  );
}
