import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Flex, Text, Button, TextField, Spinner } from '@radix-ui/themes';
import type { InvitationFormValues } from '../../types';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

interface InviteFormProps {
  onSubmit: (data: InvitationFormValues) => Promise<void>;
  isLoading: boolean;
}

export function InviteForm({ onSubmit, isLoading }: InviteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InvitationFormValues>({
    resolver: zodResolver(schema),
  });

  const handleFormSubmit = async (data: InvitationFormValues) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Flex direction="column" gap="3">
        <Box>
          <TextField.Root
            type="email"
            placeholder="friend@example.com"
            disabled={isLoading}
            aria-label="Email address"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <Text size="1" color="red" as="p" mt="1">
              {errors.email.message}
            </Text>
          )}
        </Box>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Spinner size="1" /> : null}
          Send Invitation
        </Button>
      </Flex>
    </form>
  );
}
