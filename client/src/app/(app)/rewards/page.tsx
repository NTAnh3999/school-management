"use client";

import { useMyRewards } from "@/features/rewards/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Trophy, Star } from "lucide-react";

export default function RewardsPage() {
  const { data: rewards, isLoading } = useMyRewards();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const totalPoints =
    rewards?.reduce(
      (acc: number, r: any) => acc + (r.reward?.points_value || 0),
      0,
    ) || 0;

  const rewardsByType = {
    certificate:
      rewards?.filter((r: any) => r.reward?.reward_type === "certificate") ||
      [],
    badge: rewards?.filter((r: any) => r.reward?.reward_type === "badge") || [],
    points:
      rewards?.filter((r: any) => r.reward?.reward_type === "points") || [],
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "certificate":
        return <Award className="h-6 w-6" />;
      case "badge":
        return <Trophy className="h-6 w-6" />;
      case "points":
        return <Star className="h-6 w-6" />;
      default:
        return <Award className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Rewards</h1>
        <p className="text-muted-foreground mt-1">
          Track your achievements and points
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rewardsByType.certificate.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges</CardTitle>
            <Trophy className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rewardsByType.badge.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewards?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Rewards List */}
      {rewards && rewards.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rewards.map((studentReward: any) => {
            const reward = studentReward.reward;
            return (
              <Card
                key={studentReward.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {getRewardIcon(reward.reward_type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {reward.title}
                        </CardTitle>
                        <Badge className="mt-1">{reward.reward_type}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reward.description && (
                    <CardDescription>{reward.description}</CardDescription>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Points:</span>
                    <span className="font-bold text-yellow-600">
                      {reward.points_value}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Earned on{" "}
                    {new Date(studentReward.earned_at).toLocaleDateString()}
                  </div>
                  {studentReward.enrollment && (
                    <div className="text-xs text-muted-foreground">
                      For course: {studentReward.enrollment.course?.title}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rewards yet</h3>
            <p className="text-muted-foreground">
              Complete courses and activities to earn rewards!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
