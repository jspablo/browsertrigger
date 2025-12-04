import { useStorage } from "@/lib/storage";

interface ContentData {
  type: 'selected' | 'fullPage' | 'screenshot';
  data: string;
  sourceUrl?: string;
}

export function TextDisplay() {
  const [currentContent] = useStorage<ContentData | null>("local:currentContent", null);

  const renderContent = () => {
    if (!currentContent) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">No content captured yet. Use the context menu to capture text or screenshots.</p>
        </div>
      );
    }

    switch (currentContent.type) {
      case 'selected':
        return (
          <div className="flex flex-col flex-1 min-h-0">
            <h2 className="text-lg font-semibold mb-4">Content Selected</h2>
            <div className="flex-1 overflow-auto border rounded-lg p-3 bg-background">
              <p className="text-sm whitespace-pre-wrap">{currentContent.data}</p>
            </div>
          </div>
        );

      case 'fullPage':
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-lg font-semibold mb-4">Content Selected</h2>
            <div className="flex-1 overflow-auto border rounded-lg p-3 bg-background max-h-[calc(100vh-12rem)]">
              <p className="text-sm whitespace-pre-wrap">{currentContent.data}</p>
            </div>
          </div>
        );

      case 'screenshot':
        return (
          <div className="flex flex-col flex-1 min-h-0">
            <h2 className="text-lg font-semibold mb-4">Content Selected</h2>
            <div className="flex-1 overflow-auto border rounded-lg p-3 bg-background flex items-center justify-center">
              <img
                src={currentContent.data}
                alt="Captured screenshot"
                className="max-w-full h-auto rounded"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      {renderContent()}
    </div>
  );
}
