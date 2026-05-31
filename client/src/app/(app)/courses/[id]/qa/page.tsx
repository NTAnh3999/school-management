"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  MessageCircle,
  Search,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { useCourse } from "../../_feature/hooks";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type QaAnswer = {
  id: number;
  author: string;
  role: "Instructor" | "Mentor" | "Student";
  timeAgo: string;
  content: string;
  helpful: number;
  verified?: boolean;
};

type QaThread = {
  id: number;
  author: string;
  role: "Instructor" | "Mentor" | "Student";
  timeAgo: string;
  module: string;
  topic: string;
  title: string;
  body: string[];
  upvotes: number;
  replies: number;
  views: number;
  answered: boolean;
  answers: QaAnswer[];
};

const MOCK_THREADS: QaThread[] = [
  {
    id: 1,
    author: "Elena Rodriguez",
    role: "Student",
    timeAgo: "2 hours ago",
    module: "Module 4",
    topic: "Technical",
    title:
      "How does neuroplasticity affect long-term memory encoding in the hippocampus during sleep?",
    body: [
      "I was reviewing the hippocampal-neocortical dialogue lecture and noticed the consolidation process seems heavily tied to sleep cycles.",
      "Are LTP-like effects stronger in Non-REM or REM phases? If anyone has clear references on synaptic behavior in each stage, I would appreciate it.",
    ],
    upvotes: 12,
    replies: 4,
    views: 208,
    answered: true,
    answers: [
      {
        id: 101,
        author: "Dr. Julian Aris",
        role: "Instructor",
        timeAgo: "1 hour ago",
        content:
          "Excellent question. Non-REM slow-wave sleep is usually where systems consolidation dominates, with hippocampal traces replayed toward neocortical storage. REM contributes more to synaptic tuning and integration, especially for emotional and procedural signals. Check Diekelmann and Born (2010) in your supplementary reading.",
        helpful: 8,
        verified: true,
      },
    ],
  },
  {
    id: 2,
    author: "Marcus V.",
    role: "Student",
    timeAgo: "5 hours ago",
    module: "Module 2",
    topic: "Foundations",
    title: "Clarification on sodium-potassium pump ratio during active transport",
    body: [
      "I keep mixing up the ratio of ions moved per ATP. Is it always 3 sodium out and 2 potassium in, or are there exceptions?",
    ],
    upvotes: 7,
    replies: 8,
    views: 143,
    answered: true,
    answers: [
      {
        id: 102,
        author: "Avery Singh",
        role: "Mentor",
        timeAgo: "4 hours ago",
        content:
          "For the classical Na+/K+ ATPase discussed in this module, yes, the standard stoichiometry is 3 out and 2 in per ATP hydrolyzed.",
        helpful: 5,
      },
    ],
  },
  {
    id: 3,
    author: "Sarah L.",
    role: "Student",
    timeAgo: "Yesterday",
    module: "General",
    topic: "Study Group",
    title: "Study group for Friday midterm review",
    body: [
      "Looking for 3-4 people for a virtual deep-dive session Wednesday evening. Reply if interested.",
    ],
    upvotes: 15,
    replies: 15,
    views: 301,
    answered: false,
    answers: [],
  },
  {
    id: 4,
    author: "Nadia P.",
    role: "Student",
    timeAgo: "2 days ago",
    module: "Module 3",
    topic: "Assessment",
    title: "Can I retake quiz 3 before final grading lock?",
    body: [
      "I completed quiz 3 but noticed one conceptual mistake. Is there a retry window before the final lock date?",
    ],
    upvotes: 4,
    replies: 2,
    views: 86,
    answered: false,
    answers: [],
  },
];

const TRENDING_TOPICS = [
  "#Neuroplasticity",
  "#Hippocampus",
  "#SynapticPruning",
  "#DopamineFlow",
  "#MemoryConsolidation",
];

const FAQ_ITEMS = [
  {
    question: "How do I submit the Module 4 lab report?",
    helpful: 24,
  },
  {
    question: "Is Friday guest lecture recorded?",
    helpful: 18,
  },
  {
    question: "Where is the virtual microscope tool?",
    helpful: 42,
  },
];

