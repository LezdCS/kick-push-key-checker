import pusher from 'pusher-js';
// deno-lint-ignore no-explicit-any
const Pusher = pusher as any as typeof pusher.default;

export const connect_pusher = (pusherAppKey: string, cluster: string) => {
  const pusher = new Pusher(pusherAppKey, {
    cluster: cluster,
  });

  pusher.connect();

  // deno-lint-ignore no-explicit-any
  pusher.connection.bind('error', (error: any) => {
    console.error('Pusher connection error:', error);
  });

  pusher.subscribe('chatrooms.668.v2');
  pusher.subscribe('channel.668');

  // deno-lint-ignore no-explicit-any
  pusher.connection.bind('message', (message: any) => {
    console.log('Raw message:', message);
  });

  pusher.connection.bind('state_change', (states: {
    previous: string;
    current: string;
  }) => {
    console.log('Connection state changed from', states.previous, 'to', states.current);
    if (states.current === 'connected') {
      console.log('Connected to Pusher');
    }
  });
}
