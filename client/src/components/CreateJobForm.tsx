import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobSchema, type InsertJob } from "@shared/schema";
import { useCreateJob } from "@/hooks/use-jobs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Wand2, Loader2, Music } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { z } from "zod";

// Extend schema to handle form specifics if needed, or use directly
const formSchema = insertJobSchema.extend({
  prompt: z.string().min(3, "Prompt must be at least 3 characters"),
  durationSec: z.coerce.number().min(5).max(30),
});

export function CreateJobForm() {
  const { mutate, isPending } = useCreateJob();
  const [promptExample, setPromptExample] = useState("");

  const form = useForm<InsertJob>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      model: "musicgen-medium",
      durationSec: 15,
      format: "mp3",
    },
  });

  const onSubmit = (data: InsertJob) => {
    mutate(data, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  const fillExample = (text: string) => {
    form.setValue("prompt", text);
    setPromptExample(text); // Force re-render if needed or for UI feedback
  };

  const examples = [
    "A lo-fi hip hop beat with rainy mood and jazzy piano",
    "Epic orchestral soundtrack for a fantasy movie battle",
    "Upbeat 80s synthwave with pulsing bass and retro drums",
  ];

  return (
    <Card className="glass-panel border-0 relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          <Wand2 className="w-6 h-6 text-primary" />
          Create New Track
        </CardTitle>
        <CardDescription>
          Describe the music you want to hear, and our AI will generate it for you.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your music..."
                      className="bg-black/20 border-white/10 focus:border-primary/50 min-h-[100px] text-lg resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {examples.map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => fillExample(ex)}
                        className="text-xs px-3 py-1 rounded-full bg-secondary/50 hover:bg-primary/20 hover:text-primary transition-colors border border-transparent hover:border-primary/30"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="durationSec"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration ({field.value}s)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4 h-10 px-1">
                        <span className="text-xs text-muted-foreground w-4">5s</span>
                        <Slider
                          min={5}
                          max={30}
                          step={1}
                          defaultValue={[field.value || 15]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-4">30s</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "mp3"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mp3">MP3 (Compressed)</SelectItem>
                        <SelectItem value="wav">WAV (High Quality)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 text-lg font-medium bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Music className="mr-2 h-5 w-5" />
                  Generate Music
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
