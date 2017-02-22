import Entity from './Entity'

export default class Player extends Entity {
  constructor ({ name, hp, speed, size, damage, x, y }) {
    super({ name, hp, speed, size, damage, x, y })
  }
}
