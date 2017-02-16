import BoardAggregate from './board';

it('can_create_board', () => {
  let aggr = newCreatedBoard('abc123');

  expect(aggr.boardId).toEqual('abc123');
});

it('create initializes board state', () => {
  let aggr = newCreatedBoard(null, 8, 12);
  let state = aggr.state;

  expect(state.width).toBe(8);
  expect(state.height).toBe(12);

  for (let y = 0; y < state.height; ++y) {
    for (let x = 0; x < state.width; ++x) {
      expect(state.getTile(y, x)).toEqual([0, 0]);
    }
  }
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

it('can set tile in state', () => {
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
