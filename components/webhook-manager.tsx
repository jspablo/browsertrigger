import { useState, useEffect } from "react";
import { useStorage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Send, Plus, Webhook as WebhookIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

interface Webhook {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  fieldName: string;
  authType: 'none' | 'basic' | 'header';
  authData?: {
    username?: string;
    password?: string;
    headerName?: string;
    headerValue?: string;
  };
}

interface ContentData {
  type: 'selected' | 'fullPage' | 'screenshot';
  data: string;
  sourceUrl?: string;
}

type View = 'empty' | 'form' | 'list';

export function WebhookManager() {
  const [webhooks, setWebhooks] = useStorage<Webhook[]>("local:webhooks", []);
  const [currentContent] = useStorage<ContentData | null>("local:currentContent", null);

  const [view, setView] = useState<View>('empty');
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    method: "POST" as 'GET' | 'POST',
    fieldName: "",
    authType: "none" as 'none' | 'basic' | 'header',
    authData: {
      username: "",
      password: "",
      headerName: "",
      headerValue: ""
    }
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Update view based on webhooks length
  useEffect(() => {
    if (webhooks.length === 0 && view === 'list') {
      setView('empty');
    } else if (webhooks.length > 0 && view === 'empty') {
      setView('list');
    }
  }, [webhooks.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.url || !formData.fieldName) {
      alert("Please fill in all fields");
      return;
    }

    // Validate auth fields
    if (formData.authType === 'basic' && (!formData.authData.username || !formData.authData.password)) {
      alert("Please fill in username and password for Basic authentication");
      return;
    }

    if (formData.authType === 'header' && (!formData.authData.headerName || !formData.authData.headerValue)) {
      alert("Please fill in header name and value for Header authentication");
      return;
    }

    if (editingId) {
      // Update existing webhook
      const updated = webhooks.map(w =>
        w.id === editingId
          ? { ...formData, id: editingId }
          : w
      );
      await setWebhooks(updated);
      setEditingId(null);
    } else {
      // Add new webhook
      const newWebhook: Webhook = {
        ...formData,
        id: Date.now().toString()
      };
      await setWebhooks([...webhooks, newWebhook]);
    }

    // Reset form and switch to list view
    setFormData({
      name: "",
      url: "",
      method: "POST",
      fieldName: "",
      authType: "none",
      authData: {
        username: "",
        password: "",
        headerName: "",
        headerValue: ""
      }
    });
    setView('list');
  };

  const handleEdit = (webhook: Webhook) => {
    setFormData({
      name: webhook.name,
      url: webhook.url,
      method: webhook.method,
      fieldName: webhook.fieldName,
      authType: webhook.authType,
      authData: {
        username: webhook.authData?.username ?? "",
        password: webhook.authData?.password ?? "",
        headerName: webhook.authData?.headerName ?? "",
        headerValue: webhook.authData?.headerValue ?? ""
      }
    });
    setEditingId(webhook.id);
    setView('form');
  };

  const handleDelete = async (id: string) => {
    const updated = webhooks.filter(w => w.id !== id);
    await setWebhooks(updated);
    if (editingId === id) {
      setEditingId(null);
      setFormData({
        name: "",
        url: "",
        method: "POST",
        fieldName: "",
        authType: "none",
        authData: {
          username: "",
          password: "",
          headerName: "",
          headerValue: ""
        }
      });
    }
  };

  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type: mime});
  };

  const handleSend = async (webhook: Webhook) => {
    if (!currentContent) {
      return;
    }

    setSendingId(webhook.id);

    try {
      const contentData = currentContent.data;
      const isScreenshot = currentContent.type === 'screenshot';

      // Build headers object with auth
      const headers: Record<string, string> = {};

      if (webhook.authType === 'basic' && webhook.authData?.username && webhook.authData?.password) {
        const credentials = btoa(`${webhook.authData.username}:${webhook.authData.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
      } else if (webhook.authType === 'header' && webhook.authData?.headerName && webhook.authData?.headerValue) {
        headers[webhook.authData.headerName] = webhook.authData.headerValue;
      }

      let response: Response;

      if (webhook.method === 'POST') {
        if (isScreenshot) {
          // Send screenshot as binary multipart/form-data
          const blob = dataURLtoBlob(contentData);
          const formData = new FormData();
          formData.append(webhook.fieldName, blob, 'screenshot.png');
          formData.append('contentType', currentContent.type);
          if (currentContent.sourceUrl) {
            formData.append('sourceUrl', currentContent.sourceUrl);
          }

          response = await fetch(webhook.url, {
            method: 'POST',
            headers, // Don't set Content-Type, let browser set it with boundary
            body: formData
          });
        } else {
          // Send text content as JSON
          headers['Content-Type'] = 'application/json';

          response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              [webhook.fieldName]: contentData,
              contentType: currentContent.type,
              sourceUrl: currentContent.sourceUrl || ''
            })
          });
        }
      } else {
        // Send GET request with field name as query parameter
        const url = new URL(webhook.url);
        url.searchParams.append(webhook.fieldName, contentData);
        url.searchParams.append('contentType', currentContent.type);

        response = await fetch(url.toString(), {
          method: 'GET',
          headers
        });
      }

      // Get response body
      const responseBody = await response.text();

      // Save response to storage
      await browser.storage.local.set({
        webhookResponse: {
          webhookName: webhook.name,
          timestamp: Date.now(),
          status: response.status,
          body: responseBody,
          isError: !response.ok
        }
      });
    } catch (error) {
      console.error('Error sending webhook:', error);

      // Save error to storage
      await browser.storage.local.set({
        webhookResponse: {
          webhookName: webhook.name,
          timestamp: Date.now(),
          status: 0,
          body: error instanceof Error ? error.message : 'Unknown error',
          isError: true
        }
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: "",
      url: "",
      method: "POST",
      fieldName: "",
      authType: "none",
      authData: {
        username: "",
        password: "",
        headerName: "",
        headerValue: ""
      }
    });
    setView(webhooks.length > 0 ? 'list' : 'empty');
  };

  // Render empty state
  if (view === 'empty') {
    return (
      <div className="flex flex-col h-full p-4">
        <Empty>
          <EmptyHeader>
            <WebhookIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <EmptyTitle>No Webhooks</EmptyTitle>
            <EmptyDescription>
              Create your first webhook to start sending captured content to external services.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setView('form')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  // Render form view
  if (view === 'form') {
    return (
      <div className="flex flex-col h-full p-4 overflow-auto">
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? "Edit Webhook" : "Add Webhook"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <Input
              type="text"
              placeholder="My Webhook"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">URL</label>
            <Input
              type="url"
              placeholder="https://example.com/webhook"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">HTTP Method</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value as 'GET' | 'POST' })}
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Field Name</label>
            <Input
              type="text"
              placeholder="content"
              value={formData.fieldName}
              onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.method === 'POST'
                ? "Name of the field in the POST request body"
                : "Name of the query parameter"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Authentication</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={formData.authType}
              onChange={(e) => setFormData({ ...formData, authType: e.target.value as 'none' | 'basic' | 'header' })}
            >
              <option value="none">None</option>
              <option value="basic">Basic</option>
              <option value="header">Header</option>
            </select>
          </div>

          {formData.authType === 'basic' && (
            <>
              <div>
                <label className="text-sm font-medium mb-1 block">Username</label>
                <Input
                  type="text"
                  placeholder="username"
                  value={formData.authData.username}
                  onChange={(e) => setFormData({
                    ...formData,
                    authData: { ...formData.authData, username: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Password</label>
                <Input
                  type="password"
                  placeholder="password"
                  value={formData.authData.password}
                  onChange={(e) => setFormData({
                    ...formData,
                    authData: { ...formData.authData, password: e.target.value }
                  })}
                />
              </div>
            </>
          )}

          {formData.authType === 'header' && (
            <>
              <div>
                <label className="text-sm font-medium mb-1 block">Header Name</label>
                <Input
                  type="text"
                  placeholder="X-API-Key"
                  value={formData.authData.headerName}
                  onChange={(e) => setFormData({
                    ...formData,
                    authData: { ...formData.authData, headerName: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Header Value</label>
                <Input
                  type="text"
                  placeholder="your-api-key"
                  value={formData.authData.headerValue}
                  onChange={(e) => setFormData({
                    ...formData,
                    authData: { ...formData.authData, headerValue: e.target.value }
                  })}
                />
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {editingId ? "Update" : "Add"} Webhook
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Render list view
  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Webhooks</h2>
        <Button size="sm" onClick={() => setView('form')}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      <div className="flex-1 overflow-auto space-y-2 max-h-[calc(100vh-12rem)]">
        {webhooks.map((webhook) => (
          <div
            key={webhook.id}
            className="border rounded-lg p-3 bg-background space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{webhook.name}</h3>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {webhook.url}
                </p>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Method: <span className="font-medium">{webhook.method}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Field: <span className="font-medium">{webhook.fieldName}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Auth: <span className="font-medium capitalize">{webhook.authType}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSend(webhook)}
                disabled={sendingId === webhook.id || !currentContent}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendingId === webhook.id ? "Sending content ..." : "Send content"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(webhook)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(webhook.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
