import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Flex, Table, Button, Heading, Text } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { useEvent } from '../hooks/useEvents';
import { useInvitations, useCancelInvitation } from '../hooks/useInvitations';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { toast } from '../components/ui/ToastProvider';
import { formatDate } from '../utils/formatDate';

export function EventSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading: eventLoading } = useEvent(id!);
  const { data: invitations = [], isLoading: invLoading } = useInvitations(id!);
  const cancelInvitation = useCancelInvitation(id!);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!confirmId) return;
    try {
      await cancelInvitation.mutateAsync(confirmId);
      toast.success('Invitation cancelled');
      setConfirmId(null);
    } catch {
      toast.error('Failed to cancel invitation');
    }
  };

  if (eventLoading || invLoading) return <LoadingSpinner />;
  if (!event) return <ErrorMessage message="Event not found." />;

  return (
    <Box>
      <PageHeader
        title="Event Settings"
        subtitle={event.name}
        backTo={`/events/${id}`}
        backLabel="Back to Event"
      />

      <ConfirmModal
        open={!!confirmId}
        onOpenChange={(open) => {
          if (!open) setConfirmId(null);
        }}
        title="Cancel Invitation"
        description="Are you sure you want to cancel this invitation?"
        confirmLabel="Cancel Invitation"
        onConfirm={handleCancel}
        isLoading={cancelInvitation.isPending}
      />

      <Box style={{ maxWidth: 700 }}>
        <Heading size="4" mb="4">
          Invitations
        </Heading>

        {invitations.length === 0 ? (
          <Text color="gray" size="2">
            No invitations sent yet. Go to the event page to invite guests.
          </Text>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Sent</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {invitations.map((inv) => (
                <Table.Row key={inv.id}>
                  <Table.Cell>{inv.email}</Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={inv.status} />
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1" color="gray">
                      {formatDate(inv.createdAt)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {inv.status === 'pending' && (
                      <Button
                        variant="ghost"
                        color="red"
                        size="1"
                        onClick={() => setConfirmId(inv.id)}
                        aria-label="Cancel invitation"
                        style={{ cursor: 'pointer' }}
                      >
                        <TrashIcon />
                      </Button>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}

        <Flex mt="5">
          <Button
            variant="outline"
            onClick={() => navigate(`/events/${id}`)}
            style={{ cursor: 'pointer' }}
          >
            Back to Event
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
