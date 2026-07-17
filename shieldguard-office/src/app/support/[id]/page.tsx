'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, SendIcon } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TICKETS, formatDate, timeAgo } from '@/lib/data';

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  in_progress: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  closed: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [reply, setReply] = useState('');

  const ticket = TICKETS.find((t) => t.id === params.id);

  if (!ticket) {
    return (
      <AppShell title="Ticket Not Found">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-lg text-muted-foreground">Ticket not found</p>
          <Button variant="outline" onClick={() => router.push('/support')}>
            <ArrowLeftIcon /> Back to Support
          </Button>
        </div>
      </AppShell>
    );
  }

  const timeline = [
    { event: 'Ticket created', detail: `${ticket.customer} reported: ${ticket.subject}`, time: ticket.createdAt },
    ...(ticket.assignee !== 'Unassigned'
      ? [{ event: 'Assigned to', detail: ticket.assignee, time: ticket.updatedAt - 1200000 }]
      : []),
    ...(ticket.status !== 'open'
      ? [{ event: `Status changed to ${ticket.status.replace('_', ' ')}`, detail: '', time: ticket.updatedAt }]
      : []),
  ];

  return (
    <AppShell title={`Ticket #${ticket.id}`}>
      <div className="space-y-6 max-w-3xl">
        <Button variant="ghost" onClick={() => router.push('/support')} className="-ml-2">
          <ArrowLeftIcon /> Back to Tickets
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {ticket.customer} &middot; {ticket.email}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={statusColors[ticket.status]}>
                  {ticket.status === 'in_progress' ? 'In Progress' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </Badge>
                <Badge className={priorityColors[ticket.priority]}>
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Category</p>
                <p className="capitalize">{ticket.category.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Assignee</p>
                <p>{ticket.assignee}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Created</p>
                <p>{formatDate(ticket.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {timeline.map((entry, i) => (
                <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="size-2.5 rounded-full bg-primary mt-1.5 ring-2 ring-background" />
                    {i < timeline.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.event}</p>
                    {entry.detail && (
                      <p className="text-sm text-muted-foreground mt-0.5">{entry.detail}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(entry.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reply</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Textarea
                placeholder="Type your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end">
                <Button disabled={!reply.trim()}>
                  <SendIcon /> Send Reply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
