import BoardStream from './bus.js'

it('dispatches published events', () => {
  var board = new BoardStream(() => {}, 'board')

  var clientAddedReceived = false
  var clientRemovedReceived = false
  var objectAddedReceived = false
  var objectGrabbedReceived = false
  var objectDroppedReceived = false
  var objectRemovedReceived = false
  var client = {
    id: 1,
    onClientAdded: (ev) => clientAddedReceived = true,
    onClientRemoved: (ev) => clientRemovedReceived = true,
    onObjectAdded: (ev) => objectAddedReceived = true,
    onObjectGrabbed: (ev) => objectGrabbedReceived = true,
    onObjectDropped: (ev) => objectDroppedReceived = true,
    onObjectRemoved: (ev) => objectRemovedReceived = true
  }

  board.clientAdded(client)
  board.objectAdded(1, 'horse', 3, 5)
  board.objectGrabbed(2, 'horse')
  board.objectDropped('horse', 7, 5)
  board.objectRemoved(1, 'horse')
  board.clientRemoved(5)

  expect(clientAddedReceived).toEqual(true)
  expect(clientRemovedReceived).toEqual(true)
  expect(objectAddedReceived).toEqual(true)
  expect(objectGrabbedReceived).toEqual(true)
  expect(objectDroppedReceived).toEqual(true)
  expect(objectRemovedReceived).toEqual(true)
})

it('can remove clients', () => {
  var board = new BoardStream(() => {}, 'board')

  var clientAddedReceived = false
  var objectAddedReceived = false
  var clientRemovedReceived = false

  board.clientAdded({
    id: 3,
    onClientAdded: (ev) => clientAddedReceived = true,
    onObjectAdded: (ev) => objectAddedReceived = true,
    onClientRemoved: (ev) => clientRemovedReceived = true
  })

  board.clientRemoved(3)

  board.objectAdded(5, {})

  expect(clientAddedReceived).toEqual(true)
  expect(clientRemovedReceived).toEqual(false)
  expect(objectAddedReceived).toEqual(false)
})
