import Entity from './Entity'

export default class Enemy extends Entity {
  constructor ({ name, portrait, hp, speed, size, damage, x, y }) {
    super({ name, portrait, hp, speed, size, damage, x, y })
  }
}
