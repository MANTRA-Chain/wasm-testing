import { createFileRoute } from '@tanstack/react-router';

import { MainContainer } from '@/components/MainContainer';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return <MainContainer />;
}
