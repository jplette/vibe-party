
import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Avatar } from 'primereact/avatar';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { PageHeader } from '../components/layout/PageHeader';
import { TodoList } from '../components/todos/TodoList';
import { BringItemList } from '../components/items/BringItemList';
import { InviteForm } from '../components/invitations/InviteForm';
import { useEvent } from '../hooks/useEvents';
import { useEventMembers, useSendInvitation } from '../hooks/useInvitations';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuth } from '../auth/useAuth';
import { formatDateTimeRange, formatDate, formatDuration } from '../utils/formatDate';
import type { InvitationFormValues } from '../types';
import styles from './EventDetailPage.module.css';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth();
  const { data: currentUser } = useCurrentUser();
  const dbUserId = currentUser?.id ?? null;
  const toast = useRef<Toast>(null);
  const [inviteVisible, setInviteVisible] = useState(false);
  const sendInvitation = useSendInvitation(id!);

  const { data: event, isLoading, isError } = useEvent(id!);
  const { data: members = [] } = useEventMembers(id!);

  const currentMember = members.find((m) => m.userId === dbUserId);
  const isAdmin = currentMember?.role === 'admin' || event?.createdBy === dbUserId;

  const handleSendInvite = async (data: InvitationFormValues) => {
    try {
      await sendInvitation.mutateAsync(data);
      toast.current?.show({
        severity: 'success',
        summary: 'Invited!',
        detail: `Invitation sent to ${data.email}`,
        life: 3000,
      });
      setInviteVisible(false);
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to send invitation. They may already be invited.',
        life: 4000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.center}>
        <ProgressSpinner style={{ width: '56px', height: '56px' }} strokeWidth="4" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div>
        <PageHeader title="Event" backTo="/events" backLabel="Back to Events" />
        <Message severity="error" text="Event not found or failed to load." />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Toast ref={toast} />
      <Dialog
        header="Invite Guest"
        visible={inviteVisible}
        onHide={() => setInviteVisible(false)}
        style={{ width: '420px' }}
        draggable={false}
        resizable={false}
      >
        <p style={{ margin: '0 0 1rem', color: 'var(--color-text-muted)' }}>
          They'll receive an email with an accept/decline link.
        </p>
        <InviteForm onSubmit={handleSendInvite} isLoading={sendInvitation.isPending} />
      </Dialog>

      <PageHeader
        title={event.name}
        subtitle={
          event.date
            ? [
                formatDateTimeRange(event.date, event.endDate),
                formatDuration(event.date, event.endDate),
              ]
                .filter(Boolean)
                .join(' \u00b7 ')
            : 'Date TBD'
        }
        backTo="/events"
        backLabel="Events"
        actions={
          isAdmin ? (
            <>
              <Button
                label="Edit"
                icon="pi pi-pencil"
                outlined
                size="small"
                onClick={() => navigate(`/events/${id}/edit`)}
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              />
              <Button
                label="Settings"
                icon="pi pi-cog"
                text
                size="small"
                onClick={() => navigate(`/events/${id}/settings`)}
              />
            </>
          ) : undefined
        }
      />

      <TabView className={styles.tabs}>
        {/* ─── Info tab ───────────────────────────────────────────── */}
        <TabPanel header="Info" leftIcon="pi pi-info-circle mr-2">
          <div className={styles.infoTab}>
            <div className={styles.infoGrid}>
              {event.date && (
                <div className={styles.infoItem}>
                  <i className="pi pi-calendar" aria-hidden="true" />
                  <div>
                    <span className={styles.infoLabel}>Date</span>
                    <span className={styles.infoValue}>
                      {[
                        formatDateTimeRange(event.date, event.endDate),
                        formatDuration(event.date, event.endDate),
                      ]
                        .filter(Boolean)
                        .join(' \u00b7 ')}
                    </span>
                  </div>
                </div>
              )}
              {event.location && (
                <div className={styles.infoItem}>
                  <i className="pi pi-map-marker" aria-hidden="true" />
                  <div>
                    <span className={styles.infoLabel}>Location</span>
                    <span className={styles.infoValue}>{event.location}</span>
                  </div>
                </div>
              )}
              <div className={styles.infoItem}>
                <i className="pi pi-calendar-plus" aria-hidden="true" />
                <div>
                  <span className={styles.infoLabel}>Created</span>
                  <span className={styles.infoValue}>{formatDate(event.createdAt)}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <i className="pi pi-users" aria-hidden="true" />
                <div>
                  <span className={styles.infoLabel}>Members</span>
                  <span className={styles.infoValue}>{members.length}</span>
                </div>
              </div>
            </div>

            {event.description && (
              <div className={styles.descriptionSection}>
                <h3 className={styles.descTitle}>About this event</h3>
                <p className={styles.description}>{event.description}</p>
              </div>
            )}

            {isAdmin && (
              <div className={styles.adminActions}>
                <Button
                  label="Edit Event"
                  icon="pi pi-pencil"
                  onClick={() => navigate(`/events/${id}/edit`)}
                  style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                />
                <Button
                  label="Manage Invitations"
                  icon="pi pi-envelope"
                  outlined
                  onClick={() => navigate(`/events/${id}/settings`)}
                  style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
                />
              </div>
            )}
          </div>
        </TabPanel>

        {/* ─── Todos tab ──────────────────────────────────────────── */}
        <TabPanel header="Todos" leftIcon="pi pi-check-square mr-2">
          <TodoList eventId={id!} />
        </TabPanel>

        {/* ─── Items tab ──────────────────────────────────────────── */}
        <TabPanel header="Items" leftIcon="pi pi-shopping-bag mr-2">
          <BringItemList eventId={id!} />
        </TabPanel>

        {/* ─── Guests tab ─────────────────────────────────────────── */}
        <TabPanel header="Guests" leftIcon="pi pi-users mr-2">
          <div className={styles.guestsTab}>
            {isAdmin && (
              <div className={styles.guestActions}>
                <Button
                  label="Invite Guest"
                  icon="pi pi-user-plus"
                  onClick={() => setInviteVisible(true)}
                  style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                />
              </div>
            )}

            {members.length === 0 ? (
              <div className={styles.emptyGuests}>
                <div className={styles.emptyGuestsIcon} aria-hidden="true">
                  <i className="pi pi-users" />
                </div>
                <p>No members yet. Invite some friends!</p>
              </div>
            ) : (
              <div className={styles.memberList} role="list">
                {members.map((member) => {
                  const initials = member.user?.name
                    ? member.user.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                    : (member.user?.email?.[0] ?? '?').toUpperCase();

                  return (
                    <div key={member.userId} className={styles.memberItem} role="listitem">
                      <Avatar
                        label={initials}
                        shape="circle"
                        style={{ backgroundColor: 'var(--color-accent)', color: '#fff', fontWeight: 700 }}
                      />
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>
                          {member.user?.name ?? member.user?.email ?? member.userId}
                          {member.userId === dbUserId && (
                            <span className={styles.youBadge}> (you)</span>
                          )}
                        </span>
                        {member.user?.email && member.user.name && (
                          <span className={styles.memberEmail}>{member.user.email}</span>
                        )}
                      </div>
                      <Tag
                        value={member.role}
                        severity={member.role === 'admin' ? 'warning' : 'secondary'}
                        className={styles.roleTag}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
}
