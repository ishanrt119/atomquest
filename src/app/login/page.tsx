import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex relative bg-primary flex-col justify-between p-12 text-primary-foreground overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="size-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-primary font-bold text-xl">A</span>
          </div>
          <span className="font-semibold text-xl tracking-tight">AtomQuest</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h2 className="text-4xl font-bold leading-tight">
            Elevate your team&apos;s performance tracking.
          </h2>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            "AtomQuest has completely transformed how our organization aligns goals, conducts check-ins, and drives measurable results quarter over quarter."
          </p>
          <div className="flex items-center gap-4 pt-4">
            <div className="size-12 rounded-full bg-white/20" />
            <div>
              <p className="font-semibold text-sm">Sarah Jenkins</p>
              <p className="text-primary-foreground/70 text-xs">VP of HR, TechCorp</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 text-sm text-primary-foreground/60">
          <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-col relative bg-background">
        <div className="absolute top-8 left-8">
          <Link 
            href="/" 
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 size-4" /> Back to Home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
