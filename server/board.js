import {Aggregate} from './eventsourcing';

class BoardState {
  constructor(width, height, initializer) {
    this.width = width;
    this.height = height;
    this.data = [];
    for (let i = 0, len = width * height; i < len; ++i) {
      this.data[i] = initializer();
    }
  }

  setTile(x, y, val) {
    this.data[y * this.width + x] = val;
  }

  getTile(x, y) {
    return this.data[y * this.width + x];
  }
}

class BoardAggregate extends Aggregate {
  constructor(log) {
    super(log);
    this.event('board.created', this.onCreated);
    this.event('board.client_added', this.onClientAdded);
    this.event('board.client_removed', this.onClientRemoved);
    this.event('board.object_added', this.onObjectAdded);
    this.event('board.object_removed', this.onObjectRemoved);
    this.event('board.object_grabbed', this.onObjectGrabbed);
    this.event('board.object_dropped', this.onObjectDropped);
    this.clients = {};
  }

  onCreated(ev) {
    this.boardId = ev.boardId;
    this.state = new BoardState(ev.width, ev.height, () => [0, 0]);
  }

  onClientAdded(ev) {
    this.clients[ev.clientId] = true;
  }

  onClientRemoved(ev) {
    this.clients[ev.clientId] = false;
  }

  onObjectAdded(ev) {
  }

  onObjectRemoved(ev) {
  }

  onObjectGrabbed(ev) {
  }

  onObjectDropped(ev) {
  }
}

export default BoardAggregate;
