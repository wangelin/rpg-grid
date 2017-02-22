import Entity from './Entity'

export default class Enemy extends Entity {
  constructor ({ name, hp, speed, size, damage, x, y }) {
    super({ name, hp, speed, size, damage, x, y })
  }
}
