import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { 
  BookOpen, Music, Calendar, Heart, Users, 
  Clock, MapPin, Download, Smartphone, 
  Play, ChevronRight, Globe, Building2,
  Shield, WifiOff, Volume2, Sunrise, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const PlaySermonButton = dynamic(() => import('@/components/audio/play-button').then((m) => ({ default: m.PlaySermonButton })));
const PlayMusicButton = dynamic(() => import('@/components/audio/play-button').then((m) => ({ default: m.PlayMusicButton })));

interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  audio_url: string | null;
  video_link: string | null;
}

interface Program {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  venue: string;
}

interface MusicTrack {
  id: string;
  title: string;
  artist_choir: string;
  audio_url: string;
}

interface Devotional {
  id: string;
  date: string;
  title: string;
  scripture_reference: string;
  scripture_text: string;
  reflection: string;
  prayer: string | null;
  application_question: string | null;
}

async function getHomeData() {
  const supabase = await createClient();
  const { data: bundle } = await supabase.rpc('get_home_vault_bundle');
  
  const sermons = ((bundle as any)?.sermons || []) as Sermon[];
  const programs = ((bundle as any)?.programs || []) as Program[];
  const music = ((bundle as any)?.music || []) as MusicTrack[];
  
  // Fetch today's devotional
  const { data: devotional } = await supabase.rpc('get_todays_devotional');
  
  return { sermons, programs, music, devotional: devotional as Devotional | null };
}

export const metadata = {
  title: 'Glorious Assembly Ministries International',
  description: 'Community, Word, and Spiritual Growth — All in One Vault',
  alternates: {
    canonical: '/',
  },
};

