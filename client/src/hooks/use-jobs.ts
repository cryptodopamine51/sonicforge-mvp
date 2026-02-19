import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertJob, type Job } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// Fetch all jobs
export function useJobs() {
  return useQuery({
    queryKey: [api.jobs.list.path],
    queryFn: async () => {
      const res = await fetch(api.jobs.list.path);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      // Sort by createdAt desc by default
      return api.jobs.list.responses[200].parse(data).sort((a, b) => 
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      );
    },
    // Poll every 3 seconds to update status
    refetchInterval: 3000,
  });
}

// Fetch single job
export function useJob(id: number) {
  return useQuery({
    queryKey: [api.jobs.get.path, id],
    queryFn: async () => {
      const res = await fetch(api.jobs.get.path.replace(":id", id.toString()));
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch job");
      return api.jobs.get.responses[200].parse(await res.json());
    },
    // Poll active jobs more frequently
    refetchInterval: (query) => {
      const data = query.state.data as Job | undefined;
      return data && ["pending", "processing"].includes(data.status) ? 2000 : false;
    },
  });
}

// Create new job
export function useCreateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertJob) => {
      // Validate with shared schema before sending
      const validated = api.jobs.create.input.parse(data);
      
      const res = await fetch(api.jobs.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create generation job");
      }

      return api.jobs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
      toast({
        title: "Job Started",
        description: "Your music is being generated. Hang tight!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
