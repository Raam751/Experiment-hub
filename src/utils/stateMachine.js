/**
 * Experiment status state machine.
 * Enforces valid transitions: draft → running → paused ↔ running → ended
 */

const VALID_TRANSITIONS = {
    draft: ['running'],
    running: ['paused', 'ended'],
    paused: ['running', 'ended'],
    ended: [] // terminal state — no transitions allowed
};

function canTransition(currentStatus, newStatus) {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed) return false;
    return allowed.includes(newStatus);
}

function getAllowedTransitions(currentStatus) {
    return VALID_TRANSITIONS[currentStatus] || [];
}

module.exports = {
    VALID_TRANSITIONS,
    canTransition,
    getAllowedTransitions
};
