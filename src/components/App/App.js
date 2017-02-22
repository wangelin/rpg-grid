import React, { Component } from 'react'
import './App.css'
import io from 'socket.io-client'
const socket = io('http://83.216.107.14:3001')
import { throttle } from 'lodash'

import Player from '../../js/Player'
import Enemy from '../../js/Enemy'

import playerPortraits from '../../../public/assets/portraits/player_portraits_001.png'
import monsterPortraits from '../../../public/assets/portraits/monster_portraits_001.png'

const zoomStep = 0.25
const zoomMin = 0.25
const zoomMax = 8

const tileCanvas = document.createElement('canvas')
const tileContext = tileCanvas.getContext('2d')
const memoryCanvas = document.createElement('canvas')
const memoryContext = memoryCanvas.getContext('2d')

const clamp = (n, min, max) => {
  if (min > max) [min, max] = [max, min]
  return n < min ? min : n > max ? max : n
}

const commands = ['h', 'help', 'add-player', 'add-enemy', 'delete', 'damage', 'cure']
const valueCommands = ['damage', 'cure']

const drawImagePart =  (context, image, size = 256, col = 0, row = 0,
  { targetX = 0, targetY = 0, targetSize = size, circle = false } = {}) => {
  memoryCanvas.width = targetSize
  memoryCanvas.height = targetSize
  memoryContext.drawImage(image,
    col * size, row * size, size, size,
    0, 0, targetSize, targetSize)
  if (circle) {
    memoryContext.fillStyle = '#fff'
    memoryContext.globalCompositeOperation = 'destination-in'
    memoryContext.beginPath()
    memoryContext.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, 2 * Math.PI, false)
    memoryContext.closePath()
    memoryContext.fill()
  }
  memoryContext.globalCompositeOperation = 'source-over'
  context.drawImage(memoryCanvas, targetX, targetY)
}

const drawTile =  (context, tileSetImage, tileSize = 256, tile = [0, 0, 0, 0, 0],
  { targetX = 0, targetY = 0, targetSize = tileSize } = {}) => {
  tileCanvas.width = targetSize
  tileCanvas.height = targetSize
  tileContext.translate(targetSize / 2, targetSize / 2)
  const [ col, row, rot, flip, flop ] = tile
  if (rot > 0) tileContext.rotate(rot * Math.PI / 2)
  if (flip || flop) tileContext.scale(flip ? -1 : 1, flop ? -1 : 1)
  tileContext.drawImage(tileSetImage,
    col * tileSize, row * tileSize, tileSize, tileSize,
    -targetSize / 2, -targetSize / 2, targetSize, targetSize)
  tileContext.setTransform(1, 0, 0, 1, 0, 0)
  context.drawImage(tileCanvas, targetX, targetY)
}

const drawCheck = (context, size = 256, padding = 0) => {
  context.beginPath()
  context.moveTo(padding + (size - 2 * padding) * 0.902664, padding + (size - 2 * padding) * 0.1235)
  context.lineTo(padding + (size - 2 * padding) * 0.344025, padding + (size - 2 * padding) * 0.6801)
  context.lineTo(padding + (size - 2 * padding) * 0.097336, padding + (size - 2 * padding) * 0.4355)
  context.lineTo(padding + (size - 2 * padding) * 0.000000, padding + (size - 2 * padding) * 0.5325)
  context.lineTo(padding + (size - 2 * padding) * 0.344025, padding + (size - 2 * padding) * 0.8765)
  context.lineTo(padding + (size - 2 * padding) * 1.000000, padding + (size - 2 * padding) * 0.2205)
  context.lineTo(padding + (size - 2 * padding) * 0.902664, padding + (size - 2 * padding) * 0.1235)
  context.closePath()
  context.fill()
}

