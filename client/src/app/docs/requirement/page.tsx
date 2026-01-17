import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RequirementPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Backend requirements</h1>
        <p className="text-muted-foreground">
          This mirrors the specification stored at <code>docs/requirement.md</code> in the
          monorepo root.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>RESTful E-learning API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            The backend uses Node.js + Express with an MVC structure. Tables cover users,
            roles, permissions, courses, modules, activities, quizzes, assignments,
            question banks, attempts, submissions and categories.
          </p>
          <p>
            Key capabilities include authentication, RBAC enforcement, course/module
            CRUD, activity orchestration, quiz and assignment flows (creation, attempts,
            submissions, grading), and enrollment management.
          </p>
          <p>
            Head over to{" "}
            <Link href="https://github.com/anonystick/structure-api-mvc-express-nodejs">
              the reference repository
            </Link>{" "}
            referenced in the requirements for folder structure inspiration.
          </p>
          <p>
            For the full specification, open the markdown file directly—it is bundled
            with this workspace so product and engineering stay aligned.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
