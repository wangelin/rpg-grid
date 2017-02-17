import {BoardAggregate, BoardState, BoardObject, BoardCell} from './board';

describe('BoardAggregate', () => {
  it('can create board', () => {
    let aggr = newCreatedBoard('abc123');

    expect(aggr.boardId).toEqual('abc123');
  });

  it('create initializes board state', () => {
    let aggr = newCreatedBoard(null, 8, 12);
    let state = aggr.state;

    expect(state.width).toBe(8);
    expect(state.height).toBe(12);
  });

  it('stores known clients', () => {
    let aggr = newCreatedBoard();

    expect(aggr.clients[5]).toBeFalsy();

    aggr.applyEvents([
      {
        type: 'board.client_added',
        data: {
          clientId: 5
        }
      }
    ]);

    expect(aggr.clients[5]).toBeTruthy();

    aggr.applyEvents([
      {
        type: 'board.client_added',
        data: {
          clientId: 1
        }
      },
      {
        type: 'board.client_removed',
        data: {
          clientId: 5
        }
      }
    ]);

    expect(aggr.clients[5]).toBeFalsy();
    expect(aggr.clients[1]).toBeTruthy();
  });

  function newCreatedBoard(id, w, h) {
    let aggregate = new BoardAggregate(() => {});

    aggregate.applyEvents([
      {
        type: 'board.created',
        data: {
          boardId: id || 'abc123',
          width: w || 10,
          height: h || 10
        }
      }
    ]);

    return aggregate;
  }
});

describe('BoardState', () => {
  it('should construct with default tile value', () => {
    let state = new BoardState(3, 4, () => 'grass');

    expect(state.width).toBe(3);
    expect(state.height).toBe(4);

    for (let y = 0; y < state.height; ++y) {
      for (let x = 0; x < state.width; ++x) {
        expect(state.getCell(y, x).terrain).toEqual('grass');
      }
    }
  });

  it('can use coordinates in initializer', () => {
    let state = new BoardState(2, 2, (x, y) => { return {x: x, y: y}; });

    expect(state.getCell(1, 0).terrain).toEqual({x: 1, y: 0});
  });

  it('can get cell terrain', () => {
    let state = new BoardState(1, 1, () => 'a');
    expect(state.getCell(0, 0).terrain).toBe('a');
  });

  it('can set cell terrain', () => {
    let state = new BoardState(2, 2, () => 'rock');
    state.setCellTerrain(0, 1, 'roll');
    expect(state.getCell(0, 1).terrain).toEqual('roll');
  });
});

describe('BoardObject', () => {
  it('should construct', () => {
    let obj = {apa: 'toa'};
    let bo = new BoardObject(1, obj, {x: 1, y: 2});
    expect(bo.objectId).toBe(1);
    expect(bo.position).toEqual({x: 1, y: 2});
    expect(bo.object).toBe(obj);
  });

  it('can be moved', () => {
    let obj = {apa: 'toa'};
    let bo = new BoardObject(1, obj, {x: 1, y: 2});

    bo.move(3, 1);

    expect(bo.position).toEqual({x: 3, y: 1});
  });
});

describe('BoardCell', () => {
  it('should construct', () => {
    let cell = new BoardCell('grass');
    expect(cell.terrain).toBe('grass');
    expect(cell.objects).toEqual([]);
  });

  it('can contain objects', () => {
    let cell = new BoardCell('grass');
    cell.addObject(5);
    expect(cell.objects).toEqual([5]);
    expect(cell.containsObject(5)).toBe(true);
  });

  it('can have contained objects removed', () => {
    let cell = new BoardCell('terrain');
    cell.addObject(2);
    cell.addObject(3);
    cell.addObject(1);
    cell.removeObject(3);
    expect(cell.objects).toEqual([2, 1]);
  });

  it('can only contain an object once', () => {
    let cell = new BoardCell('once');
    cell.addObject(6);
    cell.addObject(6);
    expect(cell.objects).toEqual([6]);
  });

  it('allows attempts to remove not contained object', () => {
    let cell = new BoardCell('terrain');
    cell.removeObject(3);
    expect(cell.objects).toEqual([]);
  });
});
