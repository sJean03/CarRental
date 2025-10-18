import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Rent a Car in the Philippines
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Affordable, reliable, and convenient car rental service. Choose from our wide selection of vehicles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/vehicles">Browse Vehicles</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register-owner">Lease Your Vehicle</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <CardTitle>Choose Your Vehicle</CardTitle>
                <CardDescription>
                  Browse our selection of cars and pick the one that fits your needs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <CardTitle>Book & Pay</CardTitle>
                <CardDescription>
                  Select your dates and location. Pay via Cash or GCash
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <CardTitle>Pick Up & Drive</CardTitle>
                <CardDescription>
                  Pick up your vehicle at our branch and enjoy your journey
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Vehicles Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Featured Vehicles</h2>
            <Button variant="outline" asChild>
              <Link href="/vehicles">View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Placeholder cards - we'll make these dynamic later */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">Vehicle Image</span>
                </div>
                <CardHeader>
                  <CardTitle>Toyota Vios 2020</CardTitle>
                  <CardDescription>Sedan • Automatic • 5 Seats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold">₱2,500</p>
                      <p className="text-sm text-muted-foreground">per day</p>
                    </div>
                    <Button asChild>
                      <Link href="/vehicles/1">Book Now</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">Own a Vehicle?</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-lg">
                Lease your vehicle to RentEase and earn monthly income. We handle everything!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register-owner">Learn More</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}