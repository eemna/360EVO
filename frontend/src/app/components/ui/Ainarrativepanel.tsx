import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

interface AINarrativePanelProps {
  executiveSummary: string | null;
  strengthsNarrative: string | null;
  risksNarrative: string | null;
  marketOpportunityNarrative: string | null;
  llmModel?: string | null;
}

export function AINarrativePanel({
  executiveSummary,
  strengthsNarrative,
  risksNarrative,
  marketOpportunityNarrative,
  llmModel,
}: AINarrativePanelProps) {
  return (
    <div className="space-y-4">
      {llmModel && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            {llmModel}
          </span>
        </div>
      )}

      <Tabs defaultValue="summary">
        <TabsList className="flex w-full">
          <TabsTrigger value="summary" className="flex-1 text-xs">
            Summary
          </TabsTrigger>
          <TabsTrigger value="strengths" className="flex-1 text-xs">
            Strengths
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex-1 text-xs">
            Risks
          </TabsTrigger>
          <TabsTrigger value="market" className="flex-1 text-xs">
            Market
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="pt-4">
          <NarrativeText content={executiveSummary} />
        </TabsContent>
        <TabsContent value="strengths" className="pt-4">
          <NarrativeText content={strengthsNarrative} accent="green" />
        </TabsContent>
        <TabsContent value="risks" className="pt-4">
          <NarrativeText content={risksNarrative} accent="red" />
        </TabsContent>
        <TabsContent value="market" className="pt-4">
          <NarrativeText content={marketOpportunityNarrative} accent="blue" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NarrativeText({
  content,
  accent,
}: {
  content: string | null;
  accent?: "green" | "red" | "blue";
}) {
  if (!content) {
    return (
      <p className="text-sm text-gray-400 italic">
        No narrative generated yet. Run the AI assessment to generate insights.
      </p>
    );
  }

  const leftBorderColor =
    accent === "green"
      ? "border-green-400"
      : accent === "red"
        ? "border-red-400"
        : accent === "blue"
          ? "border-blue-400"
          : "border-indigo-400";

  return (
    <div className={`border-l-4 pl-4 ${leftBorderColor}`}>
      <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
    </div>
  );
}
