import {Aggregate, EventStore} from './eventsourcing';

describe('Aggregate', () => {
  it('should construct', () => {
    let aggr = new Aggregate(() => {});
  });

  it('can register event handlers', () => {
    let aggr = new Aggregate(() => {});

    let handler = () => {};

    aggr.event('test', handler);

    expect(aggr.handlers['test']).toBe(handler);
  });

  it('can apply one event', () => {
    let aggr = new Aggregate(() => {});

    let handler = jest.fn();

    aggr.event('test', handler);
    aggr.applyEvent('test', 123);

    expect(handler).toHaveBeenCalledWith(123);
  });

  it('can apply multiple events', () => {
    let aggr = new Aggregate(() => {});

    let handler1 = jest.fn();
    aggr.event('event1', handler1);

    let handler2 = jest.fn();
    aggr.event('event2', handler2);

    aggr.applyEvents([
      {type: 'event1', data: 'abc'},
      {type: 'event2', data: 'def'}
    ]);

    expect(handler1).toHaveBeenCalledWith('abc');
    expect(handler2).toHaveBeenCalledWith('def');
  });

  it('applies events in order', () => {
    let aggr = new Aggregate(() => {});

    let handler = jest.fn();
    aggr.event('event', handler);

    aggr.applyEvents([
      {type: 'event', data: 'first'},
      {type: 'event', data: 'second'}
    ]);

    expect(handler).toHaveBeenCalledWith('first');
    expect(handler).toHaveBeenLastCalledWith('second');
  });
});

describe('EventStore', () => {
  it('should construct', () => {
    let store = new EventStore(() => {});
  });

  it('can get an empty stream', () => {
    let store = new EventStore();

    let stream = store.getStream('board_abc123');
    expect(stream).toEqual([]);
  });

  it('can append to an empty stream', () => {
    let store = new EventStore();
    let ev = event('test', 'payload');

    store.appendStream('a_stream', [ev]);

    let stream = store.getStream('a_stream');

    expect(stream.length).toBe(1);
    expect(stream[0]).toBe(ev);
  });

  it('can append an empty batch', () => {
    let store = new EventStore();

    store.appendStream('a_stream', []);

    let stream = store.getStream('a_stream');

    expect(stream.length).toBe(0);
  });

  it('can append to an existing stream', () => {
    let store = new EventStore();

    store.appendStream('b_stream', [event('test', 'stuff')]);

    let ev = event('greeting', 'hello');

    store.appendStream('b_stream', [ev]);

    let stream = store.getStream('b_stream');

    expect(stream.length).toBe(2);
    expect(stream[1]).toBe(ev);
  });

  it('publishes stored events', () => {
    let publish = jest.fn();
    let store = new EventStore(() => {}, {publish: publish});

    let ev = event('test', 'hello');

    store.appendStream('test', [ev]);

    expect(publish).toHaveBeenCalledWith('test', 'hello');
    expect(publish).toHaveBeenCalledTimes(1);
  });

  it('publishes events in order', () => {
    let publish = jest.fn();
    let store = new EventStore(() => {}, {publish: publish});

    let ev1 = event('test', 'hello');
    let ev2 = event('hest', 'bomb');

    store.appendStream('test', [ev1, ev2]);

    expect(publish).toHaveBeenLastCalledWith('hest', 'bomb');
    expect(publish).toHaveBeenCalledTimes(2);
  });

  it('does nothing and throws if invalid events are present', () => {
    let publish = jest.fn();
    let store = new EventStore(() => {}, {publish: publish});

    let validEv = event('test', 'hello');
    let invalidEv = {hurr: 'durr'};

    expect(() => {
      store.appendStream('s', [validEv, invalidEv]);
    }).toThrow();

    expect(store.getStream('s').length).toBe(0);
    expect(publish).toHaveBeenCalledTimes(0);
  });

  it('can load an aggregate', () => {
    let store = new EventStore(() => {}, {publish: () => {}});

    let validEv = event('test', 'hello');
    store.appendStream('s', [validEv]);

    let handler = jest.fn();
    let aggr = new Aggregate(() => {});
    aggr.event('test', handler);

    store.loadAggregate('s', aggr);

    expect(handler).toHaveBeenCalledWith('hello');
  });

  function event(t, d) {
    return {
      type: t,
      data: d
    };
  }
});
