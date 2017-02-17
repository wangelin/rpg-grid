import {Aggregate} from './eventsourcing';

class BoardAggregate extends Aggregate {
  constructor(log) {
    super(log);
    this.event('board.created', this.onCreated);
    this.event('board.client_added', this.onClientAdded);
    this.event('board.client_removed', this.onClientRemoved);
    this.event('board.object_added', this.onObjectAdded);
    this.event('board.object_removed', this.onObjectRemoved);
    this.event('board.object_grabbed', this.onObjectGrabbed);
    this.event('board.object_moved', this.onObjectMoved);
    this.clients = {};
    this.objects = {};
  }

  onCreated(ev) {
    this.boardId = ev.boardId;
    this.state = new BoardState(ev.width, ev.height, () => [0, 0]);
  }

  onClientAdded(ev) {
    this.clients[ev.clientId] = {};
  }

  onClientRemoved(ev) {
    this.clients[ev.clientId] = null;
  }

  onObjectAdded(ev) {
    let objectId = ev.objectId;
    let object = ev.object;
    let position = ev.position;

    let boardObject = new BoardObject(object);
    let cell = this.state.getCell(position.x, position.y);

    this.objects[objectId] = boardObject;
    cell.addObject(objectId);
    boardObject.addReference(cell);
  }

  onObjectRemoved(ev) {
    let objectId = ev.objectId;
    let boardObject = this.objects[objectId];

    this.objects[objectId] = null;

    boardObject.remove();
  }

  onObjectGrabbed(ev) {
    let objectId = ev.objectId;
    let clientId = ev.clientId;

    this.log(`${clientId} grabbed ${objectId}`);
  }

  onObjectMoved(ev) {
    let objectId = ev.objectId;
    let clientId = ev.clientId;

    this.log(`${clientId} moved ${objectId} to ${position.x}, ${position.y}`);

    let boardObject = this.objects[objectId];

    let currentPosition = boardObject.position;
    let currentCell = this.state.getCell(currentPosition.x, currentPosition.y);

    let newPosition = ev.position;
    let newCell = this.state.getCell(position.x, position.y);

    currentCell.removeObject(objectId);
    newCell.addObject(objectId);
    boardObject.move(newPosition.x, newPosition.y);
  }
}

class BoardState {
  constructor(width, height, terrainInitializer) {
    this.width = width;
    this.height = height;
    this.cells = [];

    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < height; ++x) {
        this.cells[height * y + x] = new BoardCell(terrainInitializer(x, y));
      }
    }
  }

  setCellTerrain(x, y, val) {
    this.cells[y * this.width + x].terrain = val;
  }

  getCell(x, y) {
    return this.cells[y * this.width + x];
  }
}

class BoardObject {
  constructor(objectId, obj, position) {
    this.objectId = objectId;
    this.object = obj;
    this.position = position;
  }

  move(x, y) {
    this.position = {x: x, y: y};
  }
}

class BoardCell {
  constructor(terrain) {
    this.terrain = terrain;
    this.objects = [];
  }

  containsObject(objectId) {
    return this.objects.indexOf(objectId) > -1;
  }

  addObject(objectId) {
    if (this.containsObject(objectId)) {
      return;
    }

    this.objects.push(objectId);
  }

  removeObject(objectId) {
    let index = this.objects.indexOf(objectId);

    if (index < 0) {
      return;
    }

    this.objects.splice(index, 1);
  }
}

export {BoardAggregate, BoardState, BoardCell, BoardObject};
