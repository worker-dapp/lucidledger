import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

export default function Profile() {
  const { user } = useDynamicContext();

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please log in.</p>;

  return (
    <div>
      <h1>Hi {user.email}</h1>
      <p>Your ID: {user.id}</p>
      <p>Access token: {session.access_token}</p>
    </div>
  );
}