class App extends Component {
  constructor (props) {
    super(props)

    this.id = null

    this.state = {
      clients: null,
      grid: null,
      viewX: 0,
      viewY: 0,
      zoom: parseFloat(localStorage.getItem('zoom'), 10) || 1,
      panning: false,
      prompt: false,
      promptText: '',
      value: false,
      valueText: '',
      entityStats: false,
      entity: Player,
      player: new Player({
        name: 'Super Macho Man',
        portrait: undefined,
        hp: 10,
        speed: 30,
        size: 1
      }),
      enemy: new Enemy({
        name: 'Targus Fenix',
        portrait: undefined,
        hp: 20,
        speed: 30,
        size: 2
      }),
      imagesLoaded: false,
      action: '',
      animations: null
    }

    this.images = {}
    this.loadImages = this.loadImages.bind(this)
    this.handleUpdate = this.handleUpdate.bind(this)
    this.handleInit = this.handleInit.bind(this)
    this.handlePrompt = this.handlePrompt.bind(this)
    this.handleValue = this.handleValue.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleMouseMove = throttle(this.handleMouseMove, 15).bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.resizeCanvas = this.resizeCanvas.bind(this)
    this.centerView = this.centerView.bind(this)
    this.draw = this.draw.bind(this)
    this.drawEntityStats = this.drawEntityStats.bind(this)
  }

  gridInnerWidth = () => { const { width, size, space } = this.state.grid ; return width * (size + space) - space }
  gridOuterWidth = () => { const { width, size, space } = this.state.grid ; return width * (size + space) + space }
  gridInnerHeight = () => { const { height, size, space } = this.state.grid ; return height * (size + space) - space }
  gridOuterHeight = () => { const { height, size, space } = this.state.grid ; return height * (size + space) + space }

  async loadImages (images) {
    const imagesPromises = []
    for (const imageInfo of
      [
        ...images,
        { name: 'playerPortraits', count: 4, size: 256, src: playerPortraits },
        { name: 'monsterPortraits', count: 2, size: 768, src: monsterPortraits }
      ]) {
      imagesPromises.push(new Promise((resolve, reject) => {
        const image = new Image()
        image.src = imageInfo.src
        image.addEventListener('load', () => { resolve({ imageInfo, image, success: true }) })
        image.addEventListener('error', () => { resolve({ imageInfo, image, success: false }) })
      }))
    }
    return await Promise.all(imagesPromises)
  }

  resizeCanvas () {
    const { innerWidth: width, innerHeight: height } = window
    this.canvas.width = width
    this.canvas.height = height
    this.draw()
  }

  handleUpdate (data) {
    const { clients, grid, players, enemies } = data
    //const animations = []
    //if (clients) {
    //  const { clients: prevClients, viewX, viewY } = this.state
    //  const styleSheet = document.styleSheets[0]
    //  for (const id of Object.keys(clients)) {
    //    const client = clients[id]
    //    const prevClient = prevClients ? prevClients[id] : client
    //    if (client.x && client.y) {
    //      if (!(client.x === prevClient.x && client.y === prevClient.y)) {
    //        const animation = `animation-${id}`
    //        animations.push(animation)
    //        const oldIndex = Array.from(styleSheet.rules).findIndex(rule => rule.name === animation)
    //        if (oldIndex !== -1) styleSheet.deleteRule(oldIndex)
    //        const translateFrom = `translate(${viewX + (prevClient ? prevClient.x : client.x)}px, ${viewY + (prevClient ? prevClient.y : client.y)}px)`
    //        const translateTo = `translate(${viewX + client.x}px, ${viewY + client.y}px)`
    //        const keyframes = `@-webkit-keyframes ${animation} {
    //          from {-webkit-transform:${translateFrom}}
    //          to {-webkit-transform:${translateTo}}
    //        }`
    //        styleSheet.insertRule(keyframes, styleSheet.cssRules.length)
    //        //-ms-transform
    //        //transform
    //      }
    //    }
    //  }
    //}
    this.setState(Object.assign({},
      clients && { clients },
      //animations.length && { animations },
      grid && { grid },
      players && { players },
      enemies && { enemies }))
  }

