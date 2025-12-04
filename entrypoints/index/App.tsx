import { SiteHeader } from "@/components/site-header"
import { TextDisplay } from "@/components/text-display"
import { WebhookManager } from "@/components/webhook-manager"
import { ResponseDisplay } from "@/components/response-display"


function App() {
  return (
    <div className="h-screen [--header-height:calc(--spacing(14))]">
      <div className="flex flex-col w-full h-full">
        <SiteHeader />
        <div className="flex flex-1 gap-4 p-4">
          <div className="grid gap-4 md:grid-cols-3 flex-1">
            <div className="bg-muted/50 rounded-xl">
              <TextDisplay />
            </div>
            <div className="bg-muted/50 rounded-xl">
              <WebhookManager />
            </div>
            <div className="bg-muted/50 rounded-xl">
              <ResponseDisplay />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default App;
