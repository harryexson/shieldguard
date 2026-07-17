'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const team = [
  { name: 'Alex Chen', role: 'CEO & Co-Founder', bg: 'bg-blue-600/20 text-blue-400' },
  { name: 'Sarah Mitchell', role: 'CTO & Co-Founder', bg: 'bg-purple-600/20 text-purple-400' },
  { name: 'James Okonkwo', role: 'CRO', bg: 'bg-green-600/20 text-green-400' },
  { name: 'Priya Sharma', role: 'CPO', bg: 'bg-orange-600/20 text-orange-400' },
];

const monthlyData = [
  { year: 'Year 1', revenue: 1.2, cost: 1.8, customers: 500 },
  { year: 'Year 2', revenue: 4.8, cost: 3.6, customers: 2500 },
  { year: 'Year 3', revenue: 14.5, cost: 8.7, customers: 8500 },
];
const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue));

export default function InvestorDeckPage() {
  return (
    <AppShell title="Investor Deck">
      <div className="mx-auto max-w-4xl space-y-0">
        <section className="flex min-h-[70vh] flex-col items-center justify-center text-center py-24">
          <Badge variant="outline" className="mb-4 border-blue-500/30 text-blue-400">Investment Opportunity</Badge>
          <h1 className="text-5xl font-bold tracking-tight text-gray-100 mb-4">ShieldGuard</h1>
          <p className="text-xl text-gray-400 max-w-2xl">The Future of Mobile Security — protecting enterprises from the fastest-growing threat vector in cybersecurity.</p>
        </section>

        <section className="py-24 bg-gray-900/50 -mx-4 lg:-mx-6 px-4 lg:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-100 mb-3">The Problem</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Mobile security is the largest blind spot in enterprise cybersecurity.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-4xl font-bold text-blue-400 mb-2">$18.5B</p>
                  <p className="text-sm text-gray-400">Mobile security market size in 2024, growing at 18.2% CAGR</p>
                </CardContent>
              </Card>
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-4xl font-bold text-blue-400 mb-2">68%</p>
                  <p className="text-sm text-gray-400">of enterprises have no dedicated mobile threat protection solution</p>
                </CardContent>
              </Card>
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-4xl font-bold text-blue-400 mb-2">2.7x</p>
                  <p className="text-sm text-gray-400">increase in mobile malware variants year-over-year</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">Our Solution</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">ShieldGuard is the only comprehensive mobile security platform covering the entire threat landscape.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Threat Coverage', value: '8 vectors' },
              { label: 'Detection Time', value: '&lt;1 second' },
              { label: 'False Positive Rate', value: '&lt;0.1%' },
              { label: 'Platforms', value: 'iOS + Android' },
            ].map((s) => (
              <Card key={s.label} className="text-center py-6">
                <CardContent><p className="text-2xl font-bold text-blue-400 mb-1">{s.value}</p><p className="text-sm text-gray-400">{s.label}</p></CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-24 bg-gray-900/50 -mx-4 lg:-mx-6 px-4 lg:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-100 mb-3">Market Opportunity</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-4xl font-bold text-green-400 mb-2">$18.5B</p>
                  <p className="text-sm text-gray-400 uppercase tracking-wider">TAM</p>
                  <p className="text-xs text-gray-600 mt-1">Global mobile security market</p>
                </CardContent>
              </Card>
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-4xl font-bold text-green-400 mb-2">$4.2B</p>
                  <p className="text-sm text-gray-400 uppercase tracking-wider">SAM</p>
                  <p className="text-xs text-gray-600 mt-1">Enterprise mobile security (100+ employees)</p>
                </CardContent>
              </Card>
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-4xl font-bold text-green-400 mb-2">$890M</p>
                  <p className="text-sm text-gray-400 uppercase tracking-wider">SOM</p>
                  <p className="text-xs text-gray-600 mt-1">Target addressable (North America, regulated industries)</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">Business Model</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'Basic', price: '$9/mo', market: 'Individuals & freelancers' },
              { name: 'Pro', price: '$29/mo', market: 'Small teams, power users' },
              { name: 'Enterprise', price: '$2,999 - $9,999/mo', market: 'Mid-market to large enterprises' },
            ].map((p) => (
              <Card key={p.name} className="text-center py-8">
                <CardContent className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-100">{p.name}</h3>
                  <p className="text-2xl font-bold text-blue-400">{p.price}</p>
                  <p className="text-sm text-gray-500">{p.market}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-24 bg-gray-900/50 -mx-4 lg:-mx-6 px-4 lg:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-100 mb-3">Traction</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
              <Card className="text-center py-6">
                <CardContent><p className="text-3xl font-bold text-gray-100">5,000+</p><p className="text-xs text-gray-400">Customers</p></CardContent>
              </Card>
              <Card className="text-center py-6">
                <CardContent><p className="text-3xl font-bold text-gray-100">50K+</p><p className="text-xs text-gray-400">Devices Protected</p></CardContent>
              </Card>
              <Card className="text-center py-6">
                <CardContent><p className="text-3xl font-bold text-gray-100">99.9%</p><p className="text-xs text-gray-400">Threat Block Rate</p></CardContent>
              </Card>
              <Card className="text-center py-6">
                <CardContent><p className="text-3xl font-bold text-gray-100">4.8★</p><p className="text-xs text-gray-400">Avg Customer Rating</p></CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">Team</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map((m) => (
              <Card key={m.name} className="text-center py-6">
                <CardContent className="space-y-2">
                  <div className={`mx-auto w-12 h-12 rounded-full ${m.bg} flex items-center justify-center text-sm font-bold`}>
                    {m.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-100">{m.name}</h3>
                  <p className="text-xs text-gray-500">{m.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-24 bg-gray-900/50 -mx-4 lg:-mx-6 px-4 lg:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-100 mb-3">Financial Projections</h2>
            </div>
            <Card>
              <CardContent className="py-6">
                <div className="space-y-4">
                  {monthlyData.map((d) => {
                    const revHeight = (d.revenue / maxRevenue) * 100;
                    const costHeight = (d.cost / maxRevenue) * 100;
                    return (
                      <div key={d.year}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300 font-medium">{d.year}</span>
                          <span className="text-gray-500">{d.customers} customers</span>
                        </div>
                        <div className="flex items-end gap-1 h-16">
                          <div className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full bg-blue-500/20 rounded-t relative" style={{ height: `${revHeight}%` }}>
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-blue-400">${d.revenue}M</div>
                            </div>
                            <span className="text-[10px] text-gray-600">Revenue</span>
                          </div>
                          <div className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full bg-red-500/20 rounded-t relative" style={{ height: `${costHeight}%` }}>
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-red-400">${d.cost}M</div>
                            </div>
                            <span className="text-[10px] text-gray-600">Cost</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-gray-600 text-center mt-4">Projected ARR: $14.5M by Year 3 with 65% gross margin</p>
          </div>
        </section>

        <section className="flex min-h-[50vh] flex-col items-center justify-center text-center py-24">
          <Badge variant="outline" className="mb-4 border-green-500/30 text-green-400">Series A</Badge>
          <h2 className="text-4xl font-bold text-gray-100 mb-4">The Ask</h2>
          <p className="text-lg text-gray-400 mb-4 max-w-xl">We are seeking <span className="text-blue-400 font-semibold">$8 million</span> in Series A funding to scale our sales, engineering, and customer success operations.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            <Card className="text-center py-4">
              <CardContent><p className="text-lg font-bold text-gray-100">$3.5M</p><p className="text-xs text-gray-400">Engineering</p></CardContent>
            </Card>
            <Card className="text-center py-4">
              <CardContent><p className="text-lg font-bold text-gray-100">$3.0M</p><p className="text-xs text-gray-400">Sales & Marketing</p></CardContent>
            </Card>
            <Card className="text-center py-4">
              <CardContent><p className="text-lg font-bold text-gray-100">$1.5M</p><p className="text-xs text-gray-400">Operations & G&A</p></CardContent>
            </Card>
          </div>
          <p className="text-sm text-gray-600 mt-6">Join us in building the future of mobile security.</p>
        </section>
      </div>
    </AppShell>
  );
}
