export default function PrivacyPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
      <div className="max-w-3xl mx-auto space-y-8 py-12">
        <div>
          <h1 className="text-4xl font-black mb-4">Privacy Policy</h1>
          <p className="text-slate-500 text-sm font-semibold">Last Updated: October 2023</p>
        </div>

        <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Information We Collect</h2>
            <p>
              When you use ChessInsight Pro, we collect the following types of information:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              <li><strong>Account Information:</strong> Your email address and hashed password when you sign up.</li>
              <li><strong>Usage Data:</strong> Your IP address upon signup and during specific usage events for rate-limiting and security purposes.</li>
              <li><strong>Chess Data:</strong> PGNs (Portable Game Notation) of the games you upload for analysis, along with the resulting AI insights, weaknesses, and generated puzzles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. How We Use Your Information</h2>
            <p>
              Your data is strictly used to provide and improve the ChessInsight Pro experience. Specifically, we use your game data to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              <li>Calculate your estimated ELO and track performance trends.</li>
              <li>Identify recurring tactical or positional weaknesses.</li>
              <li>Generate dynamic puzzles and populate your Leitner spaced-repetition boxes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Payment Information</h2>
            <p>
              At this time, we process upgrades manually via external transfer methods. 
              <strong> We do not collect, store, or have access to your credit card or bank account details. </strong>
              Any payment references you provide are used solely to verify your manual transfer against your requested account upgrade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Data Sharing and Security</h2>
            <p>
              We do not sell your personal information or your chess games to third parties. We use industry-standard encryption to protect your password and secure your sessions. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us via the email or phone number listed on our upgrade pages.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
