import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
          <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              RentEase ("we", "our", or "us") is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you
              use our car rental platform.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.1 Personal Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
              <li>Name, email address, and phone number</li>
              <li>Date of birth</li>
              <li>Driver's license information and photo</li>
              <li>Profile photo (optional)</li>
              <li>Payment information (credit/debit card details)</li>
              <li>Address information</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">2.2 Vehicle Information (For Owners)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
              <li>Vehicle make, model, year, and license plate</li>
              <li>Vehicle photos and descriptions</li>
              <li>Vehicle ownership documentation</li>
              <li>Insurance information</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">2.3 Usage Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Booking and rental history</li>
              <li>Payment transactions</li>
              <li>Communication with other users</li>
              <li>Platform activity and preferences</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                <strong>Account Management:</strong> To create and manage your RentEase account
              </li>
              <li>
                <strong>Verification:</strong> To verify your identity and driver's license authenticity
              </li>
              <li>
                <strong>Service Provision:</strong> To facilitate car rentals and bookings
              </li>
              <li>
                <strong>Payment Processing:</strong> To process payments and manage transactions
              </li>
              <li>
                <strong>Communication:</strong> To send booking confirmations, updates, and notifications
              </li>
              <li>
                <strong>Safety and Security:</strong> To protect users and prevent fraud
              </li>
              <li>
                <strong>Platform Improvement:</strong> To analyze usage and improve our services
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Driver's License Information</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Your driver's license photo and information are collected for verification purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Photos are securely stored using encrypted cloud storage (Cloudinary)</li>
              <li>License information is used solely for identity and eligibility verification</li>
              <li>We may share license information with car owners during active rentals</li>
              <li>License data is retained as long as your account is active</li>
              <li>You can request deletion of your license photo by contacting support</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Information Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                <strong>With Other Users:</strong> Car owners can see renter information during active
                rentals, and vice versa
              </li>
              <li>
                <strong>Service Providers:</strong> With third-party services that help us operate the
                platform (payment processors, cloud storage, etc.)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect our rights and
                safety
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset
                sales
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              <strong>We never sell your personal information to third parties.</strong>
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Secure cloud storage for uploaded documents and photos</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure payment processing through trusted providers</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee
              absolute security.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-2">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update or correct your information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li>
                <strong>Objection:</strong> Object to certain data processing activities
              </li>
              <li>
                <strong>Data Portability:</strong> Request your data in a portable format
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              To exercise these rights, please contact us at privacy@rentease.ph
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience, analyze
              platform usage, and personalize content. You can control cookie preferences through your
              browser settings.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Our platform uses the following third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Cloudinary:</strong> For secure image storage and delivery</li>
              <li><strong>Payment Processors:</strong> For secure payment processing</li>
              <li><strong>Analytics:</strong> To understand platform usage and improve services</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              These services have their own privacy policies and we encourage you to review them.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as necessary to provide our services and comply
              with legal obligations. Account data is deleted within 90 days of account closure unless
              required for legal or business purposes.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              RentEase is not intended for users under 21 years of age. We do not knowingly collect
              information from children under 21.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes via email or platform notification. Continued use after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions or concerns about this Privacy Policy, please contact us:
              <br />
              <strong>Email:</strong> privacy@rentease.ph
              <br />
              <strong>Phone:</strong> (02) 8000-0000
              <br />
              <strong>Address:</strong> RentEase Philippines, Makati City, Metro Manila
            </p>
          </section>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Your privacy matters to us.</strong> We are committed to protecting your
              personal information and being transparent about our data practices. If you have any
              questions, please don't hesitate to reach out.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
