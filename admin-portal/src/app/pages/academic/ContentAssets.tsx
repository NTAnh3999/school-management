import { Space } from "antd";
import { PageHeader } from "../../components/PageHeader";
import { ContentAssetLibrary } from "../../components/ContentAssetLibrary";

// CCA-06 — Content Asset metadata registry. Assets are tenant-scoped, not course-scoped (a
// single asset can be reused across lessons/courses), so this lives as its own page rather than
// nested under a specific course's Content tab.
export function ContentAssets() {
  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Content Assets"
        description="Register and track readiness of media/document assets used by learning items."
      />
      <ContentAssetLibrary />
    </Space>
  );
}
