import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">RentEase PH</h3>
            <p className="text-sm text-muted-foreground">
              Your trusted car rental service in the Philippines.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/vehicles" className="text-sm text-muted-foreground hover:text-primary">
                  Browse Vehicles
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* For Owners */}
          <div>
            <h3 className="font-bold text-lg mb-4">Vehicle Owners</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/register-owner" className="text-sm text-muted-foreground hover:text-primary">
                  Lease Your Vehicle
                </Link>
              </li>
              <li>
                <Link href="/owner/login" className="text-sm text-muted-foreground hover:text-primary">
                  Owner Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: info@rentease.ph</li>
              <li>Phone: (02) 8123-4567</li>
              <li>Manila, Philippines</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RentEase PH. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}