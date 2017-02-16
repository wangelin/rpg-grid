class EventStore {
  constructor(log, bus) {
    this.log = log;
    this.bus = bus;
    this.streams = {};
  }

  getStream(streamId) {
    if (this.streams.hasOwnProperty(streamId)) {
      this.log('Creating stream', streamId);
      this.streams[streamId] = [];
    }

    return this.streams[streamId];
  }

  appendStream(streamId, events) {
    let stream = this.getStream(streamId);

    this.log(`Appending ${events.length} events to stream`, streamId);
    for (let ev in events) {
      stream.push(ev);
      this.bus.publish(ev.type, ev.data);
    }
  }
}

class Aggregate {
  constructor(log) {
    if (new.target === Aggregate) {
      throw 'Extend Aggregate to use it';
    }

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
    let handler = this.handlers[evType];

    if (handler) {
      this.log(`Appending event of type ${evType}`);
      handler.apply(this, evData);
    } else {
      this.log(`Skipping event of type ${evType}`);
    }
  }
}

class CommandHandler {
  constructor(log, eventStore) {
    if (new.target === CommandHandler) {
      throw 'Extend CommandHandler to use it';
    }
    this.log = log;
    this.eventStore = eventStore;
  }

  handle(command) {
    throw 'Override me';
  }
}

export {EventStore, Aggregate, CommandHandler};
