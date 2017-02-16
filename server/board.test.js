import BoardAggregate from './board';

it('can_create_board', () => {
  let aggregate = new BoardAggregate(console.log);

  aggregate.applyEvents([
    {
      type: 'board.created',
      data: {
        boardId: 'abc123',
        width: 10,
        height: 10
      }
    }
  ]);

  expect(aggregate.boardId).toEqual('abc123');
});

it('initializes board state', () => {

});

it('stores known clients', () => {
});