  handleInit (data) {
    const { clients, grid, players, enemies } = data
    this.loadImages([{ name: 'tileSet', src: require(`../../../public/assets/tilesets/${grid.tileSet}`)}]).then(images => {
      this.images = images.reduce((obj, current) => {
        const { image, imageInfo, success } = current
        obj[imageInfo.name] = {
          image,
          src: imageInfo.src,
          size: imageInfo.size,
          count: imageInfo.count,
          success
        }
        return obj
      }, {})
      this.setState({ clients, grid, players, enemies }, () => {
        this.resizeCanvas()
        this.centerView()
        this.draw()
      })
    })
  }

  handlePrompt (e) {
    this.setState({ promptText: e.target.value })
  }

  handleValue (e) {
    this.setState({ valueText: e.target.value })
  }

  handleMouseDown (e) {
    if (e.button === 0) {
      const { viewX, viewY, zoom, action, valueText: value } = this.state
      const x = (e.pageX - viewX) / zoom
      const y = (e.pageY - viewY) / zoom
      if (action) {
        socket.emit(action, { x, y, value })
      } else {
        socket.emit('mousedown', { x, y })
      }
    }

    if (e.button === 1) {
      this.originalX = e.pageX
      this.originalY = e.pageY
      this.originalViewX = this.state.viewX
      this.originalViewY = this.state.viewY
      this.setState({ panning: true })
    }
  }

  handleMouseUp (e) {
    const { viewX, viewY, zoom } = this.state
    const x = (e.pageX - viewX) / zoom
    const y = (e.pageY - viewY) / zoom
    socket.emit('mouseup', { x, y })
    this.setState({ panning: false })
  }

  handleMouseMove (e) {
    const { viewX, viewY, zoom } = this.state
    if (this.state.panning) {
      const newViewX = this.originalViewX + e.pageX - this.originalX
      const newViewY = this.originalViewY + e.pageY - this.originalY
      this.setState({ viewX: newViewX, viewY: newViewY })
    } else {
      const x = (e.pageX - viewX) / zoom
      const y = (e.pageY - viewY) / zoom
      socket.emit('mousemove', { x, y })
    }
  }

  handleMouseLeave (e) {
    const x = null
    const y = null
    socket.emit('mousemove', { x, y })
  }

  handleKeyDown (e) {
    const { action, prompt, promptText, value, entityStats, zoom } = this.state

    if (prompt || value || entityStats) {
      switch (e.keyCode) {
        case 13:
          if (prompt) {
            const newAction = commands.indexOf(promptText) !== -1 ? promptText : ''
            this.setState({ prompt: false, action: action === newAction ? '' : newAction })
          }
          if (value) {
            this.setState({ value: false })
          }
          break;
        case 27:
          this.setState({ prompt: false, value: false, entityStats: false })
          break;
        default:
      }
      return
    }
    if (e.keyCode === 27) {
      this.setState({ prompt: false, value: false, entityStats: false, action: '' })
      return
    }

    let newAction
    let newZoom
    switch (e.key) {
      case 'p':
        this.setState({ prompt: true })
        e.preventDefault()
        break;
      case 'v':
        this.setState({ value: true })
        e.preventDefault()
        break;
      case 's':
        this.setState({ entityStats: true })
        break;
      case '+':
        newZoom = clamp(zoom + zoomStep, zoomMin, zoomMax)
        localStorage.setItem('zoom', newZoom)
        this.setState({ zoom: newZoom })
        break;
      case '-':
        newZoom = clamp(zoom - zoomStep, zoomMin, zoomMax)
        localStorage.setItem('zoom', newZoom)
        this.setState({ zoom: newZoom })
        break;
      case 'h':
        const height = window.prompt('Enter height')
        socket.emit('data', { height })
        e.preventDefault()
        break;
      case 'w':
        const width = window.prompt('Enter width')
        socket.emit('data', { width })
        e.preventDefault()
        break;
      case 'd':
        newAction = 'damage'
        this.setState({ action: action === newAction ? '' : newAction })
        e.preventDefault()
        break;
      case 'c':
        newAction = 'add-player'
        this.setState({ action: action === newAction ? '' : newAction })
        break;
      case 'e':
        newAction = 'add-enemy'
        this.setState({ action: action === newAction ? '' : newAction })
        break;
      case '=':
        this.centerView()
        break;
      default:
    }
    //e.preventDefault()
  }

