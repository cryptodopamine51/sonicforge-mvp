import { useJobs } from "@/hooks/use-jobs";
import { formatDistanceToNow } from "date-fns";
import { Job } from "@shared/schema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  Download,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Music4,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function JobList() {
  const { data: jobs, isLoading, error } = useJobs();
  const [playingId, setPlayingId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading recent tracks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/10 rounded-xl border border-destructive/20">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-destructive">Failed to load history</h3>
        <p className="text-destructive/80">Please try refreshing the page.</p>
      </div>
    );
  }

  if (!jobs?.length) {
    return (
      <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/5">
        <Music4 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-medium mb-2">No tracks yet</h3>
        <p className="text-muted-foreground">
          Create your first AI-generated music track above!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-display px-1">Recent Generations</h2>
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <JobCard
                job={job}
                isPlaying={playingId === job.id}
                onPlayToggle={() => setPlayingId(playingId === job.id ? null : job.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function JobCard({
  job,
  isPlaying,
  onPlayToggle,
}: {
  job: Job;
  isPlaying: boolean;
  onPlayToggle: () => void;
}) {
  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const statusIcons = {
    pending: <Clock className="w-3 h-3 mr-1" />,
    processing: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
    completed: <CheckCircle2 className="w-3 h-3 mr-1" />,
    failed: <AlertCircle className="w-3 h-3 mr-1" />,
  };

  return (
    <Card className="glass-card overflow-hidden group">
      <div className="flex flex-col md:flex-row gap-4 p-5">
        {/* Status Indicator / Icon */}
        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-secondary/50 border border-white/5 group-hover:border-primary/30 transition-colors">
          {job.status === "processing" ? (
            <div className="relative">
              <div className="absolute inset-0 bg-primary/50 blur-lg rounded-full animate-pulse" />
              <Loader2 className="w-6 h-6 text-primary animate-spin relative z-10" />
            </div>
          ) : job.status === "completed" ? (
            <Music4 className="w-6 h-6 text-primary" />
          ) : (
            <Clock className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold text-lg truncate pr-4" title={job.prompt}>
              {job.prompt}
            </h3>
            <Badge
              variant="outline"
              className={`${statusColors[job.status as keyof typeof statusColors]} capitalize whitespace-nowrap`}
            >
              {statusIcons[job.status as keyof typeof statusIcons]}
              {job.status}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{job.durationSec}s</span>
            <span>•</span>
            <span className="uppercase">{job.format}</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(job.createdAt || new Date()), {
                addSuffix: true,
              })}
            </span>
          </div>

          {job.error && (
            <p className="text-sm text-destructive bg-destructive/5 p-2 rounded-md border border-destructive/10">
              Error: {job.error}
            </p>
          )}

          {/* Audio Player if completed */}
          {job.status === "completed" && job.audioUrl && (
            <div className="mt-4 pt-2">
              <audio controls src={job.audioUrl} className="w-full h-8" />
            </div>
          )}
        </div>

        {/* Actions */}
        {job.status === "completed" && job.audioUrl && (
          <div className="flex md:flex-col justify-end gap-2 mt-2 md:mt-0 md:border-l md:border-white/5 md:pl-4">
            <Button
              size="sm"
              variant="secondary"
              className="w-full md:w-auto hover:bg-primary hover:text-primary-foreground transition-colors"
              asChild
            >
              <a href={job.audioUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
        )}
      </div>
      
      {/* Progress bar for processing state */}
      {job.status === "processing" && (
        <div className="h-1 bg-secondary w-full">
          <div className="h-full bg-primary animate-progress-indeterminate" />
        </div>
      )}
    </Card>
  );
}
