import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { PageHeader } from '../components/layout/PageHeader';
import { InviteForm } from '../components/invitations/InviteForm';
import { useEvent } from '../hooks/useEvents';
import {
  useInvitations,
  useSendInvitation,
  useCancelInvitation,
} from '../hooks/useInvitations';
import type { Invitation, InvitationFormValues } from '../types';
import { formatDate } from '../utils/formatDate';
import styles from './EventSettingsPage.module.css';

export function EventSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  const { data: event, isLoading: eventLoading } = useEvent(id!);
  const { data: invitations, isLoading: invLoading, isError: invError } = useInvitations(id!);
  const sendInvitation = useSendInvitation(id!);
  const cancelInvitation = useCancelInvitation(id!);

  const handleSendInvite = async (data: InvitationFormValues) => {
    try {
      await sendInvitation.mutateAsync(data);
      toast.current?.show({
        severity: 'success',
        summary: 'Invited!',
        detail: `Invitation sent to ${data.email}`,
        life: 3000,
      });
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to send invitation. They may already be invited.',
        life: 4000,
      });
    }
  };

  const handleCancelInvite = (invitation: Invitation) => {
    confirmDialog({
      message: `Cancel invitation for ${invitation.email}?`,
      header: 'Cancel Invitation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await cancelInvitation.mutateAsync(invitation.id);
          toast.current?.show({
            severity: 'info',
            summary: 'Cancelled',
            detail: `Invitation to ${invitation.email} cancelled.`,
            life: 3000,
          });
        } catch {
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to cancel invitation.',
            life: 4000,
          });
        }
      },
    });
  };

  const statusBodyTemplate = (inv: Invitation) => {
    const severityMap: Record<Invitation['status'], 'warning' | 'success' | 'danger'> = {
      pending: 'warning',
      accepted: 'success',
      declined: 'danger',
    };
    return <Tag value={inv.status} severity={severityMap[inv.status]} />;
  };

  const actionsBodyTemplate = (inv: Invitation) => {
    if (inv.status !== 'pending') return null;
    return (
      <Button
        icon="pi pi-times"
        text
        severity="danger"
        size="small"
        onClick={() => handleCancelInvite(inv)}
        aria-label={`Cancel invitation for ${inv.email}`}
        loading={cancelInvitation.isPending}
      />
    );
  };

  if (eventLoading) {
    return (
      <div className={styles.center}>
        <ProgressSpinner style={{ width: '48px', height: '48px' }} strokeWidth="4" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Toast ref={toast} />
      <ConfirmDialog />

      <PageHeader
        title="Event Settings"
        subtitle={event?.name ?? 'Manage invitations'}
        backTo={`/events/${id}`}
        backLabel="Back to Event"
        actions={
          <Button
            label="View Event"
            icon="pi pi-arrow-right"
            iconPos="right"
            outlined
            size="small"
            onClick={() => navigate(`/events/${id}`)}
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
          />
        }
      />

      {/* Send invitation */}
      <Card className={styles.card}>
        <h2 className={styles.cardTitle}>
          <i className="pi pi-send" aria-hidden="true" />
          Send Invitation
        </h2>
        <p className={styles.cardSubtitle}>
          Invite someone to join this event. They'll receive an email with an accept/decline link.
        </p>
        <InviteForm onSubmit={handleSendInvite} isLoading={sendInvitation.isPending} />
      </Card>

      {/* Invitation list */}
      <Card className={styles.card}>
        <h2 className={styles.cardTitle}>
          <i className="pi pi-envelope" aria-hidden="true" />
          Invitations
        </h2>

        {invLoading && (
          <div className={styles.center}>
            <ProgressSpinner style={{ width: '36px', height: '36px' }} strokeWidth="4" />
          </div>
        )}

        {invError && (
          <Message severity="error" text="Failed to load invitations." />
        )}

        {!invLoading && !invError && (invitations ?? []).length === 0 && (
          <div className={styles.emptyInvitations}>
            <div className={styles.emptyInvitationsIcon} aria-hidden="true">
              <i className="pi pi-envelope" />
            </div>
            <p>No invitations sent yet.</p>
          </div>
        )}

        {!invLoading && !invError && (invitations ?? []).length > 0 && (
          <DataTable
            value={invitations}
            className={styles.table}
            stripedRows
            size="small"
          >
            <Column field="email" header="Email" className={styles.emailCol} />
            <Column
              field="status"
              header="Status"
              body={statusBodyTemplate}
              style={{ width: '120px' }}
            />
            <Column
              field="createdAt"
              header="Sent"
              body={(inv: Invitation) => formatDate(inv.createdAt)}
              style={{ width: '120px' }}
            />
            <Column
              body={actionsBodyTemplate}
              style={{ width: '80px', textAlign: 'right' }}
            />
          </DataTable>
        )}
      </Card>
    </div>
  );
}
