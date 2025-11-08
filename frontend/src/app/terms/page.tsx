import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Terms and Conditions</CardTitle>
          <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using RentEase ("the Platform"), you accept and agree to be bound by
              the terms and provision of this agreement. If you do not agree to abide by the above,
              please do not use this service.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. User Accounts</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              To use certain features of the Platform, you must register for an account. When
              registering, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept all responsibility for activities that occur under your account</li>
              <li>Upload a valid driver's license for verification purposes</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Driver's License Verification</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              All users must upload a valid driver's license photo for verification. By uploading
              your license, you:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Confirm that you are a licensed driver</li>
              <li>Grant RentEase permission to verify the authenticity of your license</li>
              <li>Understand that false or fraudulent documents may result in account termination</li>
              <li>Acknowledge that your license information will be stored securely</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Rental Services</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4">4.1 For Renters</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
              <li>You must be at least 21 years old with a valid driver's license</li>
              <li>You agree to use rented vehicles responsibly and lawfully</li>
              <li>You are responsible for all damages, tickets, and violations during rental period</li>
              <li>Payment must be made according to the selected payment plan (down payment or installment)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">4.2 For Car Owners</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>You must own or have legal authority to rent the listed vehicle</li>
              <li>Your vehicle must be properly insured and maintained</li>
              <li>You agree to provide accurate information about your vehicle</li>
              <li>RentEase charges a platform fee on each rental transaction</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Payment Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              RentEase supports the following payment options:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Down Payment:</strong> Pay 20% upfront, remaining 80% due at vehicle pickup</li>
              <li><strong>Installment:</strong> Split total payment into monthly installments</li>
              <li>Platform fees are non-refundable</li>
              <li>Cancellation policies apply based on timing and circumstances</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Cancellation and Refunds</h2>
            <p className="text-gray-700 leading-relaxed">
              Cancellations made more than 24 hours before pickup may be eligible for a partial
              refund. Cancellations within 24 hours of pickup may result in forfeiture of the down
              payment. Please refer to our cancellation policy for detailed information.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Liability and Insurance</h2>
            <p className="text-gray-700 leading-relaxed">
              RentEase acts as a platform connecting renters and vehicle owners. We are not
              responsible for accidents, damages, or disputes arising from rentals. Users are
              encouraged to maintain proper insurance coverage.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Prohibited Activities</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Users may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Use vehicles for illegal activities</li>
              <li>Sublease or transfer rental rights to third parties</li>
              <li>Provide false information or fraudulent documents</li>
              <li>Violate any local, state, or national laws while using the Platform</li>
              <li>Tamper with or damage vehicles beyond normal wear and tear</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              RentEase reserves the right to suspend or terminate accounts that violate these terms,
              engage in fraudulent activity, or pose a risk to other users.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the Platform
              after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms and Conditions, please contact us at:
              <br />
              <strong>Email:</strong> support@rentease.ph
              <br />
              <strong>Phone:</strong> (02) 8000-0000
            </p>
          </section>

          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              By creating an account and using RentEase, you acknowledge that you have read,
              understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
