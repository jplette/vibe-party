import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Flex,
  Text,
  Button,
  TextField,
  TextArea,
  Grid,
  Heading,
  Switch,
  Separator,
} from '@radix-ui/themes';
import { GlobeIcon } from '@radix-ui/react-icons';
import type { EventFormValues } from '../../types';

// ─── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Event name is required').max(100),
  description: z.string().max(500).optional(),
  date: z.string().optional(),
  endDate: z.string().optional(),
  locationName: z.string().max(100).optional(),
  locationStreet: z.string().max(150).optional(),
  locationCity: z.string().max(100).optional(),
  locationZip: z.string().max(20).optional(),
  locationCountry: z.string().max(100).optional(),
});

// ─── Props ─────────────────────────────────────────────────────────────────────

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>;
  onSubmit: (data: EventFormValues) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
}

// ─── Date input style helpers ─────────────────────────────────────────────────

const dateWrapperStyle: React.CSSProperties = {
  border: '1px solid var(--gray-6)',
  borderRadius: 'var(--radius-2)',
  padding: '0 12px',
  backgroundColor: 'var(--color-surface)',
};

const dateInputStyle: React.CSSProperties = {
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  padding: '8px 0',
  fontFamily: 'inherit',
  fontSize: '14px',
  color: 'inherit',
};

// ─── Field label helper ───────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Text as="p" size="2" weight="medium" mb="1">
      {children}
      {required && (
        <Text color="red" ml="1" aria-hidden>
          *
        </Text>
      )}
    </Text>
  );
}

// ─── EventForm ────────────────────────────────────────────────────────────────

export function EventForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = 'Save',
}: EventFormProps) {
  // multiDay controls visibility of endDate field — not part of RHF schema
  const [multiDay, setMultiDay] = useState<boolean>(
    !!(defaultValues?.endDate && defaultValues.endDate !== defaultValues?.date),
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      date: defaultValues?.date ?? '',
      endDate: defaultValues?.endDate ?? '',
      locationName: defaultValues?.locationName ?? '',
      locationStreet: defaultValues?.locationStreet ?? '',
      locationCity: defaultValues?.locationCity ?? '',
      locationZip: defaultValues?.locationZip ?? '',
      locationCountry: defaultValues?.locationCountry ?? '',
    },
  });

  const handleFormSubmit = async (data: EventFormValues) => {
    // If not multi-day, clear endDate before submitting
    const payload: EventFormValues = {
      ...data,
      endDate: multiDay ? data.endDate : undefined,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Flex direction="column" gap="4">
        {/* ── Event Name ── */}
        <Box>
          <FieldLabel required>Event Name</FieldLabel>
          <TextField.Root
            placeholder="Summer BBQ 2025"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          {errors.name && (
            <Text size="1" color="red" as="p" mt="1">
              {errors.name.message}
            </Text>
          )}
        </Box>

        {/* ── Description ── */}
        <Box>
          <FieldLabel>Description</FieldLabel>
          <TextArea
            placeholder="What's this event about?"
            rows={3}
            {...register('description')}
          />
          {errors.description && (
            <Text size="1" color="red" as="p" mt="1">
              {errors.description.message}
            </Text>
          )}
        </Box>

        {/* ── Date ── */}
        <Box>
          <FieldLabel>Start Date &amp; Time</FieldLabel>
          <Box style={dateWrapperStyle}>
            <input
              type="datetime-local"
              style={dateInputStyle}
              aria-label="Start date and time"
              {...register('date')}
            />
          </Box>
        </Box>

        {/* ── Multi-day toggle ── */}
        <Flex align="center" gap="3">
          <Switch
            checked={multiDay}
            onCheckedChange={setMultiDay}
            aria-label="Multi-day event"
            style={{ cursor: 'pointer' }}
          />
          <Text size="2" color="gray" style={{ cursor: 'pointer', userSelect: 'none' }}>
            Multi-day event
          </Text>
        </Flex>

        {/* ── End Date (conditional) ── */}
        {multiDay && (
          <Box>
            <FieldLabel>End Date &amp; Time</FieldLabel>
            <Box style={dateWrapperStyle}>
              <input
                type="datetime-local"
                style={dateInputStyle}
                aria-label="End date and time"
                {...register('endDate')}
              />
            </Box>
            {errors.endDate && (
              <Text size="1" color="red" as="p" mt="1">
                {errors.endDate.message}
              </Text>
            )}
          </Box>
        )}

        <Separator size="4" />

        {/* ── Location section ── */}
        <Flex align="center" gap="2">
          <GlobeIcon style={{ color: '#ff6b35', width: 16, height: 16 }} />
          <Heading size="3">Location</Heading>
        </Flex>

        {/* ── Venue Name ── */}
        <Box>
          <FieldLabel>Venue Name</FieldLabel>
          <TextField.Root
            placeholder="e.g. Central Park, The Grand Hotel"
            {...register('locationName')}
          />
        </Box>

        {/* ── Street ── */}
        <Box>
          <FieldLabel>Street Address</FieldLabel>
          <TextField.Root
            placeholder="e.g. 123 Main St"
            {...register('locationStreet')}
          />
        </Box>

        {/* ── City + ZIP ── */}
        <Grid columns="2" gap="3">
          <Box>
            <FieldLabel>City</FieldLabel>
            <TextField.Root
              placeholder="e.g. New York"
              {...register('locationCity')}
            />
          </Box>
          <Box>
            <FieldLabel>ZIP / Postal Code</FieldLabel>
            <TextField.Root
              placeholder="e.g. 10001"
              {...register('locationZip')}
            />
          </Box>
        </Grid>

        {/* ── Country ── */}
        <Box>
          <FieldLabel>Country</FieldLabel>
          <TextField.Root
            placeholder="e.g. United States"
            {...register('locationCountry')}
          />
        </Box>

        <Separator size="4" />

        {/* ── Submit ── */}
        <Flex justify="end">
          <Button
            type="submit"
            size="3"
            disabled={isLoading}
            loading={isLoading}
            style={{ backgroundColor: '#ff6b35', cursor: 'pointer' }}
          >
            {submitLabel}
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