function matchesQuery(thread: QaThread, query: string) {
  if (!query) {
    return true;
  }

  const normalized = query.toLowerCase();
  return (
    thread.title.toLowerCase().includes(normalized) ||
    thread.topic.toLowerCase().includes(normalized) ||
    thread.module.toLowerCase().includes(normalized) ||
    thread.body.some((paragraph) => paragraph.toLowerCase().includes(normalized))
  );
}

function sortThreads(threads: QaThread[], sort: string) {
  const cloned = [...threads];

  if (sort === "upvoted") {
    return cloned.sort((left, right) => right.upvotes - left.upvotes);
  }

  if (sort === "unanswered") {
    return cloned
      .sort((left, right) => Number(left.answered) - Number(right.answered))
      .sort((left, right) => right.replies - left.replies);
  }

  return cloned;
}

export default function CourseQaPage({
  params,
}: {
  params: { id: string };
}) {
  const courseId = Number(params.id);
  const { data: course, isLoading } = useCourse(courseId);

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedThreadId, setSelectedThreadId] = useState(MOCK_THREADS[0]?.id ?? 0);
  const [draftQuestion, setDraftQuestion] = useState("");

  const visibleThreads = useMemo(() => {
    const searched = MOCK_THREADS.filter((thread) => matchesQuery(thread, query.trim()));
    return sortThreads(searched, sortBy);
  }, [query, sortBy]);

  const selectedThread = useMemo(() => {
    const fromVisible = visibleThreads.find((thread) => thread.id === selectedThreadId);
    if (fromVisible) {
      return fromVisible;
    }

    return visibleThreads[0] ?? null;
  }, [selectedThreadId, visibleThreads]);

  const otherThreads = visibleThreads.filter((thread) => thread.id !== selectedThread?.id);

  const handlePostQuestion = () => {
    if (draftQuestion.trim().length < 24) {
      toast.error("Add a bit more detail so mentors can answer clearly.");
      return;
    }

    toast.success("Question drafted. API endpoint not wired yet, so this is a preview flow.");
    setDraftQuestion("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-2/3 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_360px]">
          <Skeleton className="h-[760px] rounded-[2rem]" />
          <Skeleton className="h-[760px] rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-label-caps text-on-surface-variant">
            <Link
              href={`/courses/${courseId}`}
              className="inline-flex items-center gap-1 text-on-surface-variant transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Course
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-primary">Q&A</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
            Course Q&A: {course?.title || "Applied Neuroscience Cohort"}
          </h1>
          <p className="font-reading text-sm leading-7 text-on-surface-variant lg:text-base">
            Join learners and mentors in focused discussion. Ask precise questions,
            browse verified answers, and keep momentum without leaving the course flow.
          </p>
        </div>
        <Button className="rounded-full px-6" onClick={() => toast("Scroll to Ask a Question to post.") }>
          <Sparkles className="mr-2 h-4 w-4" />
          Ask a Question
        </Button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_360px]">
        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-11"
                placeholder="Search questions by topic or keyword..."
              />
            </div>
            <div className="w-full sm:w-[220px]">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort discussions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most recent</SelectItem>
                  <SelectItem value="upvoted">Most upvoted</SelectItem>
                  <SelectItem value="unanswered">Unanswered first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedThread ? (
            <article className="overflow-hidden rounded-[1.75rem] border border-primary/20 bg-white/80 shadow-[0_4px_18px_rgba(0,91,191,0.05),0_20px_50px_rgba(0,91,191,0.04)] backdrop-blur-sm">
              <div className="space-y-6 p-6 lg:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-high text-sm font-bold text-primary">
                      {selectedThread.author
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{selectedThread.author}</p>
                      <p className="text-xs text-on-surface-variant">
                        {selectedThread.role} • {selectedThread.timeAgo}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border border-secondary/15 bg-secondary/10 text-secondary">
                      {selectedThread.module}
                    </Badge>
                    <Badge className="border border-outline-variant bg-surface-container-low text-on-surface-variant">
                      {selectedThread.topic}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold leading-tight text-on-surface">
                    {selectedThread.title}
                  </h2>
                  <div className="space-y-3 font-reading text-on-surface-variant">
                    {selectedThread.body.map((paragraph) => (
                      <p key={paragraph} className="leading-7">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/40 pt-4">
                  <Button variant="ghost" className="rounded-full text-primary">
                    <ArrowUp className="mr-2 h-4 w-4" />
                    {selectedThread.upvotes} upvotes
                  </Button>
                  <Button variant="ghost" className="rounded-full text-on-surface-variant">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {selectedThread.replies} replies
                  </Button>
                  <Button variant="ghost" className="rounded-full text-on-surface-variant">
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="ghost" className="ml-auto rounded-full text-on-surface-variant">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              {selectedThread.answers.length > 0 && (
                <div className="border-t border-primary/15 bg-primary/5 p-6 lg:p-8">
                  {selectedThread.answers.map((answer) => (
                    <div key={answer.id} className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {answer.verified && (
                          <Badge className="border border-primary/20 bg-primary/15 text-primary">
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Verified answer
                          </Badge>
                        )}
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                          {answer.role} • {answer.timeAgo}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{answer.author}</p>
                        <p className="mt-2 font-reading text-sm leading-7 text-on-surface-variant">
                          {answer.content}
                        </p>
                      </div>
                      <Button variant="ghost" className="rounded-full px-0 text-primary hover:bg-transparent">
                        Helpful ({answer.helpful})
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ) : (
            <Card className="border-dashed border-outline-variant bg-white/80">
              <CardContent className="py-12 text-center">
                <p className="text-lg text-on-surface">No discussions found</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Try a broader keyword or switch the sort option.
                </p>
              </CardContent>
            </Card>
          )}

          <Card id="ask-question" className="border-white/80 bg-white/85">
            <CardHeader>
              <CardTitle className="text-xl">Ask a Question</CardTitle>
              <CardDescription>
                Keep it specific: include module context and what you already tried.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={draftQuestion}
                onChange={(event) => setDraftQuestion(event.target.value)}
                placeholder="Example: In Module 4, I am unclear how REM and Non-REM phases split consolidation responsibilities..."
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-on-surface-variant">
                  Draft length: {draftQuestion.trim().length} characters
                </p>
                <Button onClick={handlePostQuestion}>Post question</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-label-caps text-on-surface-variant">Other discussions</h3>
            {otherThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className="w-full rounded-2xl border border-white/70 bg-white/80 p-5 text-left shadow-sm transition-all hover:border-primary/20 hover:shadow-[0_10px_24px_rgba(0,91,191,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                      <Badge className="border border-outline-variant bg-surface-container-low text-on-surface-variant">
                        {thread.module}
                      </Badge>
                      <span>{thread.author}</span>
                      <span>•</span>
                      <span>{thread.timeAgo}</span>
                    </div>
                    <p className="line-clamp-2 text-base font-semibold text-on-surface">
                      {thread.title}
                    </p>
                    <p className="line-clamp-1 text-sm text-on-surface-variant">
                      {thread.body[0]}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {thread.replies}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <Card className="border-white/80 bg-white/85">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-4 w-4 text-tertiary" />
                Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:border-primary/40 hover:bg-primary hover:text-white"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/85">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CircleHelp className="h-4 w-4 text-primary" />
                Frequently Asked
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {FAQ_ITEMS.map((item) => (
                <div key={item.question} className="space-y-1 border-b border-outline-variant/30 pb-3 last:border-b-0 last:pb-0">
                  <p className="text-sm font-semibold text-on-surface">{item.question}</p>
                  <p className="text-xs text-on-surface-variant">
                    {item.helpful} learners found this helpful
                  </p>
                </div>
              ))}
              <Button variant="outline" className="w-full rounded-xl">
                View knowledge base
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-primary to-primary-container text-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Mentor activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/90 bg-white/20 text-xs font-bold">
                    DA
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/90 bg-white/20 text-xs font-bold">
                    SL
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/90 bg-secondary text-xs font-bold text-on-secondary">
                    +2
                  </div>
                </div>
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                  Active now
                </span>
              </div>
              <p className="text-sm leading-6 text-white/90">
                Mentors typically respond within 15-20 minutes in this cohort.
                Keep questions specific for faster, clearer help.
              </p>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                <p className="text-sm font-semibold">Community contributor</p>
                <p className="text-xs text-white/80">
                  Your recent answer was upvoted 5 times.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-secondary/10">
            <CardContent className="flex items-start gap-3 pt-6">
              <Users className="mt-0.5 h-4 w-4 text-secondary" />
              <div>
                <p className="text-sm font-semibold text-on-surface">{MOCK_THREADS.length} active discussions</p>
                <p className="text-xs text-on-surface-variant">
                  {MOCK_THREADS.reduce((sum, thread) => sum + thread.views, 0)} total views this week.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
