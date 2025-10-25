import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Car, Shield, DollarSign, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Rent a Car from Local Owners
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Find the perfect car for your next trip. Safe, affordable, and convenient.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/cars">
                <Button size="lg" variant="secondary" className="text-lg">
                  Browse Cars
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="text-lg bg-transparent text-white border-white hover:bg-white/10">
                  List Your Car
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose RentEase?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Car className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Wide Selection</h3>
              <p className="text-gray-600">
                Choose from hundreds of cars from local owners
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
              <p className="text-gray-600">
                All owners are verified for your safety
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <DollarSign className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
              <p className="text-gray-600">
                Get great deals with transparent pricing
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Rentals</h3>
              <p className="text-gray-600">
                Rent by the day with flexible payment options
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of happy renters and owners on RentEase
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
