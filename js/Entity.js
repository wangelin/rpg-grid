export default class Entity {
  constructor ({ x, y, hp, damage = 0 }) {
    this.x = x
    this.y = y
    this.hp = hp
    this.damage = damage
  }
}
