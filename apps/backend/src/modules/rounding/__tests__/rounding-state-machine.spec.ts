import { RoundStatus } from '@prisma/client';
import { RoundingStateMachine } from '../rounding-state-machine';
import { InvalidStateTransitionException } from '../exceptions';

describe('RoundingStateMachine', () => {
  describe('canTransition', () => {
    describe('from PLANNED', () => {
      it('should allow transition to IN_PROGRESS', () => {
        expect(
          RoundingStateMachine.canTransition(RoundStatus.PLANNED, RoundStatus.IN_PROGRESS),
        ).toBe(true);
      });

      it('should allow transition to CANCELLED', () => {
        expect(RoundingStateMachine.canTransition(RoundStatus.PLANNED, RoundStatus.CANCELLED)).toBe(
          true,
        );
      });

      it('should not allow transition to COMPLETED', () => {
        expect(RoundingStateMachine.canTransition(RoundStatus.PLANNED, RoundStatus.COMPLETED)).toBe(
          false,
        );
      });

      it('should not allow transition to PAUSED', () => {
        expect(RoundingStateMachine.canTransition(RoundStatus.PLANNED, RoundStatus.PAUSED)).toBe(
          false,
        );
      });
    });

    describe('from IN_PROGRESS', () => {
      it('should allow transition to PAUSED', () => {
        expect(
          RoundingStateMachine.canTransition(RoundStatus.IN_PROGRESS, RoundStatus.PAUSED),
        ).toBe(true);
      });

      it('should allow transition to COMPLETED', () => {
        expect(
          RoundingStateMachine.canTransition(RoundStatus.IN_PROGRESS, RoundStatus.COMPLETED),
        ).toBe(true);
      });

      it('should not allow transition to CANCELLED', () => {
        expect(
          RoundingStateMachine.canTransition(RoundStatus.IN_PROGRESS, RoundStatus.CANCELLED),
        ).toBe(false);
      });

      it('should not allow transition to PLANNED', () => {
        expect(
          RoundingStateMachine.canTransition(RoundStatus.IN_PROGRESS, RoundStatus.PLANNED),
        ).toBe(false);
      });
    });

    describe('from PAUSED', () => {
      it('should allow transition to IN_PROGRESS', () => {
        expect(
          RoundingStateMachine.canTransition(RoundStatus.PAUSED, RoundStatus.IN_PROGRESS),
        ).toBe(true);
      });

      it('should allow transition to COMPLETED', () => {
        expect(RoundingStateMachine.canTransition(RoundStatus.PAUSED, RoundStatus.COMPLETED)).toBe(
          true,
        );
      });

      it('should allow transition to CANCELLED', () => {
        expect(RoundingStateMachine.canTransition(RoundStatus.PAUSED, RoundStatus.CANCELLED)).toBe(
          true,
        );
      });

      it('should not allow transition to PLANNED', () => {
        expect(RoundingStateMachine.canTransition(RoundStatus.PAUSED, RoundStatus.PLANNED)).toBe(
          false,
        );
      });
    });

    describe('from COMPLETED', () => {
      it('should not allow any transitions', () => {
        expect(RoundingStateMachine.canTransition(RoundStatus.COMPLETED, RoundStatus.PLANNED)).toBe(
          false,
        );
        expect(
          RoundingStateMachine.canTransition(RoundStatus.COMPLETED, RoundStatus.IN_PROGRESS),
        ).toBe(false);
        expect(RoundingStateMachine.canTransition(RoundStatus.COMPLETED, RoundStatus.PAUSED)).toBe(
          false,
        );
        expect(
          RoundingStateMachine.canTransition(RoundStatus.COMPLETED, RoundStatus.CANCELLED),
        ).toBe(false);
      });
    });

    describe('from CANCELLED', () => {
      it('should not allow any transitions', () => {
        expect(RoundingStateMachine.canTransition(RoundStatus.CANCELLED, RoundStatus.PLANNED)).toBe(
          false,
        );
        expect(
          RoundingStateMachine.canTransition(RoundStatus.CANCELLED, RoundStatus.IN_PROGRESS),
        ).toBe(false);
        expect(RoundingStateMachine.canTransition(RoundStatus.CANCELLED, RoundStatus.PAUSED)).toBe(
          false,
        );
        expect(
          RoundingStateMachine.canTransition(RoundStatus.CANCELLED, RoundStatus.COMPLETED),
        ).toBe(false);
      });
    });
  });

  describe('validateTransition', () => {
    it('should not throw for valid transitions', () => {
      expect(() =>
        RoundingStateMachine.validateTransition(RoundStatus.PLANNED, RoundStatus.IN_PROGRESS),
      ).not.toThrow();

      expect(() =>
        RoundingStateMachine.validateTransition(RoundStatus.IN_PROGRESS, RoundStatus.COMPLETED),
      ).not.toThrow();
    });

    it('should throw InvalidStateTransitionException for invalid transitions', () => {
      expect(() =>
        RoundingStateMachine.validateTransition(RoundStatus.PLANNED, RoundStatus.COMPLETED),
      ).toThrow(InvalidStateTransitionException);

      expect(() =>
        RoundingStateMachine.validateTransition(RoundStatus.COMPLETED, RoundStatus.IN_PROGRESS),
      ).toThrow(InvalidStateTransitionException);
    });
  });

  describe('getValidTransitions', () => {
    it('should return valid transitions for PLANNED', () => {
      const transitions = RoundingStateMachine.getValidTransitions(RoundStatus.PLANNED);
      expect(transitions).toEqual([RoundStatus.IN_PROGRESS, RoundStatus.CANCELLED]);
    });

    it('should return valid transitions for IN_PROGRESS', () => {
      const transitions = RoundingStateMachine.getValidTransitions(RoundStatus.IN_PROGRESS);
      expect(transitions).toEqual([RoundStatus.PAUSED, RoundStatus.COMPLETED]);
    });

    it('should return valid transitions for PAUSED', () => {
      const transitions = RoundingStateMachine.getValidTransitions(RoundStatus.PAUSED);
      expect(transitions).toEqual([
        RoundStatus.IN_PROGRESS,
        RoundStatus.COMPLETED,
        RoundStatus.CANCELLED,
      ]);
    });

    it('should return empty array for COMPLETED', () => {
      const transitions = RoundingStateMachine.getValidTransitions(RoundStatus.COMPLETED);
      expect(transitions).toEqual([]);
    });

    it('should return empty array for CANCELLED', () => {
      const transitions = RoundingStateMachine.getValidTransitions(RoundStatus.CANCELLED);
      expect(transitions).toEqual([]);
    });
  });
});
