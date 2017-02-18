import Entity from './Entity'

export default class Enemy extends Entity {
  constructor ({ x, y, hp }) {
    super({ x, y, hp })
  }
}
