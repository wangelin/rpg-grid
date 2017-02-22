import Entity from './Entity'

export default class Player extends Entity {
  constructor ({ name, portrait, hp, speed, size, damage, x, y }) {
    super({ name, portrait, hp, speed, size, damage, x, y })
  }
}
