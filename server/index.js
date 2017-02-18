import {EventStore} from './eventsourcing';
import {BoardAggregate} from './board';
import {CreateBoardCommandHandler} from './board.commands';

const io = require('socket.io')()

class Entity {
  constructor ({ x, y, hp, damage = 0 }) {
    this.x = x
    this.y = y
    this.hp = hp
    this.damage = damage
  }
}

class Enemy extends Entity {
  constructor ({ x, y, hp }) {
    super({ x, y, hp })
  }
}

class Character extends Entity {
  constructor ({ x, y, hp }) {
    super({ x, y, hp })
  }
}

const clients = {}

const gridSnapshots = []
const grid = {
  size: 64,
  space: 10,
  width: 15,
  height: 10,
  enemies: [],
  characters: []
}

let log = console.log;
let publisher = {publish: () => {}};
let eventStore = new EventStore(log, publisher);

let createBoardCommandHandler = new CreateBoardCommandHandler(log, eventStore);

createBoardCommandHandler.execute({
  clientId: 1,
  requestId: 'something',
  width: 10,
  height: 10
});

let aggregate = eventStore.loadAggregate(new BoardAggregate());

console.log('aggregate created', aggregate.created);

const clamp = (n, min, max) => {
  if (min > max) [min, max] = [max, min]
  return n < min ? min : n > max ? max : n
}

const getXPosition = x => {
  const { size, space, width } = grid
  const xPosition = Math.floor(x / (size + space))
  return x > xPosition * (size + space) + size
    ? -1 : xPosition < 0 ? -1 : xPosition > width - 1 ? -1 : xPosition
}
const getYPosition = y => {
  const { size, space, height } = grid
  const yPosition = Math.floor(y / (size + space))
  return y > yPosition * (size + space) + size
    ? -1 : yPosition < 0 ? -1 : yPosition > height - 1 ? -1 : yPosition
}
const getXCoordinate = x => x * (grid.size + grid.space)
const getYCoordinate = y => y * (grid.size + grid.space)

const isEmpty = (x, y) => [...grid.enemies, ...grid.characters]
  .filter(entity => entity.x === x && entity.y === y).length === 0

const getEntity = (x, y) => [...grid.enemies, ...grid.characters]
    .find(entity => entity.x === x && entity.y === y)

const damage = data => {
  const x = getXPosition(data.x)
  const y = getYPosition(data.y)
  const damage = parseInt(data.value, 10)
  if (isNaN(damage)) return
  const entity = getEntity(x, y)
  if (!entity) return
  entity.damage += damage
}

const cure = data => {
  const x = getXPosition(data.x)
  const y = getYPosition(data.y)
  const cure = parseInt(data.value, 10)
  if (isNaN(cure)) return
  const entity = getEntity(x, y)
  if (!entity) return
  entity.damage -= cure
}

const addEntity = (className, data) => {
  const x = getXPosition(data.x)
  const y = getYPosition(data.y)
  if (x === -1 || y === -1) return
  const { hp = 10 } = data
  if (isEmpty(x, y)) {
    if (className === Enemy) grid.enemies.push(new className({ x, y, hp }))
    if (className === Character) grid.characters.push(new className({ x, y, hp }))
  }
}

io.on('connection', client => {
  console.log('client connected')
  clients[client.id] = {}
  client.on('mousedown', data => {
    clients[client.id].mousedown = true
    const x = getXPosition(data.x)
    const y = getYPosition(data.y)

    for (const entity of [...grid.enemies, ...grid.characters]) {
      if (entity.x === x && entity.y === y) {
        clients[client.id].floating = {
          entity,
          x: data.x,
          y: data.y,
          offsetX: getXCoordinate(x) + grid.size / 2 - data.x,
          offsetY: getYCoordinate(y) + grid.size / 2 - data.y
        }
      }
    }
    io.emit('update', { clients, grid })
  })

  client.on('init', () => {
    io.emit('init', { clients, grid })
  })

  client.on('mouseup', data => {
    clients[client.id].mousedown = false
    if (clients[client.id].floating) {
      const x = getXPosition(data.x)
      const y = getYPosition(data.y)
      clients[client.id].floating.entity.x = x
      clients[client.id].floating.entity.y = y
    }
    clients[client.id].floating = null
    io.emit('update', { clients, grid })
  })

  client.on('mousemove', data => {
    const { x, y } = data
    clients[client.id].x = x
    clients[client.id].y = y
    io.emit('update', { clients, grid })
  })

  client.on('data', data => {
    for (const key of Object.keys(data)) {
      switch (key) {
        case 'width':
        case 'height':
          const num = parseInt(data[key], 10)
          if (!isNaN(num)) grid[key] = num
          io.emit('update', { grid })
      }
    }
  })

  client.on('add-character', data => { addEntity(Character, data)})

  client.on('add-enemy', data => { addEntity(Enemy, data)})

  client.on('damage', damage)

  client.on('cure', cure)

  client.on('disconnect', () => {
    delete clients[client.id]
    console.log('client disconnected')
  })
})

const port = process.env.PORT || 3001
io.listen(port)

console.log(`Listening on port ${port}...`)
