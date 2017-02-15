const io = require('socket.io')()

const clients = {}
const grid = {
  size: 64,
  space: 10,
  width: 25,
  height: 15,
  enemies: [{ x: 7, y: 3 }, { x: 9, y: 9 }]
}

const getXPosition = x => Math.floor((x - grid.space / 2) / (grid.size + grid.space))
const getYPosition = y => Math.floor((y - grid.space / 2) / (grid.size + grid.space))
const getXCoordinate = x => x * (grid.size + grid.space)
const getYCoordinate = y => y * (grid.size + grid.space)

io.on('connection', client => {
  console.log('client connected')
  clients[client.id] = {}
  client.on('mousedown', data => {
    clients[client.id].mousedown = true
    const x = getXPosition(data.x)
    const y = getYPosition(data.y)

    for (const enemy of grid.enemies) {
      if (enemy.x === x && enemy.y === y) {
        clients[client.id].floating = {
          entity: enemy,
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
  client.on('add-enemy', () => {

  })
  client.on('disconnect', () => {
    delete clients[client.id]
    console.log('client disconnected')
  })
})

const port = process.env.PORT || 3001
io.listen(port)

console.log(`Listening on port ${port}...`)
