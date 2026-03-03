
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import type { InvitationFormValues } from '../../types';
import styles from './InviteForm.module.css';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

interface InviteFormProps {
  onSubmit: (data: InvitationFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function InviteForm({ onSubmit, isLoading }: InviteFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvitationFormValues>({
    resolver: zodResolver(inviteSchema),
  });

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
    reset();
  });

  return (
    <form onSubmit={handleFormSubmit} className={styles.form}>
      <div className={styles.row}>
        <div className={styles.fieldWrap}>
          <InputText
            {...register('email')}
            type="email"
            placeholder="friend@example.com"
            className={`${styles.emailInput} ${errors.email ? 'p-invalid' : ''}`}
            aria-label="Email address to invite"
            aria-describedby={errors.email ? 'invite-email-error' : undefined}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <small id="invite-email-error" className={styles.fieldError} role="alert">
              {errors.email.message}
            </small>
          )}
        </div>
        <Button
          type="submit"
          label="Send Invite"
          icon="pi pi-send"
          loading={isLoading}
          style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
        />
      </div>
    </form>
  );
}
