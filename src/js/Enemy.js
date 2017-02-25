import Entity from './Entity'

export default class Enemy extends Entity {
  constructor ({ id, name, portrait, hp, speed, size, damage, x, y }) {
    super({ id, name, portrait, hp, speed, size, damage, x, y })
  }
}
