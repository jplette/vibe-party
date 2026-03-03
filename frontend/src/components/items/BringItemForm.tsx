
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import type { BringItemFormValues, EventMember } from '../../types';
import styles from './BringItemForm.module.css';

const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200),
  quantity: z.string().max(50).optional(),
  assignedTo: z.string().optional(),
});

interface BringItemFormProps {
  members: EventMember[];
  onSubmit: (data: BringItemFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BringItemForm({ members, onSubmit, onCancel, isLoading }: BringItemFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<BringItemFormValues>({
    resolver: zodResolver(itemSchema),
  });

  const memberOptions = members.map((m) => ({
    label: m.user?.name ?? m.user?.email ?? m.userId,
    value: m.userId,
  }));

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit({
      name: data.name,
      quantity: data.quantity || undefined,
      assignedTo: data.assignedTo || undefined,
    });
    reset();
  });

  return (
    <form onSubmit={handleFormSubmit} className={styles.form}>
      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <InputText
            {...register('name')}
            placeholder="Item name..."
            className={errors.name ? 'p-invalid' : ''}
            autoFocus
            aria-label="Item name"
          />
          {errors.name && (
            <small className={styles.fieldError}>{errors.name.message}</small>
          )}
        </div>

        <InputText
          {...register('quantity')}
          placeholder="Qty (e.g. 2 bottles)"
          className={styles.qtyInput}
          aria-label="Quantity"
        />

        {memberOptions.length > 0 && (
          <Controller
            name="assignedTo"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={memberOptions}
                placeholder="Bring by..."
                showClear
                className={styles.assignDropdown}
              />
            )}
          />
        )}
      </div>

      <div className={styles.actions}>
        <Button
          type="submit"
          label="Add Item"
          icon="pi pi-check"
          size="small"
          loading={isLoading}
          style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
        />
        <Button
          type="button"
          label="Cancel"
          size="small"
          text
          onClick={onCancel}
        />
      </div>
    </form>
  );
}
