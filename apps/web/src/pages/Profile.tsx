import { usePlayerStore } from '../store/player';

export default function Profile() {
  const player = usePlayerStore((s) => s.player);
  return (
    <div>
      <h1>Profile</h1>
      {player ? (
        <ul>
          <li>ID: {player.id}</li>
          <li>Name: {player.name}</li>
          <li>Level: {player.level}</li>
          <li>Class: {player.class}</li>
          <li>Gold: {player.gold}</li>
        </ul>
      ) : (
        <p>No player loaded.</p>
      )}
    </div>
  );
}

