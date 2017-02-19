const io = require('socket.io')()

import Player from './js/Player'
import Enemy from './js/Enemy'

const clients = {}

const gridSnapshots = []
const grid = {
  size: 128,
  space: 0,
  width: 16,
  height: 9,
  tileSet: 'dungeon_gray_001.png',
  tileSize: 256,
  tileData: [
    [0, 13, 0, 1], [0, 5, 1], [0, 4, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 5, 0, 2], [0, 14, 0], [0, 14, 0], [0, 13, 0, 1], [0, 5, 1], [0, 5, 1], [0, 5, 1], [0, 5, 1],
    [1, 14, 0], [1, 14, 0], [1, 14, 0], [1, 14, 0], [1, 14, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
    [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 14, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 14, 0], [1, 14, 0], [1, 14, 0], [1, 14, 0], [1, 14, 0], [0, 0, 0],
    [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 14, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 14, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 14, 0], [0, 0, 0],
    [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 14, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 14, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 14, 0], [1, 14, 0],
    [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 14, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 14, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
    [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 14, 0], [1, 14, 0], [1, 14, 0], [1, 14, 0], [1, 14, 0], [1, 14, 0], [1, 14, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
    [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
    [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
  ],
  enemies: [],
  players: []
}

const clamp = (n, min, max) => {
  if (min > max) [min, max] = [max, min]
  return n < min ? min : n > max ? max : n
}

const between = (n, min, max) => n >= min && n <= max

const getXPosition = x => {
  const { size, space, width } = grid
  const xPosition = Math.floor((x + space / 2) / (size + space))
  if (between(x, -space, 0)) {
    return 0
  } else if (between(x - (size + space) * width)) {
    return width - 1
  } else {
    return xPosition
  }
}
const getYPosition = y => {
  const { size, space, height } = grid
  const yPosition = Math.floor((y + space / 2) / (size + space))
  if (between(y, -space, 0)) {
    return 0
  } else if (between(y - (size + space) * height)) {
    return height - 1
  } else {
    return yPosition
  }
}
const getXCoordinate = x => x * (grid.size + grid.space)
const getYCoordinate = y => y * (grid.size + grid.space)

const isEmpty = (x, y) => [...grid.enemies, ...grid.players]
  .filter(entity => entity.x === x && entity.y === y).length === 0

const getEntity = (x, y) => [...grid.enemies, ...grid.players]
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
    if (className === Player) grid.players.push(new className({ x, y, hp }))
  }
}

io.on('connection', client => {
  console.log('client connected')
  clients[client.id] = {}
  client.on('mousedown', data => {
    clients[client.id].mousedown = true
    const x = getXPosition(data.x)
    const y = getYPosition(data.y)

    for (const entity of [...grid.enemies, ...grid.players]) {
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

  client.on('add-player', data => { addEntity(Player, data)})

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
