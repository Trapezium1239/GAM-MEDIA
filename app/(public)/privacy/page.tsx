import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, FileText, User, Lock, Mail, Database, Globe, Trash2, Settings, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | GAM App',
  description: 'How Glorious Assembly Ministries International collects, uses, and protects your personal information.',
};

const lastUpdated = 'January 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-cream-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-wine-600 hover:text-wine-800 mb-6">
            <Shield className="w-8 h-8" />
            <span className="font-bold text-xl">GAM App</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-wine-900 mb-4">Privacy Policy</h1>
          <p className="text-wine-600">Last updated: {lastUpdated}</p>
        </header>

        <article className="bg-white rounded-2xl shadow-sm border border-cream-300 p-6 md:p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-wine-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-wine-600" />
              Introduction
            </h2>
            <p className="text-wine-700 leading-relaxed">
              Glorious Assembly Ministries International ("GAMI", "we", "us", "our") operates the GAM App (the "App"). 
              We are committed to protecting your personal information and your right to privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App.
            </p>
            <p className="text-wine-700 leading-relaxed mt-4">
              Please read this Privacy Policy carefully. If you do not agree with our policies and practices, 
              please do not use our App. By using the App, you agree to the collection and use of information 
              in accordance with this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-wine-900 mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-wine-600" />
              Information We Collect
            </h2>
            <div className="space-y-4">
              <div className="bg-cream-50 rounded-xl p-4 border border-cream-200">
                <h3 className="font-semibold text-wine-900 mb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-wine-600" />
                  Personal Information
                </h3>
                <ul className="list-disc list-inside text-wine-700 space-y-1">
                  <li>Name</li>
                  <li>Phone number / WhatsApp number</li>
                  <li>Email address (if provided)</li>
                  <li>Prayer requests (if submitted)</li>
                  <li>Interested ministry unit</li>
                </ul>
              </div>
              <div className="bg-cream-50 rounded-xl p-4 border border-cream-200">
                <h3 className="font-semibold text-wine-900 mb-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-wine-600" />
                  Usage Data
                </h3>
                <ul className="list-disc list-inside text-wine-700 space-y-1">
                  <li>App usage statistics (pages visited, features used)</li>
                  <li>Device information (OS, browser, device type)</li>
                  <li>IP address and approximate location</li>
                  <li>Audio playback history (for resume functionality)</li>
                  <li>Search queries</li>
                </ul>
              </div>
              <div className="bg-cream-50 rounded-xl p-4 border border-cream-200">
                <h3 className="font-semibold text-wine-900 mb-2 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-wine-600" />
                  Third-Party Data
                </h3>
                <ul className="list-disc list-inside text-wine-700 space-y-1">
                  <li>YouTube API data (when playing embedded content)</li>
                  <li>Bible API data (for daily devotionals)</li>
                  <li>Cloudflare R2 (audio file delivery)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-wine-900 mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6 text-wine-600" />
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside text-wine-700 space-y-2">
              <li>Provide and maintain the App functionality</li>
              <li>Process prayer requests and connect you with pastoral care</li>
              <li>Enable offline audio playback and resume functionality</li>
              <li>Send notifications about events, devotionals, and announcements</li>
              <li>Improve the App experience through usage analytics</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* How We Share Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-wine-900 mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-wine-600" />
              How We Share Your Information
            </h2>
            <p className="text-wine-700 mb-4">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-wine-700 space-y-2">
              <li><strong>With your consent:</strong> When you explicitly agree to share information</li>
              <li><strong>With service providers:</strong> Trusted third parties who help us operate the App (Supabase for database, Cloudflare R2 for audio storage, YouTube for video content)</li>
              <li><strong>Legal requirements:</strong> When required by law, court order, or government request</li>
              <li><strong>Safety:</strong> To protect the rights, property, or safety of GAMI, our users, or the public</li>
              <li><strong>Church leadership:</strong> Prayer requests may be shared with pastoral team for follow-up</li>
            </ul>
          </section>

          {/* Data Storage & Security */}
          <section>
            <h2 className="text-2xl font-bold text-wine-900 mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-wine-600" />
              Data Storage & Security
            </h2>
            <div className="space-y-4">
              <div className="bg-cream-50 rounded-xl p-4 border border-cream-200">
                <h3 className="font-semibold text-wine-900 mb-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-wine-600" />
                  Storage Locations
                </h3>
                <ul className="list-disc list-inside text-wine-700 space-y-1">
                  <li>Supabase (PostgreSQL database) - EU/US regions</li>
                  <li>Cloudflare R2 (audio files) - Global edge network</li>
                  <li>IndexedDB (offline audio cache) - Your device only</li>
                </ul>
              </div>
              <div className="bg-cream-50 rounded-xl p-4 border border-cream-200">
                <h3 className="font-semibold text-wine-900 mb-2 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-wine-600" />
                  Security Measures
                </h3>
                <ul className="list-disc list-inside text-wine-700 space-y-1">
                  <li>HTTPS/TLS encryption for all data in transit</li>
                  <li>Row Level Security (RLS) policies in Supabase</li>
                  <li>Service role keys restricted to server-side only</li>
                  <li>Row-level policies ensure users only access their own data</li>
                  <li>Regular security audits and updates</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Offline Data */}
          <section>
            <h2 className="text-2xl font-bold text-wine-900 mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-wine-600" />
              Offline Data & Local Storage
            </h2>
            <p className="text-wine-700 mb-4">
              The App uses IndexedDB (Indexed Database API) to store audio files locally on your device for offline playback. 
              This data never leaves your device and is automatically managed with a 200MB cache limit using LRU (Least Recently Used) eviction.
            </p>
            <ul className="list-disc list-inside text-wine-700 space-y-1">
              <li>Audio files cached for offline listening</li>
              <li>Search index cached for instant offline search</li>
              <li>Automatic cleanup when storage exceeds 200MB</li>
              <li>You can clear offline data anytime in Settings</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-wine-900 mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-wine-600" />
              Your Rights
            </h2>
            <p className="text-wine-700 mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-wine-700 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data (Right to be Forgotten)</li>
              <li><strong>Restriction:</strong> Limit processing of your data</li>
              <li><strong>Portability:</strong> Receive your data in a structured, commonly used format</li>
              <li><strong>Objection:</strong> Object to processing of your data</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
            </ul>
            <p className="text-wine-700 mt-4">
              To exercise these rights, contact us at <a href="mailto:info@gam.church" className="text-wine-600 underline">info@gam.church</a> or use the contact form in the App.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-wine-900 mb-4 flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-wine-600" />
              Data Retention
            </h2>
            <p className="text-wine-700 mb-4">
              We retain your personal information only as long as necessary for the purposes outlined in this policy:
            </p>
            <ul className="list-disc list-inside text-wine-700 space-y-1">
              <li>Account data: Until you request deletion or account is inactive for 2 years</li>
              <li>Prayer requests: 2 years (for pastoral follow-up)</li>
              <li>Usage analytics: Aggregated/anonymized after 12 months</li>
              <li>Audio playback history: 30 days (for resume functionality)</li>
              <li>Offline cache: Until manually cleared or LRU eviction (200MB limit)</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-wine-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-wine-600" />
              Children's Privacy
            </h2>
            <p className="text-wine-700">
              The App is not directed to children under 13. We do not knowingly collect personal information from children under 13. 
              If you are a parent or guardian and believe your child has provided us with personal information, 
              please contact us at <a href="mailto:info@gam.church" className="text-wine-600 underline">info@gam.church</a>.
            </p>
          </section>

          {/* Third-Party Links */}
          <section>
            <h2 className="text-2xl font-bold text-wine-900 mb-4 flex items-center gap-2">
              <Globe className="w-6 h-6 text-wine-600" />
              Third-Party Links
            </h2>
            <p className="text-wine-700">
              The App may contain links to third-party websites (YouTube, Bible API, Google Maps, etc.). 
              We are not responsible for the privacy practices of these third parties. 
              We encourage you to review their privacy policies.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-bold text-wine-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-wine-600" />
              Changes to This Policy
            </h2>
            <p className="text-wine-700">
              We may update this Privacy Policy from time to time. The updated version will be indicated by the 
              "Last updated" date at the top of this page. We encourage you to review this policy periodically.
            </p>
            <p className="text-wine-700 mt-4">
              If we make material changes, we will notify you through the App or via email (if provided).
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-bold text-wine-900 mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-wine-600" />
              Contact Us
            </h2>
            <p className="text-wine-700 mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-cream-50 rounded-xl p-4 border border-cream-200 space-y-2">
              <p className="text-wine-700">
                <strong>Glorious Assembly Ministries International</strong>
              </p>
              <p className="text-wine-700">
                Behind Danax Omitowoju, Adamasingba, Ibadan, Oyo State, Nigeria
              </p>
              <p className="text-wine-700">
                <a href="mailto:info@gam.church" className="text-wine-600 underline">info@gam.church</a>
              </p>
              <p className="text-wine-700">
                <a href="tel:+2347031944460" className="text-wine-600 underline">+234 703 194 4460</a>
              </p>
            </div>
          </section>
        </article>

        {/* Footer */}
        <footer className="mt-12 text-center text-wine-500 text-sm">
          <p>© {new Date().getFullYear()} Glorious Assembly Ministries International. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}