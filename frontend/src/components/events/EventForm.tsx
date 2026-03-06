
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Checkbox } from 'primereact/checkbox';
import { formatDuration } from '../../utils/formatDate';
import type { EventFormValues, Event } from '../../types';
import styles from './EventForm.module.css';

const eventSchema = z
  .object({
    name: z.string().min(1, 'Event name is required').max(120, 'Name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    date: z.string().optional(),
    endDate: z.string().optional(),
    locationName:    z.string().max(200).optional(),
    locationStreet:  z.string().max(200).optional(),
    locationCity:    z.string().max(100).optional(),
    locationZip:     z.string().max(20).optional(),
    locationCountry: z.string().max(100).optional(),
  })
  .refine(
    (data) => {
      if (!data.endDate || !data.date) return true;
      return data.endDate > data.date;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );

interface EventFormProps {
  defaultValues?: Partial<Event>;
  onSubmit: (data: EventFormValues) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  errorMessage?: string;
}

export function EventForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save Event',
  isLoading = false,
  errorMessage,
}: EventFormProps) {
  const [isMultiDay, setIsMultiDay] = useState(!!defaultValues?.endDate);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      date: defaultValues?.date ?? '',
      endDate: defaultValues?.endDate ?? '',
      locationName:    defaultValues?.locationName    ?? '',
      locationStreet:  defaultValues?.locationStreet  ?? '',
      locationCity:    defaultValues?.locationCity    ?? '',
      locationZip:     defaultValues?.locationZip     ?? '',
      locationCountry: defaultValues?.locationCountry ?? '',
    },
  });

  // Watch both dates — start is used for minDate, both for duration hint
  const startDateValue = watch('date');
  const endDateValue = watch('endDate');

  const handleFormSubmit = handleSubmit(async (data) => {
    // Clean up empty strings to undefined
    const cleaned: EventFormValues = {
      name: data.name,
      description: data.description || undefined,
      date: data.date || undefined,
      endDate:         isMultiDay ? data.endDate || undefined : undefined,
      locationName:    data.locationName    || undefined,
      locationStreet:  data.locationStreet  || undefined,
      locationCity:    data.locationCity    || undefined,
      locationZip:     data.locationZip     || undefined,
      locationCountry: data.locationCountry || undefined,
    };
    await onSubmit(cleaned);
  });

  return (
    <form onSubmit={handleFormSubmit} className={styles.form} noValidate>
      {errorMessage && (
        <Message severity="error" text={errorMessage} className={styles.errorMsg} />
      )}

      {/* Name */}
      <div className={styles.field}>
        <label htmlFor="event-name" className={styles.label}>
          Event Name <span className={styles.required} aria-hidden="true">*</span>
        </label>
        <InputText
          id="event-name"
          {...register('name')}
          placeholder="e.g. Summer BBQ 2025"
          className={errors.name ? 'p-invalid' : ''}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'event-name-error' : undefined}
          style={{ width: '100%' }}
        />
        {errors.name && (
          <small id="event-name-error" className={styles.fieldError} role="alert">
            {errors.name.message}
          </small>
        )}
      </div>

      {/* Description */}
      <div className={styles.field}>
        <label htmlFor="event-desc" className={styles.label}>
          Description
        </label>
        <InputTextarea
          id="event-desc"
          {...register('description')}
          placeholder="What's this event about?"
          rows={4}
          autoResize
          className={errors.description ? 'p-invalid' : ''}
          style={{ width: '100%' }}
        />
        {errors.description && (
          <small className={styles.fieldError} role="alert">
            {errors.description.message}
          </small>
        )}
      </div>

      {/* Date */}
      <div className={styles.field}>
        <label htmlFor="event-date" className={styles.label}>
          Date &amp; Time
        </label>
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <Calendar
              id="event-date"
              value={field.value ? new Date(field.value) : null}
              onChange={(e) =>
                field.onChange(e.value ? (e.value as Date).toISOString() : '')
              }
              showTime
              hourFormat="24"
              showIcon
              placeholder="Select date and time"
              className={errors.date ? 'p-invalid' : ''}
              style={{ width: '100%' }}
              dateFormat="dd/mm/yy"
            />
          )}
        />
        {errors.date && (
          <small className={styles.fieldError} role="alert">
            {errors.date.message}
          </small>
        )}
      </div>

      {/* Multi-day toggle */}
      <div className={styles.field}>
        <div className={styles.checkboxRow}>
          <Checkbox
            inputId="event-multiday"
            checked={isMultiDay}
            onChange={(e) => {
              setIsMultiDay(!!e.checked);
              if (!e.checked) {
                setValue('endDate', '');
              }
            }}
          />
          <label htmlFor="event-multiday" className={styles.checkboxLabel}>
            Multi-day event
          </label>
        </div>
      </div>

      {/* End Date — only when multi-day is enabled */}
      {isMultiDay && (
        <div className={styles.field}>
          <label htmlFor="event-enddate" className={styles.label}>
            End Date
          </label>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <Calendar
                id="event-enddate"
                value={field.value ? new Date(field.value) : null}
                onChange={(e) =>
                  field.onChange(e.value ? (e.value as Date).toISOString() : '')
                }
                showTime
                hourFormat="24"
                showIcon
                placeholder="Select end date and time"
                minDate={startDateValue ? new Date(startDateValue) : undefined}
                className={errors.endDate ? 'p-invalid' : ''}
                style={{ width: '100%' }}
                dateFormat="dd/mm/yy"
              />
            )}
          />
          {formatDuration(startDateValue, endDateValue) && (
            <small className={styles.durationHint}>
              Duration: {formatDuration(startDateValue, endDateValue)}
            </small>
          )}
          {errors.endDate && (
            <small className={styles.fieldError} role="alert">
              {errors.endDate.message}
            </small>
          )}
        </div>
      )}

      {/* Location */}
      <div className={styles.field}>
        <label htmlFor="event-location-name" className={styles.label}>
          Venue Name
        </label>
        <InputText
          id="event-location-name"
          {...register('locationName')}
          placeholder="e.g. Central Park"
          style={{ width: '100%' }}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="event-location-street" className={styles.label}>
          Street
        </label>
        <InputText
          id="event-location-street"
          {...register('locationStreet')}
          placeholder="Street address"
          style={{ width: '100%' }}
        />
      </div>

      <div className={styles.field}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="event-location-city" className={styles.label}>
              City
            </label>
            <InputText
              id="event-location-city"
              {...register('locationCity')}
              placeholder="City"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ width: '120px' }}>
            <label htmlFor="event-location-zip" className={styles.label}>
              Zip
            </label>
            <InputText
              id="event-location-zip"
              {...register('locationZip')}
              placeholder="Zip"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="event-location-country" className={styles.label}>
          Country
        </label>
        <InputText
          id="event-location-country"
          {...register('locationCountry')}
          placeholder="Country"
          style={{ width: '100%' }}
        />
      </div>

      {/* Submit */}
      <div className={styles.actions}>
        <Button
          type="submit"
          label={submitLabel}
          icon="pi pi-check"
          loading={isLoading}
          disabled={isLoading}
          style={{
            backgroundColor: 'var(--color-primary)',
            borderColor: 'var(--color-primary)',
          }}
        />
      </div>
    </form>
  );
}