  draw () {
    //console.count('draw')
    const { clients, grid, players, enemies, viewX, viewY, action, entityStats, zoom } = this.state

    const context = this.canvas.getContext('2d')
    const { width: viewWidth, height: viewHeight } = this.canvas
    context.clearRect(0, 0, viewWidth, viewHeight)

    if (grid) {
      const { width, height, size, space } = grid
      const totalWidth = (size + space) * width - space
      const totalHeight = (size + space) * height - space

      // Background
      context.fillStyle = 'black' // 'hsl(100, 35%, 35%)'
      context.fillRect(
        viewX - (zoom * space),
        viewY - (zoom * space),
        zoom * (totalWidth + 2 * space),
        zoom * (totalHeight + 2 * space))
      //context.fillStyle = 'hsl(100, 35%, 40%)'

      // Tiles
      //context.beginPath()
      let x
      let y
      for (let c = 0; c < width; c++) {
        x = c * (size + space)
        for (let r = 0; r < height; r++) {
          y = r * (size + space)
          if (viewX + zoom * (x + size + space) > 0 && viewY + zoom * (y + size + space) > 0) {
            //context.fillRect(viewX + zoom * x, viewY + zoom * y, zoom * size, zoom * size)
            const tile = grid.tileData[r * grid.width + c]
            drawTile(context, this.images.tileSet.image, grid.tileSize, tile, {
              targetX: viewX + zoom * x,
              targetY: viewY + zoom * y,
              targetSize: zoom * grid.size
            })
          }
          if (viewY + zoom * (y + size + space) > viewHeight) break
        }
        if (viewX + zoom * (x + size + space) > viewWidth) break
      }
      //context.closePath()
      //context.fill()

      // Players
      for (const player of players) {
        const x = player.x * (size + space) + size / 2
        const y = player.y * (size + space) + size / 2

        const fraction = clamp(player.damage || 0, 0, player.hp) / 10
        context.beginPath()
        context.arc(viewX + zoom * x, viewY + zoom * y, zoom * size / 2, 0, 2 * Math.PI)
        context.closePath()
        context.fillStyle = fraction === 1 ? 'rgba(96, 0, 0, 1)' : 'hsl(0, 0%, 75%)'
        context.fill()
        context.fillStyle = 'rgba(128, 0, 0, 1)'
        if (player.damage) {
          const a = Math.acos(1 - 2 * fraction)
          context.beginPath()
          context.arc(
            viewX + zoom * x, viewY + zoom * y,
            zoom * (size / 2 - clamp(size / 16, 0, size)),
            1/2 * Math.PI - a,
            1/2 * Math.PI + a)
          context.closePath()
          context.fill()
          const fontSize = zoom * size / 3
          context.font = `${fontSize}pt sans-serif`
          context.fillStyle = 'black'
          context.textAlign = 'center'
          context.textBaseline = 'bottom'
          context.fillText(player.damage, viewX + zoom * x, viewY + zoom * y)
          context.beginPath()
          context.moveTo(viewX + zoom * (x - 10), viewY + zoom * y);
          context.lineTo(viewX + zoom * (x + 10), viewY + zoom * y);
          context.lineWidth = 2
          context.closePath()
          context.strokeStyle = 'black'
          context.stroke()
          context.textBaseline = 'top'
          context.fillText(player.hp, viewX + zoom * x, viewY + zoom * y)
          context.textBaseline = 'middle'
        }
      }

      // Enemies
      let { image, size: sourceSize } = this.images.monsterPortraits
      for (const enemy of enemies) {
        const x = enemy.x * (size + space) + size / 2
        const y = enemy.y * (size + space) + size / 2

        drawImagePart(context, image, sourceSize, 0, 0,
          { targetX: viewX + zoom * (x - size / 2), targetY: viewY + zoom * (y - size / 2), targetSize: zoom * size, circle: true })
        //context.drawImage(image, 0, 0, sourceSize, sourceSize, x - size / 2, y - size / 2, size, size)
        if (enemy.damage >= enemy.hp) {
          context.beginPath()
          context.arc(viewX + zoom * x, viewY + zoom * y, zoom * (size / 2 - clamp(size / 16, 0, size)), 0, 2 * Math.PI)
          context.closePath()
          context.fillStyle = 'rgba(255, 0, 0, 0.5)'
          context.fill()
          const fontSize = zoom * size / 3
          context.font = `${fontSize}pt sans-serif`
          context.fillStyle = 'black'
          context.textBaseline = 'middle'
          context.textAlign = 'center'
          context.fillText(enemy.hp - enemy.damage, viewX + zoom * x, viewY + zoom * y)
        }
      }

      if (clients) {
        for (const id of Object.keys(clients)) {
          const { x, y, mousedown, floating } = clients[id]
          if (x && y) {
            if (floating) {
              // Move guide
              const { x: xPos, y: yPos } = floating.entity
              const yMin = clamp(yPos - 6, 0, height)
              const yMax = clamp(yPos + 6, 0, height)
              const xMin = clamp(xPos - 6, 0, width)
              const xMax = clamp(xPos + 6, 0, width)
              context.beginPath()
              for (let r = yMin; r < yMax; r++) {
                for (let c = xMin; c < xMax; c++) {
                  context.rect(viewX + zoom * c * (size + space), viewY + zoom * r * (size + space), zoom * size, zoom * size)
                }
              }
              context.closePath()
              context.fillStyle = 'hsla(48, 50%, 50%, 0.25)'
              context.fill()
              const { offsetX, offsetY } = floating

              // Shadow
              context.beginPath()
              context.arc(viewX + zoom * (x + offsetX), viewY + zoom * (y + offsetY), zoom * size / 2, 0, 2 * Math.PI)
              context.closePath()
              context.fillStyle = 'rgba(0, 0, 0, 0.2)'
              context.fill()
            }

            // Client pointers
            if (id !== this.id) {
              context.beginPath()
              context.fillStyle = mousedown ? 'yellow' : '#fc0'
              context.moveTo(viewX + zoom * x, viewY + zoom * y)
              context.lineTo(viewX + zoom * x, viewY + zoom * (y + 17))
              context.lineTo(viewX + zoom * (x + 12), viewY + zoom * (y + 12))
              context.lineTo(viewX + zoom * x, viewY + zoom * y)
              context.fill()
              context.closePath()
            }
          }
        }
      }
    }

    context.textBaseline = 'middle'
    context.textAlign = 'left'
    context.font = '20pt sans-serif'
    context.fillStyle = 'hsl(48, 100%, 50%)'

    context.fillText(`zoom ${this.state.zoom}`, 10, 30)
    if (action) context.fillText(action, 10, 50)

    if (entityStats) this.drawEntityStats()
  }

