import { Link } from 'react-router-dom';
import icoCalendar from '@/assets/icons/icon-calendar.svg';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 h-14">
          <Link to="/welcome" className="flex items-center gap-2">
            <img src="/logo.png" alt="DayBlock" width={28} height={28} className="rounded-lg" />
            <span className="font-semibold text-foreground">DayBlock</span>
          </Link>
          <Link to="/welcome" className="text-sm text-primary hover:underline">Back to Home</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 prose prose-sm dark:prose-invert">
        <h1>Cookie Policy</h1>
        <p className="text-muted-foreground"><strong>Last updated:</strong> March 8, 2026</p>

        <h2>1. What Are Cookies?</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and improve your experience.
        </p>

        <h2>2. How We Use Cookies</h2>
        <p>System Calendar uses cookies and similar technologies for the following purposes:</p>

        <h3>Essential Cookies (Required)</h3>
        <p>These cookies are necessary for the Service to function and cannot be disabled.</p>
        <ul>
          <li><strong>Authentication tokens</strong> — to keep you signed in securely across sessions.</li>
          <li><strong>Session management</strong> — to maintain your active session state.</li>
          <li><strong>Security tokens</strong> — to protect against cross-site request forgery (CSRF) and other threats.</li>
        </ul>

        <h3>Functional Cookies</h3>
        <p>These cookies remember your preferences to enhance your experience.</p>
        <ul>
          <li><strong>Theme preference</strong> — remembers your choice of light or dark mode.</li>
          <li><strong>Calendar view</strong> — remembers your preferred calendar view (week, month, day, agenda).</li>
          <li><strong>Timezone settings</strong> — ensures events display in your local timezone.</li>
        </ul>

        <h3>Local Storage</h3>
        <p>In addition to cookies, we use browser local storage for:</p>
        <ul>
          <li><strong>Theme settings</strong> — persisting your dark/light mode preference.</li>
          <li><strong>Draft content</strong> — temporarily saving unsent journal entries or event details to prevent data loss.</li>
        </ul>

        <h2>3. Third-Party Cookies</h2>
        <p>When you sign in using Google or Apple, those providers may set their own cookies during the authentication process. These cookies are governed by the respective providers' privacy and cookie policies:</p>
        <ul>
          <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary">Google Privacy Policy</a></li>
          <li><a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary">Apple Privacy Policy</a></li>
        </ul>

        <h2>4. Cookies We Do NOT Use</h2>
        <p>System Calendar does <strong>not</strong> use:</p>
        <ul>
          <li>Advertising or tracking cookies</li>
          <li>Analytics cookies that track behavior across websites</li>
          <li>Social media tracking pixels</li>
          <li>Any cookies that sell or share your data with third parties</li>
        </ul>

        <h2>5. Managing Cookies</h2>
        <p>
          You can manage cookies through your browser settings. Note that disabling essential cookies will prevent you from using the Service, as authentication requires them. Most modern browsers allow you to:
        </p>
        <ul>
          <li>View which cookies are stored</li>
          <li>Delete specific or all cookies</li>
          <li>Block cookies from specific sites</li>
          <li>Set preferences for first-party vs third-party cookies</li>
        </ul>

        <h2>6. Data Retention</h2>
        <p>
          Authentication cookies expire when your session ends or after a defined refresh period. Functional preferences stored in local storage persist until you clear your browser data or change the settings within the app.
        </p>

        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this Cookie Policy as our Service evolves. Material changes will be communicated via the app. The "Last updated" date at the top reflects the most recent revision.
        </p>

        <h2>8. Contact</h2>
        <p>
          For questions about our use of cookies, please contact us through the app's support channels.
        </p>

        <div className="mt-12 pt-6 border-t border-border text-sm text-muted-foreground">
          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
          {' · '}
          <Link to="/welcome" className="text-primary hover:underline">Back to Home</Link>
        </div>
      </main>
    </div>
  );
}
