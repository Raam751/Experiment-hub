const eventRepository = require('../repositories/event.repository');

/**
 * Log a single event or a batch of events.
 * Accepts either a single event object or an array.
 */
async function logEvents(input) {
    // Normalize: if single event, wrap in array
    const events = Array.isArray(input) ? input : [input];

    // Validate all events
    for (const event of events) {
        if (!event.experiment_id || !event.variant_id || !event.user_id || !event.type) {
            const error = new Error('Each event requires: experiment_id, variant_id, user_id, type');
            error.status = 400;
            throw error;
        }
        if (!['exposure', 'conversion'].includes(event.type)) {
            const error = new Error(`Invalid event type: '${event.type}'. Must be 'exposure' or 'conversion'`);
            error.status = 400;
            throw error;
        }
    }

    // Single event → simple insert; batch → bulk insert
    if (events.length === 1) {
        const e = events[0];
        return await eventRepository.createOne(e.experiment_id, e.variant_id, e.user_id, e.type);
    }

    return await eventRepository.createBatch(events);
}

module.exports = {
    logEvents
};
