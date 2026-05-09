const { canTransition, getAllowedTransitions, VALID_TRANSITIONS } = require('../utils/stateMachine');

describe('State Machine', () => {
    describe('canTransition', () => {
        test('draft -> running is allowed', () => {
            expect(canTransition('draft', 'running')).toBe(true);
        });

        test('draft -> paused is NOT allowed', () => {
            expect(canTransition('draft', 'paused')).toBe(false);
        });

        test('draft -> ended is NOT allowed', () => {
            expect(canTransition('draft', 'ended')).toBe(false);
        });

        test('running -> paused is allowed', () => {
            expect(canTransition('running', 'paused')).toBe(true);
        });

        test('running -> ended is allowed', () => {
            expect(canTransition('running', 'ended')).toBe(true);
        });

        test('running -> draft is NOT allowed', () => {
            expect(canTransition('running', 'draft')).toBe(false);
        });

        test('paused -> running is allowed', () => {
            expect(canTransition('paused', 'running')).toBe(true);
        });

        test('paused -> ended is allowed', () => {
            expect(canTransition('paused', 'ended')).toBe(true);
        });

        test('paused -> draft is NOT allowed', () => {
            expect(canTransition('paused', 'draft')).toBe(false);
        });

        test('ended -> anything is NOT allowed', () => {
            expect(canTransition('ended', 'draft')).toBe(false);
            expect(canTransition('ended', 'running')).toBe(false);
            expect(canTransition('ended', 'paused')).toBe(false);
        });

        test('unknown status returns false', () => {
            expect(canTransition('nonexistent', 'running')).toBe(false);
        });
    });

    describe('getAllowedTransitions', () => {
        test('draft can transition to [running]', () => {
            expect(getAllowedTransitions('draft')).toEqual(['running']);
        });

        test('running can transition to [paused, ended]', () => {
            expect(getAllowedTransitions('running')).toEqual(['paused', 'ended']);
        });

        test('paused can transition to [running, ended]', () => {
            expect(getAllowedTransitions('paused')).toEqual(['running', 'ended']);
        });

        test('ended has no transitions', () => {
            expect(getAllowedTransitions('ended')).toEqual([]);
        });

        test('unknown status returns empty array', () => {
            expect(getAllowedTransitions('invalid')).toEqual([]);
        });
    });

    describe('completeness', () => {
        test('all four statuses are defined', () => {
            expect(Object.keys(VALID_TRANSITIONS).sort()).toEqual(
                ['draft', 'ended', 'paused', 'running']
            );
        });
    });
});
