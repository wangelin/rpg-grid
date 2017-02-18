/**
 * EventStore is an interface for storing event streams.  At the moment it
 * strictly resides in-memory with the events stored as an array.  In the
 * future it should be extended to store events in some storage such as
 * GetEventStore.
 **/
class EventStore {
  constructor(log, bus) {
    this.log = log || (() => {});
    this.bus = bus || {publish: () => {}};
    this.streams = {};
  }

  /**
   * Fetches all events in a stream.  If the stream doesn't exist,
   * an empty stream is returned.  Do not mutate the returned array
   * since this is implemented in a very naive fashion at the moment.
   **/
  getStream(streamId) {
    if (!this.streams.hasOwnProperty(streamId)) {
      this.log('Creating stream', streamId);
      this.streams[streamId] = [];
    }

    return this.streams[streamId];
  }

  /**
   * Loads an aggregate by loading a stream and applying all the events
   * from the stream on the aggregate.
   **/
  loadAggregate(streamId, aggregate) {
    let stream = this.getStream(streamId);
    aggregate.applyEvents(stream);
    return aggregate;
  }

  /**
   * Appends events to a stream.  Each event is validated before storing
   * and if any event is invalid, none of them are commited.
   **/
  appendStream(streamId, events) {
    let stream = this.getStream(streamId);
    this.log(`Appending ${events.length} events to stream`, streamId);
    for (let ev of events) {
      if (!this.validateEvent(ev)) {
        throw `Attempted to store invalid event: ${ev}`;
      }
    }
    for (let ev of events) {
      stream.push(ev);
      this.bus.publish(ev.type, ev.data);
    }
  }

  /**
   * Validates an event.  Currently the only requirements the events
   * need to fill are:
   *
   * - The event needs to have a type property that is a string
   *   with a length over zero
   *
   * - The event needs to have a data property that is not undefined
   *   with non-null data since JSON does not support null and undefined
   **/
  validateEvent(event) {
    if (!event) {
      return false;
    }

    if (typeof event.type !== 'string' || event.type.length === 0) {
      return false;
    }

    if (typeof event.data === 'undefined' || event.data === null) {
      return false;
    }

    return true;
  }
}

/**
 * Aggregate is the base class for aggregates.  Aggregates can either be
 * implemented by inheriting from this class or by instantiating the aggregate
 * and adding event handlers.
 *
 * When events are applied, `this` will always be bound to the aggregate.
 * If this makes you sad, bind your event handlers to whatever object you want
 * before registering them.
 **/
class Aggregate {
  constructor(log) {
    this.log = log;
    this.handlers = {};
  }

  /**
   * Registers that this aggregate handles the event `evType`.  Aggregates do
   * not need to handle all events in a stream.  Unhandled events are ignored.
   *
   * `handler` is a function that takes one argument, the event data.
   **/
  event(evType, handler) {
    this.log(`Registering event handler for ${evType}`);
    this.handlers[evType] = handler;
  }

  /**
   * Applies a collection event to the aggregate.
   **/
  applyEvents(events) {
    for (let ev of events) {
      let evType = ev.type;
      let evData = ev.data;

      this.applyEvent(evType, evData);
    }
  }

  /**
   * Applies an event to the aggregate.
   **/
  applyEvent(evType, evData) {
    this.log(this.handlers);
    let handler = this.handlers[evType];

    if (handler) {
      this.log(`Applying event of type ${evType}`);
      handler.apply(this, [evData]);
    } else {
      this.log(`Skipping event of type ${evType}`);
    }
  }
}

export {EventStore, Aggregate};
