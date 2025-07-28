import { requireAuth } from "@/lib/auth";
import { getSimpleConversationMessages } from "@/lib/services/conversations-simple";
import { SimpleConversationPageClient } from "@/components/conversations/simple-conversation-page-client";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ConversationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const session = await requireAuth();
  const { id } = await params;

  try {
    const messages = await getSimpleConversationMessages(id, session.user.id);

    return (
      <SimpleConversationPageClient
        conversationId={id}
        initialMessages={messages}
        currentUserId={session.user.id}
      />
    );
  } catch (error) {
    console.error("Error loading conversation:", error);

    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Conversation Error</h3>
          <p className="text-muted-foreground mb-4">
            Unable to load this conversation. This might be due to RLS policy
            issues.
          </p>
          <div className="bg-muted p-4 rounded-lg text-sm text-left mb-4">
            <p className="font-medium mb-2">To fix the issue:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Run:{" "}
                <code className="bg-background px-1 rounded">
                  node scripts/fix-conversations-rls.js
                </code>
              </li>
              <li>Copy the SQL output to your Supabase SQL Editor</li>
              <li>Execute the SQL script</li>
              <li>Refresh this page</li>
            </ol>
          </div>
          <Button asChild>
            <Link href="/conversations">Back to Conversations</Link>
          </Button>
        </div>
      </div>
    );
  }
}
