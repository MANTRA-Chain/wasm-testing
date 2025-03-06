import { createFileRoute } from '@tanstack/react-router';

import { UserContainer } from '@/components/User/UserContainer';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return <UserContainer />;
}
