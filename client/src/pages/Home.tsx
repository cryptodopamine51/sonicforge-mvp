import { CreateJobForm } from "@/components/CreateJobForm";
import { JobList } from "@/components/JobList";
import { Sparkles, Music } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl mix-blend-screen opacity-30 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl mix-blend-screen opacity-20" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-16 space-y-12">
        {/* Header */}
        <header className="text-center space-y-6">
          <div className="inline-flex items-center justify-center p-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-4">
            <Sparkles className="w-4 h-4 text-accent mr-2" />
            <span className="text-sm font-medium text-white/80">AI Music Generator v1.0</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50">
            Turn Text into <span className="text-primary">Music</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
            Create original, royalty-free music tracks in seconds. Just describe the mood, genre, or instruments, and let our AI compose for you.
          </p>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Creator */}
          <div className="lg:col-span-5 space-y-8">
            <CreateJobForm />
            
            <div className="glass-panel p-6 rounded-xl space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" />
                Pro Tips
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground list-disc list-inside">
                <li>Be specific about instruments (e.g., "jazz saxophone")</li>
                <li>Mention the BPM or tempo (e.g., "120 bpm house beat")</li>
                <li>Describe the mood (e.g., "melancholic", "energetic")</li>
                <li>Combine genres for unique results</li>
              </ul>
            </div>
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-7">
            <JobList />
          </div>
        </main>

        {/* Footer */}
        <footer className="pt-12 border-t border-white/5 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} AI Music Generator. Built with React & Drizzle.</p>
        </footer>
      </div>
    </div>
  );
}
