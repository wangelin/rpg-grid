import React, { Component } from 'react'
import './App.css'
import io from 'socket.io-client'
const socket = io('http://83.216.107.14:3001')

import playerPortraits from '../../../public/assets/portraits/player_portraits_001.png'
import monsterPortraits from '../../../public/assets/portraits/monster_portraits_001.png'

const clamp = (n, min, max) => {
  if (min > max) [min, max] = [max, min]
  return n < min ? min : n > max ? max : n
}

const commands = ['h', 'help', 'add-player', 'add-enemy', 'delete', 'damage', 'cure']
const valueCommands = ['damage', 'cure']

const drawImagePart =  (context, image, size = 256, col = 0, row = 0,
  { targetX = 0, targetY = 0, targetSize = size, circle = false } = {}) => {
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = targetSize
  tempCanvas.height = targetSize
  const tempContext = tempCanvas.getContext('2d')
  tempContext.drawImage(image,
    col * size, row * size, size, size,
    0, 0, targetSize, targetSize)
  if (circle) {
    tempContext.fillStyle = '#fff'
    tempContext.globalCompositeOperation = 'destination-in'
    tempContext.beginPath()
    tempContext.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, 2 * Math.PI, false)
    tempContext.closePath()
    tempContext.fill()
  }
  tempContext.globalCompositeOperation = 'source-over'
  context.drawImage(tempCanvas, targetX, targetY)
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

    this.state = {
      clients: null,
      grid: null,
      viewX: 0,
      viewY: 0,
      zoom: 1,
      panning: false,
      prompt: false,
      promptText: '',
      value: false,
      valueText: '',
      entityStats: true,
      imagesLoaded: false,
      action: ''
    }

    this.images = {}
    this.loadImages = this.loadImages.bind(this)
    this.handleUpdate = this.handleUpdate.bind(this)
    this.handleInit = this.handleInit.bind(this)
    this.handlePrompt = this.handlePrompt.bind(this)
    this.handleValue = this.handleValue.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
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

  async loadImages () {
    const imagesPromises = []
    for (const imageInfo of
      [
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
    const { clients, grid } = data
    this.setState({ clients, grid })
  }

  handleInit (data) {
    const { clients, grid } = data
    this.setState({ clients, grid }, () => {
      this.resizeCanvas()
      this.centerView()
      this.draw()
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
      const { viewX, viewY, action, valueText: value } = this.state
      const x = e.pageX - viewX
      const y = e.pageY - viewY
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
    const { viewX, viewY } = this.state
    const x = e.pageX - viewX
    const y = e.pageY - viewY
    socket.emit('mouseup', { x, y })
    this.setState({ panning: false })
  }

  handleMouseMove (e) {
    const { viewX, viewY } = this.state
    if (this.state.panning) {
      const newViewX = this.originalViewX + e.pageX - this.originalX
      const newViewY = this.originalViewY + e.pageY - this.originalY
      this.setState({ viewX: newViewX, viewY: newViewY })
    } else {
      const x = e.pageX - viewX
      const y = e.pageY - viewY
      socket.emit('mousemove', { x, y })
    }
  }

  handleMouseLeave (e) {
    const x = null
    const y = null
    socket.emit('mousemove', { x, y })
  }

  handleKeyDown (e) {
    const { action, prompt, promptText, value, valueText, zoom } = this.state

    if (prompt || value) {
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
          this.setState({ prompt: false, value: false })
          break;
      }
      return
    }
    if (e.keyCode === 27) {
      this.setState({ prompt: false, value: false, action: '' })
      return
    }

    let newAction
    switch (e.key) {
      case 'p':
        this.setState({ prompt: true })
        break;
      case '+':
        this.setState({ zoom: clamp(zoom + 0.25, 0, 4) })
        break;
      case '-':
        this.setState({ zoom: clamp(zoom - 0.25, 0.25, 4) })
        break;
      case 'v':
        this.setState({ value: true })
        break;
      case 'h':
        const height = window.prompt('Enter height')
        socket.emit('data', { height })
        break;
      case 'w':
        const width = window.prompt('Enter width')
        socket.emit('data', { width })
        break;
      case 'd':
        newAction = 'damage'
        this.setState({ action: action === newAction ? '' : newAction })
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
    }
    e.preventDefault()
  }

  draw () {
    //console.count('draw')
    const { clients, grid, viewX, viewY, action, entityStats } = this.state

    const context = this.canvas.getContext('2d')
    const { width: viewWidth, height: viewHeight } = this.canvas
    context.clearRect(0, 0, viewWidth, viewHeight)

    if (grid) {
      const { width, height, enemies, size, space } = grid
      const totalWidth = (size + space) * width - space
      const totalHeight = (size + space) * height - space
      const offsetX = Math.floor((viewWidth - totalWidth) / 2)
      const offsetY = Math.floor((viewHeight - totalHeight) / 2)
      context.fillStyle = 'hsl(100, 35%, 35%)'
      context.fillRect(viewX - space, viewY - space, totalWidth + 2 * space, totalHeight + 2 * space)
      context.fillStyle = 'hsl(100, 35%, 40%)'

      context.beginPath()
      let x
      let y
      for (let c = 0; c < width; c++) {
        x = viewX + c * (size + space)
        for (let r = 0; r < height; r++) {
          y = viewY + r * (size + space)
          if (x + size + space > 0 || y + size + space > 0) context.rect(x, y, size, size)
          if (y + size + space > viewHeight) break
        }
        if (x + size + space > viewWidth) break
      }
      context.closePath()
      context.fill()

      for (const player of grid.players) {
        const x = viewX + player.x * (size + space) + size / 2
        const y = viewY + player.y * (size + space) + size / 2

        const fraction = clamp(player.damage || 0, 0, player.hp) / 10
        context.beginPath()
        context.arc(x, y, size / 2, 0, 2 * Math.PI)
        context.closePath()
        context.fillStyle = fraction === 1 ? 'rgba(96, 0, 0, 1)' : 'hsl(0, 0%, 75%)'
        context.fill()
        context.fillStyle = 'rgba(128, 0, 0, 1)'
        context.font = '20pt sans-serif'
        if (player.damage) {
          const a = Math.acos(1 - 2 * fraction)
          context.beginPath()
          context.arc(x, y, size / 2 - clamp(size / 16, 0, size), 1/2 * Math.PI - a, 1/2 * Math.PI + a)
          context.closePath()
          context.fill()
          context.font = '16pt sans-serif'
          context.fillStyle = 'black'
          context.textBaseline = 'middle'
          context.textAlign = 'center'
          context.fillText(player.damage, x, y - 12)
          context.beginPath()
          context.moveTo(x - 10, y);
          context.lineTo(x + 10, y);
          context.lineWidth = 2
          context.closePath()
          context.strokeStyle = 'black'
          context.stroke()
          context.fillText(player.hp, x, y + 12)
        }
      }

      let { image, size: sourceSize, count, success } = this.images.monsterPortraits
      for (const enemy of grid.enemies) {
        const x = viewX + enemy.x * (size + space) + size / 2
        const y = viewY + enemy.y * (size + space) + size / 2

        //context.beginPath()
        //context.arc(x, y, size / 2, 0, 2 * Math.PI)
        //context.closePath()
        //context.fillStyle = 'black'
        //context.fill()
        drawImagePart(context, image, sourceSize, 0, 0,
          { targetX: x - size / 2, targetY: y - size / 2, targetSize: size, circle: true })
        //context.drawImage(image, 0, 0, sourceSize, sourceSize, x - size / 2, y - size / 2, size, size)
        if (enemy.damage >= enemy.hp) {
          context.beginPath()
          context.arc(x, y, size / 2 - clamp(size / 16, 0, size), 0, 2 * Math.PI)
          context.closePath()
          context.fillStyle = 'rgba(255, 0, 0, 0.5)'
          context.fill()
          context.font = '16pt sans-serif'
          context.fillStyle = 'black'
          context.textBaseline = 'middle'
          context.textAlign = 'center'
          context.fillText(enemy.hp - enemy.damage, x, y)
        }
      }

      if (clients) {
        for (const id of Object.keys(clients)) {
          const { x, y, mousedown, floating } = clients[id]
          if (x && y) {
            if (floating) {
              const { x: xPos, y: yPos } = floating.entity
              const yMin = clamp(yPos - 6, 0, height)
              const yMax = clamp(yPos + 6, 0, height)
              const xMin = clamp(xPos - 6, 0, width)
              const xMax = clamp(xPos + 6, 0, width)
              context.beginPath()
              for (let r = yMin; r < yMax; r++) {
                for (let c = xMin; c < xMax; c++) {
                  context.rect(viewX + c * (size + space), viewY + r * (size + space), size, size)
                }
              }
              context.closePath()
              context.fillStyle = 'rgba(0, 0, 0, 0.05)'
              context.fill()
              const { offsetX, offsetY } = floating
              context.beginPath()
              context.arc(viewX + x + offsetX, viewY + y + offsetY, size / 2, 0, 2 * Math.PI)
              context.closePath()
              context.fillStyle = 'rgba(0, 0, 0, 0.2)'
              context.fill()
            }

            context.beginPath()
            context.fillStyle = mousedown ? 'yellow' : '#fc0'
            context.moveTo(viewX + x, viewY + y)
            context.lineTo(viewX + x, viewY + y + 17)
            context.lineTo(viewX + x + 12, viewY + y + 12)
            context.lineTo(viewX + x, viewY + y)
            context.fill()
            context.closePath()
          }
        }
      }
    }

    if (action) {
      context.font = '20pt sans-serif'
      context.fillStyle = 'black'
      context.textBaseline = 'middle'
      context.textAlign = 'left'
      context.fillText(action, 10, 30)
    }

    if (entityStats) this.drawEntityStats()
  }

  drawEntityStats () {
    if (!this.gallery || !this.galleryCanvases) return
    const { image, size, count, success } = this.images.playerPortraits
    const imagesPerRow = 3
    const space = 20
    const imageSize = (this.gallery.offsetWidth - 20 - (imagesPerRow - 1) * space) / imagesPerRow

    for (let i = 0; i < count; i++) {
      const canvas = this.galleryCanvases[i]
      canvas.width = imageSize
      canvas.height = imageSize
      const context = canvas.getContext('2d')
      drawImagePart(context, image, size, i, 0, { targetSize: imageSize, circle: true })
      context.fillStyle = 'hsla(48, 100%, 50%, 0.5)'
      drawCheck(context, imageSize, imageSize / 5)
    }
  }

  centerView () {
    const { width: viewWidth, height: viewHeight } = this.canvas
    const viewX = (viewWidth - this.gridOuterWidth()) / 2
    const viewY = (viewHeight - this.gridOuterHeight()) / 2
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
    this.loadImages().then(images => {
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
      socket.on('update', this.handleUpdate)
      socket.on('init', this.handleInit)
      socket.emit('init')
    })
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
    const { prompt, promptText, value, valueText, action, entityStats } = this.state
    this.galleryCanvases = []
    return (
      <div className='app'>
        <canvas className='board-canvas' ref={canvas => { this.canvas = canvas }}></canvas>
        {prompt && (
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
          </div>)}
        {value && (
          <div className='prompt'>
            <input type='text' placeholder={`Enter value${action ? ` for ${action}` : ''}`} autoFocus={true}
              onChange={this.handleValue}
              value={valueText} />
          </div>)}
        {entityStats && (
          <div className='prompt'>
            <div className='row'>
              <label>Name<input type='text'/></label>
              <label>HP<input defaultValue={10} type='text'/></label>
            </div>
            <div className='row'>
              <label>Speed<input defaultValue={30} type='text'/></label>
              <label>Size<input defaultValue={1} type='text'/></label>
            </div>
            <div ref={gallery => { this.gallery = gallery }} className='gallery'>
              {Object.keys(this.images).length > 0 && this.images.playerPortraits && (
                [...Array(this.images.playerPortraits.count).keys()]
                  .map(x => <canvas key={x} ref={c => { this.galleryCanvases[x] = c }}></canvas>)
              )}
            </div>
          </div>)}
          {false && entityStats && (
            <div className='prompt'>
              <div className='row'>
                <label>Name<input type='text'/></label>
                <label>HP<input defaultValue={10} type='text'/></label>
              </div>
              <div className='row'>
                <label>Speed<input defaultValue={30} type='text'/></label>
                <label>Size<input defaultValue={1} type='text'/></label>
              </div>
              <div ref={gallery => { this.gallery = gallery }} className='gallery'>
                <canvas ref={galleryCanvas => { this.galleryCanvas = galleryCanvas }}></canvas>
              </div>
            </div>)}
      </div>
    )
  }
}

export default App
