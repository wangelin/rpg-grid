import {BoardAggregate, BoardState} from './board';

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

    expect(aggr.clients[5]).toBe(true);

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
    expect(aggr.clients[1]).toBe(true);
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
        expect(state.getTile(y, x)).toEqual('grass');
      }
    }
  });

  it('can use coordinates in initializer', () => {
    let state = new BoardState(2, 2, (x, y) => { return {x: x, y: y}; });

    expect(state.getTile(1, 0)).toEqual({x: 1, y: 0});
  });

  it('can get tile in state', () => {
    let state = new BoardState(1, 1, () => 'a');
    expect(state.getTile(0, 0)).toBe('a');
  });

  it('can set tile in state', () => {
    let state = new BoardState(2, 2, () => 'rock');
    state.setTile(0, 1, 'roll');
    expect(state.getTile(0, 1)).toEqual('roll');
  });
});
