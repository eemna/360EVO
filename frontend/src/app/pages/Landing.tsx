import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Users,
  Lightbulb,
  Target,
  Rocket,
  Network,
  TrendingUp,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Connect Startups with Experts.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Grow Together.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            360EVO is a professional networking and collaboration platform
            designed for startups, experts, and members to connect, innovate,
            and grow together in the innovation ecosystem.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-lg"
              >
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-gray-300 text-gray-800 hover:bg-gray-50">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="border border-gray-200 p-8 transition-shadow hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Rocket className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">For Startups</h3>
            <p className="text-gray-600">
              Find expert mentors, connect with investors, and collaborate on
              innovative projects. Build your network and accelerate your
              growth.
            </p>
          </Card>
          <Card className="border border-gray-200 p-8 transition-shadow hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
              <Lightbulb className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">For Experts</h3>
            <p className="text-gray-600">
              Share your knowledge, mentor promising startups, and collaborate
              on cutting-edge projects. Make an impact in the innovation
              ecosystem.
            </p>
          </Card>
          <Card className="border border-gray-200 p-8 transition-shadow hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">For Members</h3>
            <p className="text-gray-600">
              Join a vibrant community of innovators, learn from experts, and
              discover exciting opportunities in the startup world.
            </p>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything you need to succeed
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Powerful features designed for the innovation ecosystem
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Expert Matching</h3>
                <p className="text-sm text-gray-600">
                  Connect with the right experts for your specific needs and
                  projects
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Project Collaboration</h3>
                <p className="text-sm text-gray-600">
                  Work together on innovative projects with structured
                  collaboration tools
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-600">
                <Network className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Professional Networking</h3>
                <p className="text-sm text-gray-600">
                  Build meaningful connections in the startup and innovation
                  community
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Innovation Ecosystem</h3>
                <p className="text-sm text-gray-600">
                  Be part of a thriving ecosystem of startups, experts, and
                  innovators
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Growth Opportunities</h3>
                <p className="text-sm text-gray-600">
                  Discover opportunities to grow your startup or expertise
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-600">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Knowledge Sharing</h3>
                <p className="text-sm text-gray-600">
                  Learn from experts and share your insights with the community
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">
            Ready to join the innovation ecosystem?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Start connecting with startups and experts today
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button
                size="lg"
                className="bg-white px-8 py-6 text-lg text-blue-600 hover:bg-gray-100"
              >
                Create Your Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
