import { useNavigate } from 'react-router-dom';
import { Flex, Heading, Text, IconButton, Box } from '@radix-ui/themes';
import { ArrowLeftIcon } from '@radix-ui/react-icons';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, backTo, backLabel, actions }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <Flex align="start" justify="between" mb="5" gap="4" wrap="wrap">
      <Flex align="center" gap="3">
        {backTo && (
          <IconButton
            variant="ghost"
            onClick={() => navigate(backTo)}
            aria-label={backLabel ?? 'Back'}
          >
            <ArrowLeftIcon />
          </IconButton>
        )}
        <Box>
          <Heading size="6">{title}</Heading>
          {subtitle && (
            <Text size="2" color="gray" mt="1" as="p">
              {subtitle}
            </Text>
          )}
        </Box>
      </Flex>
      {actions && (
        <Flex align="center" gap="2">
          {actions}
        </Flex>
      )}
    </Flex>
  );
}
