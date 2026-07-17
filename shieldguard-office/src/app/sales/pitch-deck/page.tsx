'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const features = [
  { title: 'SMS Security', desc: 'Real-time SMS phishing and smishing detection with AI-powered analysis of message content and sender behavior.' },
  { title: 'Email Security', desc: 'Advanced email filtering and threat detection for mobile email clients, blocking phishing and spear-phishing attacks.' },
  { title: 'Device Extraction Defense', desc: 'Protection against forensic data extraction tools like Cellebrite and GrayKey, preventing physical data compromise.' },
  { title: 'Cell Signal Protection', desc: 'Detection and mitigation of IMSI catchers, Stingrays, and other cell-site simulators targeting your device.' },
  { title: 'Social Vault', desc: 'Encrypted container for sensitive social media credentials and personal data, isolated from the device OS.' },
  { title: 'Anomaly Detection', desc: 'Behavioral analysis engine that identifies unusual device activity patterns indicative of compromise.' },
  { title: 'AI Analysis', desc: 'Machine learning models trained on millions of threat samples for real-time classification and response.' },
  { title: 'Anonymization', desc: 'On-device data anonymization tools that strip identifying information before transmission.' },
];

const benefits = ['Zero-click protection against known and unknown threats', 'Real-time monitoring with sub-second threat response', 'Role-based access control for enterprise deployments', 'Single sign-on integration with existing identity providers'];

const plans = [
  { name: 'Basic', price: '$9/mo', devices: '1 device', features: ['Basic threat detection', 'Manual scan', 'Email alerts'] },
  { name: 'Pro', price: '$29/mo', devices: '5 devices', features: ['Advanced detection', 'Auto-scan', 'Real-time alerts', 'Anonymization'] },
  { name: 'Enterprise', price: '$2,999/mo', devices: '100 devices', features: ['All Pro features', 'SSO/SAML', 'RBAC', 'Dedicated support', 'SLA guarantee', 'On-prem option'] },
];

const testimonials = [
  { quote: 'ShieldGuard blocked a Pegasus infection on our CEO\'s device within seconds. The zero-click protection is a game-changer.', author: 'CISO, Fortune 500 Financial Institution' },
  { quote: 'We deployed ShieldGuard across 500 devices in three days. The RBAC and SSO integration made enterprise rollout seamless.', author: 'IT Director, Global Healthcare Provider' },
  { quote: 'The IMSI catcher detection alerted us to a cell-site simulator near our office. ShieldGuard is essential for any security-conscious organization.', author: 'Security Lead, Government Contractor' },
];

export default function PitchDeckPage() {
  return (
    <AppShell title="Sales Pitch Deck">
      <div className="mx-auto max-w-4xl space-y-0">
        <section className="flex min-h-[70vh] flex-col items-center justify-center text-center py-24">
          <Badge variant="outline" className="mb-4 border-blue-500/30 text-blue-400">Enterprise Mobile Security Platform</Badge>
          <h1 className="text-5xl font-bold tracking-tight text-gray-100 mb-4">ShieldGuard</h1>
          <p className="text-xl text-gray-400 max-w-2xl">Comprehensive mobile security for the modern enterprise. Protect your workforce from advanced threats — spyware, phishing, device extraction, and cellular surveillance.</p>
        </section>

        <section className="py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">The Problem</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Mobile devices are the new attack vector, and most organizations are unprepared.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-4xl font-bold text-red-400 mb-2">73%</p>
                <p className="text-sm text-gray-400">of organizations experienced a mobile-related security incident in the past year</p>
              </CardContent>
            </Card>
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-4xl font-bold text-red-400 mb-2">4.2M</p>
                <p className="text-sm text-gray-400">surveillanceware installations detected globally in 2024, up 240% YoY</p>
              </CardContent>
            </Card>
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-4xl font-bold text-red-400 mb-2">$4.5M</p>
                <p className="text-sm text-gray-400">average cost of a mobile data breach for enterprise organizations</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-24 bg-gray-900/50 -mx-4 lg:-mx-6 px-4 lg:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-100 mb-3">The Solution</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">ShieldGuard is an enterprise-grade mobile security platform that protects against the full spectrum of modern mobile threats.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Threat Types Covered', value: '8+' },
                { label: 'Detection Speed', value: '&lt;1s' },
                { label: 'Threat Block Rate', value: '99.9%' },
                { label: 'Platform Support', value: 'iOS + Android' },
              ].map((s) => (
                <Card key={s.label} className="text-center py-6">
                  <CardContent><p className="text-3xl font-bold text-blue-400 mb-1">{s.value}</p><p className="text-sm text-gray-400">{s.label}</p></CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">Key Features</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <Card key={f.title}>
                <CardContent className="py-5">
                  <h3 className="text-sm font-semibold text-gray-100 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-400">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-24 bg-gray-900/50 -mx-4 lg:-mx-6 px-4 lg:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-100 mb-3">Enterprise Benefits</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((b, i) => (
                <Card key={i} className="flex items-center gap-3 py-5">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 ml-4" />
                  <CardContent className="py-0 px-0"><p className="text-sm text-gray-200">{b}</p></CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-100 mb-3">Pricing</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plans.map((p) => (
              <Card key={p.name} className="text-center py-8">
                <CardContent className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-100">{p.name}</h3>
                  <p className="text-3xl font-bold text-blue-400">{p.price}</p>
                  <p className="text-sm text-gray-500">{p.devices}</p>
                  <Separator />
                  <ul className="space-y-2 text-sm text-gray-400 text-left">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2"><span className="text-green-400">✓</span>{f}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-24 bg-gray-900/50 -mx-4 lg:-mx-6 px-4 lg:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-100 mb-3">Case Studies</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {testimonials.map((t, i) => (
                <Card key={i}>
                  <CardContent className="py-5">
                    <p className="text-sm text-gray-300 italic mb-3">&ldquo;{t.quote}&rdquo;</p>
                    <p className="text-xs text-gray-500">{t.author}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-[50vh] flex-col items-center justify-center text-center py-24">
          <h2 className="text-4xl font-bold text-gray-100 mb-4">Ready to Secure Your Enterprise?</h2>
          <p className="text-lg text-gray-400 mb-8 max-w-xl">Contact our sales team for a personalized demo and discover how ShieldGuard can protect your organization.</p>
          <div className="flex gap-3">
            <span className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white">Schedule a Demo</span>
            <span className="inline-flex items-center rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-200">Contact Sales</span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