  drawEntityStats () {
    if (!this.gallery || !this.galleryCanvases) return
    const { image, size, count } = this.images.playerPortraits
    const imagesPerRow = 3
    const space = 20
    const imageSize = (this.gallery.offsetWidth - 20 - (imagesPerRow - 1) * space) / imagesPerRow

    const { entity, player, enemy } = this.state
    const selected = entity === Player ? player : enemy
    for (let i = 0; i < count; i++) {
      const canvas = this.galleryCanvases[i]
      canvas.width = imageSize
      canvas.height = imageSize
      const context = canvas.getContext('2d')
      drawImagePart(context, image, size, i, 0, { targetSize: imageSize, circle: true })
      if (selected.portrait === i) {
        context.fillStyle = 'hsla(48, 100%, 50%, 0.5)'
        drawCheck(context, imageSize, imageSize / 5)
      }
    }
  }

  centerView () {
    const { width: viewWidth, height: viewHeight } = this.canvas
    const { zoom } = this.state
    const viewX = (viewWidth - zoom * this.gridOuterWidth()) / 2
    const viewY = (viewHeight - zoom * this.gridOuterHeight()) / 2
    this.setState({ viewX, viewY })
  }

  componentDidMount () {
    this.canvas.addEventListener('mousedown', this.handleMouseDown)
    this.canvas.addEventListener('mouseup', this.handleMouseUp)
    this.canvas.addEventListener('mouseleave', this.handleMouseUp)
    this.canvas.addEventListener('mousemove', this.handleMouseMove)
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave)
    window.addEventListener('resize', this.resizeCanvas, false)
    window.addEventListener('keydown', this.handleKeyDown)
    socket.on('update', this.handleUpdate)
    socket.on('init', this.handleInit)
    socket.on('id-assign', data => { this.id = data.id })
    socket.emit('init')
    //document.addEventListener('animationstart', () => {console.log('animation started')})
    //document.addEventListener('animationend', () => {console.log('animation ended')})
  }

  componentWillUnmount () {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp)
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave)
    window.removeEventListener('resize', this.resizeCanvas, false)
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  componentDidUpdate (prevProps, prevState) {
    const { action } = this.state
    if (action !== prevState.action) {
      if (valueCommands.indexOf(action) !== -1) {
        this.setState({ value: true })
      } else {
        this.setState({ value: false })
      }
    }
    this.draw()
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (nextState.panning !== this.state.panning) return false
    return true
  }

  render() {
    const {
      prompt,
      promptText,
      value,
      valueText,
      action,
      entityStats,
      entity,
      player,
      enemy
    } = this.state
    //const ids = clients ? Object.keys(clients) : []
    this.galleryCanvases = []

    const CommandPrompt = prompt && (
      <div className='prompt'>
        <input type='text' placeholder='Type a command (h for help)' autoFocus={true}
          className={commands.indexOf(promptText) !== -1 ? 'ok' : ''}
          onChange={this.handlePrompt}
          value={promptText} />
        {['h', 'help'].indexOf(promptText) !== -1 && (
          <div className='help'>Available Commands:
            <ul>
              {commands.map(command => <li key={command}>{command}</li>)}
            </ul>
          </div>)}
      </div>
    )

    const ValuePrompt = value && (
      <div className='prompt'>
        <input type='text' placeholder={`Enter value${action ? ` for ${action}` : ''}`} autoFocus={true}
          onChange={this.handleValue}
          value={valueText} />
      </div>
    )

    const selected = entity === Player ? player : enemy
    const EntityStatsDialog = entityStats && (
      <div className='prompt'>
        <div className='row'>
          <button className={entity === Player ? 'active' : ''}
            onClick={() => { this.setState({ entity: Player }) }}>Player</button>
          <button className={entity === Enemy ? 'active' : ''}
            onClick={() => { this.setState({ entity: Enemy }) }}>Enemy</button>
        </div>
        <div className='row'>
          <label>Name<input type='text' value={selected.name} /></label>
          <label>HP<input type='text' value={selected.hp} /></label>
        </div>
        <div className='row'>
          <label>Speed<input type='text' value={selected.speed} /></label>
          <label>Size<input type='text' value={selected.size} /></label>
        </div>
        <div ref={gallery => { this.gallery = gallery }} className='gallery'>
          {Object.keys(this.images).length > 0 && this.images.playerPortraits && (
            [...Array(this.images.playerPortraits.count).keys()]
              .map(x => (
                <canvas key={x} ref={c => { this.galleryCanvases[x] = c }}
                  onClick={() => {
                    this.setState({
                      player: Object.assign({}, player, { portrait: x })
                    })}}></canvas>
              ))
          )}
        </div>
        <button onClick={() => { this.setState({ entityStats: false }) }}>Close</button>
      </div>
    )

    //const Cursor = ({ style }) => (
    //  <svg className='cursor' width={12} height={17} style={style}>
    //    <polygon points='0,0 0,17 12,12 0,0' />
    //  </svg>)

    //const cursorStyle = {
    //  animationTimingFunction: 'linear',
    //  animationDuration: '25ms',
    //  animationFillMode: 'forwards'
    //}

    return (
      <div className='app'>
        <canvas className='board-canvas' ref={canvas => { this.canvas = canvas }}></canvas>
        {CommandPrompt}
        {ValuePrompt}
        {EntityStatsDialog}
        {/*ids.map(id => (<Cursor key={id} style={Object.assign(cursorStyle, { animationName: `animation-${id}` })} />))*/}
      </div>
    )
  }
}

export default App
