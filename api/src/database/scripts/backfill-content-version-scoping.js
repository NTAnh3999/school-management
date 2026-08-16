#!/usr/bin/env node
/**
 * One-off backfill for migration 018: attaches pre-existing course_modules/lessons/
 * learning_items (which had no content_version_id before 018) to a resolved ContentVersion.
 *
 * Per course, resolves/mints the right version to attach to:
 *   1. If the course already has an open draft (status DRAFT/IN_REVIEW/CHANGES_REQUESTED/
 *      APPROVED), attach to the most recently created one of those.
 *   2. Else if the course has a PUBLISHED version but no open draft, mint a new Draft cloned
 *      from that Published version's snapshot_ref is NOT needed here -- the live module/lesson/
 *      item rows themselves are the most current data, so they're attached directly to a new
 *      synthetic Draft version instead of the (possibly stale) snapshot.
 *   3. Else (no ContentVersion exists at all for the course), mint a synthetic "v1 Draft".
 *
 * Idempotent: only touches rows where content_version_id IS NULL, and only mints a version
 * when no suitable one is found, so re-running after a partial failure is safe.
 *
 * Run once, after 018_content_authoring_version_scoping.sql has been applied and before
 * 019_content_version_scoping_not_null.sql:
 *   node src/database/scripts/backfill-content-version-scoping.js
 */
require("dotenv").config();
const {
  sequelize,
  Course,
  CourseModule,
  ContentVersion,
  CourseContentRoot,
} = require("../../models");
const { CONTENT_VERSION_STATUSES } = require("../../constants/content");

const OPEN_DRAFT_STATUSES = [
  CONTENT_VERSION_STATUSES.DRAFT,
  CONTENT_VERSION_STATUSES.IN_REVIEW,
  CONTENT_VERSION_STATUSES.CHANGES_REQUESTED,
  CONTENT_VERSION_STATUSES.APPROVED,
];

const resolveDraftVersionForCourse = async (course, transaction) => {
  const openDraft = await ContentVersion.findOne({
    where: { course_id: course.id, status: OPEN_DRAFT_STATUSES },
    order: [["created_at", "DESC"]],
    transaction,
  });
  if (openDraft) return openDraft;

  const root = await CourseContentRoot.findOne({
    where: { course_id: course.id },
    transaction,
  });

  const lastVersion = await ContentVersion.findOne({
    where: { course_id: course.id },
    order: [["version_no", "DESC"]],
    transaction,
  });
  const versionNo = lastVersion ? lastVersion.version_no + 1 : 1;

  return ContentVersion.create(
    {
      course_id: course.id,
      content_root_id: root ? root.id : null,
      version_label: "Migrated Draft",
      version_no: versionNo,
      status: CONTENT_VERSION_STATUSES.DRAFT,
      revision: 1,
    },
    { transaction }
  );
};

const run = async () => {
  const courses = await Course.unscoped().findAll({
    where: sequelize.literal(
      "EXISTS (SELECT 1 FROM course_modules cm WHERE cm.course_id = `Course`.`id` AND cm.content_version_id IS NULL)"
    ),
  });

  console.log(`Found ${courses.length} course(s) with unattached module rows.`);

  let attached = 0;
  for (const course of courses) {
    await sequelize.transaction(async (transaction) => {
      const version = await resolveDraftVersionForCourse(course, transaction);

      const modules = await CourseModule.findAll({
        where: { course_id: course.id, content_version_id: null },
        transaction,
      });

      for (const courseModule of modules) {
        await courseModule.update(
          { content_version_id: version.id, revision: 1 },
          { transaction }
        );

        const lessons = await sequelize.models.Lesson.findAll({
          where: { module_id: courseModule.id, content_version_id: null },
          transaction,
        });
        for (const lesson of lessons) {
          await lesson.update({ content_version_id: version.id, revision: 1 }, { transaction });

          const items = await sequelize.models.LearningItem.findAll({
            where: { lesson_id: lesson.id, content_version_id: null },
            transaction,
          });
          for (const item of items) {
            await item.update({ content_version_id: version.id, revision: 1 }, { transaction });
          }
        }
      }

      attached += modules.length;
      console.log(`  Course ${course.id} (${course.course_code}): attached to version ${version.id}`);
    });
  }

  console.log(`Done. Attached ${attached} module tree(s).`);

  const [[{ remaining }]] = await sequelize.query(
    "SELECT COUNT(*) AS remaining FROM course_modules WHERE content_version_id IS NULL"
  );
  console.log(`Remaining unattached course_modules rows: ${remaining}`);
  if (Number(remaining) !== 0) {
    console.error("Backfill incomplete -- do NOT run 019 yet.");
    process.exitCode = 1;
  }
};

run()
  .then(() => sequelize.close())
  .catch(async (err) => {
    console.error(err);
    await sequelize.close();
    process.exitCode = 1;
  });
