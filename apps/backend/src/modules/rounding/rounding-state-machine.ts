import { RoundStatus } from '@prisma/client';
import { InvalidStateTransitionException } from './exceptions';

const STATE_TRANSITIONS: Record<RoundStatus, RoundStatus[]> = {
  [RoundStatus.PLANNED]: [RoundStatus.IN_PROGRESS, RoundStatus.CANCELLED],
  [RoundStatus.IN_PROGRESS]: [RoundStatus.PAUSED, RoundStatus.COMPLETED],
  [RoundStatus.PAUSED]: [RoundStatus.IN_PROGRESS, RoundStatus.COMPLETED, RoundStatus.CANCELLED],
  [RoundStatus.COMPLETED]: [],
  [RoundStatus.CANCELLED]: [],
};

export class RoundingStateMachine {
  static canTransition(from: RoundStatus, to: RoundStatus): boolean {
    return STATE_TRANSITIONS[from].includes(to);
  }

  static validateTransition(from: RoundStatus, to: RoundStatus): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidStateTransitionException(from, to);
    }
  }

  static getValidTransitions(from: RoundStatus): RoundStatus[] {
    return STATE_TRANSITIONS[from];
  }
}
