import { Flex, Spinner } from '@radix-ui/themes';

export function LoadingSpinner() {
  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
      <Spinner size="3" />
    </Flex>
  );
}
