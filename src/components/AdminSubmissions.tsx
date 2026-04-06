import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Mail } from 'lucide-react';

interface Submission {
  id: string;
  form_type: 'contact' | 'review';
  name: string;
  email: string;
  subject?: string;
  college?: string;
  branch?: string;
  year?: string;
  rating?: number;
  message: string;
  submitted_at: string;
}

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    // Initial load
    loadSubmissions();

    // Realtime subscription
    const channel = supabase
      .channel('contact_reviews_insert')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_reviews',
        },
        (payload) => {
          setSubmissions((prev) => [payload.new as Submission, ...prev]);
        }
      )
      .subscribe();

    // Backup refetch every 3 seconds
    const interval = setInterval(loadSubmissions, 3000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadSubmissions = async () => {
    try {
      const { data } = await supabase
        .from('contact_reviews')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (data) setSubmissions(data);
    } catch (error) {
      console.error('Error loading:', error);
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return '—';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Submissions ({submissions.length})
        </CardTitle>
      </CardHeader>

      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No submissions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject / College</TableHead>
                  <TableHead>Branch / Year</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <Badge variant={sub.form_type === 'contact' ? 'default' : 'secondary'}>
                        {sub.form_type === 'contact' ? 'Contact' : 'Review'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell className="text-sm">{sub.email}</TableCell>
                    <TableCell>{sub.form_type === 'contact' ? sub.subject : sub.college}</TableCell>
                    <TableCell>{sub.form_type === 'contact' ? '—' : `${sub.branch} / ${sub.year}`}</TableCell>
                    <TableCell className="text-yellow-500">{renderStars(sub.rating)}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{sub.message}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(sub.submitted_at), 'MMM d HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
