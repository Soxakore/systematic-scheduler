import { Link } from 'react-router-dom';
import icoCalendar from '@/assets/icons/icon-calendar.svg';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 h-14">
          <Link to="/welcome" className="flex items-center gap-2">
            <img src={icoCalendar} alt="" width={28} height={28} className="rounded-lg" />
            <span className="font-semibold text-foreground">System Calendar</span>
          </Link>
          <Link to="/welcome" className="text-sm text-primary hover:underline">Back to Home</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 prose prose-sm dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground"><strong>Last updated:</strong> March 8, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using System Calendar ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          System Calendar is a personal productivity platform that provides calendar management, habit tracking, goal setting, journaling, vision boards, focus timers, weekly reviews, morning briefings, and analytics tools. The Service is designed for individual use to help users organize and optimize their daily routines.
        </p>

        <h2>3. User Accounts</h2>
        <ul>
          <li>You must provide accurate and complete information when creating an account.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You may sign in using email/password or third-party OAuth providers (Google, Apple). Use of third-party sign-in is subject to those providers' own terms.</li>
          <li>You must be at least 16 years of age to use the Service.</li>
        </ul>

        <h2>4. User Data & Content</h2>
        <ul>
          <li>You retain ownership of all content you create (events, journal entries, goals, habits, vision board items, etc.).</li>
          <li>We do not sell, share, or monetize your personal data or content.</li>
          <li>You grant us a limited license to store and process your data solely to provide the Service.</li>
          <li>Calendar data shared with other users via the sharing feature is visible only to explicitly invited recipients.</li>
        </ul>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose.</li>
          <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
          <li>Interfere with or disrupt the Service or servers.</li>
          <li>Upload malicious content or attempt to exploit vulnerabilities.</li>
          <li>Create multiple accounts to circumvent usage limits.</li>
        </ul>

        <h2>6. Intellectual Property</h2>
        <p>
          The Service, including its design, logos, icons, and code, is owned by System Calendar and protected by intellectual property laws. You may not copy, modify, or distribute any part of the Service without prior written consent.
        </p>

        <h2>7. Service Availability</h2>
        <p>
          We strive to maintain high availability but do not guarantee uninterrupted access. We may perform maintenance, updates, or modifications that temporarily affect availability. We will make reasonable efforts to notify users of planned downtime.
        </p>

        <h2>8. Account Termination</h2>
        <p>
          You may delete your account at any time through the Settings page. We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, your data will be permanently deleted within 30 days.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          The Service is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          We may update these Terms from time to time. We will notify you of material changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the updated Terms.
        </p>

        <h2>11. Contact</h2>
        <p>
          If you have questions about these Terms, please contact us through the app's support channels.
        </p>

        <div className="mt-12 pt-6 border-t border-border text-sm text-muted-foreground">
          <Link to="/cookies" className="text-primary hover:underline">Cookie Policy</Link>
          {' · '}
          <Link to="/welcome" className="text-primary hover:underline">Back to Home</Link>
        </div>
      </main>
    </div>
  );
}
