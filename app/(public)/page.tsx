import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { 
  BookOpen, Music, Calendar, Heart, Users, 
  Clock, MapPin, Download, Smartphone, 
  Play, ChevronRight, Globe, Building2,
  Shield, WifiOff, Volume2, Sunrise, MessageSquare,
  Phone, Mail
} from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { YouTubePlaylistEmbed } from '@/components/youtube/youtube-playlist-embed';
import { BankDetailsSection } from '@/components/ui/bank-details-section';
import { InstallButton } from '@/components/pwa/install-button';

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
  title: 'GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL',
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

  const featureCardColors = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-50 border-blue-200 text-blue-600', title: 'text-slate-900', desc: 'text-slate-700', link: 'text-blue-700 hover:text-blue-800' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-50 border-amber-200 text-amber-600', title: 'text-slate-900', desc: 'text-slate-700', link: 'text-amber-700 hover:text-amber-800' },
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-50 border-emerald-200 text-emerald-600', title: 'text-slate-900', desc: 'text-slate-700', link: 'text-emerald-700 hover:text-emerald-800' },
    red: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'bg-rose-50 border-rose-200 text-rose-600', title: 'text-slate-900', desc: 'text-slate-700', link: 'text-rose-700 hover:text-rose-800' },
    emerald: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'bg-teal-50 border-teal-200 text-teal-600', title: 'text-slate-900', desc: 'text-slate-700', link: 'text-teal-700 hover:text-teal-800' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'bg-orange-50 border-orange-200 text-orange-600', title: 'text-slate-900', desc: 'text-slate-700', link: 'text-orange-700 hover:text-orange-800' },
    violet: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-50 border-purple-200 text-purple-600', title: 'text-slate-900', desc: 'text-slate-700', link: 'text-purple-700 hover:text-purple-800' },
  };

  const serviceTimes = [
    { day: 'Sunday', time: '9:30 AM', label: 'Celebration Service', icon: Building2, location: 'Main Auditorium', livestream: 'https://youtube.com/@T.H.S.ijaopo/live' },
    { day: 'Tuesday', time: '5:30 PM', label: 'Midweek Bible Study', icon: BookOpen, location: 'Chapel Hall', livestream: 'https://youtube.com/@T.H.S.ijaopo/live' },
    { day: 'Thursday', time: '5:30 PM', label: 'Prayer & Fellowship', icon: Heart, location: 'Prayer Room', livestream: 'https://youtube.com/@T.H.S.ijaopo/live' },
  ];

  const churchAddress = 'Glorious Assembly Ministries, Behind Danax Omitowoju, Adamasingba, Ibadan, Oyo State, Nigeria';
  const churchPhone = '+234 703 194 4460';
  const churchEmail = 'info@gam.church'; // UPDATE: Add real email

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
              alt="GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL"
              width={120}
              height={120}
              className="mx-auto rounded-2xl shadow-2xl shadow-amber-500/30 ring-4 ring-amber-500/20"
              priority
              unoptimized
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL
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
            <InstallButton variant="primary" className="w-full sm:w-auto" />
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
      <section className="w-full py-12 px-4 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <p className="text-center text-zinc-400 text-sm sm:text-base mb-10">
            Everything you need for your spiritual journey, in one place
          </p>

          {/* Balanced Responsive Grid (3 Columns Max for 7 items) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
            {features.map((feature, index) => {
              const colors = featureCardColors[feature.color as keyof typeof featureCardColors];
              const isLastCardAlone = index === 6;
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className={`bg-white text-slate-900 rounded-2xl p-6 flex flex-col justify-between shadow-md border border-slate-300 transition-all hover:shadow-lg ${isLastCardAlone ? "lg:col-start-2" : ""}`}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${colors.icon}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${colors.title}`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm leading-relaxed mb-6 ${colors.desc}`}>
                      {feature.desc}
                    </p>
                  </div>
                  <a
                    href={feature.href}
                    className={`inline-flex items-center text-sm font-semibold transition-colors ${colors.link}`}
                  >
                    Explore <span className="ml-1">›</span>
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live Previews */}
      {(latestSermons.length > 0 || upcomingPrograms.length > 0 || featuredTrack) && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Sermons */}
          {latestSermons.length > 0 && (
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Latest from the Word Vault
                </h2>
                <Link href="/sermons" className="text-sm text-blue-700 hover:text-blue-800 font-medium flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {latestSermons.map((sermon) => (
                  <article key={sermon.id} className="bg-white text-slate-900 rounded-2xl p-5 shadow-md border border-slate-300 transition-all hover:shadow-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                        <Volume2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 truncate">{sermon.title}</h3>
                        <p className="text-sm text-slate-600">
                          {sermon.preacher} • {format(new Date(sermon.date), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      {sermon.audio_url && (
                        <PlaySermonButton
                          track={{ id: sermon.id, title: sermon.title, artist: sermon.preacher, audioUrl: sermon.audio_url }}
                        />
                      )}
                      {sermon.video_link && (
                        <a href={sermon.video_link} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg text-center hover:bg-blue-100 transition touch-manipulation">
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
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    Upcoming Programs
                  </h2>
                  <Link href="/programs" className="text-sm text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {upcomingPrograms.map((program) => (
                    <article key={program.id} className="bg-white text-slate-900 rounded-2xl p-5 shadow-md border border-slate-300 transition-all hover:shadow-lg space-y-2">
                      <h3 className="font-semibold text-slate-900">{program.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
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
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Music className="w-5 h-5 text-amber-600" />
                    Featured Worship
                  </h2>
                  <Link href="/music" className="text-sm text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-md border border-slate-300 transition-all hover:shadow-lg space-y-2">
                  <PlayMusicButton
                    track={{ id: featuredTrack.id, title: featuredTrack.title, artist: featuredTrack.artist_choir, audioUrl: featuredTrack.audio_url }}
                  />
                </div>
              </div>
            )}

            {devotional && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Sunrise className="w-5 h-5 text-orange-600" />
                    Today's Devotional
                  </h2>
                  <Link href="/devotional" className="text-sm text-orange-700 hover:text-orange-800 font-medium flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <article className="bg-white text-slate-900 rounded-2xl p-5 shadow-md border border-slate-300 transition-all hover:shadow-lg space-y-3">
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <Sunrise className="w-3.5 h-3.5" />
                    <time dateTime={devotional.date}>{devotional.date ? format(new Date(devotional.date), 'EEEE, MMMM d, yyyy') : 'Today'}</time>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{devotional.title}</h3>
                  <p className="text-sm text-slate-600 font-medium italic">"{devotional.scripture_reference}"</p>
                  <p className="text-xs text-slate-600 line-clamp-3">{devotional.scripture_text}</p>
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">{devotional.reflection}</p>
                  {devotional.prayer && (
                    <p className="text-sm text-slate-700 italic border-t border-slate-200 pt-3">{devotional.prayer}</p>
                  )}
                  <Link 
                    href="/devotional" 
                    className="text-sm text-orange-700 hover:text-orange-800 font-medium flex items-center gap-1 inline-block mt-2"
                  >
                    Read Full Devotional <ChevronRight className="w-4 h-4" />
                  </Link>
                </article>
              </div>
            )}
          </div>
        </section>
      )}

      {/* YouTube Music Playlist */}
      <section className="bg-white text-slate-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">GAM Music on YouTube</h2>
            <p className="text-slate-600 text-sm">Stream our full worship playlist anytime, anywhere</p>
          </div>
          <YouTubePlaylistEmbed 
            playlistId="PLEjZZqlkBhWs"
            title="GAM Worship & Praise"
            height={500}
            autoplay={false}
          />
        </div>
      </section>

      {/* Service Times & Location */}
      <section className="w-full py-12 px-4 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            Service Times & Fellowship
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {serviceTimes.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.day} className="bg-slate-800 text-white rounded-2xl p-5 shadow-md border border-slate-700 transition-all hover:shadow-lg text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-white">{service.day}</h3>
                  <p className="text-sm text-amber-400 font-medium">{service.time}</p>
                  <p className="text-xs text-slate-400 mt-1">{service.label}</p>
                  {service.location && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {service.location}
                    </p>
                  )}
                  {service.livestream && (
                    <a 
                      href={service.livestream} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center justify-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                    >
                      <Play className="w-3 h-3" />
                      Watch Live
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          <div className="bg-slate-800 text-white rounded-2xl p-5 shadow-md border border-slate-700 mt-8">
            <h3 className="font-semibold text-white mb-3 flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              Find Us
            </h3>
            <p className="text-sm text-slate-300 mb-4 text-center">{churchAddress}</p>
            
            {/* Google Maps Embed */}
            <div className="relative rounded-xl overflow-hidden border border-slate-600 mb-4" style={{ aspectRatio: '16/9' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.604860677069!2d3.8858823!3d7.3953746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x10398d6b73ecef59%3A0x57b185bc39cc8849!2sGlorious%20Assembly%20Ministries%20Int%27l%20(Inc.)!5e0!3m2!1sen!2sng!4v1700000000000!5m2!1sen!2sng"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Glorious Assembly Ministries International Location"
              />
            </div>
            
            <p className="text-xs text-slate-400 text-center mb-4">
              9VWQ+46 Ibadan, Oyo State, Nigeria
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
              <a href={`tel:${churchPhone}`} className="flex items-center gap-1 hover:text-amber-400 transition">
                <Phone className="w-4 h-4" />
                {churchPhone}
              </a>
              <a href={`mailto:${churchEmail}`} className="flex items-center gap-1 hover:text-amber-400 transition">
                <Mail className="w-4 h-4" />
                {churchEmail}
              </a>
              <a 
                href="https://www.google.com/maps/place/Glorious+Assembly+Ministries+Int'l+(Inc.)/@7.3953632,3.8880763,16z/data=!4m6!3m5!1s0x10398d6b73ecef59:0x57b185bc39cc8849!8m2!3d7.3953746!4d3.888071!16s%2Fg%2F11hch_wqt1?entry=ttu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-amber-400 transition"
              >
                <MapPin className="w-4 h-4" />
                Open in Maps
              </a>
            </div>
            <p className="text-sm text-slate-400 mt-4 text-center">
              <Globe className="w-4 h-4 inline" />
              Join us online or in person — all services streamed live
            </p>
          </div>
        </div>
      </section>

      <BankDetailsSection />

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
        <div className="flex items-center justify-center gap-6 mb-4 flex-wrap">
          <a href="/privacy" className="text-zinc-500 hover:text-amber-400 transition text-xs">Privacy Policy</a>
          <span className="text-zinc-700 mx-2">|</span>
          <a href="https://www.facebook.com/TheYESofGOD" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-amber-400 transition" aria-label="Facebook">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="https://www.youtube.com/@T.H.S.ijaopo" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-amber-400 transition" aria-label="YouTube">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.166 3.166 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.166 3.166 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.166 3.166 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.166 3.166 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          <a href="https://www.instagram.com/_gamhq/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-amber-400 transition" aria-label="Instagram">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-.128-.058-.166-.07-.298-.07-3.31 0-3.755-.015-5.057.071zM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </a>
          <a href="https://wa.me/2347031944460" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-green-400 transition" aria-label="WhatsApp">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.521-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 2.954.149.078 2.096 3.2 4.997 4.487.092.042.195.055.289.05.099 0 .2-.015.3-.048.098-.033.221-.126.35-.32.245-.32.347-.542.446-.788.099-.248.05-.458.025-.647-.025-.198-.025-.371-.025-.52-.892-.579-1.529-1.642-1.916-2.077-.38-.435-.38-.45-.38-.525 0-.074.13-.24.297-.744.173-.499.173-1.579 1.423-2.496.56-.412 1.12-.613 1.47-.7.525-.132.967-.132 1.463-.132.33 0 .688.058.918.15.23.1.436.272.626.472.19.198.371.435.551.72.248.39.45.727.548 1.087.098.36.098.743.098 1.022 0 .41-.098.677-.221.826-.123.148-.404.528-.747 1.087-.583.95-1.69 2.108-1.69 3.287 0 .678.24 1.258.434 1.59.135.232.297.488.488.792.19.303.334.572.487.88.15.303.224.55.297.827.073.273.11.517.149.79.038.273.005.52-.025.712-.025.222-.024.52-.048.867-.098 1.132-.42 1.905-1.312 2.57-1.87 1.3-.527 1.89-.67 2.135-.688.147 0 .272.03.424.18.175.178.27.4.247.642-.028.245-.15.6-.312.94-.172.368-.357.86-.357 1.405 0 1.13.45 1.813 1.048 2.317.602.505 1.132 1.04 1.427 1.57.296.524.458 1.16.458 1.82 0 .298-.046.67-.172 1.05-.058.173-.157.298-.27.417-.12.12-.282.188-.52.222-.233.034-.513.074-.84.132-.32.055-.666.08-.99.108-.31.025-.61-.055-.86-.252-.25-.197-.47-.468-.67-.752-.197-.282-.344-.508-.487-.703-.133-.197-.233-.347-.36-.46-.126-.11-.263-.197-.435-.26-.173-.06-.36-.09-.57-.13-.224-.04-.478-.045-.753-.045-.272 0-.55.06-.813.17-.26.11-.553.26-.84.47-.29.21-.566.452-.826.717-.26.265-.49.56-.71.887-.22.326-.44.633-.66.926-.22.29-.42.55-.636.778-.216.226-.42.42-.636.575-.216.15-.433.22-.65.22-.22 0-.44-.08-.66-.22-.22-.14-.42-.3-.595-.46-.175-.16-.33-.304-.49-.45-.15-.15-.27-.283-.378-.403-.108-.12-.2-.233-.278-.338-.077-.105-.14-.2-.2-.3-.06-.1-.11-.198-.15-.297-.038-.098-.06-.197-.08-.296-.02-.098-.03-.197-.03-.296 0-.1 0-.197.03-.296.02-.1.04-.198.06-.297.04-.1.09-.197.15-.297.19-.22.405-.42.64-.626.235-.206.48-.403.735-.596.255-.193.51-.37.766-.543.256-.173.51-.33.766-.48.256-.15.51-.29.766-.42.256-.13.51-.25.766-.37.256-.11.51-.22.766-.33.256-.09.51-.19.766-.3.256-.07.51-.15.766-.26.256-.05.51-.1.766-.22.256-.03.51-.06.766-.18.256-.01.51-.02.766-.02.256 0 .51.02.766.02.256.02.51.06.766.18.256.04.51.1.766.22.256.06.51.15.766.26.256.07.51.15.766.26.256.09.51.19.766.3.256.11.51.22.766.33.256.13.51.25.766.37.256.15.51.29.766.42.256.173.51.33.766.48.256.193.51.37.766.543.256.173.51.33.766.48.256.15.51.29.766.42.256.13.51.25.766.37.256.11.51.22.766.33.256.09.51.19.766.3.256.07.51.15.766.26.256.05.51.1.766.22.256.03.51.06.766.18.256.01.51.02.766.02.256.01.51.02.766.02"/></svg>
          </a>
        </div>
        <p className="text-xs text-zinc-600">
          GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL &copy; {new Date().getFullYear()}
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          GAM App — Built for the community, by the community
        </p>
      </footer>
    </div>
  );
}