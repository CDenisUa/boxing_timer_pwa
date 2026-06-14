// Types
import { RoundConfig, Session } from '@/types/models';

type RoundsSource = Pick<Session, 'rounds' | 'workSeconds' | 'restSeconds' | 'roundsConfig'>;

/**
 * Resolves a session to its concrete per-round timing. Sessions with an explicit
 * `roundsConfig` use it directly; legacy/uniform sessions expand to N identical
 * rounds with rest between them (no rest after the final round).
 */
export const resolveRounds = (session: RoundsSource): RoundConfig[] => {
  if (session.roundsConfig && session.roundsConfig.length > 0) {
    return session.roundsConfig.map((round) => ({
      workSeconds: Math.max(1, Math.floor(round.workSeconds)),
      restSeconds: Math.max(0, Math.floor(round.restSeconds)),
    }));
  }

  const count = Math.max(1, Math.floor(session.rounds));
  return Array.from({ length: count }, (_, index) => ({
    workSeconds: Math.max(1, Math.floor(session.workSeconds)),
    restSeconds: index < count - 1 ? Math.max(0, Math.floor(session.restSeconds)) : 0,
  }));
};

export const sumRounds = (
  rounds: RoundConfig[],
): { work: number; rest: number; total: number } => {
  const work = rounds.reduce((sum, round) => sum + round.workSeconds, 0);
  const rest = rounds.reduce((sum, round) => sum + round.restSeconds, 0);
  return { work, rest, total: work + rest };
};

/** True when every round shares the same work and rest timing. */
export const isUniformRounds = (rounds: RoundConfig[]): boolean => {
  if (rounds.length <= 1) {
    return true;
  }
  const [first] = rounds;
  return rounds.every(
    (round, index) =>
      round.workSeconds === first.workSeconds &&
      // The final round's rest is conventionally 0, so ignore it when comparing.
      (round.restSeconds === first.restSeconds || index === rounds.length - 1),
  );
};
