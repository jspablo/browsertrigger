import { useStorage } from "@/lib/storage";
import { CheckCircle2, XCircle } from "lucide-react";

interface WebhookResponse {
  webhookName: string;
  timestamp: number;
  status: number;
  body: string;
  isError: boolean;
}

export function ResponseDisplay() {
  const [response] = useStorage<WebhookResponse | null>("local:webhookResponse", null);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatBody = (body: string) => {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  };

  if (!response) {
    return (
      <div className="flex flex-col h-full p-4">
        <h2 className="text-lg font-semibold mb-4">Webhook Response</h2>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">No webhook response yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-lg font-semibold mb-4">Webhook Response</h2>

      <div className={`border-2 rounded-lg p-4 space-y-3 ${
        response.isError
          ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
          : 'border-green-500 bg-green-50 dark:bg-green-950/20'
      }`}>
        {/* Header with status icon */}
        <div className="flex items-center gap-2">
          {response.isError ? (
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          )}
          <span className={`font-semibold ${
            response.isError ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'
          }`}>
            {response.isError ? 'Error' : 'Success'}
          </span>
        </div>

        {/* Webhook details */}
        <div className="space-y-2">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Webhook:</span>
            <p className="text-sm font-medium">{response.webhookName}</p>
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground">Timestamp:</span>
            <p className="text-sm">{formatTimestamp(response.timestamp)}</p>
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground">Status Code:</span>
            <p className="text-sm font-mono">{response.status}</p>
          </div>
        </div>

        {/* Response body */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Response Body:</span>
          <div className="max-h-96 overflow-auto border rounded-lg p-3 bg-background">
            <pre className="text-xs whitespace-pre-wrap font-mono">{formatBody(response.body)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
