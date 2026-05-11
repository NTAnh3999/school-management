"use client";

import { useMemo, useState, useTransition } from "react";
import {
  BellRing,
  BookOpenText,
  Brain,
  CheckCircle2,
  Mail,
  Sparkles,
  TimerReset,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { useSessionStore } from "@/stores/session-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Tone = "calm" | "celebratory" | "coach";
type ReadingDensity = "focused" | "balanced" | "immersive";
type ReminderCadence = "quiet" | "steady" | "high-touch";
type DigestWindow = "daily" | "weekly" | "milestone";

function PreferencePillGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; title: string; description: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-label-caps text-muted-foreground">{label}</p>
      <div className="grid gap-3 md:grid-cols-3">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-[1.25rem] border p-4 text-left transition-all ${
                selected
                  ? "border-primary/20 bg-primary/10 shadow-mentor"
                  : "border-white/80 bg-white/75 hover:border-primary/15 hover:bg-primary/5"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-foreground">
                  {option.title}
                </span>
                {selected ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const user = useSessionStore((state) => state.user);
  const [isSaving, startTransition] = useTransition();
  const [fullName, setFullName] = useState(user?.fullName ?? "Admin User");
  const [email, setEmail] = useState(user?.email ?? "admin@schoolhub.io");
  const [studyGoal, setStudyGoal] = useState("Build steadier study habits with fewer distractions.");
  const [focusWindow, setFocusWindow] = useState("45-minute focus blocks");
  const [learningNotes, setLearningNotes] = useState(
    "Prefer concise prompts, visual checkpoints, and encouragement for incremental progress.",
  );
  const [tone, setTone] = useState<Tone>("calm");
  const [readingDensity, setReadingDensity] =
    useState<ReadingDensity>("focused");
  const [reminderCadence, setReminderCadence] =
    useState<ReminderCadence>("steady");
  const [digestWindow, setDigestWindow] = useState<DigestWindow>("weekly");

  const initials = useMemo(
    () =>
      fullName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [fullName],
  );

  const clarityScore = useMemo(() => {
    const toneScore = { calm: 32, celebratory: 26, coach: 24 }[tone];
    const densityScore = {
      focused: 36,
      balanced: 30,
      immersive: 24,
    }[readingDensity];
    const reminderScore = {
      quiet: 18,
      steady: 28,
      "high-touch": 22,
    }[reminderCadence];
    return toneScore + densityScore + reminderScore;
  }, [readingDensity, reminderCadence, tone]);

  const savePreferences = () => {
    startTransition(() => {
      toast.success("Settings updated for this session.", {
        description:
          "The new Cognitive Clarity workspace is now reflected in your local frontend experience.",
      });
    });
  };

  const previewCelebration = () => {
    toast("5 questions correct. Small wins compound.", {
      description:
        tone === "celebratory"
          ? "Momentum is visible, earned, and worth repeating."
          : "A calm nudge keeps progress moving without breaking focus.",
      action: {
        label: "Nice",
        onClick: () => undefined,
      },
    });
  };

  return (
    <div className="space-y-8 pb-8">
      <section className="surface-float overflow-hidden rounded-[2rem] border border-white/70 px-6 py-7 lg:px-8 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-5">
            <Badge className="w-fit bg-primary/10 text-primary">
              Cognitive Clarity
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-[12ch] text-4xl font-bold leading-tight lg:text-5xl">
                Shape a calmer learning workspace.
              </h1>
              <p className="font-reading reading-measure text-base leading-7 text-muted-foreground lg:text-lg">
                Tune profile details, notification cadence, and encouragement style
                so the interface rewards progress without creating noise.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={savePreferences} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save preferences"}
              </Button>
              <Button variant="outline" onClick={previewCelebration}>
                Preview encouragement
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Card className="bg-white/85">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 border border-white/80 shadow-mentor">
                    <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                      {initials || "AD"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-label-caps text-primary">Profile State</p>
                    <CardTitle className="mt-1 text-xl">{fullName}</CardTitle>
                    <CardDescription>{email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clarity score</span>
                  <span className="font-semibold text-foreground">
                    {clarityScore}/100
                  </span>
                </div>
                <Progress value={clarityScore} />
                <p className="font-reading text-sm leading-6 text-muted-foreground">
                  Balanced spacing, focused reading width, and restrained celebration
                  keep the workspace supportive rather than noisy.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/85">
              <CardHeader className="pb-3">
                <p className="text-label-caps text-gold">Milestone Preview</p>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Trophy className="h-5 w-5 text-gold" />
                  Small wins, amplified
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge className="border-gold/20 bg-gold/15 text-gold-foreground">
                  7-day streak
                </Badge>
                <Badge className="border-purple/20 bg-purple/15 text-purple">
                  Reading sprint
                </Badge>
                <Badge className="border-secondary/20 bg-secondary/10 text-secondary">
                  Focus block complete
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Tabs defaultValue="profile" className="space-y-5">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="encouragement">Encouragement</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-primary" />
                  Identity and learning intent
                </CardTitle>
                <CardDescription>
                  Keep labels outside fields, the copy short, and the purpose explicit.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="study-goal">Primary study goal</Label>
                  <Input
                    id="study-goal"
                    value={studyGoal}
                    onChange={(event) => setStudyGoal(event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="learning-notes">Mentor notes</Label>
                  <Textarea
                    id="learning-notes"
                    value={learningNotes}
                    onChange={(event) => setLearningNotes(event.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpenText className="h-5 w-5 text-secondary" />
                  Reading fit
                </CardTitle>
                <CardDescription>
                  Long-form content should remain easy to scan at a measured line width.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="focus-window">Preferred focus window</Label>
                  <Select value={focusWindow} onValueChange={setFocusWindow}>
                    <SelectTrigger id="focus-window">
                      <SelectValue placeholder="Select a focus window" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25-minute recovery blocks">
                        25-minute recovery blocks
                      </SelectItem>
                      <SelectItem value="45-minute focus blocks">
                        45-minute focus blocks
                      </SelectItem>
                      <SelectItem value="60-minute deep work sessions">
                        60-minute deep work sessions
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-[1.25rem] border border-white/80 bg-surface-low p-4">
                  <p className="text-label-caps text-secondary">Preview copy</p>
                  <p className="mt-3 max-w-reading font-reading text-[17px] leading-8 text-foreground">
                    Lessons stay within a measured column so the eye tracks steadily,
                    the page feels structured, and attention stays on the material.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="experience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Cognitive load controls
              </CardTitle>
              <CardDescription>
                Keep the workspace stable, generous with spacing, and deliberate about emphasis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PreferencePillGroup
                label="Reading density"
                value={readingDensity}
                onChange={setReadingDensity}
                options={[
                  {
                    value: "focused",
                    title: "Focused",
                    description:
                      "Maximum breathing room with the narrowest reading line.",
                  },
                  {
                    value: "balanced",
                    title: "Balanced",
                    description:
                      "Keeps the layout compact enough for mixed dashboard work.",
                  },
                  {
                    value: "immersive",
                    title: "Immersive",
                    description:
                      "Allows slightly denser content for longer review sessions.",
                  },
                ]}
              />

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-5">
                  <TimerReset className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">Fixed grid</h3>
                  <p className="mt-2 font-reading text-sm leading-6 text-muted-foreground">
                    Desktop surfaces stay within a stable width to prevent sparse,
                    unfocused layouts on large screens.
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-5">
                  <Sparkles className="h-5 w-5 text-secondary" />
                  <h3 className="mt-4 text-lg font-semibold">Ambient depth</h3>
                  <p className="mt-2 font-reading text-sm leading-6 text-muted-foreground">
                    Shadows stay soft and tinted, using layers instead of hard contrast.
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-5">
                  <Zap className="h-5 w-5 text-gold" />
                  <h3 className="mt-4 text-lg font-semibold">Reserved accents</h3>
                  <p className="mt-2 font-reading text-sm leading-6 text-muted-foreground">
                    Gold and purple remain tied to rewards so milestones keep their impact.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encouragement" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-primary" />
                  Notification cadence
                </CardTitle>
                <CardDescription>
                  Reinforce progress without adding friction or attention debt.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <PreferencePillGroup
                  label="Encouragement tone"
                  value={tone}
                  onChange={setTone}
                  options={[
                    {
                      value: "calm",
                      title: "Calm mentor",
                      description:
                        "Quiet reinforcement with minimal interruption and low visual intensity.",
                    },
                    {
                      value: "celebratory",
                      title: "Celebratory",
                      description:
                        "Higher-energy reward moments for streaks and milestone events.",
                    },
                    {
                      value: "coach",
                      title: "Coach",
                      description:
                        "Direct prompts that nudge the next useful action without excess flair.",
                    },
                  ]}
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reminder-cadence">Reminder cadence</Label>
                    <Select
                      value={reminderCadence}
                      onValueChange={(value) =>
                        setReminderCadence(value as ReminderCadence)
                      }
                    >
                      <SelectTrigger id="reminder-cadence">
                        <SelectValue placeholder="Select reminder cadence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiet">Quiet</SelectItem>
                        <SelectItem value="steady">Steady</SelectItem>
                        <SelectItem value="high-touch">High touch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="digest-window">Digest window</Label>
                    <Select
                      value={digestWindow}
                      onValueChange={(value) =>
                        setDigestWindow(value as DigestWindow)
                      }
                    >
                      <SelectTrigger id="digest-window">
                        <SelectValue placeholder="Select digest window" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="milestone">Milestone only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-secondary" />
                  Encouragement preview
                </CardTitle>
                <CardDescription>
                  Toasts should feel earned, small, and easy to dismiss.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-5">
                  <p className="text-label-caps text-secondary">Bottom-left toast</p>
                  <div className="mt-4 rounded-[1.25rem] border border-secondary/15 bg-gradient-to-r from-secondary/10 to-success/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          5 questions correct
                        </p>
                        <p className="mt-1 font-reading text-sm leading-6 text-muted-foreground">
                          {tone === "celebratory"
                            ? "Your streak is alive. Keep the momentum."
                            : tone === "coach"
                              ? "Solid work. Lock the next focus block while recall is fresh."
                              : "Steady progress. One more short session is enough for today."}
                        </p>
                      </div>
                      <Badge className="border-gold/20 bg-gold/15 text-gold-foreground">
                        earned
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-white/80 bg-surface-low p-5">
                  <p className="text-label-caps text-primary">Digest rhythm</p>
                  <p className="mt-3 font-reading text-sm leading-6 text-muted-foreground">
                    Current cadence:{" "}
                    <span className="font-semibold text-foreground">
                      {reminderCadence}
                    </span>{" "}
                    reminders with a{" "}
                    <span className="font-semibold text-foreground">
                      {digestWindow}
                    </span>{" "}
                    summary pattern.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={previewCelebration}>Send preview toast</Button>
                  <Button variant="outline" onClick={savePreferences} disabled={isSaving}>
                    Save session defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
