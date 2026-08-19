import { useEffect, useState } from "react";
import api from "../../services/axios";
import { ProjectCreationWizard } from "./ProjectCreationWizard";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export default function StartupProfile() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [wizardLoading, setWizardLoading] = useState(false);

  useEffect(() => {
    api.get("/projects/my-startup").then(({ data }) => {
      setProjectId(data.id);
      setProjectStatus(data.status);
      setPageLoading(false);
    });
  }, []);

  if (pageLoading) return <LoadingSpinner />;

  return (
    <ProjectCreationWizard
      isOpen={true}
      embedded
      onClose={() => {}}
      projectId={projectId}
      projectStatus={projectStatus}
      loading={wizardLoading}
      setLoading={setWizardLoading}
      onProjectSaved={() => {}}
    />
  );
}