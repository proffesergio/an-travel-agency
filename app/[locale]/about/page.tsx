import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import { ShieldCheck, Award, Users, HeadphonesIcon } from 'lucide-react';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-[#1b4332] text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">About Athar Nur Travels</h1>
            <p className="text-green-200 text-lg leading-relaxed">
              Serving Bangladesh's pilgrims and travellers for over 15 years with trust, care, and excellence.
            </p>
          </div>
        </div>

        {/* Story */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <span className="text-[#2d6a4f] text-sm font-semibold uppercase tracking-widest">Our Story</span>
              <h2 className="mt-2 text-3xl font-bold text-gray-900 mb-5">
                A Legacy Built on Faith & Trust
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Athar Nur Travels was established with a single mission: to make the sacred journey to
                  the Holy Land accessible, safe, and spiritually fulfilling for every Bangladeshi Muslim.
                  Located in the heart of Dhaka at Purana Paltan, we have grown from a small travel desk
                  to one of Bangladesh's most trusted Hajj and Umrah agencies.
                </p>
                <p>
                  Over the years we have served thousands of pilgrims, ensuring every detail — from visa
                  processing to hotel accommodation, ground transport, and Mutawwif guidance — is handled
                  with the utmost care. Our offices in both Dhaka and Saudi Arabia allow us to provide
                  seamless support throughout the entire journey.
                </p>
                <p>
                  Beyond pilgrimage, we have expanded our services to include international leisure tours
                  and competitive air ticketing, making us a one-stop travel solution for Bangladeshi
                  travellers of all backgrounds.
                </p>
              </div>
            </div>
            <div className="relative h-80 rounded-3xl overflow-hidden bg-gray-200">
              <Image
                src="/ATHAR-NUR-Logo.png"
                alt="Athar Nur Travels Office"
                fill
                className="object-contain p-10"
              />
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Our Core Values</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: ShieldCheck, title: 'Trust & Integrity', desc: 'Transparent pricing with no hidden charges. What we quote is what you pay.' },
                { icon: Award, title: 'Excellence', desc: 'We hold ourselves to the highest standards in service delivery and client care.' },
                { icon: Users, title: 'Community', desc: 'Deep roots in the Bangladeshi community — we understand your needs and values.' },
                { icon: HeadphonesIcon, title: 'Support', desc: '24/7 on-ground support during Hajj and Umrah so you are never alone.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#2d6a4f]" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-[#2d6a4f] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {[
                { value: '5,000+', label: 'Happy Pilgrims' },
                { value: '15+', label: 'Years of Experience' },
                { value: '20+', label: 'Destinations' },
                { value: '24/7', label: 'Support' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-4xl font-extrabold text-white">{value}</div>
                  <div className="mt-1 text-green-200 text-sm">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Credentials */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Licences & Credentials</h2>
            <p className="text-gray-600 mb-8">
              Athar Nur Travels operates as a fully licensed and government-approved travel agency in Bangladesh.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'ATAB Member', sub: 'Association of Travel Agents of Bangladesh' },
                { label: 'Govt. Approved', sub: 'Ministry of Civil Aviation & Tourism' },
                { label: 'Hajj Licensed', sub: 'Ministry of Religious Affairs, Bangladesh' },
                { label: 'IATA Accredited', sub: 'International Air Transport Association' },
                { label: 'Saudi MOH Listed', sub: 'Ministry of Hajj, Saudi Arabia' },
                { label: 'TOAB Member', sub: 'Tour Operators Association of Bangladesh' },
              ].map(({ label, sub }) => (
                <div key={label} className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="font-bold text-[#2d6a4f]">{label}</div>
                  <div className="text-xs text-gray-500 mt-1">{sub}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              * Credential details will be updated once official licence numbers are confirmed.
            </p>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
