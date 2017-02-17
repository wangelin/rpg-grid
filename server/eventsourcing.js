class EventStore {
  constructor(log, bus) {
    this.log = log || (() => {});
    this.bus = bus || {publish: () => {}};
    this.streams = {};
  }

  getStream(streamId) {
    if (!this.streams.hasOwnProperty(streamId)) {
      this.log('Creating stream', streamId);
      this.streams[streamId] = [];
    }

    return this.streams[streamId];
  }

  loadAggregate(streamId, aggregate) {
    let stream = this.getStream(streamId);
    aggregate.applyEvents(stream);
    return aggregate;
  }

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

class Aggregate {
  constructor(log) {
    this.log = log;
    this.handlers = {};
  }

  event(evType, handler) {
    this.log(`Registering event handler for ${evType}`);
    this.handlers[evType] = handler;
  }

  applyEvents(events) {
    for (let ev of events) {
      let evType = ev.type;
      let evData = ev.data;

      this.applyEvent(evType, evData);
    }
  }

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

class CommandHandler {
  constructor(log) {
    this.log = log;
  }

  execute(command) {
    throw 'Override me';
  }
}

export {EventStore, Aggregate, CommandHandler};
