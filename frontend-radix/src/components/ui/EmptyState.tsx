import { Flex, Text, Heading } from '@radix-ui/themes';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Flex direction="column" align="center" gap="3" py="8" style={{ textAlign: 'center' }}>
      {icon && (
        <Text style={{ fontSize: '3rem' }} aria-hidden>
          {icon}
        </Text>
      )}
      <Heading size="4">{title}</Heading>
      {description && (
        <Text color="gray" size="2">
          {description}
        </Text>
      )}
      {action}
    </Flex>
  );
}