export default async function LandingPage() {
  const { sermons, programs, music, devotional } = await getHomeData();
  const latestSermons = sermons.slice(0, 3);
  const upcomingPrograms = programs.slice(0, 2);
  const featuredTrack = music[0];

  const features = [
    { icon: BookOpen, title: 'Word Vault', desc: 'Stream and download Sunday sermons with background audio playback', href: '/sermons', color: 'blue' },
    { icon: Music, title: 'GAM Music', desc: 'Listen to choir anthems, praise & worship, and special ministrations', href: '/music', color: 'amber' },
    { icon: Calendar, title: 'Programs & Events', desc: 'Real-time church calendar with reminders and venue details', href: '/programs', color: 'green' },
    { icon: Heart, title: 'Giving & Seeds', desc: 'Direct account access for Tithes, Offerings, and Building Fund', href: '/giving', color: 'red' },
    { icon: Users, title: 'First-Timer Welcome', desc: 'Direct onboarding form for new visitors and prayer requests', href: '/welcome', color: 'emerald' },
    { icon: Sunrise, title: 'Daily Devotional', desc: 'Daily Bible passage with reflection, prayer & application', href: '/devotional', color: 'orange' },
    { icon: MessageSquare, title: 'Messages & Notes', desc: 'Pastoral messages, study notes & spiritual encouragement', href: '/sermons', color: 'violet' },
  ];

  const serviceTimes = [
    { day: 'Sunday', time: '8:00 AM & 10:30 AM', label: 'Celebration Services', icon: Building2 },
    { day: 'Wednesday', time: '6:00 PM', label: 'Midweek Bible Study', icon: BookOpen },
    { day: 'Friday', time: '7:00 PM', label: 'Prayer Vigil', icon: Heart },
  ];

  return (
    <div className="space-y-8 pb-32">
        {/* Hero Section with Video Background */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/20">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          poster="/icon-192.png"
        >
          <source src="/hero-loop.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-950/90" />
        <div className="relative max-w-4xl mx-auto text-center p-6 md:p-10">
          {/* Logo */}
          <div className="mx-auto mb-6 relative">
            <Image
              src="/icon-192.png"
              alt="Glorious Assembly Ministries International"
              width={120}
              height={120}
              className="mx-auto rounded-2xl shadow-2xl shadow-amber-500/30 ring-4 ring-amber-500/20"
              priority
              unoptimized
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Glorious Assembly Ministries International
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Community, Word, and Spiritual Growth — All in One Vault
          </p>
          
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700 text-xs font-medium text-zinc-300">
              <Smartphone className="w-3.5 h-3.5" /> Installable PWA
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700 text-xs font-medium text-zinc-300">
              <WifiOff className="w-3.5 h-3.5" /> Offline-Capable
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700 text-xs font-medium text-zinc-300">
              <Shield className="w-3.5 h-3.5" /> Ad-Free Audio
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700 text-xs font-medium text-zinc-300">
              <Volume2 className="w-3.5 h-3.5" /> Background Playback
            </span>
          </div>

          {/* Dual CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/app" 
              className="btn-accent w-full sm:w-auto"
            >
              <Play className="w-4 h-4 mr-2" />
              Explore Vault
            </Link>
            <Link 
              href="/welcome" 
              className="btn-secondary w-full sm:w-auto"
            >
              <Users className="w-4 h-4 mr-2" />
              First Time Here?
            </Link>
          </div>
        </div>
      </section>

      {/* Today's Bible Passage — Prominent Card */}
      {devotional && (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900/50 to-zinc-950 border border-amber-500/20 p-6 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Sunrise className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-amber-400 font-medium uppercase tracking-wider">Today's Word</p>
                <h2 className="text-2xl font-bold text-white">Daily Bible Passage</h2>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-zinc-300 font-medium italic">"{devotional.scripture_reference}"</p>
              <p className="text-base text-zinc-100 leading-relaxed">"{devotional.scripture_text}"</p>
              <div className="pt-4 border-t border-zinc-800/50">
                <p className="text-sm text-zinc-300 leading-relaxed">{devotional.reflection}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/50">
                <span className="text-xs text-zinc-500">
                  <time dateTime={devotional.date}>{devotional.date ? format(new Date(devotional.date), 'EEEE, MMMM d, yyyy') : 'Today'}</time>
                </span>
                <div className="flex items-center gap-3">
                  <Link 
                    href="/devotional" 
                    className="btn-accent text-sm"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Read Full Devotional
                  </Link>
                  <Link 
                    href="/sermons" 
                    className="btn-secondary text-sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Browse Messages
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Feature Grid */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">What&apos;s Inside GAM App</h2>
          <p className="text-zinc-400 text-sm">Everything you need for your spiritual journey, in one place</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const colorClasses = {
              blue: 'bg-blue-500/10 text-blue-400',
              amber: 'bg-amber-500/10 text-amber-400',
              green: 'bg-green-500/10 text-green-400',
              red: 'bg-red-500/10 text-red-400',
              emerald: 'bg-emerald-500/10 text-emerald-400',
              orange: 'bg-orange-500/10 text-orange-400',
              violet: 'bg-violet-500/10 text-violet-400',
            };
            return (
              <Link 
                key={feature.title} 
                href={feature.href}
                className="card-interactive group h-full flex flex-col"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClasses[feature.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors">{feature.title}</h3>
                <p className="text-xs text-zinc-500 flex-1">{feature.desc}</p>
                <span className="text-xs font-medium text-amber-400 flex items-center gap-1 mt-2 group-hover:gap-2 transition-all">
                  Explore <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Live Previews */}
      {(latestSermons.length > 0 || upcomingPrograms.length > 0 || featuredTrack) && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Sermons */}
          {latestSermons.length > 0 && (
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  Latest from the Word Vault
                </h2>
                <Link href="/sermons" className="text-sm text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {latestSermons.map((sermon) => (
                  <article key={sermon.id} className="card space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <Volume2 className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white truncate">{sermon.title}</h3>
                        <p className="text-sm text-zinc-400">
                          {sermon.preacher} • {format(new Date(sermon.date), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
                      {sermon.audio_url && (
                        <PlaySermonButton
                          track={{ id: sermon.id, title: sermon.title, artist: sermon.preacher, audioUrl: sermon.audio_url }}
                        />
                      )}
                      {sermon.video_link && (
                        <a href={sermon.video_link} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 text-sm font-medium text-amber-400 bg-amber-500/10 rounded-lg text-center hover:bg-amber-500/20 transition touch-manipulation">
                          Watch Video
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Programs + Featured Music */}
          <div className="space-y-6">
            {upcomingPrograms.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-400" />
                    Upcoming Programs
                  </h2>
                  <Link href="/programs" className="text-sm text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {upcomingPrograms.map((program) => (
                    <article key={program.id} className="card space-y-2">
                      <h3 className="font-semibold text-white">{program.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(program.event_date), 'EEE, MMM d')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(program.event_date), 'h:mm a')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {program.venue}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {featuredTrack && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Music className="w-5 h-5 text-amber-400" />
                    Featured Worship
                  </h2>
                  <Link href="/music" className="text-sm text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <PlayMusicButton
                  track={{ id: featuredTrack.id, title: featuredTrack.title, artist: featuredTrack.artist_choir, audioUrl: featuredTrack.audio_url }}
                />
              </div>
            )}

            {devotional && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sunrise className="w-5 h-5 text-amber-400" />
                    Today's Devotional
                  </h2>
                  <Link href="/devotional" className="text-sm text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <article className="card space-y-3 p-5">
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <Sunrise className="w-3.5 h-3.5" />
                    <time dateTime={devotional.date}>{devotional.date ? format(new Date(devotional.date), 'EEEE, MMMM d, yyyy') : 'Today'}</time>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{devotional.title}</h3>
                  <p className="text-sm text-zinc-300 font-medium italic">"{devotional.scripture_reference}"</p>
                  <p className="text-xs text-zinc-400 line-clamp-3">{devotional.scripture_text}</p>
                  <p className="text-sm text-zinc-300 leading-relaxed line-clamp-4">{devotional.reflection}</p>
                  {devotional.prayer && (
                    <p className="text-sm text-zinc-400 italic border-t border-zinc-800 pt-3">{devotional.prayer}</p>
                  )}
                  <Link 
                    href="/devotional" 
                    className="text-sm text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 inline-block mt-2"
                  >
                    Read Full Devotional <ChevronRight className="w-4 h-4" />
                  </Link>
                </article>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Service Times & Location */}
      <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-400" />
          Service Times & Fellowship
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {serviceTimes.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.day} className="card-compact text-center">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white">{service.day}</h3>
                <p className="text-sm text-amber-400 font-medium">{service.time}</p>
                <p className="text-xs text-zinc-500 mt-1">{service.label}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-6 border-t border-zinc-800/50 text-center">
          <p className="text-sm text-zinc-400 flex items-center justify-center gap-2">
            <Globe className="w-4 h-4" />
            <span>Join us online or in person — all services streamed live</span>
          </p>
        </div>
      </section>

      {/* Install Callout */}
      <section className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 md:p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
            <Download className="w-8 h-8 text-zinc-950" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Install GAM App</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Get the full experience: offline sermons, push notifications, home screen access, and background audio playback.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-green-400" />
                </div>
                <span className="font-medium text-white">Android / Chrome</span>
              </div>
              <p className="text-xs text-zinc-500">Tap "Install" in the banner below or use Chrome menu → Install App</p>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-blue-400" />
                </div>
                <span className="font-medium text-white">iOS / Safari</span>
              </div>
              <p className="text-xs text-zinc-500">Tap Share → "Add to Home Screen" from Safari bottom bar</p>
            </div>
          </div>

          <Link href="/app" className="btn-accent inline-flex">
            <Play className="w-4 h-4 mr-2" />
            Open App Now
          </Link>
        </div>
      </section>

{/* Footer */}
<footer className="pt-8 pb-16 text-center">
        <div className="flex items-center justify-center gap-6 mb-4">
          <a href="https://facebook.com/gami" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-amber-400 transition" aria-label="Facebook">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="https://youtube.com/@gami" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-amber-400 transition" aria-label="YouTube">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.166 3.166 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.166 3.166 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.166 3.166 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.166 3.166 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          <a href="https://instagram.com/gami" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-amber-400 transition" aria-label="Instagram">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-.128-.058-.166-.07-.298-.07-3.31 0-3.755-.015-5.057.071zM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </a>
        </div>
        <p className="text-xs text-zinc-600">
          Glorious Assembly Ministries International &copy; {new Date().getFullYear()}
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          GAM App — Built for the community, by the community
        </p>
      </footer>
    </div>
  );
}