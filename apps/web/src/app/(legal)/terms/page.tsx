export default function TermsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
      <div className="max-w-3xl mx-auto space-y-8 py-12">
        <div>
          <h1 className="text-4xl font-black mb-4">Terms of Service</h1>
          <p className="text-slate-500 text-sm font-semibold">Last Updated: October 2023</p>
        </div>

        <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using ChessInsight Pro, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Service Description</h2>
            <p>
              ChessInsight Pro provides chess game analysis, dynamic puzzle generation, and spaced repetition learning based on your uploaded PGNs. We utilize advanced AI models to provide narrative insights into your games.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Payments and Billing</h2>
            <p>
              Currently, all payments for upgraded plans (Pro, Elite, Custom) are processed manually via third-party transfer services (e.g., Bkash, Bank Transfer). 
              <strong> We do not collect, process, or store credit card information on our servers.</strong>
              Upon verification of your manual payment, your account quotas will be updated. All payments are non-refundable unless otherwise specified.
            </p>
            <p className="mt-2">
              If and when we implement automated payment gateways, these terms will be updated to reflect the new payment processing standards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Fair Use</h2>
            <p>
              Account sharing is strictly prohibited. Your quotas for game analysis and training sessions are tied directly to your individual account and subscription tier. Attempting to bypass quota limits or abusing the AI narrative enrichment features may result in immediate account suspension.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Disclaimer of Warranties</h2>
            <p>
              The service is provided "as is". While we strive for accuracy in our engine evaluations and AI insights, ChessInsight Pro makes no guarantees regarding the accuracy of chess analysis or resulting ELO improvement.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
