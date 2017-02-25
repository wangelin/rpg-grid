const io = require('socket.io')()

import Player from '../src/js/Player'
import Enemy from '../src/js/Enemy'
import { uniqueId } from 'lodash'

const clients = {}

const gridSnapshots = []
const grid = {
  size: 256,
  space: 0,
  width: 16,
  height: 9,
  layers: [
    {
      tileSet: 'dungeon',
      tileData: [
    //      1              2          3          4           5           6           7           8             9           10          11             12         13         14         15          16
    /* 1 */ [0, 13, 0, 1], [0, 5, 1], [0, 4, 0], [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 5, 0, 2], [0, 14, 0], [0, 14, 0], [0, 13, 0, 1], [0, 5, 1], [0, 5, 1], [0, 5, 1], [0, 5, 1],  [0, 5, 1],
    /* 2 */ [0, 4, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 4, 1],    [0, 5, 1],  [0, 5, 1],  [0, 4, 0],     [1, 2, 3], [1, 3, 1], [1, 3, 1], [1, 2, 1],  [0, 0, 0],
    /* 3 */ [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],
    /* 4 */ [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 4, 2],  [0, 4, 3],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],
    /* 5 */ [0, 0, 0],     [0, 0, 0], [0, 4, 2], [0, 11, 1], [0, 4, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [1, 2, 3], [1, 3, 1], [1, 3, 1], [1, 2, 1],  [0, 0, 0],
    /* 6 */ [0, 0, 0],     [0, 0, 0], [0, 4, 1], [0, 4, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],
    /* 7 */ [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 1, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],
    /* 8 */ [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [0, 0, 0], [0, 1, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],
    /* 9 */ [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],
      ]
    }
  ],
  tileSet: 'dungeon_gray_001.png',
  tileSize: 256,
  tileData: [
//      1              2          3          4           5           6           7           8             9           10          11             12         13         14         15          16
/* 1 */ [0, 13, 0, 1], [0, 5, 1], [0, 4, 0], [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 5, 0, 2], [0, 14, 0], [0, 14, 0], [0, 13, 0, 1], [0, 5, 1], [0, 5, 1], [0, 5, 1], [0, 5, 1],  [0, 5, 1],
/* 2 */ [0, 4, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 4, 1],    [0, 5, 1],  [0, 5, 1],  [0, 4, 0],     [1, 2, 3], [1, 3, 1], [1, 3, 1], [1, 2, 1],  [0, 0, 0],
/* 3 */ [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],
/* 4 */ [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 4, 2],  [0, 4, 3],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],
/* 5 */ [0, 0, 0],     [0, 0, 0], [0, 4, 2], [0, 11, 1], [0, 4, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [1, 2, 3], [1, 3, 1], [1, 3, 1], [1, 2, 1],  [0, 0, 0],
/* 6 */ [0, 0, 0],     [0, 0, 0], [0, 4, 1], [0, 4, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],
/* 7 */ [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 1, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],
/* 8 */ [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [0, 0, 0], [0, 1, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],
/* 9 */ [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],  [0, 0, 0],    [0, 0, 0],  [0, 0, 0],  [0, 0, 0],     [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],  [0, 0, 0],
  ]
}
const enemies = []
const players = []

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

const isEmpty = (x, y) => [...enemies, ...players]
  .filter(entity => entity.x === x && entity.y === y).length === 0

const getEntity = (x, y) => [...enemies, ...players]
    .find(entity => entity.x === x && entity.y === y)

const damage = data => {
  const x = getXPosition(data.x)
  const y = getYPosition(data.y)
  const damage = parseInt(data.value, 10)
  if (isNaN(damage)) return
  const entity = getEntity(x, y)
  if (!entity) return
  entity.damage += damage
  if (entity instanceof Player) io.emit('update', { players })
  if (entity instanceof Enemy) io.emit('update', { enemies })
}

const deleteEntity = data => {
  const x = getXPosition(data.x)
  const y = getYPosition(data.y)
  const entity = getEntity(x, y)
  if (!entity) return
  if (entity instanceof Player) {
    const index = players.findIndex(player => player.id === entity.id)
    return players.splice(index, 1)[0]
  }
  if (entity instanceof Enemy) {
    const index = enemies.findIndex(enemy => enemy.id === entity.id)
    return enemies.splice(index, 1)[0]
  }
}

const cure = data => {
  const x = getXPosition(data.x)
  const y = getYPosition(data.y)
  const cure = parseInt(data.value, 10)
  if (isNaN(cure)) return
  const entity = getEntity(x, y)
  if (!entity) return
  entity.damage -= cure
  if (entity instanceof Player) io.emit('update', { players })
  if (entity instanceof Enemy) io.emit('update', { enemies })
}

const addEntity = (className, data) => {
  const x = getXPosition(data.x)
  const y = getYPosition(data.y)
  if (x === -1 || y === -1) return
  if (isEmpty(x, y)) {
    if (className === Enemy) enemies.push(new Enemy({ x, y, id: uniqueId(), ...data.enemy }))
    if (className === Player) players.push(new Player({ x, y, id: uniqueId(), ...data.player }))
    return true
  }
  return false
}

io.on('connection', client => {
  console.log(`client connected: ${client.id}`)
  clients[client.id] = {}
  client.on('mousedown', data => {
    clients[client.id].mousedown = true
    const x = getXPosition(data.x)
    const y = getYPosition(data.y)

    let clickedEntity
    for (const entity of [...enemies, ...players]) {
      if (entity.x === x && entity.y === y) {
        clickedEntity = entity
        clients[client.id].floating = {
          entity,
          x: data.x,
          y: data.y,
          offsetX: getXCoordinate(x) + grid.size / 2 - data.x,
          offsetY: getYCoordinate(y) + grid.size / 2 - data.y
        }
        break
      }
    }
    io.emit('update', Object.assign(
      { clients },
      clickedEntity && clickedEntity.constructor === Player && { players },
      clickedEntity && clickedEntity.constructor === Enemy && { enemies }
    ))
  })

  client.on('init', () => {
    client.emit('id-assign', { id: client.id })
    io.emit('init', { clients, grid, enemies, players })
  })

  client.on('mouseup', data => {
    clients[client.id].mousedown = false
    if (clients[client.id].floating) {
      const x = getXPosition(data.x)
      const y = getYPosition(data.y)
      const entity = clients[client.id].floating.entity
      entity.x = x
      entity.y = y
      clients[client.id].floating = null
      io.emit('update', Object.assign(
        { clients },
        entity.constructor === Player && { players },
        entity.constructor === Enemy && { enemies }
      ))
    } else {
      io.emit('update', { clients })
    }
  })

  client.on('mousemove', data => {
    const { x, y } = data
    clients[client.id].x = x
    clients[client.id].y = y
    io.emit('update', { clients })
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

  client.on('add-player', data => {
    if (addEntity(Player, data)) io.emit('update', { players })
  })

  client.on('add-enemy', data => {
    if (addEntity(Enemy, data)) io.emit('update', { enemies })
  })

  client.on('delete', data => {
    const entity = deleteEntity(data)
    if (entity instanceof Player) io.emit('update', { players })
    if (entity instanceof Enemy) io.emit('update', { enemies })
  })

  client.on('cure', cure)
  client.on('damage', damage)

  client.on('disconnect', () => {
    delete clients[client.id]
    console.log('client disconnected')
  })
})

const port = process.env.PORT || 3001
io.listen(port)

console.log(`Listening on port ${port}...`)
