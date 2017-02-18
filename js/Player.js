import Entity from './Entity'

export default class Player extends Entity {
  constructor ({ x, y, hp }) {
    super({ x, y, hp })
  }
}
