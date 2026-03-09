import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Tabs,
  Button,
  Dialog,
  Avatar,
  Badge,
  Text,
  Heading,
  Grid,
} from '@radix-ui/themes';
import {
  Pencil1Icon,
  GearIcon,
  PersonIcon,
  PlusIcon,
  GlobeIcon,
  CalendarIcon,
  ExternalLinkIcon,
} from '@radix-ui/react-icons';
import { useEvent } from '../hooks/useEvents';
import { useEventMembers, useSendInvitation } from '../hooks/useInvitations';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { TodoList } from '../components/todos/TodoList';
import { BringItemList } from '../components/items/BringItemList';
import { InviteForm } from '../components/invitations/InviteForm';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { toast } from '../components/ui/ToastProvider';
import { formatDateTimeRange, formatDuration, formatDate } from '../utils/formatDate';
import type { InvitationFormValues } from '../types';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const dbUserId = currentUser?.id ?? null;
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: event, isLoading, isError } = useEvent(id!);
  const { data: members = [] } = useEventMembers(id!);
  const sendInvitation = useSendInvitation(id!);

  const currentMember = members.find((m) => m.userId === dbUserId);
  const isAdmin = currentMember?.role === 'admin' || event?.createdBy === dbUserId;

  const handleSendInvite = async (data: InvitationFormValues) => {
    try {
      await sendInvitation.mutateAsync(data);
      toast.success('Invited!', `Invitation sent to ${data.email}`);
      setInviteOpen(false);
    } catch {
      toast.error('Failed to send invitation', 'They may already be invited.');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <ErrorMessage message="Event not found or failed to load." />;

  // Build a comma-separated address for Maps link
  const mapsQuery = [
    event.locationStreet,
    event.locationCity,
    event.locationZip,
    event.locationCountry,
  ]
    .filter(Boolean)
    .join(', ');

  const mapsUrl = mapsQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`
    : null;

  // Build subtitle: date range + optional duration
  const dateRange = event.date ? formatDateTimeRange(event.date, event.endDate) : null;
  const duration = event.date ? formatDuration(event.date, event.endDate) : null;
  const subtitle = [dateRange, duration].filter(Boolean).join(' · ') || 'Date TBD';

  return (
    <Box>
      <PageHeader
        title={event.name}
        subtitle={subtitle}
        backTo="/events"
        backLabel="Events"
        actions={
          isAdmin ? (
            <Flex gap="2">
              <Button
                variant="outline"
                size="2"
                onClick={() => navigate(`/events/${id}/edit`)}
                style={{ cursor: 'pointer' }}
              >
                <Pencil1Icon /> Edit
              </Button>
              <Button
                variant="ghost"
                size="2"
                onClick={() => navigate(`/events/${id}/settings`)}
                style={{ cursor: 'pointer' }}
              >
                <GearIcon /> Settings
              </Button>
            </Flex>
          ) : undefined
        }
      />

      {/* ── Invite Dialog ── */}
      <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
        <Dialog.Content style={{ maxWidth: 420 }}>
          <Dialog.Title>Invite Guest</Dialog.Title>
          <Dialog.Description>
            <Text color="gray" size="2">
              They'll receive an email with an accept/decline link.
            </Text>
          </Dialog.Description>
          <Box mt="4">
            <InviteForm onSubmit={handleSendInvite} isLoading={sendInvitation.isPending} />
          </Box>
        </Dialog.Content>
      </Dialog.Root>

      {/* ── Tabs ── */}
      <Tabs.Root defaultValue="info">
        <Tabs.List>
          <Tabs.Trigger value="info">Info</Tabs.Trigger>
          <Tabs.Trigger value="todos">Todos</Tabs.Trigger>
          <Tabs.Trigger value="items">Items</Tabs.Trigger>
          <Tabs.Trigger value="guests">Guests ({members.length})</Tabs.Trigger>
        </Tabs.List>

        {/* ── Info tab ── */}
        <Tabs.Content value="info">
          <Box pt="5">
            <Grid columns={{ initial: '1', sm: '2' }} gap="4" mb="5">
              {event.date && (
                <Flex align="start" gap="2">
                  <CalendarIcon
                    style={{ marginTop: 2, color: '#ff6b35', flexShrink: 0, width: 16 }}
                  />
                  <Box>
                    <Text size="1" color="gray" style={{ display: 'block' }}>
                      Date
                    </Text>
                    <Text size="2" weight="medium">
                      {[
                        formatDateTimeRange(event.date, event.endDate),
                        formatDuration(event.date, event.endDate),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </Box>
                </Flex>
              )}

              {(event.locationName || mapsQuery) && (
                <Flex align="start" gap="2">
                  <GlobeIcon
                    style={{ marginTop: 2, color: '#ff6b35', flexShrink: 0, width: 16 }}
                  />
                  <Box>
                    <Text size="1" color="gray" style={{ display: 'block' }}>
                      Location
                    </Text>
                    {event.locationName && (
                      <Text size="2" weight="medium" style={{ display: 'block' }}>
                        {event.locationName}
                      </Text>
                    )}
                    {mapsQuery && (
                      <Text size="1" color="gray" style={{ display: 'block' }}>
                        {mapsQuery}
                      </Text>
                    )}
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#ff6b35',
                          marginTop: 4,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLinkIcon style={{ width: 12 }} />
                        Open in Maps
                      </a>
                    )}
                  </Box>
                </Flex>
              )}

              <Flex align="start" gap="2">
                <PersonIcon
                  style={{ marginTop: 2, color: '#ff6b35', flexShrink: 0, width: 16 }}
                />
                <Box>
                  <Text size="1" color="gray" style={{ display: 'block' }}>
                    Members
                  </Text>
                  <Text size="2" weight="medium">
                    {members.length}
                  </Text>
                </Box>
              </Flex>

              <Flex align="start" gap="2">
                <CalendarIcon
                  style={{ marginTop: 2, color: '#ff6b35', flexShrink: 0, width: 16 }}
                />
                <Box>
                  <Text size="1" color="gray" style={{ display: 'block' }}>
                    Created
                  </Text>
                  <Text size="2" weight="medium">
                    {formatDate(event.createdAt)}
                  </Text>
                </Box>
              </Flex>
            </Grid>

            {event.description && (
              <Box mb="5">
                <Heading size="3" mb="2">
                  About this event
                </Heading>
                <Text size="2" color="gray" as="p">
                  {event.description}
                </Text>
              </Box>
            )}

            {isAdmin && (
              <Flex gap="3">
                <Button
                  style={{ backgroundColor: '#ff6b35', cursor: 'pointer' }}
                  onClick={() => navigate(`/events/${id}/edit`)}
                >
                  <Pencil1Icon /> Edit Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/events/${id}/settings`)}
                  style={{ cursor: 'pointer' }}
                >
                  Manage Invitations
                </Button>
              </Flex>
            )}
          </Box>
        </Tabs.Content>

        {/* ── Todos tab ── */}
        <Tabs.Content value="todos">
          <Box pt="5">
            <TodoList eventId={id!} />
          </Box>
        </Tabs.Content>

        {/* ── Items tab ── */}
        <Tabs.Content value="items">
          <Box pt="5">
            <BringItemList eventId={id!} />
          </Box>
        </Tabs.Content>

        {/* ── Guests tab ── */}
        <Tabs.Content value="guests">
          <Box pt="5">
            {isAdmin && (
              <Flex justify="end" mb="4">
                <Button
                  style={{ backgroundColor: '#ff6b35', cursor: 'pointer' }}
                  onClick={() => setInviteOpen(true)}
                >
                  <PlusIcon /> Invite Guest
                </Button>
              </Flex>
            )}

            {members.length === 0 ? (
              <Text color="gray" size="2">
                No members yet. Invite some friends!
              </Text>
            ) : (
              <Flex direction="column" gap="3">
                {members.map((member) => {
                  const nameParts = member.user?.name?.split(' ').slice(0, 2) ?? [];
                  const initials =
                    nameParts.length > 0
                      ? nameParts.map((n) => n[0]).join('').toUpperCase()
                      : (member.user?.email?.[0] ?? '?').toUpperCase();

                  return (
                    <Flex key={member.userId} align="center" gap="3">
                      <Avatar
                        size="2"
                        fallback={initials}
                        style={{ backgroundColor: '#ff6b35', color: '#fff', flexShrink: 0 }}
                      />
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text size="2" weight="medium">
                          {member.user?.name ?? member.user?.email ?? member.userId}
                          {member.userId === dbUserId && (
                            <Text color="gray" size="1" ml="1">
                              (you)
                            </Text>
                          )}
                        </Text>
                        {member.user?.email && member.user.name && (
                          <Text
                            size="1"
                            color="gray"
                            style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {member.user.email}
                          </Text>
                        )}
                      </Box>
                      <Badge
                        color={member.role === 'admin' ? 'orange' : 'gray'}
                        variant="soft"
                        style={{ flexShrink: 0 }}
                      >
                        {member.role}
                      </Badge>
                    </Flex>
                  );
                })}
              </Flex>
            )}
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
